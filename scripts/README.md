# Location Data Population Script

This script fetches location data from DataForSEO and stores it in your MongoDB database, allowing you to use your own API instead of calling DataForSEO every time.

## What it does

1. Fetches locations from **DataForSEO SERP API** (`/v3/serp/google/locations`)
2. Fetches locations from **DataForSEO Labs API** (`/v3/dataforseo_labs/locations_and_languages`)
3. Merges the data (Labs data takes priority as it's more comprehensive)
4. Saves all locations to your MongoDB database

## Prerequisites

Make sure your `.env.local` file has:
```env
DATAFORSEO_LOGIN=your_email@example.com
DATAFORSEO_PASSWORD=your_api_password
MONGODB_URI=your_mongodb_connection_string
```

## Usage

### Run the script:
```bash
npm run populate-locations
```

### What to expect:
```
🚀 Starting location data population...

🔌 Connecting to MongoDB...
✅ Connected to MongoDB

📍 Fetching Google SERP locations...
✅ Fetched 65000+ SERP locations

📍 Fetching DataForSEO Labs locations...
✅ Fetched 50000+ Labs locations

🔀 Merging location data...
✅ Merged into 70000+ unique locations

💾 Saving locations to database...

📊 Database Update Summary:
   ✅ Inserted: 70000+
   🔄 Updated: 0
   
✅ Location data population completed successfully!

💡 Tip: You can now use the /api/locations endpoint to search locations from your own database.
```

## Database Schema

The script creates a `locations` collection with the following structure:

```typescript
{
  location_code: number;        // Unique DataForSEO location code
  location_name: string;        // e.g., "New York, United States"
  location_code_parent: number; // Parent location code (null for countries)
  country_iso_code: string;     // e.g., "US", "IN", "GB"
  location_type: string;        // e.g., "City", "Country", "Region"
  available_languages: string[]; // e.g., ["en", "es"]
  available_sources: string[];   // DataForSEO Labs sources
  createdAt: Date;
  updatedAt: Date;
}
```

## Indexes

The script creates the following indexes for fast searching:
- `location_code` (unique)
- `location_name` (text search)
- `country_iso_code`

## Re-running the script

You can safely re-run the script anytime to update your location data. It uses `upsert` operations, so:
- New locations will be **inserted**
- Existing locations will be **updated** with latest data
- No duplicates will be created

## Next Steps

After populating the database, you can update your `/api/locations` endpoint to query your own database instead of calling DataForSEO.

## Troubleshooting

### Error: DATAFORSEO credentials not found
Make sure your `.env.local` file has the correct credentials.

### Error: MongoDB connection failed
Check your `MONGODB_URI` in `.env.local`.

### DataForSEO API errors
- **401 Unauthorized**: Check your credentials
- **403 Forbidden**: Your account may be paused (contact DataForSEO support)
- **Rate limit**: Wait a few minutes and try again

## Cost

This script makes 2 API calls to DataForSEO:
- 1 call to `/v3/serp/google/locations` (usually free)
- 1 call to `/v3/dataforseo_labs/locations_and_languages` (usually free)

Check your DataForSEO pricing plan to confirm.
