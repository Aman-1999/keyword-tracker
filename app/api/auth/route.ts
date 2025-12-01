import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { signToken } from '@/lib/jwt';
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
});

export async function POST(request: Request) {
    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const rateLimitResult = limiter.check(request as any, 10, ip);

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429 }
            );
        }

        await dbConnect();
        const { action, email, password, name } = await request.json();

        if (action === 'signup') {
            // Validate input
            if (!name || !email || !password) {
                return NextResponse.json(
                    { error: 'Please provide name, email, and password' },
                    { status: 400 }
                );
            }

            if (password.length < 6) {
                return NextResponse.json(
                    { error: 'Password must be at least 6 characters' },
                    { status: 400 }
                );
            }

            // Check if user exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return NextResponse.json(
                    { error: 'User already exists with this email' },
                    { status: 400 }
                );
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            const user = await User.create({
                name,
                email,
                password: hashedPassword,
                role: 'user', // Default role
            });

            // Generate JWT
            const token = await signToken({
                userId: user._id.toString(),
                email: user.email,
                role: user.role,
            });

            // Set cookie
            const response = NextResponse.json({
                success: true,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });

            response.cookies.set('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7, // 7 days
            });

            return response;
        }

        if (action === 'login') {
            // Validate input
            if (!email || !password) {
                return NextResponse.json(
                    { error: 'Please provide email and password' },
                    { status: 400 }
                );
            }

            // Find user
            const user = await User.findOne({ email }).select('+password');
            if (!user) {
                return NextResponse.json(
                    { error: 'Invalid credentials' },
                    { status: 401 }
                );
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return NextResponse.json(
                    { error: 'Invalid credentials' },
                    { status: 401 }
                );
            }

            // Generate JWT
            const token = await signToken({
                userId: user._id.toString(),
                email: user.email,
                role: user.role,
                name: user.name,
            });

            // Set cookie
            const response = NextResponse.json({
                success: true,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });

            response.cookies.set('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7, // 7 days
            });

            return response;
        }

        if (action === 'logout') {
            const response = NextResponse.json({ success: true });
            response.cookies.delete('token');
            return response;
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Auth error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
