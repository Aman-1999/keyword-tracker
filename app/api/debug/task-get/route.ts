import { NextResponse } from 'next/server';
import { getDataForSEOClient } from '@/services/dataforseo/base';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
        return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    try {
        const client = getDataForSEOClient();
        // Call the raw API directly to see exactly what it returns
        const response = await client.makeRequest(
            `/serp/google/organic/task_get/regular/${taskId}`,
            'GET'
        );

        return NextResponse.json({
            success: true,
            taskId,
            rawResponse: response
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
