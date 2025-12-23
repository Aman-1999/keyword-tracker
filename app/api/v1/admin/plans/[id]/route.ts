import dbConnect from "@/lib/db";
import Plan from "@/models/Plan";
import { Types } from "mongoose";
import {
  verifyAdmin,
  authErrorResponse,
  successResponse,
  errorResponse,
  noContentResponse,
} from "@/lib/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/admin/plans/[id]
 * Get a single plan by ID (admin only)
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const authResult = await verifyAdmin();
    if (!authResult.success || !authResult.user) {
      return authErrorResponse(authResult);
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid plan ID", 400);
    }

    await dbConnect();

    const plan = await Plan.findById(id).lean();
    if (!plan) {
      return errorResponse("Plan not found", 404);
    }

    return successResponse(plan);
  } catch (error: unknown) {
    console.error("Get plan error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}

/**
 * PUT /api/v1/admin/plans/[id]
 * Update a plan (admin only)
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const authResult = await verifyAdmin();
    if (!authResult.success || !authResult.user) {
      return authErrorResponse(authResult);
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid plan ID", 400);
    }

    const body = await request.json();

    await dbConnect();

    const plan = await Plan.findById(id);
    if (!plan) {
      return errorResponse("Plan not found", 404);
    }

    // If changing slug, check it doesn't already exist
    if (body.slug && body.slug !== plan.slug) {
      const existingPlan = await Plan.findOne({
        slug: body.slug,
        _id: { $ne: id },
      });
      if (existingPlan) {
        return errorResponse("A plan with this slug already exists", 400);
      }
    }

    // Update fields
    if (body.name !== undefined) plan.name = body.name;
    if (body.slug !== undefined) plan.slug = body.slug;
    if (body.description !== undefined) plan.description = body.description;
    if (body.isActive !== undefined) plan.isActive = body.isActive;
    if (body.isDefault !== undefined) plan.isDefault = body.isDefault;
    if (body.sortOrder !== undefined) plan.sortOrder = body.sortOrder;
    if (body.color !== undefined) plan.color = body.color;
    if (body.badge !== undefined) plan.badge = body.badge;

    // Merge price
    if (body.price && typeof body.price === "object") {
      if (body.price.monthly !== undefined)
        plan.price.monthly = body.price.monthly;
      if (body.price.yearly !== undefined)
        plan.price.yearly = body.price.yearly;
      if (body.price.currency !== undefined)
        plan.price.currency = body.price.currency;
    }

    // Merge limits
    if (body.limits && typeof body.limits === "object") {
      const limitsUpdate = body.limits;
      if (limitsUpdate.keywordSearches !== undefined)
        plan.limits.keywordSearches = limitsUpdate.keywordSearches;
      if (limitsUpdate.keywordsPerSearch !== undefined)
        plan.limits.keywordsPerSearch = limitsUpdate.keywordsPerSearch;
      if (limitsUpdate.searchHistoryDays !== undefined)
        plan.limits.searchHistoryDays = limitsUpdate.searchHistoryDays;
      if (limitsUpdate.backlinksChecks !== undefined)
        plan.limits.backlinksChecks = limitsUpdate.backlinksChecks;
      if (limitsUpdate.siteAudits !== undefined)
        plan.limits.siteAudits = limitsUpdate.siteAudits;
      if (limitsUpdate.competitorAnalysis !== undefined)
        plan.limits.competitorAnalysis = limitsUpdate.competitorAnalysis;
      if (limitsUpdate.contentOptimization !== undefined)
        plan.limits.contentOptimization = limitsUpdate.contentOptimization;
      if (limitsUpdate.apiRequestsPerDay !== undefined)
        plan.limits.apiRequestsPerDay = limitsUpdate.apiRequestsPerDay;
      if (limitsUpdate.apiRequestsPerMonth !== undefined)
        plan.limits.apiRequestsPerMonth = limitsUpdate.apiRequestsPerMonth;

      // Merge features
      if (limitsUpdate.features && typeof limitsUpdate.features === "object") {
        const featuresUpdate = limitsUpdate.features;
        if (featuresUpdate.aiOverviewTracking !== undefined)
          plan.limits.features.aiOverviewTracking =
            featuresUpdate.aiOverviewTracking;
        if (featuresUpdate.serpFeatureAnalysis !== undefined)
          plan.limits.features.serpFeatureAnalysis =
            featuresUpdate.serpFeatureAnalysis;
        if (featuresUpdate.exportData !== undefined)
          plan.limits.features.exportData = featuresUpdate.exportData;
        if (featuresUpdate.apiAccess !== undefined)
          plan.limits.features.apiAccess = featuresUpdate.apiAccess;
        if (featuresUpdate.prioritySupport !== undefined)
          plan.limits.features.prioritySupport = featuresUpdate.prioritySupport;
        if (featuresUpdate.whiteLabel !== undefined)
          plan.limits.features.whiteLabel = featuresUpdate.whiteLabel;
        if (featuresUpdate.customReports !== undefined)
          plan.limits.features.customReports = featuresUpdate.customReports;
        if (featuresUpdate.teamMembers !== undefined)
          plan.limits.features.teamMembers = featuresUpdate.teamMembers;
      }
    }

    await plan.save();

    return successResponse(plan);
  } catch (error: unknown) {
    console.error("Update plan error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}

/**
 * DELETE /api/v1/admin/plans/[id]
 * Delete a plan (admin only)
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const authResult = await verifyAdmin();
    if (!authResult.success || !authResult.user) {
      return authErrorResponse(authResult);
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid plan ID", 400);
    }

    await dbConnect();

    const plan = await Plan.findById(id);
    if (!plan) {
      return errorResponse("Plan not found", 404);
    }

    // Don't allow deleting the default plan
    if (plan.isDefault) {
      return errorResponse(
        "Cannot delete the default plan. Set another plan as default first.",
        400
      );
    }

    await plan.deleteOne();

    return noContentResponse();
  } catch (error: unknown) {
    console.error("Delete plan error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}
