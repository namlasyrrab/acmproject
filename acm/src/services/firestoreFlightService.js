// src/services/firestoreFlightService.js
// Complete service for saving flight data to Firestore
// Matches your exact schema: flights, aircraft_positions, locations

import { db } from '../firebaseConfig';
import { 
  collection, 
  doc,
  setDoc,
  getDoc, 
  serverTimestamp,
  query,
  where,
  getDocs,
  updateDoc
} from 'firebase/firestore';

/**
 * Airport database for missing state/city info
 * Add more airports as needed
 */
const AIRPORT_DATABASE = {
  'MIA': { city: 'Miami', state: 'Florida' },
  'IAH': { city: 'Houston', state: 'Texas' },
  'LAX': { city: 'Los Angeles', state: 'California' },
  'SFO': { city: 'San Francisco', state: 'California' },
  'JFK': { city: 'New York', state: 'New York' },
  'ORD': { city: 'Chicago', state: 'Illinois' },
  'ATL': { city: 'Atlanta', state: 'Georgia' },
  'DFW': { city: 'Dallas', state: 'Texas' },
  'DEN': { city: 'Denver', state: 'Colorado' },
  'SEA': { city: 'Seattle', state: 'Washington' },
  'BOS': { city: 'Boston', state: 'Massachusetts' },
  'EWR': { city: 'Newark', state: 'New Jersey' },
  'LAS': { city: 'Las Vegas', state: 'Nevada' },
  'PHX': { city: 'Phoenix', state: 'Arizona' },
  'MCO': { city: 'Orlando', state: 'Florida' },
  'CLT': { city: 'Charlotte', state: 'North Carolina' },
  'MSP': { city: 'Minneapolis', state: 'Minnesota' },
  'DTW': { city: 'Detroit', state: 'Michigan' },
  'PHL': { city: 'Philadelphia', state: 'Pennsylvania' },
  'LGA': { city: 'New York', state: 'New York' },
  'BWI': { city: 'Baltimore', state: 'Maryland' },
  'SLC': { city: 'Salt Lake City', state: 'Utah' },
  'SAN': { city: 'San Diego', state: 'California' },
  'TPA': { city: 'Tampa', state: 'Florida' },
  'PDX': { city: 'Portland', state: 'Oregon' },
  'STL': { city: 'St. Louis', state: 'Missouri' },
  'NAS': { city: 'Nassau', state: 'Bahamas' },
};

/**
 * Enhance airport data with missing city/state info
 */
function enhanceAirportData(airport) {
  const code = airport.code?.toUpperCase();
  const knownAirport = AIRPORT_DATABASE[code];
  
  if (knownAirport) {
    return {
      code: airport.code,
      name: airport.name,
      city: knownAirport.city,  // Use our database
      state: knownAirport.state  // Use our database
    };
  }
  
  // Return as-is if not in database
  return {
    code: airport.code,
    name: airport.name,
    city: airport.city || "Unknown",
    state: airport.state || ""
  };
}

/**
 * Main function: Save or update flight data to Firestore
 * Called automatically 2 seconds after modal opens
 * @param {Object} flightData - Complete flight object from convertLiveAircraftToFlight
 * @returns {Promise<string>} Document ID
 */
export async function saveFlightToFirestore(flightData) {
  try {
    console.log('💾 Saving flight to Firestore:', flightData.flightNumber);

    // Generate a unique flight identifier for duplicate detection
    const flightIdentifier = generateFlightIdentifier(flightData);
    
    // Check if this exact flight already exists today
    const existingFlight = await findExistingFlight(flightIdentifier);
    
    if (existingFlight) {
      // Flight clicked before - UPDATE existing record
      console.log('🔄 Updating existing flight:', existingFlight.id);
      await updateExistingFlight(existingFlight.id, flightData);
      return existingFlight.id;
    } else {
      // First time clicking this flight - CREATE new record
      console.log('✨ Creating new flight record');
      const flightDocId = await createNewFlight(flightIdentifier, flightData);
      return flightDocId;
    }
  } catch (error) {
    console.error('❌ Error saving flight to Firestore:', error);
    throw error;
  }
}

