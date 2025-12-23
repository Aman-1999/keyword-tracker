import dbConnect from "@/lib/db";
import RankingResult from "@/models/RankingResult";
import { Types } from "mongoose";
import {
  verifyAuth,
  authErrorResponse,
  successResponse,
  errorResponse,
} from "@/lib/api";

/**
 * Calculate visibility score based on rankings
 * Higher positions = more visibility
 * Position 1 = 100 points, Position 2 = 90, etc.
 */
function calculateVisibilityScore(rank: number | null): number {
  if (!rank || rank > 100) return 0;
  if (rank === 1) return 100;
  if (rank <= 3) return 95 - (rank - 1) * 5;
  if (rank <= 10) return 80 - (rank - 3) * 5;
  if (rank <= 20) return 40 - (rank - 10) * 2;
  if (rank <= 50) return 20 - (rank - 20) * 0.4;
  return Math.max(0, 10 - (rank - 50) * 0.2);
}

/**
 * GET /api/v1/analytics/visibility
 * Get visibility score and market share analytics
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

    const matchQuery: Record<string, unknown> = {
      userId: userObjectId,
      createdAt: { $gte: startDate },
    };
    if (domain) matchQuery.domain = domain;

    // Get all ranking data
    const [
      visibilityTrend,
      domainVisibility,
      rankBrackets,
      topOpportunities,
      weekOverWeek,
      keywordMovers,
    ] = await Promise.all([
      // Daily visibility score trend
      RankingResult.aggregate([
        { $match: matchQuery },
        { $sort: { keyword: 1, domain: 1, createdAt: -1 } },
        {
          $group: {
            _id: {
              date: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
            },
            keywords: { $addToSet: "$keyword" },
            ranks: { $push: "$rank" },
          },
        },
        { $sort: { "_id.date": 1 } },
      ]),

      // Visibility by domain
      RankingResult.aggregate([
        { $match: { userId: userObjectId, createdAt: { $gte: startDate } } },
        { $sort: { keyword: 1, createdAt: -1 } },
        {
          $group: {
            _id: { domain: "$domain", keyword: "$keyword" },
            latestRank: { $first: "$rank" },
          },
        },
        {
          $group: {
            _id: "$_id.domain",
            keywords: { $sum: 1 },
            ranks: { $push: "$latestRank" },
            rankedKeywords: {
              $sum: { $cond: [{ $ne: ["$latestRank", null] }, 1, 0] },
            },
            top3: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$latestRank", null] },
                      { $lte: ["$latestRank", 3] },
                    ],
                  },
                  1,
                  0,
                ],
              },
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
            top20: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$latestRank", null] },
                      { $lte: ["$latestRank", 20] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        { $sort: { keywords: -1 } },
      ]),

      // Rank bracket distribution over time (for stacked area chart)
      RankingResult.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
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
                  {
                    $and: [
                      { $ne: ["$rank", null] },
                      { $gt: ["$rank", 3] },
                      { $lte: ["$rank", 10] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            top20: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$rank", null] },
                      { $gt: ["$rank", 10] },
                      { $lte: ["$rank", 20] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            top50: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$rank", null] },
                      { $gt: ["$rank", 20] },
                      { $lte: ["$rank", 50] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            beyond50: {
              $sum: {
                $cond: [
                  { $and: [{ $ne: ["$rank", null] }, { $gt: ["$rank", 50] }] },
                  1,
                  0,
                ],
              },
            },
            notRanked: {
              $sum: { $cond: [{ $eq: ["$rank", null] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Top opportunities (keywords close to page 1)
      RankingResult.aggregate([
        { $match: { ...matchQuery, rank: { $gt: 10, $lte: 20 } } },
        { $sort: { keyword: 1, createdAt: -1 } },
        {
          $group: {
            _id: { keyword: "$keyword", domain: "$domain" },
            currentRank: { $first: "$rank" },
            bestRank: { $min: "$rank" },
            checks: { $sum: 1 },
          },
        },
        { $sort: { currentRank: 1 } },
        { $limit: 15 },
      ]),

      // Week over week comparison
      (async () => {
        const thisWeekStart = new Date();
        thisWeekStart.setDate(thisWeekStart.getDate() - 7);
        const lastWeekStart = new Date();
        lastWeekStart.setDate(lastWeekStart.getDate() - 14);

        const [thisWeek, lastWeek] = await Promise.all([
          RankingResult.aggregate([
            { $match: { ...matchQuery, createdAt: { $gte: thisWeekStart } } },
            {
              $group: {
                _id: null,
                avgRank: { $avg: "$rank" },
                top10Count: {
                  $sum: { $cond: [{ $lte: ["$rank", 10] }, 1, 0] },
                },
                totalKeywords: { $sum: 1 },
              },
            },
          ]),
          RankingResult.aggregate([
            {
              $match: {
                ...matchQuery,
                createdAt: { $gte: lastWeekStart, $lt: thisWeekStart },
              },
            },
            {
              $group: {
                _id: null,
                avgRank: { $avg: "$rank" },
                top10Count: {
                  $sum: { $cond: [{ $lte: ["$rank", 10] }, 1, 0] },
                },
                totalKeywords: { $sum: 1 },
              },
            },
          ]),
        ]);
        return { thisWeek: thisWeek[0], lastWeek: lastWeek[0] };
      })(),

      // Biggest movers (improved and declined)
      RankingResult.aggregate([
        { $match: matchQuery },
        { $sort: { keyword: 1, domain: 1, createdAt: 1 } },
        {
          $group: {
            _id: { keyword: "$keyword", domain: "$domain" },
            firstRank: { $first: "$rank" },
            lastRank: { $last: "$rank" },
            firstDate: { $first: "$createdAt" },
            lastDate: { $last: "$createdAt" },
          },
        },
        {
          $match: {
            firstRank: { $ne: null },
            lastRank: { $ne: null },
          },
        },
        {
          $project: {
            keyword: "$_id.keyword",
            domain: "$_id.domain",
            startRank: "$firstRank",
            endRank: "$lastRank",
            change: { $subtract: ["$firstRank", "$lastRank"] },
          },
        },
        { $match: { change: { $ne: 0 } } },
        { $sort: { change: -1 } },
      ]),
    ]);

    // Calculate visibility scores for trend
    const visibilityScoreTrend = visibilityTrend.map(
      (day: { _id: { date: string }; ranks: (number | null)[] }) => {
        const validRanks = day.ranks.filter((r): r is number => r !== null);
        const totalScore = validRanks.reduce(
          (sum, rank) => sum + calculateVisibilityScore(rank),
          0
        );
        const maxPossibleScore = day.ranks.length * 100;
        return {
          date: day._id.date,
          score:
            maxPossibleScore > 0
              ? Math.round((totalScore / maxPossibleScore) * 100)
              : 0,
          keywords: day.ranks.length,
          ranked: validRanks.length,
        };
      }
    );

    // Calculate domain visibility scores
    const domainScores = domainVisibility.map(
      (d: {
        _id: string;
        keywords: number;
        ranks: (number | null)[];
        rankedKeywords: number;
        top3: number;
        top10: number;
        top20: number;
      }) => {
        const validRanks = d.ranks.filter((r): r is number => r !== null);
        const totalScore = validRanks.reduce(
          (sum, rank) => sum + calculateVisibilityScore(rank),
          0
        );
        const maxPossibleScore = d.keywords * 100;
        return {
          domain: d._id,
          visibilityScore:
            maxPossibleScore > 0
              ? Math.round((totalScore / maxPossibleScore) * 100)
              : 0,
          keywords: d.keywords,
          rankedKeywords: d.rankedKeywords,
          top3: d.top3,
          top10: d.top10,
          top20: d.top20,
          marketShare:
            d.rankedKeywords > 0
              ? Math.round((d.top10 / d.rankedKeywords) * 100)
              : 0,
        };
      }
    );

    // Format week over week
    const wow = weekOverWeek as {
      thisWeek: { avgRank: number; top10Count: number } | null;
      lastWeek: { avgRank: number; top10Count: number } | null;
    };
    const weekComparison = {
      thisWeek: {
        avgRank: wow.thisWeek?.avgRank
          ? Math.round(wow.thisWeek.avgRank * 10) / 10
          : null,
        top10: wow.thisWeek?.top10Count || 0,
      },
      lastWeek: {
        avgRank: wow.lastWeek?.avgRank
          ? Math.round(wow.lastWeek.avgRank * 10) / 10
          : null,
        top10: wow.lastWeek?.top10Count || 0,
      },
      changes: {
        avgRank:
          wow.thisWeek?.avgRank && wow.lastWeek?.avgRank
            ? Math.round((wow.lastWeek.avgRank - wow.thisWeek.avgRank) * 10) /
              10
            : null,
        top10:
          (wow.thisWeek?.top10Count || 0) - (wow.lastWeek?.top10Count || 0),
      },
    };

    // Get top improvers and decliners
    const movers = keywordMovers as Array<{
      keyword: string;
      domain: string;
      startRank: number;
      endRank: number;
      change: number;
    }>;
    const improvers = movers.filter((m) => m.change > 0).slice(0, 10);
    const decliners = movers
      .filter((m) => m.change < 0)
      .sort((a, b) => a.change - b.change)
      .slice(0, 10);

    return successResponse({
      period: { days, startDate: startDate.toISOString() },
      visibilityTrend: visibilityScoreTrend,
      domainVisibility: domainScores,
      rankBrackets: rankBrackets.map(
        (r: {
          _id: string;
          top3: number;
          top10: number;
          top20: number;
          top50: number;
          beyond50: number;
          notRanked: number;
        }) => ({
          date: r._id,
          top3: r.top3,
          top10: r.top10,
          top20: r.top20,
          top50: r.top50,
          beyond50: r.beyond50,
          notRanked: r.notRanked,
        })
      ),
      opportunities: topOpportunities.map(
        (o: {
          _id: { keyword: string; domain: string };
          currentRank: number;
          bestRank: number;
        }) => ({
          keyword: o._id.keyword,
          domain: o._id.domain,
          currentRank: o.currentRank,
          bestRank: o.bestRank,
          potential: o.currentRank - 10, // positions to page 1
        })
      ),
      weekOverWeek: weekComparison,
      movers: {
        improvers: improvers.map((m) => ({
          keyword: m.keyword,
          domain: m.domain,
          from: m.startRank,
          to: m.endRank,
          change: m.change,
        })),
        decliners: decliners.map((m) => ({
          keyword: m.keyword,
          domain: m.domain,
          from: m.startRank,
          to: m.endRank,
          change: Math.abs(m.change),
        })),
      },
    });
  } catch (error: unknown) {
    console.error("Visibility analytics error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}
