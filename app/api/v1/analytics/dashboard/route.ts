import dbConnect from "@/lib/db";
import SearchHistory from "@/models/SearchHistory";
import RankingResult from "@/models/RankingResult";
import { Types } from "mongoose";
import {
  verifyAuth,
  authErrorResponse,
  successResponse,
  errorResponse,
  getOrSetCache,
  CACHE_TTL,
  CACHE_KEYS,
} from "@/lib/api";

/**
 * GET /api/v1/analytics/dashboard
 * Get user's analytics dashboard summary
 */
export async function GET() {
  try {
    const authResult = await verifyAuth();
    if (!authResult.success || !authResult.user) {
      return authErrorResponse(authResult);
    }

    const userId = authResult.user.userId;

    const dashboard = await getOrSetCache(
      CACHE_KEYS.userDashboard(userId),
      CACHE_TTL.USER_DASHBOARD,
      async () => {
        await dbConnect();

        const userObjectId = new Types.ObjectId(userId);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Run all queries in parallel for performance
        const [
          totalKeywords,
          rankedKeywords,
          rankDistribution,
          recentChanges,
          topDomains,
          recentSearches,
          serpFeatures,
        ] = await Promise.all([
          // Total unique keywords tracked
          RankingResult.countDocuments({ userId: userObjectId }),

          // Keywords with rank (in top 100)
          RankingResult.countDocuments({
            userId: userObjectId,
            rank: { $ne: null },
          }),

          // Rank distribution
          RankingResult.aggregate([
            { $match: { userId: userObjectId, rank: { $ne: null } } },
            {
              $group: {
                _id: {
                  $switch: {
                    branches: [
                      { case: { $lte: ["$rank", 3] }, then: "top3" },
                      { case: { $lte: ["$rank", 10] }, then: "top10" },
                      { case: { $lte: ["$rank", 20] }, then: "top20" },
                      { case: { $lte: ["$rank", 50] }, then: "top50" },
                      { case: { $lte: ["$rank", 100] }, then: "top100" },
                    ],
                    default: "notRanked",
                  },
                },
                count: { $sum: 1 },
              },
            },
          ]),

          // Recent rank changes (compare latest vs previous)
          RankingResult.aggregate([
            {
              $match: {
                userId: userObjectId,
                createdAt: { $gte: thirtyDaysAgo },
              },
            },
            { $sort: { domain: 1, keyword: 1, createdAt: -1 } },
            {
              $group: {
                _id: { domain: "$domain", keyword: "$keyword" },
                latestRank: { $first: "$rank" },
                previousRank: { $last: "$rank" },
              },
            },
            {
              $project: {
                change: {
                  $cond: {
                    if: {
                      $and: [
                        { $ne: ["$latestRank", null] },
                        { $ne: ["$previousRank", null] },
                      ],
                    },
                    then: { $subtract: ["$previousRank", "$latestRank"] },
                    else: null,
                  },
                },
              },
            },
            {
              $group: {
                _id: null,
                improved: { $sum: { $cond: [{ $gt: ["$change", 0] }, 1, 0] } },
                declined: { $sum: { $cond: [{ $lt: ["$change", 0] }, 1, 0] } },
                unchanged: { $sum: { $cond: [{ $eq: ["$change", 0] }, 1, 0] } },
              },
            },
          ]),

          // Top tracked domains
          SearchHistory.aggregate([
            { $match: { userId: userObjectId } },
            {
              $group: {
                _id: "$domain",
                searchCount: { $sum: 1 },
                keywords: { $sum: { $size: "$keywords" } },
              },
            },
            { $sort: { searchCount: -1 } },
            { $limit: 5 },
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
                  { $group: { _id: null, avgRank: { $avg: "$rank" } } },
                ],
                as: "rankData",
              },
            },
            {
              $project: {
                domain: "$_id",
                searchCount: 1,
                keywords: 1,
                avgRank: {
                  $ifNull: [{ $arrayElemAt: ["$rankData.avgRank", 0] }, null],
                },
              },
            },
          ]),

          // Recent searches
          SearchHistory.find({ userId: userObjectId })
            .sort({ createdAt: -1 })
            .limit(5)
            .select("domain keywords location createdAt")
            .lean(),

          // SERP features summary
          RankingResult.aggregate([
            {
              $match: {
                userId: userObjectId,
                createdAt: { $gte: thirtyDaysAgo },
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

        // Calculate average rank
        const avgRankResult = await RankingResult.aggregate([
          { $match: { userId: userObjectId, rank: { $ne: null } } },
          { $group: { _id: null, avgRank: { $avg: "$rank" } } },
        ]);

        const avgRank = avgRankResult[0]?.avgRank || null;
        const notRanked = totalKeywords - rankedKeywords;

        // Format rank distribution
        const distribution: Record<string, number> = {
          top3: 0,
          top10: 0,
          top20: 0,
          top50: 0,
          top100: 0,
          notRanked: 0,
        };
        rankDistribution.forEach((item: { _id: string; count: number }) => {
          distribution[item._id] = item.count;
        });
        distribution.notRanked = notRanked;

        // Format changes
        const changes = recentChanges[0] || {
          improved: 0,
          declined: 0,
          unchanged: 0,
        };

        // Format SERP features
        const features = serpFeatures[0] || {
          total: 0,
          withAiOverview: 0,
          withPaa: 0,
          withFeaturedSnippet: 0,
        };

        return {
          summary: {
            totalKeywords,
            rankedKeywords,
            notRanked,
            avgRank: avgRank ? Math.round(avgRank * 10) / 10 : null,
          },
          rankDistribution: distribution,
          recentChanges: {
            improved: changes.improved,
            declined: changes.declined,
            unchanged: changes.unchanged,
          },
          serpFeatures: {
            total: features.total,
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
          topDomains: topDomains.map(
            (d: {
              domain: string;
              searchCount: number;
              keywords: number;
              avgRank: number | null;
            }) => ({
              domain: d.domain,
              searches: d.searchCount,
              keywords: d.keywords,
              avgRank: d.avgRank ? Math.round(d.avgRank * 10) / 10 : null,
            })
          ),
          recentSearches: recentSearches.map(
            (s: {
              _id: Types.ObjectId;
              domain: string;
              keywords: string[];
              location: string;
              createdAt: Date;
            }) => ({
              id: s._id,
              domain: s.domain,
              keywords: s.keywords.length,
              location: s.location,
              createdAt: s.createdAt,
            })
          ),
        };
      }
    );

    return successResponse(dashboard);
  } catch (error: unknown) {
    console.error("Analytics dashboard error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}
