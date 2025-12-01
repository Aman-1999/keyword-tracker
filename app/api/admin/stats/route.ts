import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import SearchHistory from '@/models/SearchHistory';
import RankingResult from '@/models/RankingResult';
import { verifyToken } from '@/lib/jwt';

export async function GET(request: Request) {
    try {
        await dbConnect();

        // Verify admin access
        const token = request.headers.get('cookie')?.split('token=')[1]?.split(';')[0];

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyToken(token);

        if (!payload || payload.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        // Get analytics data
        const totalUsers = await User.countDocuments();
        const totalSearches = await SearchHistory.countDocuments();
        const totalRankings = await RankingResult.countDocuments();

        // Recent searches (last 10)
        const recentSearches = await SearchHistory.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select('domain keywords location createdAt');

        // Top searched domains
        const topDomains = await SearchHistory.aggregate([
            { $group: { _id: '$domain', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);

        // Top keywords
        const topKeywords = await SearchHistory.aggregate([
            { $unwind: '$keywords' },
            { $group: { _id: '$keywords', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);

        // User distribution by role
        const usersByRole = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } },
        ]);

        // Recent rankings with comprehensive data
        const recentRankings = await RankingResult.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .select('domain keyword rank url location device createdAt se_results_count etv');

        return NextResponse.json({
            success: true,
            stats: {
                totalUsers,
                totalSearches,
                totalRankings,
                usersByRole,
            },
            recentSearches,
            recentRankings,
            topDomains,
            topKeywords,
        });
    } catch (error: any) {
        console.error('Admin stats error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
