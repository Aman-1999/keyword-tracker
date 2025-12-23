import dbConnect from "@/lib/db";
import User from "@/models/User";
import {
  verifyAdmin,
  authErrorResponse,
  successResponse,
  errorResponse,
  notFoundResponse,
  invalidateUserCache,
} from "@/lib/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/v1/admin/users/[id]/tokens
 * Adjust user tokens (add or set)
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
    const { amount, operation = "add", reason } = body;

    if (amount === undefined || typeof amount !== "number") {
      return errorResponse("Amount is required and must be a number", 400);
    }

    if (!["add", "subtract", "set"].includes(operation)) {
      return errorResponse("Operation must be one of: add, subtract, set", 400);
    }

    // Get current user
    const user = await User.findById(id);
    if (!user) {
      return notFoundResponse("User");
    }

    let newTokens: number;
    const previousTokens = user.requestTokens;

    switch (operation) {
      case "add":
        newTokens = previousTokens + amount;
        break;
      case "subtract":
        newTokens = Math.max(0, previousTokens - amount);
        break;
      case "set":
        newTokens = Math.max(0, amount);
        break;
      default:
        newTokens = previousTokens;
    }

    // Update user tokens
    user.requestTokens = newTokens;
    await user.save();

    // Log the adjustment
    const CreditUsage = (await import("@/models/CreditUsage")).default;
    await CreditUsage.create({
      userId: id,
      apiEndpoint: "admin/tokens/adjust",
      creditsUsed:
        operation === "subtract"
          ? -amount
          : operation === "add"
          ? amount
          : newTokens - previousTokens,
      requestParams: {
        operation,
        amount,
        reason,
        previousTokens,
        newTokens,
        adjustedBy: authResult.user?.userId,
      },
      responseStatus: 200,
    });

    // Invalidate cache
    invalidateUserCache(id);

    return successResponse(
      {
        userId: id,
        previousTokens,
        newTokens,
        operation,
        amount,
      },
      {
        message: `Tokens ${
          operation === "set"
            ? "set to"
            : operation === "add"
            ? "added"
            : "subtracted"
        } successfully`,
      }
    );
  } catch (error: unknown) {
    console.error("Admin adjust tokens error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}
