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
 * GET /api/v1/analytics/overview
 * Get comprehensive analytics overview with charts data
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

    await dbConnect();

    const userObjectId = new Types.ObjectId(userId);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Execute all queries in parallel
    const [
      searchActivity,
      rankDistribution,
      topKeywords,
      serpFeatureStats,
      locationStats,
      rankChanges,
      dailyStats,
    ] = await Promise.all([
      // Search activity over time
      SearchHistory.aggregate([
        { $match: { userId: userObjectId, createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            searches: { $sum: 1 },
            keywords: { $sum: { $size: { $ifNull: ["$keywords", []] } } },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Rank distribution (pie chart data)
      RankingResult.aggregate([
        { $match: { userId: userObjectId, createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $lte: ["$rank", 3] }, then: "Top 3" },
                  { case: { $lte: ["$rank", 10] }, then: "Top 10" },
                  { case: { $lte: ["$rank", 20] }, then: "Top 20" },
                  { case: { $lte: ["$rank", 50] }, then: "Top 50" },
                  { case: { $lte: ["$rank", 100] }, then: "Top 100" },
                ],
                default: "Not Ranked",
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Top performing keywords
      RankingResult.aggregate([
        {
          $match: {
            userId: userObjectId,
            rank: { $ne: null },
            createdAt: { $gte: startDate },
          },
        },
        { $sort: { keyword: 1, createdAt: -1 } },
        {
          $group: {
            _id: "$keyword",
            currentRank: { $first: "$rank" },
            bestRank: { $min: "$rank" },
            domain: { $first: "$domain" },
            checks: { $sum: 1 },
          },
        },
        { $match: { currentRank: { $lte: 20 } } },
        { $sort: { currentRank: 1 } },
        { $limit: 10 },
      ]),

      // SERP feature presence stats
      RankingResult.aggregate([
        { $match: { userId: userObjectId, createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            withAiOverview: { $sum: { $cond: ["$isAiOverview", 1, 0] } },
            withPaa: { $sum: { $cond: ["$isPeopleAlsoAsk", 1, 0] } },
            withFeaturedSnippet: {
              $sum: { $cond: ["$is_featured_snippet", 1, 0] },
            },
            withLocalPack: { $sum: { $cond: ["$has_local_pack", 1, 0] } },
            withKnowledgePanel: {
              $sum: { $cond: ["$has_knowledge_panel", 1, 0] },
            },
          },
        },
      ]),

      // Location distribution
      RankingResult.aggregate([
        { $match: { userId: userObjectId, createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: "$location",
            count: { $sum: 1 },
            avgRank: { $avg: "$rank" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Rank changes analysis
      RankingResult.aggregate([
        { $match: { userId: userObjectId, createdAt: { $gte: startDate } } },
        { $sort: { keyword: 1, domain: 1, createdAt: 1 } },
        {
          $group: {
            _id: { keyword: "$keyword", domain: "$domain" },
            firstRank: { $first: "$rank" },
            lastRank: { $last: "$rank" },
          },
        },
        {
          $project: {
            change: {
              $cond: {
                if: {
                  $and: [
                    { $ne: ["$firstRank", null] },
                    { $ne: ["$lastRank", null] },
                  ],
                },
                then: { $subtract: ["$firstRank", "$lastRank"] },
                else: null,
              },
            },
          },
        },
        { $match: { change: { $ne: null } } },
        {
          $group: {
            _id: null,
            improved: { $sum: { $cond: [{ $gt: ["$change", 0] }, 1, 0] } },
            declined: { $sum: { $cond: [{ $lt: ["$change", 0] }, 1, 0] } },
            stable: { $sum: { $cond: [{ $eq: ["$change", 0] }, 1, 0] } },
            totalImprovement: {
              $sum: { $cond: [{ $gt: ["$change", 0] }, "$change", 0] },
            },
            totalDecline: {
              $sum: { $cond: [{ $lt: ["$change", 0] }, "$change", 0] },
            },
          },
        },
      ]),

      // Daily average rank trend
      RankingResult.aggregate([
        {
          $match: {
            userId: userObjectId,
            rank: { $ne: null },
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            avgRank: { $avg: "$rank" },
            minRank: { $min: "$rank" },
            maxRank: { $max: "$rank" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Format SERP feature stats for chart
    const serpFeatures = serpFeatureStats[0] || {
      total: 0,
      withAiOverview: 0,
      withPaa: 0,
      withFeaturedSnippet: 0,
      withLocalPack: 0,
      withKnowledgePanel: 0,
    };

    const serpFeatureChart = [
      {
        name: "AI Overview",
        value: serpFeatures.withAiOverview,
        color: "#8b5cf6",
      },
      {
        name: "People Also Ask",
        value: serpFeatures.withPaa,
        color: "#3b82f6",
      },
      {
        name: "Featured Snippet",
        value: serpFeatures.withFeaturedSnippet,
        color: "#10b981",
      },
      {
        name: "Local Pack",
        value: serpFeatures.withLocalPack,
        color: "#f59e0b",
      },
      {
        name: "Knowledge Panel",
        value: serpFeatures.withKnowledgePanel,
        color: "#ef4444",
      },
    ].filter((f) => f.value > 0);

    // Calculate summary stats
    const rankChangeStats = rankChanges[0] || {
      improved: 0,
      declined: 0,
      stable: 0,
      totalImprovement: 0,
      totalDecline: 0,
    };

    return successResponse({
      period: { days, startDate: startDate.toISOString() },
      searchActivity: searchActivity.map(
        (s: { _id: string; searches: number; keywords: number }) => ({
          date: s._id,
          searches: s.searches,
          keywords: s.keywords,
        })
      ),
      rankDistribution: rankDistribution.map(
        (r: { _id: string; count: number }) => ({
          range: r._id,
          count: r.count,
        })
      ),
      topKeywords: topKeywords.map(
        (k: {
          _id: string;
          currentRank: number;
          bestRank: number;
          domain: string;
          checks: number;
        }) => ({
          keyword: k._id,
          currentRank: k.currentRank,
          bestRank: k.bestRank,
          domain: k.domain,
          checks: k.checks,
        })
      ),
      serpFeatures: {
        total: serpFeatures.total,
        chart: serpFeatureChart,
      },
      locationStats: locationStats.map(
        (l: { _id: string; count: number; avgRank: number }) => ({
          location: l._id || "Unknown",
          count: l.count,
          avgRank: l.avgRank ? Math.round(l.avgRank * 10) / 10 : null,
        })
      ),
      rankChanges: {
        improved: rankChangeStats.improved,
        declined: rankChangeStats.declined,
        stable: rankChangeStats.stable,
        netChange:
          rankChangeStats.totalImprovement + rankChangeStats.totalDecline,
      },
      dailyStats: dailyStats.map(
        (d: {
          _id: string;
          avgRank: number;
          minRank: number;
          maxRank: number;
          count: number;
        }) => ({
          date: d._id,
          avgRank: Math.round(d.avgRank * 10) / 10,
          minRank: d.minRank,
          maxRank: d.maxRank,
          count: d.count,
        })
      ),
    });
  } catch (error: unknown) {
    console.error("Analytics overview error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}
