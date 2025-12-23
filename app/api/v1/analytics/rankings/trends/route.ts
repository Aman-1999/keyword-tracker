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
 * GET /api/v1/analytics/rankings/trends
 * Get ranking trends over time
 */
export async function GET(request: Request) {
  try {
    const authResult = await verifyAuth();
    if (!authResult.success || !authResult.user) {
      return authErrorResponse(authResult);
    }

    const userId = authResult.user.userId;
    const { searchParams } = new URL(request.url);

    // Parse parameters
    const domain = searchParams.get("domain");
    const keyword = searchParams.get("keyword");
    const days = parseInt(searchParams.get("days") || "30");
    const granularity = searchParams.get("granularity") || "day"; // day, week, month

    await dbConnect();

    const userObjectId = new Types.ObjectId(userId);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build match query
    const matchQuery: Record<string, unknown> = {
      userId: userObjectId,
      createdAt: { $gte: startDate },
      rank: { $ne: null },
    };

    if (domain) matchQuery.domain = domain;
    if (keyword) matchQuery.keyword = { $regex: keyword, $options: "i" };

    // Date format based on granularity
    const dateFormat =
      {
        day: "%Y-%m-%d",
        week: "%Y-W%V",
        month: "%Y-%m",
      }[granularity] || "%Y-%m-%d";

    // Get trends data
    const trends = await RankingResult.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          },
          avgRank: { $avg: "$rank" },
          bestRank: { $min: "$rank" },
          worstRank: { $max: "$rank" },
          keywordCount: { $sum: 1 },
          rankedCount: { $sum: { $cond: [{ $lte: ["$rank", 100] }, 1, 0] } },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    // Calculate summary
    const firstPeriod = trends[0];
    const lastPeriod = trends[trends.length - 1];

    const summary = {
      startAvg: firstPeriod?.avgRank
        ? Math.round(firstPeriod.avgRank * 10) / 10
        : null,
      endAvg: lastPeriod?.avgRank
        ? Math.round(lastPeriod.avgRank * 10) / 10
        : null,
      change: null as number | null,
      changePercent: null as number | null,
      trend: "stable" as "improving" | "declining" | "stable",
    };

    if (summary.startAvg && summary.endAvg) {
      summary.change =
        Math.round((summary.startAvg - summary.endAvg) * 10) / 10;
      summary.changePercent = Math.round(
        (summary.change / summary.startAvg) * 100
      );
      summary.trend =
        summary.change > 0
          ? "improving"
          : summary.change < 0
          ? "declining"
          : "stable";
    }

    // Get keyword-level trends if specific domain requested
    let keywordTrends: Array<{
      keyword: string;
      startRank: number | null;
      endRank: number | null;
      change: number | null;
    }> = [];
    if (domain) {
      const keywordData = await RankingResult.aggregate([
        { $match: { ...matchQuery, domain } },
        { $sort: { keyword: 1, createdAt: -1 } },
        {
          $group: {
            _id: "$keyword",
            latestRank: { $first: "$rank" },
            oldestRank: { $last: "$rank" },
            checks: { $sum: 1 },
          },
        },
        { $sort: { latestRank: 1 } },
        { $limit: 20 },
      ]);

      keywordTrends = keywordData.map(
        (k: { _id: string; latestRank: number; oldestRank: number }) => ({
          keyword: k._id,
          startRank: k.oldestRank,
          endRank: k.latestRank,
          change:
            k.oldestRank && k.latestRank ? k.oldestRank - k.latestRank : null,
        })
      );
    }

    return successResponse({
      period: {
        days,
        granularity,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
      filters: { domain, keyword },
      summary,
      trends: trends.map(
        (t: {
          _id: { date: string };
          avgRank: number;
          bestRank: number;
          worstRank: number;
          keywordCount: number;
          rankedCount: number;
        }) => ({
          date: t._id.date,
          avgRank: Math.round(t.avgRank * 10) / 10,
          bestRank: t.bestRank,
          worstRank: t.worstRank,
          keywordCount: t.keywordCount,
          rankedCount: t.rankedCount,
        })
      ),
      keywordTrends,
    });
  } catch (error: unknown) {
    console.error("Rankings trends error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}
