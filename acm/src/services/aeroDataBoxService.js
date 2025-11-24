// src/services/aeroDataBoxService.js

const API_KEY = import.meta.env.VITE_AERODATABOX_API_KEY;
const BASE_URL = 'https://aerodatabox.p.rapidapi.com/aircrafts';

const cache = new Map();
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days (registration rarely changes)

let apiCallCount = 0;

export function getAeroDataBoxCallCount() {
  return apiCallCount;
}

/**
 * Get aircraft details by ICAO24 or registration
 */
export async function getAircraftDetails(icao24) {
  try {
    const cleanIcao = icao24?.trim().toUpperCase();
    if (!cleanIcao) return null;

    // Check cache first
    const cached = cache.get(cleanIcao);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`📦 Using cached aircraft data for ${cleanIcao}`);
      return cached.data;
    }

    console.log(`🔍 Looking up aircraft details for ${cleanIcao}`);

    const response = await fetch(
      `${BASE_URL}/icao24/${cleanIcao}`,
      {
        headers: {
          'X-RapidAPI-Key': API_KEY,
          'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
        }
      }
    );

    apiCallCount++;
    console.log(`📊 AeroDataBox API calls this session: ${apiCallCount}`);

    // ✨ ADD THIS - Log the actual response
    console.log(`📡 AeroDataBox response status: ${response.status}`);
    console.log(`📡 AeroDataBox content-type: ${response.headers.get('content-type')}`);

    // ✨ NEW: Check response status before parsing JSON
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`⚠️ Aircraft ${cleanIcao} not found in AeroDataBox`);
      } else if (response.status === 429) {
        console.warn(`🚨 AeroDataBox rate limit hit! (150/day)`);
      } else if (response.status === 403) {
        console.error(`🚨 AeroDataBox API key invalid or expired`);
      } else {
        console.error(`❌ AeroDataBox error: ${response.status} ${response.statusText}`);
      }
      
      // Cache null result to avoid repeated failed lookups
      cache.set(cleanIcao, {
        data: null,
        timestamp: Date.now()
      });
      
      return null;
    }

    // ✨ NEW: Check if response has content before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`❌ AeroDataBox returned non-JSON response for ${cleanIcao}`);
      
      // Cache null result
      cache.set(cleanIcao, {
        data: null,
        timestamp: Date.now()
      });
      
      return null;
    }

    // ✨ NEW: Try to parse JSON with error handling
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error(`❌ Failed to parse AeroDataBox JSON response:`, jsonError);
      
      // Cache null result
      cache.set(cleanIcao, {
        data: null,
        timestamp: Date.now()
      });
      
      return null;
    }

    // Check if data is valid
    if (!data || typeof data !== 'object') {
      console.error(`❌ AeroDataBox returned invalid data for ${cleanIcao}`);
      
      // Cache null result
      cache.set(cleanIcao, {
        data: null,
        timestamp: Date.now()
      });
      
      return null;
    }
    
    const result = {
      registration: data.reg || null,
      aircraftType: data.typeName || data.model || null,
      manufacturer: data.manufacturerName || null,
      owner: data.operatorName || null,
      serialNumber: data.serialNumber || null
    };

    // Cache the result
    cache.set(cleanIcao, {
      data: result,
      timestamp: Date.now()
    });

    console.log(`✅ Aircraft details found for ${cleanIcao}:`, result);
    return result;

  } catch (error) {
    console.error('Error fetching aircraft details from AeroDataBox:', error);
    
    // Cache null result to avoid repeated errors
    if (icao24) {
      cache.set(icao24.trim().toUpperCase(), {
        data: null,
        timestamp: Date.now()
      });
    }
    
    return null;
  }
}