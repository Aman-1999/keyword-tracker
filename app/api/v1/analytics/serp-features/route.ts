import dbConnect from "@/lib/db";
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
 * GET /api/v1/analytics/serp-features
 * Get SERP features analytics
 */
export async function GET(request: Request) {
  try {
    const authResult = await verifyAuth();
    if (!authResult.success || !authResult.user) {
      return authErrorResponse(authResult);
    }

    const userId = authResult.user.userId;
    const { searchParams } = new URL(request.url);

    const domain = searchParams.get("domain");
    const days = parseInt(searchParams.get("days") || "30");

    const serpFeatures = await getOrSetCache(
      `${CACHE_KEYS.serpFeatures(userId)}:${domain || "all"}:${days}`,
      CACHE_TTL.SERP_FEATURES,
      async () => {
        await dbConnect();

        const userObjectId = new Types.ObjectId(userId);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Build match query
        const matchQuery: Record<string, unknown> = {
          userId: userObjectId,
          createdAt: { $gte: startDate },
        };
        if (domain) matchQuery.domain = domain;

        // Run all queries in parallel
        const [
          featureSummary,
          featureTrends,
          aiOverviewKeywords,
          paaKeywords,
          featuredSnippetKeywords,
          domainPresence,
        ] = await Promise.all([
          // Overall feature summary
          RankingResult.aggregate([
            { $match: matchQuery },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                withAiOverview: { $sum: { $cond: ["$isAiOverview", 1, 0] } },
                withPaa: { $sum: { $cond: ["$isPeopleAlsoAsk", 1, 0] } },
                withFeaturedSnippet: {
                  $sum: { $cond: ["$is_featured_snippet", 1, 0] },
                },
                withLocalPack: {
                  $sum: {
                    $cond: [
                      { $in: ["local_pack", { $ifNull: ["$item_types", []] }] },
                      1,
                      0,
                    ],
                  },
                },
                withSitelinks: {
                  $sum: {
                    $cond: [
                      { $gt: [{ $size: { $ifNull: ["$links", []] } }, 0] },
                      1,
                      0,
                    ],
                  },
                },
                withImages: {
                  $sum: {
                    $cond: [
                      { $gt: [{ $size: { $ifNull: ["$images", []] } }, 0] },
                      1,
                      0,
                    ],
                  },
                },
                withFaq: {
                  $sum: {
                    $cond: [
                      { $gt: [{ $size: { $ifNull: ["$faq", []] } }, 0] },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ]),

          // Feature trends over time
          RankingResult.aggregate([
            { $match: matchQuery },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                total: { $sum: 1 },
                aiOverview: { $sum: { $cond: ["$isAiOverview", 1, 0] } },
                paa: { $sum: { $cond: ["$isPeopleAlsoAsk", 1, 0] } },
                featuredSnippet: {
                  $sum: { $cond: ["$is_featured_snippet", 1, 0] },
                },
              },
            },
            { $sort: { _id: 1 } },
          ]),

          // Keywords with AI Overview
          RankingResult.aggregate([
            { $match: { ...matchQuery, isAiOverview: true } },
            { $sort: { createdAt: -1 } },
            {
              $group: {
                _id: { domain: "$domain", keyword: "$keyword" },
                rank: { $first: "$rank" },
                lastSeen: { $first: "$createdAt" },
              },
            },
            { $sort: { lastSeen: -1 } },
            { $limit: 20 },
          ]),

          // Keywords with People Also Ask
          RankingResult.aggregate([
            { $match: { ...matchQuery, isPeopleAlsoAsk: true } },
            { $sort: { createdAt: -1 } },
            {
              $group: {
                _id: { domain: "$domain", keyword: "$keyword" },
                rank: { $first: "$rank" },
                paaCount: {
                  $first: { $size: { $ifNull: ["$people_also_ask", []] } },
                },
                lastSeen: { $first: "$createdAt" },
              },
            },
            { $sort: { lastSeen: -1 } },
            { $limit: 20 },
          ]),

          // Keywords with Featured Snippet
          RankingResult.aggregate([
            { $match: { ...matchQuery, is_featured_snippet: true } },
            { $sort: { createdAt: -1 } },
            {
              $group: {
                _id: { domain: "$domain", keyword: "$keyword" },
                rank: { $first: "$rank" },
                lastSeen: { $first: "$createdAt" },
              },
            },
            { $sort: { lastSeen: -1 } },
            { $limit: 20 },
          ]),

          // Domain presence in SERP features (where user's domain appears)
          domain
            ? RankingResult.aggregate([
                { $match: { ...matchQuery, domain } },
                {
                  $group: {
                    _id: null,
                    inAiOverview: {
                      $sum: {
                        $cond: [
                          { $and: ["$isAiOverview", { $ne: ["$rank", null] }] },
                          1,
                          0,
                        ],
                      },
                    },
                    total: { $sum: 1 },
                  },
                },
              ])
            : Promise.resolve([]),
        ]);

        const summary = featureSummary[0] || {
          total: 0,
          withAiOverview: 0,
          withPaa: 0,
          withFeaturedSnippet: 0,
          withLocalPack: 0,
          withSitelinks: 0,
          withImages: 0,
          withFaq: 0,
        };
        const presence = domainPresence[0] || { inAiOverview: 0, total: 0 };

        const calcPercent = (count: number) =>
          summary.total ? Math.round((count / summary.total) * 100) : 0;

        return {
          period: {
            days,
            startDate: startDate.toISOString(),
            endDate: new Date().toISOString(),
          },
          filters: { domain },
          summary: {
            totalChecks: summary.total,
            features: {
              aiOverview: {
                count: summary.withAiOverview,
                percent: calcPercent(summary.withAiOverview),
              },
              peopleAlsoAsk: {
                count: summary.withPaa,
                percent: calcPercent(summary.withPaa),
              },
              featuredSnippet: {
                count: summary.withFeaturedSnippet,
                percent: calcPercent(summary.withFeaturedSnippet),
              },
              localPack: {
                count: summary.withLocalPack,
                percent: calcPercent(summary.withLocalPack),
              },
              sitelinks: {
                count: summary.withSitelinks,
                percent: calcPercent(summary.withSitelinks),
              },
              images: {
                count: summary.withImages,
                percent: calcPercent(summary.withImages),
              },
              faq: {
                count: summary.withFaq,
                percent: calcPercent(summary.withFaq),
              },
            },
          },
          domainPresence: domain
            ? {
                inAiOverview: presence.inAiOverview,
                percent: presence.total
                  ? Math.round((presence.inAiOverview / presence.total) * 100)
                  : 0,
              }
            : null,
          trends: featureTrends.map(
            (t: {
              _id: string;
              total: number;
              aiOverview: number;
              paa: number;
              featuredSnippet: number;
            }) => ({
              date: t._id,
              total: t.total,
              aiOverview: t.aiOverview,
              paa: t.paa,
              featuredSnippet: t.featuredSnippet,
              aiOverviewPercent: t.total
                ? Math.round((t.aiOverview / t.total) * 100)
                : 0,
            })
          ),
          keywords: {
            withAiOverview: aiOverviewKeywords.map(
              (k: {
                _id: { domain: string; keyword: string };
                rank: number | null;
                lastSeen: Date;
              }) => ({
                domain: k._id.domain,
                keyword: k._id.keyword,
                rank: k.rank,
                lastSeen: k.lastSeen,
              })
            ),
            withPaa: paaKeywords.map(
              (k: {
                _id: { domain: string; keyword: string };
                rank: number | null;
                paaCount: number;
                lastSeen: Date;
              }) => ({
                domain: k._id.domain,
                keyword: k._id.keyword,
                rank: k.rank,
                paaCount: k.paaCount,
                lastSeen: k.lastSeen,
              })
            ),
            withFeaturedSnippet: featuredSnippetKeywords.map(
              (k: {
                _id: { domain: string; keyword: string };
                rank: number | null;
                lastSeen: Date;
              }) => ({
                domain: k._id.domain,
                keyword: k._id.keyword,
                rank: k.rank,
                lastSeen: k.lastSeen,
              })
            ),
          },
        };
      }
    );

    return successResponse(serpFeatures);
  } catch (error: unknown) {
    console.error("SERP features analytics error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}
