import { NextResponse } from 'next/server';
import { pollDataForSeoTasks } from '@/lib/pollDataForSeoTasks';

// This endpoint triggers DataForSEO task polling
// Can be called manually or via a cron job
export async function GET(request: Request) {
    try {
        // Trigger polling (async, don't wait)
        pollDataForSeoTasks().catch(error => {
            console.error('Error in pollDataForSeoTasks:', error);
        });

        return NextResponse.json({
            success: true,
            message: 'DataForSEO task polling triggered',
        });
    } catch (error: any) {
        console.error('Poll DataForSEO tasks endpoint error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
