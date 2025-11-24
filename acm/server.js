import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json()); // Parse JSON request bodies

// Serve static audio files
app.use('/audios', express.static(path.join(__dirname, 'public/audios')));

// ============================================================================
// FLIGHT LOGGING
// ============================================================================

const LOGS_DIR = path.join(__dirname, 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
  console.log('📁 Created logs directory:', LOGS_DIR);
}

// Get today's log file path
function getTodayLogFile() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(LOGS_DIR, `detections-${today}.json`);
}

// Read existing detections from today's log file
function readTodayDetections() {
  const logFile = getTodayLogFile();
  try {
    if (fs.existsSync(logFile)) {
      const data = fs.readFileSync(logFile, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading log file:', err);
  }
  return { date: new Date().toISOString().split('T')[0], detections: [] };
}

// Write detections to today's log file
function writeTodayDetections(data) {
  const logFile = getTodayLogFile();
  try {
    fs.writeFileSync(logFile, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error('Error writing log file:', err);
    return false;
  }
}

// Log single flight detection
app.post('/api/log-detection', (req, res) => {
  try {
    const { callsign, detectedAt } = req.body;

    if (!callsign) {
      return res.status(400).json({ error: 'Missing callsign' });
    }

    const logData = readTodayDetections();

    // Check if already logged today
    const existing = logData.detections.find(d => d.callsign === callsign);
    if (existing) {
      return res.json({ status: 'already_logged', callsign });
    }

    // Add new detection
    logData.detections.push({
      callsign,
      detectedAt: detectedAt || new Date().toISOString(),
      loggedAt: new Date().toISOString()
    });

    if (writeTodayDetections(logData)) {
      console.log(`📝 Logged detection: ${callsign}`);
      res.json({ status: 'logged', callsign });
    } else {
      res.status(500).json({ error: 'Failed to write log' });
    }
  } catch (err) {
    console.error('Error in log-detection:', err);
    res.status(500).json({ error: err.message });
  }
});

// Log multiple flight detections at once
app.post('/api/log-detections', (req, res) => {
  try {
    const { detections } = req.body;

    if (!detections || !Array.isArray(detections)) {
      return res.status(400).json({ error: 'Missing or invalid detections array' });
    }

    const logData = readTodayDetections();
    const existingCallsigns = new Set(logData.detections.map(d => d.callsign));

    let newCount = 0;
    for (const detection of detections) {
      if (detection.callsign && !existingCallsigns.has(detection.callsign)) {
        logData.detections.push({
          callsign: detection.callsign,
          detectedAt: detection.detectedAt || new Date().toISOString(),
          loggedAt: new Date().toISOString()
        });
        existingCallsigns.add(detection.callsign);
        newCount++;
      }
    }

    if (newCount > 0) {
      if (writeTodayDetections(logData)) {
        console.log(`📝 Logged ${newCount} new detections`);
        res.json({ status: 'logged', count: newCount });
      } else {
        res.status(500).json({ error: 'Failed to write log' });
      }
    } else {
      res.json({ status: 'no_new_detections', count: 0 });
    }
  } catch (err) {
    console.error('Error in log-detections:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get today's detections
app.get('/api/detections', (req, res) => {
  try {
    const logData = readTodayDetections();
    res.json(logData);
  } catch (err) {
    console.error('Error getting detections:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get detections for a specific date
app.get('/api/detections/:date', (req, res) => {
  try {
    const date = req.params.date;
    const logFile = path.join(LOGS_DIR, `detections-${date}.json`);

    if (fs.existsSync(logFile)) {
      const data = fs.readFileSync(logFile, 'utf-8');
      res.json(JSON.parse(data));
    } else {
      res.json({ date, detections: [] });
    }
  } catch (err) {
    console.error('Error getting detections:', err);
    res.status(500).json({ error: err.message });
  }
});

// Enhanced helper function to format filename to better title and metadata
function parseAudioMetadata(filename) {
  // Remove .mp3 extension and flight ID prefix
  // e.g., "flight1-preflight.mp3" -> "preflight"
  // e.g., "flight1-takeoff-clearance.mp3" -> "takeoff clearance"
  const withoutExt = filename.replace(/\.(mp3|wav)$/, '');
  const parts = withoutExt.split('-');
  
  // Remove the flight ID part (e.g., "flight1")
  const titleParts = parts.slice(1);
  
  // Join parts with spaces
  const rawTitle = titleParts.join(' ');
  
  // Mapping of keywords to better titles and descriptions
  const titleMappings = {
    'preflight': {
      title: 'Pre-flight Communications',
      description: 'Ground control and taxi instructions'
    },
    'pre flight': {
      title: 'Pre-flight Communications',
      description: 'Ground control and taxi instructions'
    },
    'takeoff': {
      title: 'Takeoff Clearance',
      description: 'Tower communications for departure'
    },
    'takeoff clearance': {
      title: 'Takeoff Clearance',
      description: 'Tower communications for departure'
    },
    'departure': {
      title: 'Departure Control',
      description: 'Initial climb and route clearance'
    },
    'enroute': {
      title: 'En Route Communications',
      description: 'Air traffic control during flight'
    },
    'en route': {
      title: 'En Route Communications',
      description: 'Air traffic control during flight'
    },
    'approach': {
      title: 'Approach Communications',
      description: 'Descent and approach instructions'
    },
    'landing': {
      title: 'Landing Clearance',
      description: 'Final approach and landing communications'
    },
    'arrival': {
      title: 'Arrival Communications',
      description: 'Approach and landing at destination'
    },
    'ground': {
      title: 'Ground Operations',
      description: 'Ground control and pushback clearance'
    },
    'taxi': {
      title: 'Taxi Instructions',
      description: 'Ground movement and taxi clearance'
    },
    'pushback': {
      title: 'Pushback Clearance',
      description: 'Gate departure and pushback instructions'
    }
  };
  
  // Check if we have a mapping for this audio type
  const lowerTitle = rawTitle.toLowerCase().trim();
  const mapping = titleMappings[lowerTitle];
  
  if (mapping) {
    return mapping;
  }
  
  // Fallback: capitalize each word
  const capitalizedTitle = rawTitle
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return {
    title: capitalizedTitle || 'Recording',
    description: 'Air traffic control communications'
  };
}

// Helper to estimate timestamp based on filename or file creation time
function estimateTimestamp(filename, audioDir) {
  try {
    const filePath = path.join(audioDir, filename);
    const stats = fs.statSync(filePath);
    const time = new Date(stats.birthtime);
    
    // Format as "H:MM AM/PM"
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${displayHours}:${displayMinutes} ${ampm}`;
  } catch (err) {
    return 'N/A';
  }
}

// Audio playlist endpoint
app.get('/api/playlist', (req, res) => {
  const audioDir = path.join(__dirname, 'public/audios');
  
  fs.readdir(audioDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to read directory' });
    }
    
    const audioFiles = files.filter(file => 
      file.endsWith('.mp3') || file.endsWith('.wav')
    );
    
    const playlist = audioFiles.map((file, index) => {
      const baseName = file.replace(/\.(mp3|wav)$/, '');
      const transcriptExists = fs.existsSync(path.join(audioDir, `${baseName}.txt`));
      
      return {
        id: index + 1,
        title: baseName.replace(/-|_/g, ' '),
        url: `/audios/${file}`,
        transcript: transcriptExists ? `/audios/${baseName}.txt` : null
      };
    });
    
    res.json(playlist);
  });
});

// NEW: Get recording dates for timeline
app.get('/api/recording-dates', (req, res) => {
  const audioDir = path.join(__dirname, 'public', 'audios');
  
  try {
    const files = fs.readdirSync(audioDir);
    const audioFiles = files.filter(file => 
      file.endsWith('.mp3') || file.endsWith('.wav')
    );
    
    const recordingDates = audioFiles.map(file => {
      const filePath = path.join(audioDir, file);
      const stats = fs.statSync(filePath);
      
      return {
        filename: file,
        date: stats.birthtime, // File creation time
        size: stats.size
      };
    });
    
    res.json(recordingDates);
  } catch (err) {
    console.error('Error reading recording dates:', err);
    res.status(500).json({ error: 'Unable to read recording dates' });
  }
});

// Flight audio endpoint
app.get('/api/flight/:flightId', (req, res) => {
  const flightId = req.params.flightId;
  const audioDir = path.join(__dirname, 'public', 'audios');
  
  try {
    // Normalize flightId: remove hyphens for file matching
    const normalizedFlightId = flightId.replace(/-/g, '');
    
    console.log(`Looking for files starting with: ${normalizedFlightId}`);
    
    // Find all audio files matching this flight
    const files = fs.readdirSync(audioDir);
    const flightAudios = files
      .filter(file => 
        (file.endsWith('.mp3') || file.endsWith('.wav')) && 
        file.startsWith(normalizedFlightId)
      )
      .map((file, index) => {
        const metadata = parseAudioMetadata(file);
        const timestamp = estimateTimestamp(file, audioDir);
        
        return {
          id: index + 1,
          title: metadata.title,
          description: metadata.description,
          audioUrl: `/audios/${file}`,
          duration: "0:00", // Placeholder - could calculate real duration with a library
          timestamp: timestamp
        };
      });
    
    console.log(`Found ${flightAudios.length} audio files for ${flightId}`);
    
    res.json({
      flightId: flightId,
      audioRecordings: flightAudios
    });
  } catch (err) {
    console.error('Error reading audio directory:', err);
    res.status(500).json({ 
      error: 'Unable to read audio files',
      flightId: flightId,
      audioRecordings: []
    });
  }
});

// NEW: OpenSky API Proxy (to bypass CORS)
app.get('/api/opensky', async (req, res) => {
  try {
    const { lamin, lamax, lomin, lomax } = req.query;
    
    if (!lamin || !lamax || !lomin || !lomax) {
      return res.status(400).json({ 
        error: 'Missing required parameters: lamin, lamax, lomin, lomax' 
      });
    }
    
    console.log(`🛫 Proxying OpenSky request: lat ${lamin}-${lamax}, lon ${lomin}-${lomax}`);
    
    const openSkyUrl = `https://opensky-network.org/api/states/all?` +
      `lamin=${lamin}&lamax=${lamax}&lomin=${lomin}&lomax=${lomax}`;
    
    console.log('🔗 Fetching from:', openSkyUrl);
    
    // Use anonymous access (400 requests/day)
    console.log('⚠️ Using anonymous access (400 requests/day limit)');
    const response = await fetch(openSkyUrl);
    
    if (!response.ok) {
      console.error(`❌ OpenSky API error: ${response.status}`);
      
      if (response.status === 503) {
        return res.status(503).json({ 
          error: 'OpenSky Network is temporarily unavailable',
          message: 'Try again in a few minutes'
        });
      }
      
      if (response.status === 429) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded',
          message: 'Too many requests. Wait before trying again or increase refresh interval'
        });
      }
      
      return res.status(response.status).json({ 
        error: `OpenSky API returned status ${response.status}` 
      });
    }
    
    const data = await response.json();
    console.log(`✅ Retrieved ${data.states?.length || 0} aircraft states (anonymous)`);
    
    res.json(data);
    
  } catch (error) {
    console.error('💥 Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy error',
      message: error.message 
    });
  }
});

app.listen(3001, () => {
  console.log('🚀 Server running on http://localhost:3001');
  console.log('📡 Audio API: http://localhost:3001/api/playlist');
  console.log('✈️  OpenSky Proxy: http://localhost:3001/api/opensky');
  console.log('📝 Flight Logging: http://localhost:3001/api/log-detection');
  console.log('📁 Logs directory:', LOGS_DIR);
});