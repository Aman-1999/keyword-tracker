import dbConnect from "@/lib/db";
import Plan, { DEFAULT_PLANS } from "@/models/Plan";
import {
  verifyAdmin,
  authErrorResponse,
  successResponse,
  errorResponse,
  createdResponse,
} from "@/lib/api";

/**
 * GET /api/v1/admin/plans
 * Get all plans (admin only)
 */
export async function GET() {
  try {
    const authResult = await verifyAdmin();
    if (!authResult.success || !authResult.user) {
      return authErrorResponse(authResult);
    }

    await dbConnect();

    const plans = await Plan.find({}).sort({ sortOrder: 1 }).lean();

    return successResponse(plans);
  } catch (error: unknown) {
    console.error("Get plans error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}

/**
 * POST /api/v1/admin/plans
 * Create a new plan (admin only)
 */
export async function POST(request: Request) {
  try {
    const authResult = await verifyAdmin();
    if (!authResult.success || !authResult.user) {
      return authErrorResponse(authResult);
    }

    const body = await request.json();
    const {
      name,
      slug,
      description,
      price,
      limits,
      color,
      badge,
      isActive,
      isDefault,
      sortOrder,
    } = body;

    if (!name || !slug || !description) {
      return errorResponse("Name, slug, and description are required", 400);
    }

    await dbConnect();

    // Check if slug already exists
    const existingPlan = await Plan.findOne({ slug });
    if (existingPlan) {
      return errorResponse("A plan with this slug already exists", 400);
    }

    const plan = await Plan.create({
      name,
      slug,
      description,
      price: price || { monthly: 0, yearly: 0, currency: "USD" },
      limits: limits || {},
      color: color || "#6366f1",
      badge,
      isActive: isActive ?? true,
      isDefault: isDefault ?? false,
      sortOrder: sortOrder ?? 0,
    });

    return createdResponse(plan);
  } catch (error: unknown) {
    console.error("Create plan error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}

/**
 * PUT /api/v1/admin/plans/seed
 * Seed default plans (admin only)
 */
export async function PUT() {
  try {
    const authResult = await verifyAdmin();
    if (!authResult.success || !authResult.user) {
      return authErrorResponse(authResult);
    }

    await dbConnect();

    // Check if plans already exist
    const existingCount = await Plan.countDocuments();
    if (existingCount > 0) {
      return errorResponse(
        "Plans already exist. Delete existing plans first to re-seed.",
        400
      );
    }

    // Seed default plans
    const plans = await Plan.insertMany(DEFAULT_PLANS);

    return successResponse(plans, {
      message: `${plans.length} default plans created`,
    });
  } catch (error: unknown) {
    console.error("Seed plans error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}
