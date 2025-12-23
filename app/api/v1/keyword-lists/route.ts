import dbConnect from "@/lib/db";
import KeywordList from "@/models/KeywordList";
import { Types } from "mongoose";
import {
  verifyAuth,
  authErrorResponse,
  successResponse,
  errorResponse,
  createdResponse,
} from "@/lib/api";

// Default limit: 1 list per domain per user (can be increased per user/plan)
const DEFAULT_LISTS_PER_DOMAIN = 1;

/**
 * GET /api/v1/keyword-lists
 * Get all keyword lists for the authenticated user
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
    const activeOnly = searchParams.get("active") !== "false";

    await dbConnect();

    const query: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };

    if (domain) {
      query.domain = domain.toLowerCase();
    }

    if (activeOnly) {
      query.isActive = true;
    }

    const lists = await KeywordList.find(query).sort({ updatedAt: -1 }).lean();

    // Add keyword count to each list
    const listsWithCount = lists.map((list) => ({
      ...list,
      keywordCount: list.keywords?.length || 0,
    }));

    return successResponse(listsWithCount);
  } catch (error: unknown) {
    console.error("Get keyword lists error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}

/**
 * POST /api/v1/keyword-lists
 * Create a new keyword list
 */
export async function POST(request: Request) {
  try {
    const authResult = await verifyAuth();
    if (!authResult.success || !authResult.user) {
      return authErrorResponse(authResult);
    }

    const userId = authResult.user.userId;
    const body = await request.json();
    const {
      name,
      domain,
      location,
      locationCode,
      language,
      languageName,
      keywords,
      autoTrack,
      trackingFrequency,
    } = body;

    if (!name || !domain) {
      return errorResponse("Name and domain are required", 400);
    }

    await dbConnect();

    const userObjectId = new Types.ObjectId(userId);
    const normalizedDomain = domain
      .toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, "")
      .replace(/\/$/, "");

    // Check if user already has a list for this domain
    const existingCount = await KeywordList.countDocuments({
      userId: userObjectId,
      domain: normalizedDomain,
    });

    if (existingCount >= DEFAULT_LISTS_PER_DOMAIN) {
      return errorResponse(
        `You can only have ${DEFAULT_LISTS_PER_DOMAIN} list(s) per domain. Delete an existing list first.`,
        400
      );
    }

    // Process keywords if provided
    const processedKeywords = keywords?.length
      ? keywords.map((kw: string | { keyword: string }) => ({
          keyword: (typeof kw === "string" ? kw : kw.keyword)
            .toLowerCase()
            .trim(),
          addedAt: new Date(),
        }))
      : [];

    const keywordList = await KeywordList.create({
      userId: userObjectId,
      name: name.trim(),
      domain: normalizedDomain,
      location: location || "United States",
      locationCode: locationCode || null,
      language: language || "en",
      languageName: languageName || "English",
      keywords: processedKeywords,
      autoTrack: autoTrack || false,
      trackingFrequency: trackingFrequency || "manual",
    });

    return createdResponse(keywordList);
  } catch (error: unknown) {
    console.error("Create keyword list error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}
