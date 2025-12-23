import { Types } from "mongoose";

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: string;
}

export interface CursorPaginationResult {
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
  prevCursor?: string;
}

/**
 * Parse pagination params from URL search params
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaults: { limit?: number; sortBy?: string; sortOrder?: "asc" | "desc" } = {}
): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(
    100,
    Math.max(
      1,
      parseInt(searchParams.get("limit") || String(defaults.limit || 20))
    )
  );
  const cursor = searchParams.get("cursor") || undefined;
  const sortBy = searchParams.get("sortBy") || defaults.sortBy || "createdAt";
  const sortOrder = (searchParams.get("sortOrder") ||
    defaults.sortOrder ||
    "desc") as "asc" | "desc";

  return { page, limit, cursor, sortBy, sortOrder };
}

/**
 * Build skip-based pagination metadata
 */
export function buildPagination(
  page: number,
  limit: number,
  total: number
): PaginationResult {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Build cursor-based pagination for large datasets
 * More efficient than skip-based for large offsets
 */
export function buildCursorPagination<T extends Record<string, unknown>>(
  items: T[],
  limit: number,
  cursorField: string = "_id"
): CursorPaginationResult {
  const hasMore = items.length > limit;
  const displayItems = hasMore ? items.slice(0, limit) : items;
  const nextCursor =
    hasMore && displayItems.length > 0
      ? encodeCursor(displayItems[displayItems.length - 1][cursorField])
      : undefined;

  return {
    limit,
    hasMore,
    nextCursor,
  };
}

/**
 * Parse cursor for cursor-based pagination
 */
export function parseCursor(
  cursor: string | undefined
): { _id?: Types.ObjectId; date?: Date } | null {
  if (!cursor) return null;

  try {
    const decoded = decodeCursor(cursor);

    // Try to parse as ObjectId
    if (Types.ObjectId.isValid(decoded)) {
      return { _id: new Types.ObjectId(decoded) };
    }

    // Try to parse as date
    const date = new Date(decoded);
    if (!isNaN(date.getTime())) {
      return { date };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Encode cursor value
 */
export function encodeCursor(value: unknown): string {
  const str = value instanceof Date ? value.toISOString() : String(value);
  return Buffer.from(str).toString("base64");
}

/**
 * Decode cursor value
 */
export function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, "base64").toString("utf8");
}

/**
 * Build MongoDB sort object
 */
export function buildSortObject(
  sortBy: string,
  sortOrder: "asc" | "desc"
): Record<string, 1 | -1> {
  return { [sortBy]: sortOrder === "asc" ? 1 : -1 };
}

/**
 * Build cursor-based query filter
 */
export function buildCursorFilter(
  cursor: string | undefined,
  sortBy: string,
  sortOrder: "asc" | "desc"
): Record<string, unknown> {
  const parsed = parseCursor(cursor);
  if (!parsed) return {};

  const operator = sortOrder === "desc" ? "$lt" : "$gt";

  if (parsed._id && sortBy === "_id") {
    return { _id: { [operator]: parsed._id } };
  }

  if (parsed.date) {
    return { [sortBy]: { [operator]: parsed.date } };
  }

  if (parsed._id) {
    return { _id: { [operator]: parsed._id } };
  }

  return {};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MongooseQuery = any;

/**
 * Apply pagination to a Mongoose query
 */
export function applyPagination(
  query: MongooseQuery,
  params: PaginationParams
): MongooseQuery {
  const {
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  return query
    .sort(buildSortObject(sortBy, sortOrder))
    .skip((page - 1) * limit)
    .limit(limit);
}

/**
 * Apply cursor-based pagination to a Mongoose query
 */
export function applyCursorPagination(
  query: MongooseQuery,
  params: PaginationParams
): MongooseQuery {
  const {
    limit = 20,
    cursor,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  const cursorFilter = buildCursorFilter(cursor, sortBy, sortOrder);

  return query
    .find(cursorFilter)
    .sort(buildSortObject(sortBy, sortOrder))
    .limit(limit + 1); // Fetch one extra to check if there's more
}
