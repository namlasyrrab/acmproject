// src/services/aviationStackService.js

const API_KEY = import.meta.env.VITE_AVIATIONSTACK_API_KEY; // Replace with your actual key
const BASE_URL = 'https://api.aviationstack.com/v1'; 

// Add at the top of the file
const cache = new Map();
const pendingRequests = new Map(); // ← ADD THIS
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Track API usage
let apiCallCount = 0;

export function getAPICallCount() {
  return apiCallCount;
}

export function resetAPICallCount() {
  apiCallCount = 0;
}

/**
 * Fetch flight details by callsign
 */
export async function getFlightDetails(callsign) {
  try {
    const cleanCallsign = callsign?.trim();
    if (!cleanCallsign) return null;

    // Check cache first (works for both success and failure)
    const cached = cache.get(cleanCallsign);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`📦 Using cached data for ${cleanCallsign}`);
      return cached.data; // Could be flight data OR null
    }

    // ✨ NEW: Check if request is already in progress
    if (pendingRequests.has(cleanCallsign)) {
      console.log(`⏳ Request already in progress for ${cleanCallsign}, waiting...`);
      return await pendingRequests.get(cleanCallsign);
    }

    console.log(`🌐 Making API call for ${cleanCallsign}`);

// Create the promise and store it
    const requestPromise = (async () => {
      try {
        // Try IATA format first
        let response = await fetch(
          `${BASE_URL}/flights?access_key=${API_KEY}&flight_iata=${cleanCallsign}`
        );

        apiCallCount++;
        const warningThreshold = 80;
        const dangerThreshold = 95;

        if (apiCallCount >= dangerThreshold) {
          console.error(`🚨 DANGER: ${apiCallCount}/100 API calls! Approaching limit!`);
        } else if (apiCallCount >= warningThreshold) {
          console.warn(`⚠️ WARNING: ${apiCallCount}/100 API calls used this session`);
        } else {
          console.log(`📊 API calls this session: ${apiCallCount}/100`);
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch flight details: ${response.status}`);
        }

        let data = await response.json();

        // Only try ICAO if IATA explicitly returned no results
        if (!data.data || data.data.length === 0) {
          console.log(`No results for IATA ${cleanCallsign}, trying ICAO...`);
          response = await fetch(
            `${BASE_URL}/flights?access_key=${API_KEY}&flight_icao=${cleanCallsign}`
          );

          apiCallCount++;

          if (apiCallCount >= dangerThreshold) {
            console.error(`🚨 DANGER: ${apiCallCount}/100 API calls! Approaching limit!`);
          } else if (apiCallCount >= warningThreshold) {
            console.warn(`⚠️ WARNING: ${apiCallCount}/100 API calls used this session`);
          } else {
            console.log(`📊 API calls this session: ${apiCallCount}/100`);
          }

          if (!response.ok) {
            throw new Error(`Failed to fetch flight details: ${response.status}`);
          }

          data = await response.json();
        }

        let result = null;

        if (data.data && data.data.length > 0) {
          const flight = data.data[0];

          // Calculate duration from scheduled times if not provided
          let duration = null;
          if (flight.departure?.scheduled && flight.arrival?.scheduled) {
            const depTime = new Date(flight.departure.scheduled);
            const arrTime = new Date(flight.arrival.scheduled);
            duration = Math.round((arrTime - depTime) / (1000 * 60)); // Duration in minutes
          }

          result = {
            airline: flight.airline?.name || null,
            airlineIATA: flight.airline?.iata || null,
            flightNumber: flight.flight?.iata || callsign,
            aircraft: flight.aircraft?.registration || null,
            aircraftType: flight.aircraft?.iata || flight.aircraft?.registration || null,
            duration: duration,  // ✅ Calculated from departure/arrival times
            departure: {
              airport: flight.departure?.airport || null,
              iata: flight.departure?.iata || null,
              terminal: flight.departure?.terminal || null,
              gate: flight.departure?.gate || null,
              scheduledTime: flight.departure?.scheduled || null
            },
            arrival: {
              airport: flight.arrival?.airport || null,
              iata: flight.arrival?.iata || null,
              terminal: flight.arrival?.terminal || null,
              gate: flight.arrival?.gate || null,
              scheduledTime: flight.arrival?.scheduled || null
            },
            status: flight.flight_status || null
          };
        }

        // Cache the result
        cache.set(cleanCallsign, {
          data: result,
          timestamp: Date.now()
        });

        console.log(result ? `✅ Cached enriched data for ${cleanCallsign}` : `📦 Cached "no data" result for ${cleanCallsign}`);

        return result;
      } finally {
        // ✨ Remove from pending requests when done
        pendingRequests.delete(cleanCallsign);
      }
    })();

    // ✨ Store the pending promise
    pendingRequests.set(cleanCallsign, requestPromise);

    return await requestPromise;

  } catch (error) {
    console.error('Error fetching flight details from AviationStack:', error);
    pendingRequests.delete(cleanCallsign);
    return null;
  }
}