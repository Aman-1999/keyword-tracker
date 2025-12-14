import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import SearchHistory from '@/models/SearchHistory';

import { verifyToken } from '@/lib/jwt';
import { submitDomainRankingTasks } from '@/services/dataforseo';

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

        const userId = payload.userId as string;

        // Check user's available tokens
        const User = (await import('@/models/User')).default;
        const user = await User.findById(userId);

        if (!user) {
            return NextResponse.json(
                { error: 'User not found.' },
                { status: 404 }
            );
        }

        if (user.requestTokens <= 0) {
            return NextResponse.json(
                {
                    error: 'Insufficient request tokens. Please contact support to purchase more tokens.',
                    tokensRemaining: 0
                },
                { status: 403 }
            );
        }

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

        const finalLocationCode = location_code || (location_name ? null : 2840);

        console.log('📍 Location Debug:', {
            location,
            location_name,
            location_code,
            finalLocationCode
        });

        // Submit tasks using task_post API
        const taskResult = await submitDomainRankingTasks(
            domain,
            keywords,
            {
                location_code: finalLocationCode,
                location_name,
                language_code: searchFilters.language,
                device: searchFilters.device as 'desktop' | 'mobile' | 'tablet',
                os: searchFilters.os,
                priority: 1, // Standard priority
                userId,
                depth: 100,
            }
        );

        if (!taskResult.success) {
            return NextResponse.json(
                { error: taskResult.error || 'Failed to submit tasks' },
                { status: 500 }
            );
        }

        // Extract task IDs
        const taskIds = taskResult.data.map(t => t.taskId);
        console.log(taskResult);

        // Fetch location name from database if not provided
        let finalLocationName = location_name || location;
        if (!finalLocationName && finalLocationCode) {
            try {
                const Location = (await import('@/models/Location')).default;
                const locationDoc = await Location.findOne({ location_code: finalLocationCode });
                if (locationDoc) {
                    finalLocationName = locationDoc.location_name;
                }
            } catch (err) {
                console.error('Failed to fetch location name:', err);
            }
        }

        // Save search history with task IDs
        const history = await SearchHistory.create({
            userId: user._id,
            domain,
            location: finalLocationName || 'Unknown',
            location_code: finalLocationCode || 0,
            keywords,
            filters: searchFilters,
            taskIds,
        });

        // Deduct one token from user's account
        user.requestTokens -= 1;
        await user.save();

        console.log(`User ${userId} submitted ${keywords.length} tasks. History ID: ${history._id}`);

        return NextResponse.json({
            success: true,
            historyId: history._id,
            taskIds,
            tasksSubmitted: taskResult.data.length,
            tokensRemaining: user.requestTokens,
            creditsUsed: taskResult.cost,
            message: `Tasks submitted successfully.`,
        });
    } catch (error: any) {
        console.error('Check rank (regular) error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
