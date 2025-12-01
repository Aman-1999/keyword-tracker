'use client';

import { Check, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function Pricing() {
    const plans = [
        {
            name: 'Starter',
            price: 'Free',
            description: 'Perfect for individuals and small projects.',
            features: [
                '5 searches per day',
                'Basic ranking data',
                'Mobile & Desktop results',
                'Search history (last 10)',
                'Community support',
            ],
            cta: 'Get Started',
            href: '/signup',
            popular: false,
        },
        {
            name: 'Pro',
            price: '$29',
            period: '/month',
            description: 'For SEO professionals and growing agencies.',
            features: [
                '100 searches per day',
                'Advanced SERP features',
                'Competitor analysis',
                'Unlimited search history',
                'Priority email support',
                'API access',
            ],
            cta: 'Start Free Trial',
            href: '/signup?plan=pro',
            popular: true,
        },
        {
            name: 'Agency',
            price: '$99',
            period: '/month',
            description: 'Scalable solution for large teams and high volume.',
            features: [
                'Unlimited searches',
                'White-label reports',
                'Team collaboration',
                'Dedicated account manager',
                'Custom API integration',
                'SLA support',
            ],
            cta: 'Contact Sales',
            href: '/contact',
            popular: false,
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Navbar />

            <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">
                        Simple, transparent pricing
                    </h1>
                    <p className="text-xl text-gray-500">
                        Choose the plan that's right for you. No hidden fees, cancel anytime.
                    </p>
                </div>

                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`relative bg-white rounded-2xl shadow-xl border ${plan.popular ? 'border-indigo-500 ring-2 ring-indigo-500 ring-opacity-50' : 'border-gray-100'
                                } p-8 flex flex-col`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 right-0 -mt-4 mr-4">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-600 text-white uppercase tracking-wide shadow-sm">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                                <p className="mt-2 text-gray-500 text-sm">{plan.description}</p>
                            </div>

                            <div className="mb-6">
                                <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                                {plan.period && <span className="text-gray-500 font-medium">{plan.period}</span>}
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <Check className="h-5 w-5 text-indigo-500" />
                                        </div>
                                        <p className="ml-3 text-sm text-gray-600">{feature}</p>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={plan.href}
                                className={`w-full flex items-center justify-center py-3 px-4 rounded-xl font-semibold transition-all ${plan.popular
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                    }`}
                            >
                                {plan.cta}
                            </Link>
                        </div>
                    ))}
                </div>

                <div className="mt-20 text-center">
                    <p className="text-gray-500">
                        Need a custom enterprise plan?{' '}
                        <a href="#" className="text-indigo-600 font-medium hover:text-indigo-500">
                            Contact us
                        </a>
                    </p>
                </div>
            </main>
        </div>
    );
}
