import dbConnect from "@/lib/db";
import KeywordList from "@/models/KeywordList";
import { Types } from "mongoose";
import {
  verifyAuth,
  authErrorResponse,
  successResponse,
  errorResponse,
} from "@/lib/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/keyword-lists/[id]/keywords
 * Add keywords to a list
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const authResult = await verifyAuth();
    if (!authResult.success || !authResult.user) {
      return authErrorResponse(authResult);
    }

    const { id } = await params;
    const userId = authResult.user.userId;

    if (!Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid list ID", 400);
    }

    const body = await request.json();
    const { keywords } = body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return errorResponse("Keywords array is required", 400);
    }

    await dbConnect();

    const list = await KeywordList.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });

    if (!list) {
      return errorResponse("Keyword list not found", 404);
    }

    // Get existing keywords for duplicate check
    const existingKeywords = new Set(
      list.keywords.map((k) => k.keyword.toLowerCase())
    );

    // Process new keywords
    const newKeywords = keywords
      .map((kw: string | { keyword: string; notes?: string }) => {
        const keyword = (typeof kw === "string" ? kw : kw.keyword)
          .toLowerCase()
          .trim();
        const notes = typeof kw === "object" ? kw.notes : undefined;
        return { keyword, notes };
      })
      .filter((kw) => kw.keyword && !existingKeywords.has(kw.keyword))
      .map((kw) => ({
        keyword: kw.keyword,
        notes: kw.notes,
        addedAt: new Date(),
      }));

    if (newKeywords.length === 0) {
      return errorResponse("All keywords already exist in the list", 400);
    }

    // Add new keywords
    list.keywords.push(...newKeywords);
    await list.save();

    return successResponse({
      added: newKeywords.length,
      total: list.keywords.length,
      keywords: newKeywords,
    });
  } catch (error: unknown) {
    console.error("Add keywords error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}

/**
 * DELETE /api/v1/keyword-lists/[id]/keywords
 * Remove keywords from a list
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const authResult = await verifyAuth();
    if (!authResult.success || !authResult.user) {
      return authErrorResponse(authResult);
    }

    const { id } = await params;
    const userId = authResult.user.userId;

    if (!Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid list ID", 400);
    }

    const body = await request.json();
    const { keywords, keywordIds } = body;

    if (
      (!keywords || keywords.length === 0) &&
      (!keywordIds || keywordIds.length === 0)
    ) {
      return errorResponse("Keywords or keywordIds array is required", 400);
    }

    await dbConnect();

    const list = await KeywordList.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });

    if (!list) {
      return errorResponse("Keyword list not found", 404);
    }

    const initialCount = list.keywords.length;

    // Remove by keyword text
    if (keywords && keywords.length > 0) {
      const keywordsToRemove = new Set(
        keywords.map((k: string) => k.toLowerCase().trim())
      );
      list.keywords = list.keywords.filter(
        (k) => !keywordsToRemove.has(k.keyword.toLowerCase())
      );
    }

    // Remove by keyword IDs
    if (keywordIds && keywordIds.length > 0) {
      const idsToRemove = new Set(
        keywordIds.map((id: string) => id.toString())
      );
      list.keywords = list.keywords.filter(
        (k) =>
          !idsToRemove.has(
            (k as unknown as { _id: Types.ObjectId })._id.toString()
          )
      );
    }

    await list.save();

    const removedCount = initialCount - list.keywords.length;

    return successResponse({
      removed: removedCount,
      total: list.keywords.length,
    });
  } catch (error: unknown) {
    console.error("Remove keywords error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}

/**
 * PUT /api/v1/keyword-lists/[id]/keywords
 * Update a specific keyword (notes, etc.)
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const authResult = await verifyAuth();
    if (!authResult.success || !authResult.user) {
      return authErrorResponse(authResult);
    }

    const { id } = await params;
    const userId = authResult.user.userId;

    if (!Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid list ID", 400);
    }

    const body = await request.json();
    const { keywordId, keyword, notes } = body;

    if (!keywordId && !keyword) {
      return errorResponse("keywordId or keyword is required", 400);
    }

    await dbConnect();

    const list = await KeywordList.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });

    if (!list) {
      return errorResponse("Keyword list not found", 404);
    }

    // Find the keyword to update
    let keywordEntry;
    if (keywordId) {
      keywordEntry = list.keywords.find(
        (k) =>
          (k as unknown as { _id: Types.ObjectId })._id.toString() === keywordId
      );
    } else if (keyword) {
      keywordEntry = list.keywords.find(
        (k) => k.keyword.toLowerCase() === keyword.toLowerCase()
      );
    }

    if (!keywordEntry) {
      return errorResponse("Keyword not found in list", 404);
    }

    // Update fields
    if (notes !== undefined) {
      keywordEntry.notes = notes;
    }

    await list.save();

    return successResponse(keywordEntry);
  } catch (error: unknown) {
    console.error("Update keyword error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}
