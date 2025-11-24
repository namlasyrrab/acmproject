// mapHelpers.js - Helper functions, constants, and data for MapView

import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { getFlightDetails } from '../services/aviationStackService';
import { getAircraftDetails } from '../services/aeroDataBoxService';
import { getFAARegistration } from '../services/faaRegistryService';
import { isCommercialCallsign, getAirlineFromCallsign } from './callsignHelper';

// ============================================================================
// ICON DEFINITIONS
// ============================================================================

// Fix for the default icon
export const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Create a custom red icon
const redIconUrl = "data:image/svg+xml;base64," + btoa(`
<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
  <path fill="#e04141" stroke="#ffffff" stroke-width="1" d="M12.5,1C5.6,1,0,6.6,0,13.5c0,4.6,2.4,8.7,6,11c0,0,0.1,0.1,0.1,0.1l5.6,16.1c0.2,0.5,0.8,0.8,1.4,0.5c0.2-0.1,0.4-0.2,0.5-0.5L19.2,24c0,0,0.1-0.1,0.1-0.1c3.6-2.3,6-6.4,6-11C25.3,6.6,19.4,1,12.5,1z M12.5,18c-2.5,0-4.5-2-4.5-4.5s2-4.5,4.5-4.5s4.5,2,4.5,4.5S15,18,12.5,18z"/>
</svg>
`);

