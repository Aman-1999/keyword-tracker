import { NextResponse } from "next/server";
import { PaginationResult, CursorPaginationResult } from "./pagination";

/**
 * Standard API response types
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationResult | CursorPaginationResult;
  meta?: Record<string, unknown>;
}

/**
 * Create success response
 */
export function successResponse<T>(
  data: T,
  options: {
    message?: string;
    pagination?: PaginationResult | CursorPaginationResult;
    meta?: Record<string, unknown>;
    status?: number;
    headers?: Record<string, string>;
  } = {}
): NextResponse {
  const { message, pagination, meta, status = 200, headers = {} } = options;

  const body: ApiResponse<T> = {
    success: true,
    data,
  };

  if (message) body.message = message;
  if (pagination) body.pagination = pagination;
  if (meta) body.meta = meta;

  return NextResponse.json(body, {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

/**
 * Create error response
 */
export function errorResponse(
  error: string,
  status: number = 400,
  meta?: Record<string, unknown>
): NextResponse {
  const body: ApiResponse = {
    success: false,
    error,
  };

  if (meta) body.meta = meta;

  return NextResponse.json(body, { status });
}

/**
 * Create validation error response
 */
export function validationError(errors: Record<string, string>): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: "Validation failed",
      meta: { errors },
    },
    { status: 400 }
  );
}

/**
 * Create not found response
 */
export function notFoundResponse(resource: string = "Resource"): NextResponse {
  return errorResponse(`${resource} not found`, 404);
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse(
  message: string = "Authentication required"
): NextResponse {
  return errorResponse(message, 401);
}

/**
 * Create forbidden response
 */
export function forbiddenResponse(
  message: string = "Access denied"
): NextResponse {
  return errorResponse(message, 403);
}

/**
 * Create internal server error response
 */
export function serverErrorResponse(error?: Error | string): NextResponse {
  const message =
    typeof error === "string"
      ? error
      : error?.message || "Internal server error";

  // Log the error for debugging (in production, use proper logging)
  if (error instanceof Error) {
    console.error("Server Error:", error);
  }

  return errorResponse(message, 500);
}

/**
 * Create rate limit response
 */
export function rateLimitResponse(retryAfter?: number): NextResponse {
  const headers: Record<string, string> = {};
  if (retryAfter) {
    headers["Retry-After"] = String(retryAfter);
  }

  return NextResponse.json(
    {
      success: false,
      error: "Too many requests. Please try again later.",
    },
    {
      status: 429,
      headers,
    }
  );
}

/**
 * Add cache headers to response
 */
export function withCacheHeaders(
  response: NextResponse,
  options: {
    public?: boolean;
    maxAge?: number;
    staleWhileRevalidate?: number;
  }
): NextResponse {
  const {
    public: isPublic = false,
    maxAge = 60,
    staleWhileRevalidate = 30,
  } = options;

  const directive = isPublic ? "public" : "private";
  const cacheControl = `${directive}, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`;

  response.headers.set("Cache-Control", cacheControl);
  return response;
}

/**
 * Create paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: PaginationResult | CursorPaginationResult,
  meta?: Record<string, unknown>
): NextResponse {
  return successResponse(data, { pagination, meta });
}

/**
 * Create created response (201)
 */
export function createdResponse<T>(data: T, message?: string): NextResponse {
  return successResponse(data, { message, status: 201 });
}

/**
 * Create no content response (204)
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Handle async route with error catching
 */
export async function handleRoute(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    return serverErrorResponse(error instanceof Error ? error : String(error));
  }
}
