import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SearchHistory from '@/models/SearchHistory';

export async function GET() {
    try {
        await dbConnect();

        // Fetch last 50 searches, sorted by newest first
        const history = await SearchHistory.find({})
            .sort({ createdAt: -1 })
            .limit(50);

        return NextResponse.json({ history });
    } catch (error: unknown) {
        console.error('History API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
