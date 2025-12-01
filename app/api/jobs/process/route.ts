import { NextResponse } from 'next/server';
import { pollAndProcessJobs } from '@/lib/processJobs';

// This endpoint triggers job processing
// Can be called manually or via a cron job
export async function GET(request: Request) {
    try {
        // Trigger job processing (async, don't wait)
        pollAndProcessJobs().catch(error => {
            console.error('Error in pollAndProcessJobs:', error);
        });

        return NextResponse.json({
            success: true,
            message: 'Job processing triggered',
        });
    } catch (error: any) {
        console.error('Process jobs endpoint error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
