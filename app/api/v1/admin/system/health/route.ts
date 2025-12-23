import dbConnect from "@/lib/db";
import mongoose from "mongoose";
import {
  verifyAdmin,
  authErrorResponse,
  successResponse,
  errorResponse,
  getOrSetCache,
  getCacheStats,
  CACHE_TTL,
  CACHE_KEYS,
} from "@/lib/api";

/**
 * GET /api/v1/admin/system/health
 * Get system health status
 */
export async function GET() {
  try {
    const authResult = await verifyAdmin();
    if (!authResult.success) {
      return authErrorResponse(authResult);
    }

    const healthData = await getOrSetCache(
      CACHE_KEYS.systemHealth(),
      CACHE_TTL.SYSTEM_HEALTH,
      async () => {
        await dbConnect();

        // Check MongoDB connection
        const dbState = mongoose.connection.readyState;
        const dbStatusMap: Record<number, string> = {
          0: "disconnected",
          1: "connected",
          2: "connecting",
          3: "disconnecting",
        };
        const dbStatus = dbStatusMap[dbState] || "unknown";

        // Get database stats
        let dbStats = null;
        try {
          if (mongoose.connection.db) {
            const stats = await mongoose.connection.db.stats();
            dbStats = {
              collections: stats.collections,
              objects: stats.objects,
              dataSize: formatBytes(stats.dataSize),
              storageSize: formatBytes(stats.storageSize),
              indexes: stats.indexes,
              indexSize: formatBytes(stats.indexSize),
            };
          }
        } catch (e) {
          console.error("Failed to get db stats:", e);
        }

        // Get collection counts
        const User = (await import("@/models/User")).default;
        const SearchHistory = (await import("@/models/SearchHistory")).default;
        const RankingResult = (await import("@/models/RankingResult")).default;
        const MasterSERP = (await import("@/models/MasterSERP")).default;
        const CreditUsage = (await import("@/models/CreditUsage")).default;

        const [userCount, searchCount, rankingCount, serpCount, creditCount] =
          await Promise.all([
            User.estimatedDocumentCount(),
            SearchHistory.estimatedDocumentCount(),
            RankingResult.estimatedDocumentCount(),
            MasterSERP.estimatedDocumentCount(),
            CreditUsage.estimatedDocumentCount(),
          ]);

        // Memory usage
        const memoryUsage = process.memoryUsage();

        return {
          status: "healthy",
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          database: {
            status: dbStatus,
            stats: dbStats,
          },
          collections: {
            users: userCount,
            searchHistory: searchCount,
            rankingResults: rankingCount,
            masterSerp: serpCount,
            creditUsage: creditCount,
          },
          memory: {
            heapUsed: formatBytes(memoryUsage.heapUsed),
            heapTotal: formatBytes(memoryUsage.heapTotal),
            rss: formatBytes(memoryUsage.rss),
            external: formatBytes(memoryUsage.external),
          },
          cache: getCacheStats(),
          node: {
            version: process.version,
            platform: process.platform,
            arch: process.arch,
          },
        };
      }
    );

    return successResponse(healthData);
  } catch (error: unknown) {
    console.error("System health check error:", error);
    const message =
      error instanceof Error ? error.message : "Health check failed";
    return errorResponse(message, 500);
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
