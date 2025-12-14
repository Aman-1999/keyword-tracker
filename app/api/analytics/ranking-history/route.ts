import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import MasterSERP from '@/models/MasterSERP';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const domain = searchParams.get('domain');
        const keyword = searchParams.get('keyword');

        if (!domain || !keyword) {
            return NextResponse.json({ error: 'Domain and keyword are required' }, { status: 400 });
        }

        await dbConnect();

        // Fetch all MasterSERP entries for this domain+keyword combination
        // Sort by date ascending to build a history line
        const history = await MasterSERP.find({
            domain: domain,
            keyword: keyword,
            // Ensure we only get entries that actually have rank data
            ranks: { $exists: true, $ne: null }
        })
            .select('createdAt ranks')
            .sort({ createdAt: 1 })
            .lean();

        // Format for the chart
        const chartData = history.map(item => {
            // ranks is Mixed, assume it follows the structure saved in update-rankings or check-rank
            // typically: { rank_group, rank_absolute, position, etc. }
            // We'll prioritize rank_absolute, then rank_group
            const r = item.ranks as any;
            const rank = r?.rank_absolute || r?.rank_group || r?.position || null;

            return {
                date: item.createdAt,
                rank: rank,
                // fullRanks: r // Optional: return all details if needed
            };
        }).filter(item => item.rank !== null); // Filter out any malformed entries

        return NextResponse.json({ history: chartData });

    } catch (error) {
        console.error('Failed to fetch ranking history:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
