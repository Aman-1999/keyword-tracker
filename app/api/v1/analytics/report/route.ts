import dbConnect from "@/lib/db";
import SearchHistory from "@/models/SearchHistory";
import RankingResult from "@/models/RankingResult";
import { Types } from "mongoose";
import {
  verifyAuth,
  authErrorResponse,
  successResponse,
  errorResponse,
} from "@/lib/api";

/**
 * GET /api/v1/analytics/report
 * Get comprehensive SEO performance report
 */
export async function GET(request: Request) {
  try {
    const authResult = await verifyAuth();
    if (!authResult.success || !authResult.user) {
      return authErrorResponse(authResult);
    }

    const userId = authResult.user.userId;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const domain = searchParams.get("domain");

    await dbConnect();

    const userObjectId = new Types.ObjectId(userId);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);

    const matchQuery: Record<string, unknown> = {
      userId: userObjectId,
      createdAt: { $gte: startDate },
    };
    const previousMatchQuery: Record<string, unknown> = {
      userId: userObjectId,
      createdAt: { $gte: previousStartDate, $lt: startDate },
    };
    if (domain) {
      matchQuery.domain = domain;
      previousMatchQuery.domain = domain;
    }

    const [
      currentStats,
      previousStats,
      keywordGrowth,
      topGainers,
      topLosers,
      serpPresence,
      deviceBreakdown,
      avgRankByDay,
      keywordsByIntent,
      domainHealth,
    ] = await Promise.all([
      // Current period stats
      RankingResult.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalChecks: { $sum: 1 },
            uniqueKeywords: { $addToSet: "$keyword" },
            uniqueDomains: { $addToSet: "$domain" },
            avgRank: { $avg: "$rank" },
            top3: {
              $sum: {
                $cond: [
                  { $and: [{ $ne: ["$rank", null] }, { $lte: ["$rank", 3] }] },
                  1,
                  0,
                ],
              },
            },
            top10: {
              $sum: {
                $cond: [
                  { $and: [{ $ne: ["$rank", null] }, { $lte: ["$rank", 10] }] },
                  1,
                  0,
                ],
              },
            },
            top20: {
              $sum: {
                $cond: [
                  { $and: [{ $ne: ["$rank", null] }, { $lte: ["$rank", 20] }] },
                  1,
                  0,
                ],
              },
            },
            ranked: { $sum: { $cond: [{ $ne: ["$rank", null] }, 1, 0] } },
            withAiOverview: { $sum: { $cond: ["$isAiOverview", 1, 0] } },
            withPaa: { $sum: { $cond: ["$isPeopleAlsoAsk", 1, 0] } },
          },
        },
      ]),

      // Previous period stats for comparison
      RankingResult.aggregate([
        { $match: previousMatchQuery },
        {
          $group: {
            _id: null,
            avgRank: { $avg: "$rank" },
            top10: {
              $sum: {
                $cond: [
                  { $and: [{ $ne: ["$rank", null] }, { $lte: ["$rank", 10] }] },
                  1,
                  0,
                ],
              },
            },
            ranked: { $sum: { $cond: [{ $ne: ["$rank", null] }, 1, 0] } },
          },
        },
      ]),

      // Keyword growth over time
      RankingResult.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            uniqueKeywords: { $addToSet: "$keyword" },
            newKeywords: { $sum: 1 },
          },
        },
        {
          $project: {
            date: "$_id",
            keywordCount: { $size: "$uniqueKeywords" },
          },
        },
        { $sort: { date: 1 } },
      ]),

      // Top gainers (biggest rank improvements)
      RankingResult.aggregate([
        { $match: matchQuery },
        { $sort: { keyword: 1, domain: 1, createdAt: 1 } },
        {
          $group: {
            _id: { keyword: "$keyword", domain: "$domain" },
            firstRank: { $first: "$rank" },
            lastRank: { $last: "$rank" },
            checks: { $sum: 1 },
          },
        },
        { $match: { firstRank: { $ne: null }, lastRank: { $ne: null } } },
        {
          $project: {
            keyword: "$_id.keyword",
            domain: "$_id.domain",
            from: "$firstRank",
            to: "$lastRank",
            change: { $subtract: ["$firstRank", "$lastRank"] },
            checks: 1,
          },
        },
        { $match: { change: { $gt: 0 } } },
        { $sort: { change: -1 } },
        { $limit: 10 },
      ]),

      // Top losers (biggest rank drops)
      RankingResult.aggregate([
        { $match: matchQuery },
        { $sort: { keyword: 1, domain: 1, createdAt: 1 } },
        {
          $group: {
            _id: { keyword: "$keyword", domain: "$domain" },
            firstRank: { $first: "$rank" },
            lastRank: { $last: "$rank" },
            checks: { $sum: 1 },
          },
        },
        { $match: { firstRank: { $ne: null }, lastRank: { $ne: null } } },
        {
          $project: {
            keyword: "$_id.keyword",
            domain: "$_id.domain",
            from: "$firstRank",
            to: "$lastRank",
            change: { $subtract: ["$firstRank", "$lastRank"] },
            checks: 1,
          },
        },
        { $match: { change: { $lt: 0 } } },
        { $sort: { change: 1 } },
        { $limit: 10 },
      ]),

      // SERP feature presence over time
      RankingResult.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            total: { $sum: 1 },
            aiOverview: { $sum: { $cond: ["$isAiOverview", 1, 0] } },
            paa: { $sum: { $cond: ["$isPeopleAlsoAsk", 1, 0] } },
            featuredSnippet: {
              $sum: { $cond: ["$is_featured_snippet", 1, 0] },
            },
            localPack: { $sum: { $cond: ["$has_local_pack", 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Device breakdown from search history
      SearchHistory.aggregate([
        { $match: { userId: userObjectId, createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: "$filters.device",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // Average rank by day of week (for best posting times insight)
      RankingResult.aggregate([
        { $match: { ...matchQuery, rank: { $ne: null } } },
        {
          $group: {
            _id: { $dayOfWeek: "$createdAt" },
            avgRank: { $avg: "$rank" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Keyword categorization by assumed intent
      RankingResult.aggregate([
        { $match: matchQuery },
        { $sort: { keyword: 1, createdAt: -1 } },
        {
          $group: {
            _id: "$keyword",
            latestRank: { $first: "$rank" },
            domain: { $first: "$domain" },
          },
        },
        {
          $project: {
            keyword: "$_id",
            rank: "$latestRank",
            domain: 1,
            intent: {
              $switch: {
                branches: [
                  {
                    case: {
                      $regexMatch: {
                        input: "$_id",
                        regex: /buy|price|cost|cheap|deal|discount|shop|order/i,
                      },
                    },
                    then: "transactional",
                  },
                  {
                    case: {
                      $regexMatch: {
                        input: "$_id",
                        regex:
                          /how|what|why|when|where|guide|tutorial|tips|learn/i,
                      },
                    },
                    then: "informational",
                  },
                  {
                    case: {
                      $regexMatch: {
                        input: "$_id",
                        regex: /best|top|review|compare|vs|alternative/i,
                      },
                    },
                    then: "commercial",
                  },
                  {
                    case: {
                      $regexMatch: {
                        input: "$_id",
                        regex: /near me|location|address|directions|hours/i,
                      },
                    },
                    then: "local",
                  },
                ],
                default: "navigational",
              },
            },
          },
        },
        {
          $group: {
            _id: "$intent",
            count: { $sum: 1 },
            avgRank: { $avg: "$rank" },
            top10: {
              $sum: {
                $cond: [
                  { $and: [{ $ne: ["$rank", null] }, { $lte: ["$rank", 10] }] },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),

      // Domain health scores
      RankingResult.aggregate([
        { $match: { userId: userObjectId, createdAt: { $gte: startDate } } },
        { $sort: { keyword: 1, createdAt: -1 } },
        {
          $group: {
            _id: { domain: "$domain", keyword: "$keyword" },
            latestRank: { $first: "$rank" },
            previousRank: { $last: "$rank" },
          },
        },
        {
          $group: {
            _id: "$_id.domain",
            totalKeywords: { $sum: 1 },
            rankedKeywords: {
              $sum: { $cond: [{ $ne: ["$latestRank", null] }, 1, 0] },
            },
            top10: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$latestRank", null] },
                      { $lte: ["$latestRank", 10] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            avgRank: { $avg: "$latestRank" },
            improved: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$latestRank", null] },
                      { $ne: ["$previousRank", null] },
                      { $lt: ["$latestRank", "$previousRank"] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            declined: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$latestRank", null] },
                      { $ne: ["$previousRank", null] },
                      { $gt: ["$latestRank", "$previousRank"] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        { $sort: { totalKeywords: -1 } },
      ]),
    ]);

    // Process current stats
    const current = currentStats[0] || {};
    const previous = previousStats[0] || {};

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return successResponse({
      period: {
        days,
        startDate: startDate.toISOString(),
        previousStartDate: previousStartDate.toISOString(),
      },
      summary: {
        totalChecks: current.totalChecks || 0,
        uniqueKeywords: current.uniqueKeywords?.length || 0,
        uniqueDomains: current.uniqueDomains?.length || 0,
        avgRank: current.avgRank ? Math.round(current.avgRank * 10) / 10 : null,
        top3: current.top3 || 0,
        top10: current.top10 || 0,
        top20: current.top20 || 0,
        ranked: current.ranked || 0,
        rankRate: current.totalChecks
          ? Math.round((current.ranked / current.totalChecks) * 100)
          : 0,
        aiOverviewRate: current.totalChecks
          ? Math.round((current.withAiOverview / current.totalChecks) * 100)
          : 0,
        paaRate: current.totalChecks
          ? Math.round((current.withPaa / current.totalChecks) * 100)
          : 0,
      },
      comparison: {
        avgRankChange:
          current.avgRank && previous.avgRank
            ? Math.round((previous.avgRank - current.avgRank) * 10) / 10
            : null,
        top10Change: (current.top10 || 0) - (previous.top10 || 0),
        rankedChange: (current.ranked || 0) - (previous.ranked || 0),
      },
      keywordGrowth: keywordGrowth.map(
        (k: { date: string; keywordCount: number }) => ({
          date: k.date,
          keywords: k.keywordCount,
        })
      ),
      topGainers: topGainers.map(
        (g: {
          keyword: string;
          domain: string;
          from: number;
          to: number;
          change: number;
        }) => ({
          keyword: g.keyword,
          domain: g.domain,
          from: g.from,
          to: g.to,
          improvement: g.change,
        })
      ),
      topLosers: topLosers.map(
        (l: {
          keyword: string;
          domain: string;
          from: number;
          to: number;
          change: number;
        }) => ({
          keyword: l.keyword,
          domain: l.domain,
          from: l.from,
          to: l.to,
          drop: Math.abs(l.change),
        })
      ),
      serpTrend: serpPresence.map(
        (s: {
          _id: string;
          total: number;
          aiOverview: number;
          paa: number;
          featuredSnippet: number;
          localPack: number;
        }) => ({
          date: s._id,
          aiOverview: s.total ? Math.round((s.aiOverview / s.total) * 100) : 0,
          paa: s.total ? Math.round((s.paa / s.total) * 100) : 0,
          featuredSnippet: s.total
            ? Math.round((s.featuredSnippet / s.total) * 100)
            : 0,
          localPack: s.total ? Math.round((s.localPack / s.total) * 100) : 0,
        })
      ),
      deviceBreakdown: deviceBreakdown.map(
        (d: { _id: string | null; count: number }) => ({
          device: d._id || "desktop",
          count: d.count,
        })
      ),
      rankByDayOfWeek: avgRankByDay.map(
        (d: { _id: number; avgRank: number; count: number }) => ({
          day: dayNames[d._id - 1] || "Unknown",
          avgRank: Math.round(d.avgRank * 10) / 10,
          checks: d.count,
        })
      ),
      keywordIntents: keywordsByIntent.map(
        (i: {
          _id: string;
          count: number;
          avgRank: number;
          top10: number;
        }) => ({
          intent: i._id,
          count: i.count,
          avgRank: i.avgRank ? Math.round(i.avgRank * 10) / 10 : null,
          top10: i.top10,
          top10Rate: i.count ? Math.round((i.top10 / i.count) * 100) : 0,
        })
      ),
      domainHealth: domainHealth.map(
        (d: {
          _id: string;
          totalKeywords: number;
          rankedKeywords: number;
          top10: number;
          avgRank: number;
          improved: number;
          declined: number;
        }) => ({
          domain: d._id,
          keywords: d.totalKeywords,
          ranked: d.rankedKeywords,
          top10: d.top10,
          avgRank: d.avgRank ? Math.round(d.avgRank * 10) / 10 : null,
          healthScore: Math.round(
            (d.rankedKeywords / d.totalKeywords) * 30 +
              (d.top10 / Math.max(d.rankedKeywords, 1)) * 40 +
              (d.improved / Math.max(d.improved + d.declined, 1)) * 30
          ),
          trend:
            d.improved > d.declined
              ? "up"
              : d.improved < d.declined
              ? "down"
              : "stable",
        })
      ),
    });
  } catch (error: unknown) {
    console.error("SEO report error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}
