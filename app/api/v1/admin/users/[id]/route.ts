import dbConnect from "@/lib/db";
import User from "@/models/User";
import {
  verifyAdmin,
  authErrorResponse,
  successResponse,
  errorResponse,
  notFoundResponse,
  noContentResponse,
  invalidateUserCache,
} from "@/lib/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/admin/users/[id]
 * Get single user details
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const authResult = await verifyAdmin();
    if (!authResult.success) {
      return authErrorResponse(authResult);
    }

    const { id } = await params;
    await dbConnect();

    const user = await User.findById(id).select("-password").lean();

    if (!user) {
      return notFoundResponse("User");
    }

    // Get additional stats
    const SearchHistory = (await import("@/models/SearchHistory")).default;
    const RankingResult = (await import("@/models/RankingResult")).default;
    const CreditUsage = (await import("@/models/CreditUsage")).default;

    const [searchCount, rankingCount, creditUsage] = await Promise.all([
      SearchHistory.countDocuments({ userId: id }),
      RankingResult.countDocuments({ userId: id }),
      CreditUsage.aggregate([
        { $match: { userId: user._id } },
        { $group: { _id: null, total: { $sum: "$creditsUsed" } } },
      ]),
    ]);

    return successResponse({
      ...user,
      stats: {
        totalSearches: searchCount,
        totalRankings: rankingCount,
        totalCreditsUsed: creditUsage[0]?.total || 0,
      },
    });
  } catch (error: unknown) {
    console.error("Admin get user error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}

/**
 * PATCH /api/v1/admin/users/[id]
 * Update user details
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const authResult = await verifyAdmin();
    if (!authResult.success) {
      return authErrorResponse(authResult);
    }

    const { id } = await params;
    await dbConnect();

    const body = await request.json();
    const { name, email, role, requestTokens, password } = body;

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (requestTokens !== undefined) updateData.requestTokens = requestTokens;

    // Handle password update separately
    if (password) {
      const bcrypt = await import("bcryptjs");
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse("No fields to update", 400);
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .select("-password")
      .lean();

    if (!user) {
      return notFoundResponse("User");
    }

    // Invalidate user cache
    invalidateUserCache(id);

    return successResponse(user, { message: "User updated successfully" });
  } catch (error: unknown) {
    console.error("Admin update user error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}

/**
 * DELETE /api/v1/admin/users/[id]
 * Delete a user
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const authResult = await verifyAdmin();
    if (!authResult.success) {
      return authErrorResponse(authResult);
    }

    const { id } = await params;

    // Prevent self-deletion
    if (authResult.user?.userId === id) {
      return errorResponse("Cannot delete your own account", 400);
    }

    await dbConnect();

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return notFoundResponse("User");
    }

    // Invalidate user cache
    invalidateUserCache(id);

    return noContentResponse();
  } catch (error: unknown) {
    console.error("Admin delete user error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}
