import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Job from '@/models/Job';
import { verifyToken } from '@/lib/jwt';

export async function POST(request: Request) {
    try {
        await dbConnect();

        // Get user from token
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'Authentication required. Please log in to continue.' },
                { status: 401 }
            );
        }

        const payload = await verifyToken(token);
        if (!payload || !payload.userId) {
            return NextResponse.json(
                { error: 'Invalid or expired session. Please log in again.' },
                { status: 401 }
            );
        }

        const userId = payload.userId;

        const {
            domain,
            location,
            location_code,
            location_name,
            keywords,
            filters,
        } = await request.json();

        // Validation
        if (!domain) {
            return NextResponse.json(
                { error: 'Domain is required.' },
                { status: 400 }
            );
        }

        if (!keywords || !Array.isArray(keywords)) {
            return NextResponse.json(
                { error: 'Keywords must be provided as an array.' },
                { status: 400 }
            );
        }

        if (keywords.length === 0) {
            return NextResponse.json(
                { error: 'At least one keyword is required.' },
                { status: 400 }
            );
        }

        // Default filters
        const searchFilters = {
            language: filters?.language || 'en',
            device: filters?.device || 'desktop',
            os: filters?.os || 'windows',
        };

        // Use provided location_code or default to US (2840)
        const finalLocationCode = location_code || (location_name ? null : 2840);

        // Create job
        const job = await Job.create({
            userId,
            domain,
            keywords,
            location: location_name || location || 'Unknown',
            location_code: finalLocationCode || 0,
            filters: searchFilters,
            status: 'pending',
            progress: {
                total: keywords.length,
                completed: 0,
                failed: 0,
            },
        });

        return NextResponse.json({
            success: true,
            jobId: job._id,
            message: `Job created with ${keywords.length} keywords. Use the job ID to poll for status.`,
        });
    } catch (error: any) {
        console.error('Create job error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        await dbConnect();

        // Get user from token
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'Authentication required. Please log in to continue.' },
                { status: 401 }
            );
        }

        const payload = await verifyToken(token);
        if (!payload || !payload.userId) {
            return NextResponse.json(
                { error: 'Invalid or expired session. Please log in again.' },
                { status: 401 }
            );
        }

        const userId = payload.userId;

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = parseInt(searchParams.get('skip') || '0');

        // Build query
        const query: any = { userId };
        if (status) {
            query.status = status;
        }

        // Fetch jobs
        const jobs = await Job.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .select('-results'); // Don't include full results array in list

        const total = await Job.countDocuments(query);

        return NextResponse.json({
            success: true,
            jobs,
            pagination: {
                total,
                limit,
                skip,
                hasMore: skip + jobs.length < total,
            },
        });
    } catch (error: any) {
        console.error('List jobs error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
