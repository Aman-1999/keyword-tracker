import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export interface AuthUser {
  userId: string;
  email: string;
  role: "user" | "admin";
  name?: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  status?: number;
}

/**
 * Verify authentication from request cookies
 * Returns user data if authenticated, error otherwise
 */
export async function verifyAuth(): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return {
        success: false,
        error: "Authentication required",
        status: 401,
      };
    }

    const payload = await verifyToken(token);

    if (!payload || !payload.userId) {
      return {
        success: false,
        error: "Invalid or expired session",
        status: 401,
      };
    }

    return {
      success: true,
      user: {
        userId: payload.userId as string,
        email: payload.email as string,
        role: payload.role as "user" | "admin",
        name: payload.name as string | undefined,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Authentication failed",
      status: 401,
    };
  }
}

/**
 * Verify admin access
 * Returns user data if admin, error otherwise
 */
export async function verifyAdmin(): Promise<AuthResult> {
  const authResult = await verifyAuth();

  if (!authResult.success) {
    return authResult;
  }

  if (authResult.user?.role !== "admin") {
    return {
      success: false,
      error: "Admin access required",
      status: 403,
    };
  }

  return authResult;
}

/**
 * Get full user from database (with token balance etc)
 */
export async function getAuthenticatedUser() {
  const authResult = await verifyAuth();

  if (!authResult.success || !authResult.user) {
    return {
      success: false,
      error: authResult.error,
      status: authResult.status,
    };
  }

  await dbConnect();
  const user = await User.findById(authResult.user.userId).lean();

  if (!user) {
    return { success: false, error: "User not found", status: 404 };
  }

  // Update last active
  await User.updateOne(
    { _id: authResult.user.userId },
    { $set: { lastActiveAt: new Date() } }
  );

  return {
    success: true,
    user: {
      ...authResult.user,
      requestTokens: user.requestTokens,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
    },
  };
}

/**
 * Create error response for auth failures
 */
export function authErrorResponse(result: AuthResult): NextResponse {
  return NextResponse.json(
    { error: result.error },
    { status: result.status || 401 }
  );
}
