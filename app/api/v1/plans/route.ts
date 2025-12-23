import dbConnect from "@/lib/db";
import Plan from "@/models/Plan";
import { successResponse, errorResponse } from "@/lib/api";

/**
 * GET /api/v1/plans
 * Get all active plans (public)
 */
export async function GET() {
  try {
    await dbConnect();

    const plans = await Plan.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .select("-__v")
      .lean();

    return successResponse(plans);
  } catch (error: unknown) {
    console.error("Get plans error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}