/**
 * Generate unique identifier for a flight (to detect duplicates)
 * Format: CALLSIGN-DATE-ROUTE (e.g., "AAL1234-2024-11-20-MIA-SFO")
 */
function generateFlightIdentifier(flightData) {
  // Get today's date in LOCAL timezone (not UTC!)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${day}`; // YYYY-MM-DD in local time
  
  const callsign = (flightData.flightNumber || flightData.liveData.icao24).toUpperCase();
  const route = flightData.route.replace(/\s+/g, '-');
  
  return `${callsign}-${today}-${route}`;
}

/**
 * Check if flight already exists in Firestore today
 * Returns existing flight doc if found, null otherwise
 */
async function findExistingFlight(flightIdentifier) {
  try {
    const flightsRef = collection(db, 'flights');
    const q = query(flightsRef, where('flightId', '==', flightIdentifier));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, data: doc.data() };
    }
    
    return null;
  } catch (error) {
    console.error('Error finding existing flight:', error);
    return null;
  }
}

/**
 * Create NEW flight record in Firestore
 * Matches your exact schema from flight-1, flight-2, etc.
 */
async function createNewFlight(flightIdentifier, flightData) {
  const docId = flightIdentifier.toLowerCase();
  const flightDocRef = doc(db, 'flights', docId);
  
  const flightDoc = {
    // Core identifiers
    flightId: flightIdentifier, // Unique ID for duplicate detection
    flightNumber: flightData.flightNumber,
    route: flightData.route,
    time: flightData.time,
    
    // Flight Details card fields
    airline: flightData.airline,
    aircraft: flightData.aircraft,
    status: flightData.status,
    gate: flightData.gate,
    terminal: flightData.terminal,
    duration: flightData.duration,
    distance: flightData.distance,
    
    // Departure card fields
    departureAirport: enhanceAirportData(flightData.departureAirport),
    boardingTime: flightData.boardingTime,
    
    // Arrival card fields
    arrivalAirport: enhanceAirportData(flightData.arrivalAirport),
    arrivalTime: flightData.arrivalTime,
    
    // Audio recordings (initially empty for live flights)
    audioRecordings: flightData.audioRecordings || [],
    
    // Metadata
    enrichmentSource: flightData.enrichmentSource || "Live Data",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    clickCount: 1
  };
  
  await setDoc(flightDocRef, flightDoc);
  console.log('✅ Flight saved with ID:', docId);
  
  // Also save initial position snapshot to aircraft_positions
  if (flightData.liveData) {
    await savePositionSnapshot(docId, flightData); // ✅ Use docId instead
  }
  
  return docId;
}

/**
 * UPDATE existing flight record (2nd, 3rd, etc. click on same flight)
 * Updates: live position, status, click count
 */
async function updateExistingFlight(docId, flightData) {
  const flightRef = doc(db, 'flights', docId);
  
  // Get current click count
  const flightDoc = await getDoc(flightRef);
  const currentClickCount = flightDoc.data().clickCount || 1;
  
  const updates = {
    // Update status (might change from "En Route" to "Arriving")
    status: flightData.status,
    
    // Update times (in case they changed)
    boardingTime: flightData.boardingTime,
    arrivalTime: flightData.arrivalTime,
    
    // Increment click count
    clickCount: currentClickCount + 1,
    
    // Update timestamp
    updatedAt: serverTimestamp()
  };
  
  await updateDoc(flightRef, updates);
  console.log('✅ Flight updated:', docId, `(click #${currentClickCount + 1})`);
  
  // Save new position snapshot each time
  if (flightData.liveData) {
    await savePositionSnapshot(docId, flightData);
  }
}

/**
 * Save position snapshot to aircraft_positions collection
 * Creates a new document each time (for tracking movement history)
 * Matches your schema: aircraft-fc567-001, aircraft-sw1234-001, etc.
 */
