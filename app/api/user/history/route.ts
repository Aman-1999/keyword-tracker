import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import SearchHistory from '@/models/SearchHistory';
import { verifyToken } from '@/lib/jwt';

export async function GET(request: Request) {
    try {
        await dbConnect();

        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ history: [] });
        }

        const payload = await verifyToken(token);
        if (!payload || !payload.userId) {
            return NextResponse.json({ history: [] });
        }

        const userId = payload.userId;

        // Fetch history directly
        const history = await SearchHistory.find({ userId })
            .sort({ createdAt: -1 })
            .limit(50);

        return NextResponse.json({ history });

    } catch (error) {
        console.error('Fetch history error:', error);
        return NextResponse.json({ history: [] }, { status: 500 });
    }
}
