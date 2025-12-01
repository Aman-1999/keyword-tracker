import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Job from '@/models/Job';
import RankingResult from '@/models/RankingResult';
import { verifyToken } from '@/lib/jwt';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();

        // Await params in Next.js 15
        const { id: jobId } = await params;

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

        // Fetch job
        const job = await Job.findOne({
            _id: jobId,
            userId,
        }).populate('results');

        if (!job) {
            return NextResponse.json(
                { error: 'Job not found.' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            job,
        });
    } catch (error: any) {
        console.error('Get job error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();

        // Await params in Next.js 15
        const { id: jobId } = await params;

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

        // Find and update job
        const job = await Job.findOneAndUpdate(
            {
                _id: jobId,
                userId,
                status: { $in: ['pending', 'processing'] }, // Only cancel if not already done
            },
            {
                status: 'cancelled',
                updatedAt: new Date(),
            },
            { new: true }
        );

        if (!job) {
            return NextResponse.json(
                { error: 'Job not found or already completed.' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Job cancelled successfully.',
            job,
        });
    } catch (error: any) {
        console.error('Cancel job error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
