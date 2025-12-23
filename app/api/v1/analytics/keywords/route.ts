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

interface KeywordStats {
  keyword: string;
  domain: string;
  currentRank: number | null;
  bestRank: number | null;
  avgRank: number | null;
  worstRank: number | null;
  totalChecks: number;
  lastChecked: Date;
  firstChecked: Date;
  rankChange: number | null;
  trend: "improving" | "declining" | "stable" | "new";
  hasAiOverview: boolean;
  hasPaa: boolean;
  hasFeaturedSnippet: boolean;
}

/**
 * GET /api/v1/analytics/keywords
 * Get keyword performance analytics
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
      limit: 20,
      sortBy: "lastChecked",
      sortOrder: "desc",
    });

    const keyword = searchParams.get("keyword");
    const domain = searchParams.get("domain");
    const days = parseInt(searchParams.get("days") || "30");
    const rankFilter = searchParams.get("rankFilter"); // top10, top20, top50, top100, notRanked

    await dbConnect();

    const userObjectId = new Types.ObjectId(userId);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // If specific keyword requested, return detailed stats
    if (keyword) {
      const keywordData = await getKeywordDetail(
        userObjectId,
        keyword,
        domain,
        days
      );
      return successResponse(keywordData);
    }

    // Build match query for filtering
    const matchQuery: Record<string, unknown> = { userId: userObjectId };
    if (domain) matchQuery.domain = domain;

    // Get all keywords with stats
    const keywordsAggregation = await RankingResult.aggregate([
      { $match: matchQuery },
      { $sort: { keyword: 1, createdAt: -1 } },
      {
        $group: {
          _id: { keyword: "$keyword", domain: "$domain" },
          currentRank: { $first: "$rank" },
          bestRank: { $min: "$rank" },
          worstRank: { $max: "$rank" },
          avgRank: { $avg: "$rank" },
          totalChecks: { $sum: 1 },
          lastChecked: { $first: "$createdAt" },
          firstChecked: { $last: "$createdAt" },
          previousRank: { $last: "$rank" },
          hasAiOverview: { $max: { $cond: ["$isAiOverview", 1, 0] } },
          hasPaa: { $max: { $cond: ["$isPeopleAlsoAsk", 1, 0] } },
          hasFeaturedSnippet: {
            $max: { $cond: ["$is_featured_snippet", 1, 0] },
          },
        },
      },
      {
        $project: {
          keyword: "$_id.keyword",
          domain: "$_id.domain",
          currentRank: 1,
          bestRank: 1,
          worstRank: 1,
          avgRank: { $round: ["$avgRank", 1] },
          totalChecks: 1,
          lastChecked: 1,
          firstChecked: 1,
          rankChange: {
            $cond: {
              if: {
                $and: [
                  { $ne: ["$currentRank", null] },
                  { $ne: ["$previousRank", null] },
                ],
              },
              then: { $subtract: ["$previousRank", "$currentRank"] },
              else: null,
            },
          },
          hasAiOverview: { $eq: ["$hasAiOverview", 1] },
          hasPaa: { $eq: ["$hasPaa", 1] },
          hasFeaturedSnippet: { $eq: ["$hasFeaturedSnippet", 1] },
        },
      },
    ]);

    // Apply rank filter
    let filteredKeywords = keywordsAggregation;
    if (rankFilter) {
      filteredKeywords = keywordsAggregation.filter(
        (k: { currentRank: number | null }) => {
          const rank = k.currentRank;
          switch (rankFilter) {
            case "top10":
              return rank !== null && rank <= 10;
            case "top20":
              return rank !== null && rank <= 20;
            case "top50":
              return rank !== null && rank <= 50;
            case "top100":
              return rank !== null && rank <= 100;
            case "notRanked":
              return rank === null;
            default:
              return true;
          }
        }
      );
    }

    // Sort
    const sortField = params.sortBy || "lastChecked";
    const sortDir = params.sortOrder === "asc" ? 1 : -1;
    filteredKeywords.sort(
      (a: Record<string, unknown>, b: Record<string, unknown>) => {
        const aVal = a[sortField] as any;
        const bVal = b[sortField] as any;
        if (aVal === null) return 1;
        if (bVal === null) return -1;
        if (aVal < bVal) return -1 * sortDir;
        if (aVal > bVal) return 1 * sortDir;
        return 0;
      }
    );

    // Paginate
    const total = filteredKeywords.length;
    const startIdx = (params.page! - 1) * params.limit!;
    const paginatedKeywords = filteredKeywords.slice(
      startIdx,
      startIdx + params.limit!
    );

    // Add trend calculation
    const keywordsWithTrend = paginatedKeywords.map(
      (k: {
        keyword: string;
        domain: string;
        currentRank: number | null;
        bestRank: number | null;
        avgRank: number | null;
        worstRank: number | null;
        totalChecks: number;
        lastChecked: Date;
        firstChecked: Date;
        rankChange: number | null;
        hasAiOverview: boolean;
        hasPaa: boolean;
        hasFeaturedSnippet: boolean;
      }) => {
        let trend: "improving" | "declining" | "stable" | "new" = "stable";
        if (k.totalChecks === 1) trend = "new";
        else if (k.rankChange !== null && k.rankChange > 0) trend = "improving";
        else if (k.rankChange !== null && k.rankChange < 0) trend = "declining";
        return { ...k, trend };
      }
    );

    // Get summary stats
    const summary = {
      totalKeywords: total,
      rankedKeywords: filteredKeywords.filter(
        (k: { currentRank: number | null }) => k.currentRank !== null
      ).length,
      top10: filteredKeywords.filter(
        (k: { currentRank: number | null }) =>
          k.currentRank !== null && k.currentRank <= 10
      ).length,
      top20: filteredKeywords.filter(
        (k: { currentRank: number | null }) =>
          k.currentRank !== null && k.currentRank <= 20
      ).length,
      improving: keywordsAggregation.filter(
        (k: { rankChange: number | null }) =>
          k.rankChange !== null && k.rankChange > 0
      ).length,
      declining: keywordsAggregation.filter(
        (k: { rankChange: number | null }) =>
          k.rankChange !== null && k.rankChange < 0
      ).length,
    };

    const pagination = buildPagination(params.page!, params.limit!, total);

    return successResponse(keywordsWithTrend, {
      pagination,
      meta: { summary },
    });
  } catch (error: unknown) {
    console.error("Keyword analytics error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}

async function getKeywordDetail(
  userId: Types.ObjectId,
  keyword: string,
  domain: string | null,
  days: number
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const matchQuery: Record<string, unknown> = {
    userId,
    keyword: { $regex: `^${keyword}$`, $options: "i" },
  };
  if (domain) matchQuery.domain = domain;

  const [keywordStats, rankHistory, domainsForKeyword, serpFeatureHistory] =
    await Promise.all([
      // Overall keyword stats
      RankingResult.aggregate([
        { $match: matchQuery },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$domain",
            currentRank: { $first: "$rank" },
            bestRank: { $min: "$rank" },
            worstRank: { $max: "$rank" },
            avgRank: { $avg: "$rank" },
            totalChecks: { $sum: 1 },
            lastChecked: { $first: "$createdAt" },
            firstChecked: { $last: "$createdAt" },
            location: { $first: "$location" },
            hasAiOverview: { $max: { $cond: ["$isAiOverview", 1, 0] } },
            hasPaa: { $max: { $cond: ["$isPeopleAlsoAsk", 1, 0] } },
          },
        },
      ]),

      // Rank history over time
      RankingResult.aggregate([
        { $match: { ...matchQuery, createdAt: { $gte: startDate } } },
        { $sort: { createdAt: 1 } },
        {
          $group: {
            _id: {
              date: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              domain: "$domain",
            },
            rank: { $last: "$rank" },
            hasAiOverview: { $max: { $cond: ["$isAiOverview", 1, 0] } },
          },
        },
        { $sort: { "_id.date": 1 } },
      ]),

      // All domains where this keyword was tracked
      RankingResult.distinct("domain", matchQuery),

      // SERP feature presence over time
      RankingResult.aggregate([
        { $match: { ...matchQuery, createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            total: { $sum: 1 },
            withAiOverview: { $sum: { $cond: ["$isAiOverview", 1, 0] } },
            withPaa: { $sum: { $cond: ["$isPeopleAlsoAsk", 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

  // Format rank history for chart
  const historyByDomain: Record<
    string,
    Array<{ date: string; rank: number | null; hasAiOverview: boolean }>
  > = {};
  rankHistory.forEach(
    (h: {
      _id: { date: string; domain: string };
      rank: number | null;
      hasAiOverview: number;
    }) => {
      if (!historyByDomain[h._id.domain]) {
        historyByDomain[h._id.domain] = [];
      }
      historyByDomain[h._id.domain].push({
        date: h._id.date,
        rank: h.rank,
        hasAiOverview: h.hasAiOverview === 1,
      });
    }
  );

  return {
    keyword,
    period: { days, startDate: startDate.toISOString() },
    domains: domainsForKeyword,
    stats: keywordStats.map(
      (s: {
        _id: string;
        currentRank: number | null;
        bestRank: number | null;
        worstRank: number | null;
        avgRank: number | null;
        totalChecks: number;
        lastChecked: Date;
        firstChecked: Date;
        location: string;
        hasAiOverview: number;
        hasPaa: number;
      }) => ({
        domain: s._id,
        currentRank: s.currentRank,
        bestRank: s.bestRank,
        worstRank: s.worstRank,
        avgRank: s.avgRank ? Math.round(s.avgRank * 10) / 10 : null,
        totalChecks: s.totalChecks,
        lastChecked: s.lastChecked,
        firstChecked: s.firstChecked,
        location: s.location,
        hasAiOverview: s.hasAiOverview === 1,
        hasPaa: s.hasPaa === 1,
      })
    ),
    rankHistory: historyByDomain,
    serpFeatureHistory: serpFeatureHistory.map(
      (s: {
        _id: string;
        total: number;
        withAiOverview: number;
        withPaa: number;
      }) => ({
        date: s._id,
        total: s.total,
        aiOverviewPercent: s.total
          ? Math.round((s.withAiOverview / s.total) * 100)
          : 0,
        paaPercent: s.total ? Math.round((s.withPaa / s.total) * 100) : 0,
      })
    ),
  };
}
