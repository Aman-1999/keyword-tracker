import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Location from '@/models/Location';

// Simple in-memory cache
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache

interface ScoredLocation {
  location_code: number;
  location_name: string;
  location_type: string;
  country_iso_code: string;
  location_code_parent: number | null;
  score: number;
  matchQuality: number;
}

/**
 * Calculate match quality score (separate from location type)
 */
function calculateMatchQuality(locationName: string, query: string): number {
  const lowerName = locationName.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Exact match
  if (lowerName === lowerQuery) return 1000;

  // Starts with query
  if (lowerName.startsWith(lowerQuery)) return 500;

  // Word boundary match
  if (new RegExp(`\\b${lowerQuery}`, 'i').test(locationName)) return 300;

  // Contains query
  if (lowerName.includes(lowerQuery)) return 100;

  // Partial match
  return 10;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Check cache first
    const cacheKey = query.toLowerCase();
    const cachedResult = cache.get(cacheKey);
    if (cachedResult && (Date.now() - cachedResult.timestamp < CACHE_TTL)) {
      return NextResponse.json({ results: cachedResult.data }, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
          'X-Cache': 'HIT'
        }
      });
    }

    await dbConnect();

    let locations: any[] = [];
    const selectFields = 'location_code location_name location_type country_iso_code';

    // Exclude unwanted location types
    const excludedTypes = ["Postal Code", "Municipality"];

    // Primary: text search with high limit
    const textResults = await Location.find(
      {
        $text: { $search: query },
        location_type: { $nin: excludedTypes }
      },
      { score: { $meta: 'textScore' } }
    )
      .select(selectFields)
      .sort({ score: { $meta: 'textScore' } })
      .limit(500)
      .lean();

    locations = textResults;

    // Secondary: Regex fallback (only if text search yields few results)
    if (locations.length < 5) {
      const regex = new RegExp(query, 'i');
      const regexResults = await Location.find({
        $and: [
          {
            $or: [
              { location_name: { $regex: regex } },
              { country_iso_code: { $regex: regex } },
            ]
          },
          { location_type: { $nin: excludedTypes } }
        ]
      })
        .select(selectFields)
        .limit(200)
        .lean();

      const existing = new Set(locations.map((l) => l.location_code));
      regexResults.forEach((r) => {
        if (!existing.has(r.location_code)) locations.push(r);
      });
    }

    // Pre-compile regex for scoring
    const lowerQuery = query.toLowerCase();
    const wordBoundaryRegex = new RegExp(`\\b${lowerQuery}`, 'i');

    // --- SCORE CALCULATION ---
    const scored = locations.map((loc: any) => {
      // Inline match quality calculation for performance
      const lowerName = loc.location_name.toLowerCase();
      let matchQuality = 10;

      if (lowerName === lowerQuery) matchQuality = 1000;
      else if (lowerName.startsWith(lowerQuery)) matchQuality = 500;
      else if (wordBoundaryRegex.test(loc.location_name)) matchQuality = 300;
      else if (lowerName.includes(lowerQuery)) matchQuality = 100;

      const isIndia = loc.country_iso_code?.toUpperCase() === "IN" ? 1 : 0;

      const typeBoost = (() => {
        const t = loc.location_type.toLowerCase();
        if (t === "country") return 500;
        if (t === "state" || t === "province") return 400;
        if (t === "city") return 300;
        return 100;
      })();

      // Weighted scoring model
      const score =
        matchQuality * 2 + // Strong match relevance
        typeBoost +        // Type priority (country > state > city)
        (isIndia ? 2000 : 0); // India SUPER Boost (always top)

      return {
        ...loc,
        matchQuality,
        score,
      };
    });

    // Filter out irrelevant results (loose matches from text search that don't contain the query string)
    const filtered = scored.filter(s => s.matchQuality >= 50); // Keep score > 10 (Partial match is 10)

    // --- SORTING ORDER ---
    filtered.sort((a, b) => {
      const aIN = a.country_iso_code === "IN" ? 1 : 0;
      const bIN = b.country_iso_code === "IN" ? 1 : 0;

      if (aIN !== bIN) return bIN - aIN;
      if (a.score !== b.score) return b.score - a.score;
      return a.location_name.localeCompare(b.location_name);
    });

    // Format results
    const results = filtered.slice(0, 20).map((loc) => ({
      id: loc.location_code,
      name: loc.location_name,
      subtext: `${loc.location_type} • ${loc.country_iso_code}`,
      value: loc.location_name,
      type: loc.location_type,
      location_code: loc.location_code,
      country_iso_code: loc.country_iso_code,
    }));

    // Update cache
    cache.set(cacheKey, { data: results, timestamp: Date.now() });

    // Clean old cache entries if too large
    if (cache.size > 1000) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey !== undefined) {
        cache.delete(oldestKey);
      }
    }

    return NextResponse.json({ results }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
        'X-Cache': 'MISS'
      }
    });

  } catch (error) {
    console.error("Location search error:", error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
