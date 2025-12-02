import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export async function GET(request: Request) {
    try {
        await dbConnect();

        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload || !payload.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin role
        const User = (await import('@/models/User')).default;
        const user = await User.findById(payload.userId);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch credit usage stats
        const CreditUsage = (await import('@/models/CreditUsage')).default;

        // Total credits used
        const totalUsage = await CreditUsage.aggregate([
            {
                $group: {
                    _id: null,
                    totalCredits: { $sum: "$creditsUsed" },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Usage by endpoint
        const usageByEndpoint = await CreditUsage.aggregate([
            {
                $group: {
                    _id: "$apiEndpoint",
                    totalCredits: { $sum: "$creditsUsed" },
                    count: { $sum: 1 },
                    lastUsed: { $max: "$timestamp" }
                }
            },
            { $sort: { totalCredits: -1 } }
        ]);

        // Recent logs
        const recentLogs = await CreditUsage.find()
            .sort({ timestamp: -1 })
            .limit(50)
            .populate('userId', 'name email');

        return NextResponse.json({
            success: true,
            stats: {
                totalCredits: totalUsage[0]?.totalCredits || 0,
                totalRequests: totalUsage[0]?.count || 0,
                usageByEndpoint,
                recentLogs
            }
        });

    } catch (error: any) {
        console.error('Admin API usage error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
