/**
 * Script to populate the database with location data from DataForSEO
 * 
 * This script fetches location data from two DataForSEO endpoints:
 * 1. /v3/serp/google/locations - Google SERP locations
 * 2. /v3/dataforseo_labs/locations_and_languages - DataForSEO Labs locations
 * 
 * Usage:
 *   npm run populate-locations
 * 
 * Or directly with ts-node:
 *   npx ts-node scripts/populate-locations.ts
 */

import mongoose from 'mongoose';
import Location from '../models/Location';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN;
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD;
const MONGODB_URI = process.env.MONGODB_URI;

if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
    console.error('❌ Error: DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD must be set in .env.local');
    process.exit(1);
}

if (!MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI must be set in .env.local');
    process.exit(1);
}

// Create Basic Auth header
const authHeader = 'Basic ' + Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64');

interface DataForSEOLanguage {
    language_name: string;
    language_code: string;
    keywords?: number;
    serps?: number;
    available_sources?: string[];
}

interface DataForSEOLocation {
    location_code: number;
    location_name: string;
    location_code_parent: number | null;
    country_iso_code: string;
    location_type: string;
    available_languages?: DataForSEOLanguage[];
}

/**
 * Fetch locations from DataForSEO SERP endpoint
 */
async function fetchSERPLocations(): Promise<DataForSEOLocation[]> {
    console.log('📍 Fetching Google SERP locations...');

    try {
        const response = await fetch('https://api.dataforseo.com/v3/serp/google/locations', {
            method: 'GET',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`DataForSEO API error: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.tasks && data.tasks[0] && data.tasks[0].result) {
            const locations = data.tasks[0].result;
            console.log(`✅ Fetched ${locations.length} SERP locations`);
            return locations;
        }

        console.warn('⚠️  No SERP locations found in response');
        return [];
    } catch (error: any) {
        console.error('❌ Error fetching SERP locations:', error.message);
        throw error;
    }
}

/**
 * Fetch locations from DataForSEO Labs endpoint
 */
async function fetchLabsLocations(): Promise<DataForSEOLocation[]> {
    console.log('📍 Fetching DataForSEO Labs locations...');

    try {
        const response = await fetch('https://api.dataforseo.com/v3/dataforseo_labs/locations_and_languages', {
            method: 'GET',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`DataForSEO API error: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.tasks && data.tasks[0] && data.tasks[0].result) {
            const locations = data.tasks[0].result;
            console.log(`✅ Fetched ${locations.length} Labs locations`);
            return locations;
        }

        console.warn('⚠️  No Labs locations found in response');
        return [];
    } catch (error: any) {
        console.error('❌ Error fetching Labs locations:', error.message);
        throw error;
    }
}

/**
 * Merge locations from both sources, preferring Labs data when available
 */
function mergeLocations(serpLocations: DataForSEOLocation[], labsLocations: DataForSEOLocation[]): DataForSEOLocation[] {
    const locationMap = new Map<number, DataForSEOLocation>();

    // Add SERP locations first (they don't have language data)
    for (const loc of serpLocations) {
        locationMap.set(loc.location_code, {
            ...loc,
            available_languages: [],
        });
    }

    // Merge Labs locations (they have language data)
    for (const loc of labsLocations) {
        const existing = locationMap.get(loc.location_code);
        if (existing) {
            // Merge: keep all fields, add language data from Labs
            locationMap.set(loc.location_code, {
                ...existing,
                ...loc,
                available_languages: loc.available_languages || [],
            });
        } else {
            locationMap.set(loc.location_code, {
                ...loc,
                available_languages: loc.available_languages || [],
            });
        }
    }

    return Array.from(locationMap.values());
}

/**
 * Save locations to MongoDB
 */
async function saveLocationsToDatabase(locations: DataForSEOLocation[]): Promise<void> {
    console.log(`💾 Saving ${locations.length} locations to database...`);

    let inserted = 0;
    let updated = 0;
    let errors = 0;

    for (const loc of locations) {
        try {
            const result = await Location.findOneAndUpdate(
                { location_code: loc.location_code },
                {
                    location_name: loc.location_name,
                    location_code_parent: loc.location_code_parent,
                    country_iso_code: loc.country_iso_code,
                    location_type: loc.location_type,
                    available_languages: loc.available_languages || [],
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            if (result) {
                // Check if it was an insert or update
                const wasInserted = result.createdAt.getTime() === result.updatedAt.getTime();
                if (wasInserted) {
                    inserted++;
                } else {
                    updated++;
                }
            }
        } catch (error: any) {
            errors++;
            console.error(`❌ Error saving location ${loc.location_code} (${loc.location_name}):`, error.message);
        }
    }

    console.log(`\n📊 Database Update Summary:`);
    console.log(`   ✅ Inserted: ${inserted}`);
    console.log(`   🔄 Updated: ${updated}`);
    if (errors > 0) {
        console.log(`   ❌ Errors: ${errors}`);
    }
}

/**
 * Main function
 */
async function main() {
    console.log('🚀 Starting location data population...\n');

    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI!);
        console.log('✅ Connected to MongoDB\n');

        // Fetch data from both endpoints
        const [serpLocations, labsLocations] = await Promise.all([
            fetchSERPLocations(),
            fetchLabsLocations(),
        ]);

        // Merge locations
        console.log('\n🔀 Merging location data...');
        const mergedLocations = mergeLocations(serpLocations, labsLocations);
        console.log(`✅ Merged into ${mergedLocations.length} unique locations\n`);

        // Save to database
        await saveLocationsToDatabase(mergedLocations);

        console.log('\n✅ Location data population completed successfully!');
        console.log(`\n💡 Tip: You can now use the /api/locations endpoint to search locations from your own database.`);

    } catch (error: any) {
        console.error('\n❌ Fatal error:', error.message);
        process.exit(1);
    } finally {
        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the script
main();