export const redIcon = L.icon({
  iconUrl: redIconUrl,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

// ============================================================================
// CONSTANTS
// ============================================================================

// Miami International Airport coordinates
export const MIA_COORDS = {
  lat: 25.7959,
  lng: -80.2870
};

// Airport info for display
export const MIA_AIRPORT = {
  code: "MIA",
  name: "Miami International Airport",
  city: "Miami",
  state: "Florida",
  lat: MIA_COORDS.lat,
  lng: MIA_COORDS.lng
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================


/**
 * Format ISO timestamp to readable time (e.g., "2:30 PM")
 */
function formatTime(isoString) {
  if (!isoString) return null;

  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return isoString; // Return original if parsing fails
  }
}
/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get MIA-related flights from live aircraft data
 * Renamed from getBCTFlights to getMIAFlights but keeping export name for compatibility
 */
export function getBCTFlights(aircraft) {
  const NEARBY_THRESHOLD = 15; // km - larger for MIA
  const LOW_ALTITUDE_THRESHOLD = 3000; // meters (~10,000 ft)

  const nearby = aircraft.filter(plane => {
    const distance = calculateDistance(MIA_COORDS.lat, MIA_COORDS.lng, plane.latitude, plane.longitude);
    return distance <= NEARBY_THRESHOLD && plane.altitude && plane.altitude < LOW_ALTITUDE_THRESHOLD;
  });

  const departing = nearby.filter(plane =>
    plane.vertical_rate && plane.vertical_rate > 2 // Climbing (m/s)
  );

  const arriving = nearby.filter(plane =>
    plane.vertical_rate && plane.vertical_rate < -2 // Descending (m/s)
  );

  return { departing, arriving, total: nearby.length };
}

// Alias for clarity
export const getMIAFlights = getBCTFlights;

/**
 * Determine flight direction based on vertical rate and altitude
 */
export function determineFlightDirection(plane) {
  if (!plane.vertical_rate) return 'unknown';

  if (plane.vertical_rate > 2) return 'departing';
  if (plane.vertical_rate < -2) return 'arriving';

  // If level flight, guess based on distance from airport
  const distance = calculateDistance(MIA_COORDS.lat, MIA_COORDS.lng, plane.latitude, plane.longitude);
  return distance < 5 ? 'departing' : 'arriving';
}

/**
 * Check if flight should be enriched with API data
 * Only commercial flights are worth the API call
 */
export function shouldEnrichWithAPI(callsign) {
  return isCommercialCallsign(callsign);
}

/**
 * Convert live aircraft data to flight detail format for modal
 * Now with optional API enrichment
 */
export async function convertLiveAircraftToFlight(plane, direction, enrichWithAPI = true) {
  const MIA = {
    code: "MIA",
    name: "Miami International Airport",
    city: "Miami",
    state: "Florida",
    lat: MIA_COORDS.lat,
    lng: MIA_COORDS.lng
  };

  const isDeparture = direction === 'departing';
  const currentTime = new Date();
  const timeStr = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const distanceFromMIA = calculateDistance(
    MIA.lat,
    MIA.lng,
    plane.latitude,
    plane.longitude
  ).toFixed(1);

  const estimatedDuration = plane.velocity > 0
    ? Math.round((parseFloat(distanceFromMIA) / plane.velocity) * 60)
    : null;

  const durationStr = estimatedDuration
    ? `~${Math.floor(estimatedDuration / 60)}h ${estimatedDuration % 60}m (estimated)`
    : "Unknown";

  // Try to enrich with external APIs
  let flightData = null;
  let aircraftData = null;

  // Only call APIs for commercial callsigns
  const isCommercial = isCommercialCallsign(plane.callsign);

  if (enrichWithAPI && plane.callsign && isCommercial) {
    // Step 1: Try AviationStack (commercial flights)
    console.log(`🔍 Step 1: Checking AviationStack for ${plane.callsign}`);
    flightData = await getFlightDetails(plane.callsign);

    // Step 2: If no flight data, try aircraft registration lookup
    if (!flightData && plane.icao24) {
      console.log(`🔍 Step 2: Checking AeroDataBox for aircraft ${plane.icao24}`);
      aircraftData = await getAircraftDetails(plane.icao24);

      // Step 3: If AeroDataBox failed and it's a US aircraft, try FAA
      if (!aircraftData && plane.callsign?.startsWith('N')) {
        console.log(`🔍 Step 3: Trying FAA Registry for ${plane.callsign}`);
        aircraftData = await getFAARegistration(plane.callsign);
      }
    }
  } else if (enrichWithAPI && plane.callsign && !isCommercial) {
    // For private aircraft, only try FAA if it's a US tail number
    if (plane.callsign?.startsWith('N')) {
      console.log(`🔍 Private aircraft - checking FAA for ${plane.callsign}`);
      aircraftData = await getFAARegistration(plane.callsign);
    }
  }

  // Determine airline name
  let airlineName = "Private Flight";
  if (flightData?.airline) {
    airlineName = flightData.airline;
  } else if (isCommercial) {
    airlineName = getAirlineFromCallsign(plane.callsign) || "Commercial Flight";
  } else if (aircraftData?.owner) {
    airlineName = `${aircraftData.owner} (Private)`;
  }

  return {
    flightId: `live-${plane.icao24}`,
    route: flightData
      ? `${flightData.departure.iata || 'UNK'} to ${flightData.arrival.iata || 'UNK'}`
      : (isDeparture ? `MIA to ${plane.origin_country || 'UNK'}` : `${plane.origin_country || 'UNK'} to MIA`),
    time: timeStr,
    boardingTime: formatTime(flightData?.departure.scheduledTime) || (isDeparture ? timeStr : 'N/A'),
    arrivalTime: formatTime(flightData?.arrival.scheduledTime) || (!isDeparture ? timeStr : 'N/A'),
    airline: airlineName,
    flightNumber: flightData?.flightNumber || plane.callsign?.trim() || plane.icao24.toUpperCase(),
    aircraft: flightData?.aircraftType || aircraftData?.aircraftType || "Aircraft Type Unknown",
    status: flightData?.status || (isDeparture ? "Departing (Live)" : "Arriving (Live)"),
    gate: flightData?.departure.gate || flightData?.arrival.gate || "Not Available",
    terminal: flightData?.departure.terminal || flightData?.arrival.terminal || (isCommercial ? "Commercial Terminal" : "Private Aviation"),
    duration: durationStr,
    distance: `${distanceFromMIA} km`,
    departureAirport: isDeparture ? MIA : {
      code: flightData?.departure.iata || "UNK",
      name: flightData?.departure.airport || "Origin Unknown",
      city: flightData?.departure.city || plane.origin_country || "",
      state: flightData?.departure.state || ""
    },
    arrivalAirport: !isDeparture ? MIA : {
      code: flightData?.arrival.iata || "UNK",
      name: flightData?.arrival.airport || "Destination Unknown",
      city: flightData?.arrival.city || plane.origin_country || "",
      state: flightData?.arrival.state || ""
    },
    liveData: {
      icao24: plane.icao24,
      latitude: plane.latitude,
      longitude: plane.longitude,
      altitude: plane.altitude,
      velocity: plane.velocity,
      heading: plane.heading,
      vertical_rate: plane.vertical_rate,
      on_ground: plane.on_ground
    },
    // Add enrichment source for transparency
    enrichmentSource: flightData ? 'AviationStack' : (aircraftData ? (aircraftData.source || 'AeroDataBox') : 'None'),
    isCommercial: isCommercial,
    audioRecordings: []
  };
}

// ============================================================================
// FLIGHT DATA (Sample/Historical)
// ============================================================================

// Flight data (detailed flight information - this will eventually come from Firebase)
export const flightData = {
  'flight-1': {
    route: "MIA to JFK",
    time: "9:30 AM",
    boardingTime: "8:45 AM",
    arrivalTime: "12:45 PM",
    airline: "American Airlines",
    flightNumber: "AA1234",
    aircraft: "Boeing 737-800",
    status: "On Time",
    gate: "D22",
    terminal: "North Terminal",
    duration: "3 hours 15 minutes",
    distance: "1,089 miles",
    departureAirport: {
      code: "MIA",
      name: "Miami International Airport",
      city: "Miami",
      state: "Florida"
    },
    arrivalAirport: {
      code: "JFK",
      name: "John F. Kennedy International Airport",
      city: "New York",
      state: "New York"
    },
    audioRecordings: [
      {
        id: 1,
        title: "Pre-flight Communications",
        description: "Ground control and taxi instructions",
        audioUrl: "/audio/flight1-preflight.mp3",
        duration: "2:34",
        timestamp: "8:20 AM"
      },
      {
        id: 2,
        title: "Takeoff Clearance",
        description: "Tower communications for departure",
        audioUrl: null,
        duration: "1:45",
        timestamp: "9:25 AM"
      }
    ]
  },
  'flight-2': {
    route: "LAX to MIA",
    time: "2:15 PM",
    boardingTime: "1:30 PM",
    arrivalTime: "10:30 PM",
    airline: "Delta Air Lines",
    flightNumber: "DL567",
    aircraft: "Airbus A321",
    status: "On Time",
    gate: "J8",
    terminal: "South Terminal",
    duration: "5 hours 15 minutes",
    distance: "2,342 miles",
    departureAirport: {
      code: "LAX",
      name: "Los Angeles International Airport",
      city: "Los Angeles",
      state: "California"
    },
    arrivalAirport: {
      code: "MIA",
      name: "Miami International Airport",
      city: "Miami",
      state: "Florida"
    },
    audioRecordings: [
      {
        id: 1,
        title: "Miami Approach",
        description: "Approach and landing clearance",
        audioUrl: null,
        duration: "3:12",
        timestamp: "10:20 PM"
      }
    ]
  },
  'flight-3': {
    route: "MIA to ATL",
    time: "4:45 PM",
    boardingTime: "4:00 PM",
    arrivalTime: "6:30 PM",
    airline: "United Airlines",
    flightNumber: "UA789",
    aircraft: "Boeing 757-200",
    status: "On Time",
    gate: "E15",
    terminal: "Central Terminal",
    duration: "1 hour 45 minutes",
    distance: "594 miles",
    departureAirport: {
      code: "MIA",
      name: "Miami International Airport",
      city: "Miami",
      state: "Florida"
    },
    arrivalAirport: {
      code: "ATL",
      name: "Hartsfield-Jackson Atlanta International Airport",
      city: "Atlanta",
      state: "Georgia"
    },
    audioRecordings: []
  }
};