async function savePositionSnapshot(flightDocId, flightData) {
  try {
    // Create readable position ID: callsign-timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -1); // Remove trailing Z
    const callsign = (flightData.flightNumber || flightData.liveData.icao24).toLowerCase();
    const positionId = `${callsign}-${timestamp}`;
    
    const positionDocRef = doc(db, 'aircraft_positions', positionId);
    
    const positionDoc = {
      // Link to parent flight
      flightId: flightDocId,
      
      // Aircraft identification
      aircraftId: flightData.liveData.icao24.toUpperCase(),
      callsign: flightData.flightNumber || flightData.liveData.icao24.toUpperCase(),
      
      // Position data (matching your schema exactly)
      latitude: flightData.liveData.latitude,
      longitude: flightData.liveData.longitude,
      altitude: Math.round(flightData.liveData.altitude), // meters
      speed: Math.round(flightData.liveData.velocity * 1.94384), // knots
      heading: Math.round(flightData.liveData.heading || 0),
      verticalRate: Math.round(flightData.liveData.vertical_rate || 0),
      onGround: flightData.liveData.on_ground || false,
      
      // Squawk (not in live data, set default)
      squawk: "0000", // OpenSky doesn't provide this
      
      // Timestamp
      timestamp: serverTimestamp()
    };
    
    await setDoc(positionDocRef, positionDoc);
    console.log('📍 Position snapshot saved for:', positionDoc.callsign);
  } catch (error) {
    console.error('Error saving position snapshot:', error);
    // Don't throw - position save failure shouldn't block flight save
  }
}

/**
 * BONUS: Save airport location to 'locations' collection
 * Call this once per airport to build your locations database
 */
export async function saveAirportLocation(airportData) {
  try {
    const airportCode = airportData.code.toLowerCase();
    const locationDocRef = doc(db, 'locations', airportCode); // Use airport code as ID
    
    // Check if airport already exists
    const existingDoc = await getDoc(locationDocRef);
    if (existingDoc.exists()) {
      console.log('📍 Airport already in database:', airportCode);
      return;
    }
    
    const locationDoc = {
      airportCode: airportData.code.toUpperCase(),
      airportName: airportData.name,
      city: airportData.city,
      state: airportData.state || "",
      lat: airportData.lat || 0,
      lng: airportData.lng || 0,
      description: `${airportData.name} (${airportData.code.toUpperCase()})`,
      createdAt: serverTimestamp()
    };
    
    await setDoc(locationDocRef, locationDoc);
    console.log('✅ Airport location saved:', airportCode);
  } catch (error) {
    console.error('Error saving airport location:', error);
  }
}

/**
 * BONUS: Get flight history for analysis
 * Returns all flights for a specific aircraft or route
 */
export async function getFlightHistory(icao24OrCallsign) {
  try {
    const flightsRef = collection(db, 'flights');
    const q = query(
      flightsRef, 
      where('flightNumber', '==', icao24OrCallsign.toUpperCase())
    );
    const querySnapshot = await getDocs(q);
    
    const flights = [];
    querySnapshot.forEach((doc) => {
      flights.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`📊 Found ${flights.length} historical flights for ${icao24OrCallsign}`);
    return flights;
  } catch (error) {
    console.error('Error getting flight history:', error);
    return [];
  }
}

/**
 * BONUS: Get position history for a specific flight
 * Shows how aircraft moved over time
 */
export async function getPositionHistory(flightDocId) {
  try {
    const positionsRef = collection(db, 'aircraft_positions');
    const q = query(positionsRef, where('flightId', '==', flightDocId));
    const querySnapshot = await getDocs(q);
    
    const positions = [];
    querySnapshot.forEach((doc) => {
      positions.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by timestamp (oldest first)
    positions.sort((a, b) => {
      if (!a.timestamp || !b.timestamp) return 0;
      return a.timestamp.seconds - b.timestamp.seconds;
    });
    
    console.log(`📍 Found ${positions.length} position snapshots`);
    return positions;
  } catch (error) {
    console.error('Error getting position history:', error);
    return [];
  }
}

// Export all functions
export default {
  saveFlightToFirestore,
  saveAirportLocation,
  getFlightHistory,
  getPositionHistory
};