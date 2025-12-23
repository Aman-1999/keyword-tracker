import dbConnect from "@/lib/db";
import User from "@/models/User";
import SearchHistory from "@/models/SearchHistory";
import RankingResult from "@/models/RankingResult";
import CreditUsage from "@/models/CreditUsage";
import {
  verifyAdmin,
  authErrorResponse,
  successResponse,
  errorResponse,
  getOrSetCache,
  CACHE_TTL,
  CACHE_KEYS,
} from "@/lib/api";

/**
 * GET /api/v1/admin/analytics/overview
 * Get admin dashboard analytics overview
 */
export async function GET(request: Request) {
  try {
    const authResult = await verifyAdmin();
    if (!authResult.success) {
      return authErrorResponse(authResult);
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const overview = await getOrSetCache(
      `${CACHE_KEYS.adminStats()}:overview:${days}`,
      CACHE_TTL.ADMIN_STATS,
      async () => {
        await dbConnect();

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Run all queries in parallel
        const [
          totalUsers,
          newUsers,
          activeUsers,
          totalSearches,
          recentSearches,
          totalRankings,
          creditStats,
          usersByRole,
          searchesByDay,
          topDomains,
          topKeywords,
          rankDistribution,
        ] = await Promise.all([
          // Total users
          User.countDocuments(),

          // New users in period
          User.countDocuments({ createdAt: { $gte: startDate } }),

          // Active users in period
          User.countDocuments({ lastActiveAt: { $gte: startDate } }),

          // Total searches
          SearchHistory.countDocuments(),

          // Recent searches in period
          SearchHistory.countDocuments({ createdAt: { $gte: startDate } }),

          // Total rankings
          RankingResult.countDocuments(),

          // Credit usage stats
          CreditUsage.aggregate([
            { $match: { timestamp: { $gte: startDate } } },
            {
              $group: {
                _id: null,
                totalCredits: { $sum: "$creditsUsed" },
                totalRequests: { $sum: 1 },
              },
            },
          ]),

          // Users by role
          User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),

          // Searches by day (for chart)
          SearchHistory.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                count: { $sum: 1 },
                keywords: { $sum: { $size: "$keywords" } },
              },
            },
            { $sort: { _id: 1 } },
          ]),

          // Top searched domains
          SearchHistory.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: "$domain", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ]),

          // Top keywords
          SearchHistory.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $unwind: "$keywords" },
            { $group: { _id: "$keywords", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ]),

          // Rank distribution
          RankingResult.aggregate([
            { $match: { createdAt: { $gte: startDate }, rank: { $ne: null } } },
            {
              $bucket: {
                groupBy: "$rank",
                boundaries: [1, 4, 11, 21, 51, 101],
                default: "not_ranked",
                output: { count: { $sum: 1 } },
              },
            },
          ]),
        ]);

        return {
          period: {
            days,
            startDate: startDate.toISOString(),
            endDate: new Date().toISOString(),
          },
          summary: {
            totalUsers,
            newUsers,
            activeUsers,
            totalSearches,
            recentSearches,
            totalRankings,
            totalCreditsUsed: creditStats[0]?.totalCredits || 0,
            totalApiRequests: creditStats[0]?.totalRequests || 0,
          },
          usersByRole: usersByRole.reduce(
            (
              acc: Record<string, number>,
              item: { _id: string; count: number }
            ) => {
              acc[item._id] = item.count;
              return acc;
            },
            {}
          ),
          charts: {
            searchesByDay: searchesByDay.map(
              (item: { _id: string; count: number; keywords: number }) => ({
                date: item._id,
                searches: item.count,
                keywords: item.keywords,
              })
            ),
          },
          rankings: {
            topDomains: topDomains.map(
              (item: { _id: string; count: number }) => ({
                domain: item._id,
                count: item.count,
              })
            ),
            topKeywords: topKeywords.map(
              (item: { _id: string; count: number }) => ({
                keyword: item._id,
                count: item.count,
              })
            ),
            distribution: formatRankDistribution(rankDistribution),
          },
        };
      }
    );

    return successResponse(overview);
  } catch (error: unknown) {
    console.error("Admin analytics overview error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}

function formatRankDistribution(
  distribution: Array<{ _id: number | string; count: number }>
) {
  const labels: Record<number | string, string> = {
    1: "top3",
    4: "top10",
    11: "top20",
    21: "top50",
    51: "top100",
    not_ranked: "notRanked",
  };

  return distribution.reduce((acc: Record<string, number>, item) => {
    const label = labels[item._id] || String(item._id);
    acc[label] = item.count;
    return acc;
  }, {});
}
