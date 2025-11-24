// src/services/simpleFlightLogger.js

const loggedFlights = new Set(); // Track which flights we've already logged

/**
 * Log a single flight detection (callsign + timestamp only)
 */
export async function logFlightDetection(callsign, timestamp = new Date()) {
  try {
    // Skip if already logged this session
    if (loggedFlights.has(callsign)) {
      return;
    }

    const response = await fetch('/api/log-detection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        callsign: callsign.trim(),
        detectedAt: timestamp.toISOString()
      }),
    });

    if (response.ok) {
      loggedFlights.add(callsign);
      console.log(`📝 Logged detection: ${callsign} at ${timestamp.toLocaleTimeString()}`);
    } else {
      console.error('Failed to log flight detection:', response.status);
    }
  } catch (error) {
    console.error('Error logging flight detection:', error);
  }
}

/**
 * Log multiple flight detections at once
 */
export async function logFlightDetections(aircraftList) {
  try {
    // Filter out already-logged flights
    const newFlights = aircraftList.filter(plane => {
      const callsign = plane.callsign?.trim() || plane.icao24;
      return !loggedFlights.has(callsign);
    });

    if (newFlights.length === 0) {
      return; // All flights already logged
    }

    const detections = newFlights.map(plane => ({
      callsign: plane.callsign?.trim() || plane.icao24,
      detectedAt: new Date().toISOString()
    }));

    const response = await fetch('/api/log-detections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ detections }),
    });

    if (response.ok) {
      // Mark all as logged
      newFlights.forEach(plane => {
        const callsign = plane.callsign?.trim() || plane.icao24;
        loggedFlights.add(callsign);
      });
      console.log(`📝 Logged ${newFlights.length} new flight detections`);
    } else {
      console.error('Failed to log flight detections:', response.status);
    }
  } catch (error) {
    console.error('Error logging flight detections:', error);
  }
}

/**
 * Reset logged flights (useful for testing or daily reset)
 */
export function resetLoggedFlights() {
  loggedFlights.clear();
  console.log('🔄 Reset logged flights tracker');
}

/**
 * Get count of logged flights this session
 */
export function getLoggedFlightsCount() {
  return loggedFlights.size;
}
