import dbConnect from "@/lib/db";
import User from "@/models/User";
import {
  verifyAdmin,
  authErrorResponse,
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePaginationParams,
  buildPagination,
  buildSortObject,
  getOrSetCache,
  CACHE_TTL,
  CACHE_KEYS,
} from "@/lib/api";

/**
 * GET /api/v1/admin/users
 * List all users with filtering and pagination
 */
export async function GET(request: Request) {
  try {
    // Verify admin access
    const authResult = await verifyAdmin();
    if (!authResult.success) {
      return authErrorResponse(authResult);
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const params = parsePaginationParams(searchParams, {
      limit: 20,
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    // Parse filters
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") as "user" | "admin" | null;
    const tokensBelow = searchParams.get("tokensBelow")
      ? parseInt(searchParams.get("tokensBelow")!)
      : null;
    const createdAfter = searchParams.get("createdAfter");
    const createdBefore = searchParams.get("createdBefore");
    const isActive = searchParams.get("isActive"); // Active in last 7 days

    // Build query
    interface MongoQuery {
      $or?: Array<{
        name?: { $regex: string; $options: string };
        email?: { $regex: string; $options: string };
      }>;
      role?: string;
      requestTokens?: { $lte: number };
      createdAt?: { $gte?: Date; $lte?: Date };
      lastActiveAt?: { $gte?: Date; $lt?: Date };
    }
    const query: MongoQuery = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (tokensBelow !== null) {
      query.requestTokens = { $lte: tokensBelow };
    }

    if (createdAfter || createdBefore) {
      query.createdAt = {};
      if (createdAfter) query.createdAt.$gte = new Date(createdAfter);
      if (createdBefore) query.createdAt.$lte = new Date(createdBefore);
    }

    if (isActive === "true") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query.lastActiveAt = { $gte: sevenDaysAgo };
    } else if (isActive === "false") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query.lastActiveAt = { $lt: sevenDaysAgo };
    }

    // Execute queries in parallel
    const [users, total, stats] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort(buildSortObject(params.sortBy!, params.sortOrder!))
        .skip((params.page! - 1) * params.limit!)
        .limit(params.limit!)
        .lean(),
      User.countDocuments(query),
      getOrSetCache(
        CACHE_KEYS.adminStats(),
        CACHE_TTL.ADMIN_STATS,
        async () => {
          const [totalUsers, activeToday, lowTokenUsers, usersByRole] =
            await Promise.all([
              User.countDocuments(),
              User.countDocuments({
                lastActiveAt: {
                  $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                },
              }),
              User.countDocuments({ requestTokens: { $lte: 10 } }),
              User.aggregate([
                { $group: { _id: "$role", count: { $sum: 1 } } },
              ]),
            ]);
          return { totalUsers, activeToday, lowTokenUsers, usersByRole };
        }
      ),
    ]);

    const pagination = buildPagination(params.page!, params.limit!, total);

    return paginatedResponse(users, pagination, { stats });
  } catch (error: unknown) {
    console.error("Admin users list error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}

/**
 * POST /api/v1/admin/users
 * Create a new user (admin only)
 */
export async function POST(request: Request) {
  try {
    const authResult = await verifyAdmin();
    if (!authResult.success) {
      return authErrorResponse(authResult);
    }

    await dbConnect();

    const body = await request.json();
    const { name, email, password, role = "user", requestTokens = 100 } = body;

    // Validation
    if (!name || !email || !password) {
      return errorResponse("Name, email, and password are required", 400);
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse("User with this email already exists", 400);
    }

    // Hash password
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      requestTokens,
    });

    // Return without password
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      requestTokens: user.requestTokens,
      createdAt: user.createdAt,
    };

    return successResponse(userResponse, {
      status: 201,
      message: "User created successfully",
    });
  } catch (error: unknown) {
    console.error("Admin create user error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, 500);
  }
}
