// Auth utilities
export {
  verifyAuth,
  verifyAdmin,
  getAuthenticatedUser,
  authErrorResponse,
  type AuthUser,
  type AuthResult,
} from "./auth";

// Cache utilities
export {
  getCached,
  setCache,
  deleteCache,
  deleteCacheByPrefix,
  invalidateUserCache,
  getOrSetCache,
  getCacheStats,
  CACHE_TTL,
  CACHE_KEYS,
} from "./cache";

// Pagination utilities
export {
  parsePaginationParams,
  buildPagination,
  buildCursorPagination,
  parseCursor,
  encodeCursor,
  decodeCursor,
  buildSortObject,
  buildCursorFilter,
  applyPagination,
  applyCursorPagination,
  type PaginationParams,
  type PaginationResult,
  type CursorPaginationResult,
} from "./pagination";

// Response utilities
export {
  successResponse,
  errorResponse,
  validationError,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
  rateLimitResponse,
  withCacheHeaders,
  paginatedResponse,
  createdResponse,
  noContentResponse,
  handleRoute,
  type ApiResponse,
} from "./response";
