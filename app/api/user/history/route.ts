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

        // Aggregate history by domain
        const history = await SearchHistory.aggregate([
            { $match: { userId: new Object(userId) } }, // Match user
            { $sort: { createdAt: -1 } }, // Sort by newest first
            {
                $group: {
                    _id: "$domain",
                    domain: { $first: "$domain" },
                    lastLocation: { $first: "$location" },
                    lastLocationCode: { $first: "$location_code" },
                    keywords: { $addToSet: "$keywords" }, // Collect all unique keyword arrays
                    lastSearched: { $first: "$createdAt" }
                }
            },
            { $sort: { lastSearched: -1 } },
            { $limit: 20 } // Limit to last 20 unique domains
        ]);

        // Flatten keywords arrays and remove duplicates
        const formattedHistory = history.map(item => {
            const allKeywords = item.keywords.flat();
            const uniqueKeywords = Array.from(new Set(allKeywords)).slice(0, 10); // Top 10 unique keywords

            return {
                domain: item.domain,
                lastLocation: item.lastLocation,
                lastLocationCode: item.lastLocationCode,
                keywords: uniqueKeywords,
                lastSearched: item.lastSearched
            };
        });

        return NextResponse.json({ history: formattedHistory });

    } catch (error) {
        console.error('Fetch history error:', error);
        return NextResponse.json({ history: [] }, { status: 500 });
    }
}
