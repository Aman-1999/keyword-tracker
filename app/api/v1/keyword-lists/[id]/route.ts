import dbConnect from "@/lib/db";
import KeywordList from "@/models/KeywordList";
import { Types } from "mongoose";
import {
  verifyAuth,
  authErrorResponse,
  successResponse,
  errorResponse,
  noContentResponse,
} from "@/lib/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/keyword-lists/[id]
 * Get a specific keyword list
 */
export async function GET(request: Request, { params }: RouteParams) {
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

    await dbConnect();

    const list = await KeywordList.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    }).lean();

    if (!list) {
      return errorResponse("Keyword list not found", 404);
    }

    return successResponse({
      ...list,
      keywordCount: list.keywords?.length || 0,
    });
  } catch (error: unknown) {
    console.error("Get keyword list error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}

/**
 * PUT /api/v1/keyword-lists/[id]
 * Update a keyword list (name, location, language, settings)
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

    await dbConnect();

    const list = await KeywordList.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });

    if (!list) {
      return errorResponse("Keyword list not found", 404);
    }

    // Update allowed fields
    if (body.name !== undefined) list.name = body.name.trim();
    if (body.location !== undefined) list.location = body.location;
    if (body.locationCode !== undefined) list.locationCode = body.locationCode;
    if (body.language !== undefined) list.language = body.language;
    if (body.languageName !== undefined) list.languageName = body.languageName;
    if (body.isActive !== undefined) list.isActive = body.isActive;
    if (body.autoTrack !== undefined) list.autoTrack = body.autoTrack;
    if (body.trackingFrequency !== undefined)
      list.trackingFrequency = body.trackingFrequency;

    await list.save();

    return successResponse(list);
  } catch (error: unknown) {
    console.error("Update keyword list error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}

/**
 * DELETE /api/v1/keyword-lists/[id]
 * Delete a keyword list
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

    await dbConnect();

    const result = await KeywordList.deleteOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      return errorResponse("Keyword list not found", 404);
    }

    return noContentResponse();
  } catch (error: unknown) {
    console.error("Delete keyword list error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}
