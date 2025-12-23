import dbConnect from "@/lib/db";
import SearchHistory from "@/models/SearchHistory";
import RankingResult from "@/models/RankingResult";
import { Types } from "mongoose";
import {
  verifyAuth,
  authErrorResponse,
  successResponse,
  errorResponse,
  parsePaginationParams,
  buildPagination,
} from "@/lib/api";

/**
 * GET /api/v1/analytics/domains
 * Get domain performance analytics
 */
export async function GET(request: Request) {
  try {
    const authResult = await verifyAuth();
    if (!authResult.success || !authResult.user) {
      return authErrorResponse(authResult);
    }

    const userId = authResult.user.userId;
    const { searchParams } = new URL(request.url);
    const params = parsePaginationParams(searchParams, {
      limit: 10,
      sortBy: "lastChecked",
      sortOrder: "desc",
    });

    const domain = searchParams.get("domain");
    const days = parseInt(searchParams.get("days") || "30");

    await dbConnect();

    const userObjectId = new Types.ObjectId(userId);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // If specific domain requested, return detailed stats
    if (domain) {
      const [domainStats, keywordStats, rankHistory, serpFeatures] =
        await Promise.all([
          // Overall domain stats
          RankingResult.aggregate([
            {
              $match: {
                userId: userObjectId,
                domain,
                createdAt: { $gte: startDate },
              },
            },
            {
              $group: {
                _id: null,
                totalChecks: { $sum: 1 },
                avgRank: { $avg: "$rank" },
                bestRank: { $min: "$rank" },
                worstRank: { $max: "$rank" },
                rankedCount: {
                  $sum: { $cond: [{ $ne: ["$rank", null] }, 1, 0] },
                },
                uniqueKeywords: { $addToSet: "$keyword" },
              },
            },
            {
              $project: {
                totalChecks: 1,
                avgRank: { $round: ["$avgRank", 1] },
                bestRank: 1,
                worstRank: 1,
                rankedCount: 1,
                uniqueKeywords: { $size: "$uniqueKeywords" },
              },
            },
          ]),

          // Keyword performance for this domain
          RankingResult.aggregate([
            { $match: { userId: userObjectId, domain } },
            { $sort: { keyword: 1, createdAt: -1 } },
            {
              $group: {
                _id: "$keyword",
                latestRank: { $first: "$rank" },
                avgRank: { $avg: "$rank" },
                bestRank: { $min: "$rank" },
                checks: { $sum: 1 },
                lastChecked: { $first: "$createdAt" },
                hasAiOverview: { $max: { $cond: ["$isAiOverview", 1, 0] } },
                hasPaa: { $max: { $cond: ["$isPeopleAlsoAsk", 1, 0] } },
              },
            },
            { $sort: { latestRank: 1 } },
            { $limit: 50 },
          ]),

          // Rank history by day
          RankingResult.aggregate([
            {
              $match: {
                userId: userObjectId,
                domain,
                createdAt: { $gte: startDate },
                rank: { $ne: null },
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                avgRank: { $avg: "$rank" },
                bestRank: { $min: "$rank" },
                keywords: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ]),

          // SERP features for this domain
          RankingResult.aggregate([
            {
              $match: {
                userId: userObjectId,
                domain,
                createdAt: { $gte: startDate },
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                withAiOverview: { $sum: { $cond: ["$isAiOverview", 1, 0] } },
                withPaa: { $sum: { $cond: ["$isPeopleAlsoAsk", 1, 0] } },
                withFeaturedSnippet: {
                  $sum: { $cond: ["$is_featured_snippet", 1, 0] },
                },
              },
            },
          ]),
        ]);

      const stats = domainStats[0] || {
        totalChecks: 0,
        avgRank: null,
        bestRank: null,
        worstRank: null,
        rankedCount: 0,
        uniqueKeywords: 0,
      };
      const features = serpFeatures[0] || {
        total: 0,
        withAiOverview: 0,
        withPaa: 0,
        withFeaturedSnippet: 0,
      };

      return successResponse({
        domain,
        period: { days, startDate: startDate.toISOString() },
        summary: {
          totalChecks: stats.totalChecks,
          uniqueKeywords: stats.uniqueKeywords,
          rankedKeywords: stats.rankedCount,
          avgRank: stats.avgRank,
          bestRank: stats.bestRank,
          worstRank: stats.worstRank,
        },
        serpFeatures: {
          aiOverview: {
            count: features.withAiOverview,
            percent: features.total
              ? Math.round((features.withAiOverview / features.total) * 100)
              : 0,
          },
          peopleAlsoAsk: {
            count: features.withPaa,
            percent: features.total
              ? Math.round((features.withPaa / features.total) * 100)
              : 0,
          },
          featuredSnippet: {
            count: features.withFeaturedSnippet,
            percent: features.total
              ? Math.round(
                  (features.withFeaturedSnippet / features.total) * 100
                )
              : 0,
          },
        },
        keywords: keywordStats.map(
          (k: {
            _id: string;
            latestRank: number | null;
            avgRank: number;
            bestRank: number;
            checks: number;
            lastChecked: Date;
            hasAiOverview: number;
            hasPaa: number;
          }) => ({
            keyword: k._id,
            currentRank: k.latestRank,
            avgRank: k.avgRank ? Math.round(k.avgRank * 10) / 10 : null,
            bestRank: k.bestRank,
            checks: k.checks,
            lastChecked: k.lastChecked,
            hasAiOverview: k.hasAiOverview === 1,
            hasPaa: k.hasPaa === 1,
          })
        ),
        rankHistory: rankHistory.map(
          (h: {
            _id: string;
            avgRank: number;
            bestRank: number;
            keywords: number;
          }) => ({
            date: h._id,
            avgRank: Math.round(h.avgRank * 10) / 10,
            bestRank: h.bestRank,
            keywords: h.keywords,
          })
        ),
      });
    }

    // List all domains with stats
    const [domains, total] = await Promise.all([
      SearchHistory.aggregate([
        { $match: { userId: userObjectId } },
        {
          $group: {
            _id: "$domain",
            searches: { $sum: 1 },
            lastSearched: { $max: "$createdAt" },
          },
        },
        { $sort: { lastSearched: -1 } },
        { $skip: (params.page! - 1) * params.limit! },
        { $limit: params.limit! },
        {
          $lookup: {
            from: "rankingresults",
            let: { domain: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$domain", "$$domain"] },
                      { $eq: ["$userId", userObjectId] },
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  avgRank: { $avg: "$rank" },
                  bestRank: { $min: "$rank" },
                  totalKeywords: { $sum: 1 },
                  rankedKeywords: {
                    $sum: { $cond: [{ $ne: ["$rank", null] }, 1, 0] },
                  },
                },
              },
            ],
            as: "stats",
          },
        },
        { $unwind: { path: "$stats", preserveNullAndEmptyArrays: true } },
      ]),
      SearchHistory.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: "$domain" } },
        { $count: "total" },
      ]),
    ]);

    const pagination = buildPagination(
      params.page!,
      params.limit!,
      total[0]?.total || 0
    );

    return successResponse(
      domains.map(
        (d: {
          _id: string;
          searches: number;
          lastSearched: Date;
          stats?: {
            avgRank: number;
            bestRank: number;
            totalKeywords: number;
            rankedKeywords: number;
          };
        }) => ({
          domain: d._id,
          searches: d.searches,
          lastSearched: d.lastSearched,
          avgRank: d.stats?.avgRank
            ? Math.round(d.stats.avgRank * 10) / 10
            : null,
          bestRank: d.stats?.bestRank || null,
          totalKeywords: d.stats?.totalKeywords || 0,
          rankedKeywords: d.stats?.rankedKeywords || 0,
        })
      ),
      { pagination }
    );
  } catch (error: unknown) {
    console.error("Domain analytics error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}
