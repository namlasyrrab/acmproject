/**
 * Helper functions for analyzing aircraft callsigns
 */

/**
 * Detect if a callsign appears to be from a commercial airline
 * Based on ICAO airline designator patterns
 */
export function isCommercialCallsign(callsign) {
  if (!callsign) return false;

  const clean = callsign.trim().toUpperCase();

  // Common commercial airline ICAO codes
  const commercialPrefixes = [
    'AAL',  // American Airlines
    'DAL',  // Delta
    'UAL',  // United
    'SWA',  // Southwest
    'JBU',  // JetBlue
    'FFT',  // Frontier
    'NKS',  // Spirit
    'ASA',  // Alaska Airlines
    'HAL',  // Hawaiian Airlines
    'SKW',  // SkyWest
    'ENY',  // Envoy Air
    'ENV',  // Envoy Air (alternative code)
    'CPZ',  // Compass Airlines
    'FDX',  // FedEx
    'UPS',  // UPS
    'ABX',  // ABX Air
    'GTI',  // Atlas Air
    'AJT',  // Amerijet International
    'BAW',  // British Airways
    'DLH',  // Lufthansa
    'AFR',  // Air France
    'KLM',  // KLM
    'ACA',  // Air Canada
    'VOI',  // Volaris
    'VIV',  // VivaAerobus
    'AMX',  // Aeromexico
    'JNY',  // JetNetherlands
    'SVA',  // Riyadh Air
    'UAE',  // Emirates
    'AVA',  // Avianca
    'CMP',  // Copa Airlines
    'THY',  // Turkish Airlines
    'BHS',  // Bahamasair
    'LAN',  // LATAM Airlines
    'TAM',  // LATAM Airlines (Brazil)
    'JTA',  // LATAM Airlines (alternate)
    'ETD',  // Etihad Airways
    'AAY',  // Allegiant Air
    'TVI',  // Tropic Ocean Airways (scheduled seaplane service)
    'CKS',  // Kalitta Air (cargo)
    'ATN',  // Air Transport International (cargo)
    'WWI',  // Western Global Airlines (cargo)
  ];

  // Check if callsign starts with a known commercial prefix
  for (const prefix of commercialPrefixes) {
    if (clean.startsWith(prefix)) {
      return true;
    }
  }

  // Pattern: 3 letters + numbers (e.g., AAL2341, DAL1234)
  // This is the typical ICAO flight number format
  const icaoPattern = /^[A-Z]{3}\d{1,4}[A-Z]?$/;
  if (icaoPattern.test(clean)) {
    return true;
  }

  // If it starts with 'N' followed by numbers, it's likely a tail number (private)
  if (/^N\d/.test(clean)) {
    return false;
  }

  return false;
}

/**
 * Check if an aircraft type is exclusively private/general aviation
 * These aircraft are never used by commercial airlines
 */
export function isPrivateAircraftType(aircraftType) {
  if (!aircraftType) return false;

  const privateTypes = [
    // Single-engine trainers (most common GA)
    'CESSNA 172',
    'CESSNA 182',
    'CESSNA 206',
    'PIPER CHEROKEE',
    'PIPER ARCHER',
    'PIPER WARRIOR',
    'CIRRUS SR20',
    'CIRRUS SR22',

    // Light twins
    'PIPER SENECA',
    'BEECHCRAFT BARON',
    'CESSNA 310',

    // Very light jets (typically private)
    'CESSNA CITATION MUSTANG',

    // Helicopters (unless explicitly commercial)
    'ROBINSON R22',
    'ROBINSON R44',
  ];

  const upperType = aircraftType.toUpperCase();

  // Check for exact matches or partial matches
  return privateTypes.some(type =>
    upperType.includes(type) || type.includes(upperType)
  );
}

/**
 * Format callsign for display
 */
export function formatCallsign(callsign) {
  if (!callsign) return 'Unknown';

  const clean = callsign.trim();

  // If it matches ICAO format (AAL2341), format nicely
  const match = clean.match(/^([A-Z]{2,3})(\d{1,4})([A-Z]?)$/i);
  if (match) {
    const [, airline, number, suffix] = match;
    return `${airline.toUpperCase()} ${number}${suffix.toUpperCase()}`;
  }

  return clean.toUpperCase();
}

/**
 * Get likely airline name from ICAO code
 */
export function getAirlineFromCallsign(callsign) {
  if (!callsign) return null;

  const clean = callsign.trim().toUpperCase();

  const airlineMap = {
    'AAL': 'American Airlines',
    'DAL': 'Delta Air Lines',
    'UAL': 'United Airlines',
    'SWA': 'Southwest Airlines',
    'JBU': 'JetBlue Airways',
    'FFT': 'Frontier Airlines',
    'NKS': 'Spirit Airlines',
    'ASA': 'Alaska Airlines',
    'HAL': 'Hawaiian Airlines',
    'SKW': 'SkyWest Airlines',
    'ENY': 'Envoy Air',
    'ENV': 'Envoy Air',
    'FDX': 'FedEx',
    'UPS': 'UPS Airlines',
    'ABX': 'ABX Air',
    'GTI': 'Atlas Air',
    'AJT': 'Amerijet International',
    'BAW': 'British Airways',
    'DLH': 'Lufthansa',
    'AFR': 'Air France',
    'KLM': 'KLM Royal Dutch Airlines',
    'ACA': 'Air Canada',
    'VOI': 'Volaris',
    'VIV': 'VivaAerobus',
    'AMX': 'Aeromexico',
    'JNY': 'JetNetherlands',
    'SVA': 'Riyadh Air',
    'UAE': 'Emirates',
    'AVA': 'Avianca',
    'CMP': 'Copa Airlines',
    'THY': 'Turkish Airlines',
    'BHS': 'Bahamasair',
    'LAN': 'LATAM Airlines',
    'TAM': 'LATAM Airlines',
    'JTA': 'LATAM Airlines',
    'ETD': 'Etihad Airways',
    'AAY': 'Allegiant Air',
    'TVI': 'Tropic Ocean Airways',
    'WUP': 'Wheels Up',
    'VJA': 'VistaJet',
    'EJA': 'NetJets',
    'SHR': 'Shoreline Aviation',
    'HPJ': 'Hop-A-Jet',
    'JTL': 'Jet Linx',
    'XOJ': 'XOJet',
    'TWY': 'Jet Aviation',
    'FLX': 'FlexJet',
    'CKS': 'Kalitta Air',
    'ATN': 'Air Transport International',
    'WWI': 'Western Global Airlines',
  };

  // Extract airline code (first 3 letters)
  const code = clean.substring(0, 3);
  return airlineMap[code] || null;
}
