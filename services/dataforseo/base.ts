// Base DataForSEO service with authentication and credit tracking

import { DataForSEOResponse, DataForSEOCredentials, CreditUsageData } from './types';
import dbConnect from '@/lib/db';

export class DataForSEOClient {
    private baseURL = 'https://api.dataforseo.com/v3';
    private credentials: DataForSEOCredentials;
    private authHeader: string;

    constructor() {
        const login = process.env.DATAFORSEO_LOGIN;
        const password = process.env.DATAFORSEO_PASSWORD;

        if (!login || !password) {
            throw new Error('DataForSEO credentials not found in environment variables');
        }

        this.credentials = { login, password };
        this.authHeader = 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64');
    }

    /**
     * Make a request to DataForSEO API with automatic credit tracking
     */
    async makeRequest<T = any>(
        endpoint: string,
        method: 'GET' | 'POST' = 'POST',
        data?: any,
        userId?: string
    ): Promise<DataForSEOResponse<T>> {
        const url = `${this.baseURL}${endpoint}`;

        try {
            const options: RequestInit = {
                method,
                headers: {
                    'Authorization': this.authHeader,
                    'Content-Type': 'application/json',
                },
            };

            if (method === 'POST' && data) {
                options.body = JSON.stringify(Array.isArray(data) ? data : [data]);
            }

            const response = await fetch(url, options);

            if (!response.ok) {
                throw new Error(`DataForSEO API error: ${response.status} ${response.statusText}`);
            }

            const result: DataForSEOResponse<T> = await response.json();

            // Track credit usage
            if (result.cost && userId) {
                await this.trackCreditUsage({
                    userId,
                    apiEndpoint: endpoint,
                    creditsUsed: result.cost,
                    requestParams: data,
                    responseStatus: result.status_code,
                    timestamp: new Date(),
                });
            }

            // Check for API errors
            if (result.status_code !== 20000) {
                throw new Error(`DataForSEO API error: ${result.status_message} (Code: ${result.status_code})`);
            }

            return result;
        } catch (error: any) {
            console.error(`DataForSEO API request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    /**
     * Track credit usage in database
     */
    private async trackCreditUsage(data: CreditUsageData): Promise<void> {
        try {
            await dbConnect();

            // Dynamically import to avoid circular dependencies
            const CreditUsage = (await import('@/models/CreditUsage')).default;

            await CreditUsage.create(data);

            console.log(`Tracked ${data.creditsUsed} credits for ${data.apiEndpoint}`);
        } catch (error) {
            // Don't fail the request if credit tracking fails
            console.error('Failed to track credit usage:', error);
        }
    }

    /**
     * Get account balance (optional - requires additional API call)
     */
    async getAccountBalance(): Promise<number> {
        try {
            const response = await fetch(`${this.baseURL}/appendix/user_data`, {
                method: 'GET',
                headers: {
                    'Authorization': this.authHeader,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to get account balance');
            }

            const data = await response.json();

            if (data.tasks && data.tasks[0] && data.tasks[0].result) {
                return data.tasks[0].result[0].money.balance || 0;
            }

            return 0;
        } catch (error) {
            console.error('Failed to get account balance:', error);
            return 0;
        }
    }

    /**
     * Check if account has sufficient balance (optional)
     */
    async hasSufficientBalance(estimatedCost: number): Promise<boolean> {
        try {
            const balance = await this.getAccountBalance();
            return balance >= estimatedCost;
        } catch (error) {
            // If we can't check balance, allow the request to proceed
            console.warn('Could not verify account balance:', error);
            return true;
        }
    }
}

// Singleton instance
let clientInstance: DataForSEOClient | null = null;

export function getDataForSEOClient(): DataForSEOClient {
    if (!clientInstance) {
        clientInstance = new DataForSEOClient();
    }
    return clientInstance;
}
