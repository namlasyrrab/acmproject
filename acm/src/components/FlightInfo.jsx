import { useParams, Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

export default function FlightInfo() {
  const { flightId } = useParams();
  
  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedAudio, setSelectedAudio] = useState(0);
  const audioRef = useRef(null);
  
  // Flight data - in a real app, this would come from a database
  const flightData = {
    'flight-1': {
      route: "RDU to BCT",
      time: "2:56 PM",
      boardingTime: "2:26 PM",
      arrivalTime: "5:11 PM",
      airline: "SkyWay Express",
      flightNumber: "SW1234",
      aircraft: "Cessna Citation CJ3",
      status: "On Time",
      gate: "A3",
      terminal: "Private Aviation Terminal",
      duration: "2 hours 15 minutes",
      distance: "678 miles",
      departureAirport: {
        code: "RDU",
        name: "Raleigh-Durham International Airport",
        city: "Raleigh",
        state: "North Carolina"
      },
      arrivalAirport: {
        code: "BCT",
        name: "Boca Raton Airport",
        city: "Boca Raton",
        state: "Florida"
      },
      // Audio recordings for this flight
      audioRecordings: [
        {
          id: 1,
          title: "Pre-flight Communications",
          description: "Ground control and taxi instructions",
          // In the future, replace with actual audio file paths
          audioUrl: null, // "path/to/preflight-audio.mp3"
          duration: "2:34",
          timestamp: "2:20 PM"
        },
        {
          id: 2,
          title: "Takeoff Clearance",
          description: "Tower communications for departure",
          audioUrl: null, // "path/to/takeoff-audio.mp3"
          duration: "1:45",
          timestamp: "2:55 PM"
        },
        {
          id: 3,
          title: "En Route Communications",
          description: "Air traffic control during flight",
          audioUrl: null, // "path/to/enroute-audio.mp3"
          duration: "3:12",
          timestamp: "3:30 PM"
        }
      ]
    },
    'flight-2': {
      route: "BCT to MIA",
      time: "4:30 PM",
      boardingTime: "4:00 PM",
      arrivalTime: "5:15 PM",
      airline: "Florida Connect",
      flightNumber: "FC567",
      aircraft: "Pilatus PC-12",
      status: "On Time",
      gate: "B2",
      terminal: "Main Terminal",
      duration: "45 minutes",
      distance: "52 miles",
      departureAirport: {
        code: "BCT",
        name: "Boca Raton Airport",
        city: "Boca Raton",
        state: "Florida"
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
          title: "Departure Clearance",
          description: "Initial clearance and taxi to runway",
          audioUrl: null,
          duration: "1:28",
          timestamp: "4:25 PM"
        },
        {
          id: 2,
          title: "Approach Communications",
          description: "Miami approach and landing clearance",
          audioUrl: null,
          duration: "2:15",
          timestamp: "5:10 PM"
        }
      ]
    },
    'flight-3': {
      route: "BCT to ATL",
      time: "5:15 PM",
      boardingTime: "4:45 PM",
      arrivalTime: "7:10 PM",
      airline: "Southern Airways",
      flightNumber: "SA789",
      aircraft: "Embraer Phenom 300",
      status: "On Time",
      gate: "C1",
      terminal: "Private Aviation Terminal",
      duration: "1 hour 55 minutes",
      distance: "581 miles",
      departureAirport: {
        code: "BCT",
        name: "Boca Raton Airport",
        city: "Boca Raton",
        state: "Florida"
      },
      arrivalAirport: {
        code: "ATL",
        name: "Hartsfield-Jackson Atlanta International Airport",
        city: "Atlanta",
        state: "Georgia"
      },
      audioRecordings: [
        {
          id: 1,
          title: "Ground Operations",
          description: "Ground control and pushback clearance",
          audioUrl: null,
          duration: "2:01",
          timestamp: "5:10 PM"
        },
        {
          id: 2,
          title: "Departure Control",
          description: "Initial climb and route clearance",
          audioUrl: null,
          duration: "1:52",
          timestamp: "5:20 PM"
        },
        {
          id: 3,
          title: "Atlanta Approach",
          description: "Descent and approach to ATL",
          audioUrl: null,
          duration: "4:20",
          timestamp: "7:05 PM"
        }
      ]
    },
    'flight-4': {
      route: "BCT to LGA",
      time: "6:45 PM",
      boardingTime: "6:15 PM",
      arrivalTime: "9:30 PM",
      airline: "East Coast Express",
      flightNumber: "ECE456",
      aircraft: "Bombardier Challenger 350",
      status: "Delayed (7:15 PM)",
      gate: "A5",
      terminal: "Private Aviation Terminal",
      duration: "2 hours 45 minutes",
      distance: "1,070 miles",
      departureAirport: {
        code: "BCT",
        name: "Boca Raton Airport",
        city: "Boca Raton",
        state: "Florida"
      },
      arrivalAirport: {
        code: "LGA",
        name: "LaGuardia Airport",
        city: "New York",
        state: "New York"
      },
      audioRecordings: [
        {
          id: 1,
          title: "Delay Notification",
          description: "Ground control regarding departure delay",
          audioUrl: null,
          duration: "0:45",
          timestamp: "6:50 PM"
        },
        {
          id: 2,
          title: "Revised Clearance",
          description: "Updated departure clearance",
          audioUrl: null,
          duration: "1:33",
          timestamp: "7:10 PM"
        }
      ]
    },
    'flight-5': {
      route: "MCO to BCT",
      time: "7:30 PM",
      boardingTime: "7:00 PM",
      arrivalTime: "8:20 PM",
      airline: "Florida Sky",
      flightNumber: "FS321",
      aircraft: "Beechcraft King Air 350",
      status: "On Time",
      gate: "D4",
      terminal: "Main Terminal",
      duration: "50 minutes",
      distance: "162 miles",
      departureAirport: {
        code: "MCO",
        name: "Orlando International Airport",
        city: "Orlando",
        state: "Florida"
      },
      arrivalAirport: {
        code: "BCT",
        name: "Boca Raton Airport",
        city: "Boca Raton",
        state: "Florida"
      },
      audioRecordings: [
        {
          id: 1,
          title: "Orlando Departure",
          description: "Clearance delivery and taxi instructions",
          audioUrl: null,
          duration: "1:20",
          timestamp: "7:25 PM"
        },
        {
          id: 2,
          title: "BCT Arrival",
          description: "Approach and landing at Boca Raton",
          audioUrl: null,
          duration: "2:05",
          timestamp: "8:15 PM"
        }
      ]
    }
  };
  
  // Get the flight data for the selected flight
  const flight = flightData[flightId];
  
  // Audio player functions
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // For now, we'll just simulate play since we don't have actual audio files
        if (!flight.audioRecordings[selectedAudio].audioUrl) {
          alert('Audio file not available yet. This is a placeholder for future audio recordings.');
          return;
        }
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleAudioSelect = (index) => {
    setSelectedAudio(index);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Update current time
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const updateTime = () => setCurrentTime(audio.currentTime);
      const updateDuration = () => setDuration(audio.duration);
      
      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateDuration);
      audio.addEventListener('ended', () => setIsPlaying(false));
      
      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
        audio.removeEventListener('ended', () => setIsPlaying(false));
      };
    }
  }, [selectedAudio]);
  
  if (!flight) {
    return (
      <div className="flight-not-found">
        <h2>Flight Not Found</h2>
        <p>Sorry, the flight information you requested could not be found.</p>
        <Link to="/map">Return to Map</Link>
      </div>
    );
  }
  
  const currentAudio = flight.audioRecordings[selectedAudio];
  
  return (
    <div className="flight-info-container">
      <div className="flight-header">
        <h1>{flight.route}</h1>
        <div className="flight-time">{flight.time}</div>
        <div className="flight-status">Status: <span className={`status ${flight.status.includes('Delayed') ? 'delayed' : 'on-time'}`}>{flight.status}</span></div>
      </div>
      
      <div className="flight-details">
        <div className="flight-card">
          <h2>Flight Details</h2>
          <table className="details-table">
            <tbody>
              <tr>
                <td>Airline:</td>
                <td>{flight.airline}</td>
              </tr>
              <tr>
                <td>Flight Number:</td>
                <td>{flight.flightNumber}</td>
              </tr>
              <tr>
                <td>Aircraft:</td>
                <td>{flight.aircraft}</td>
              </tr>
              <tr>
                <td>Duration:</td>
                <td>{flight.duration}</td>
              </tr>
              <tr>
                <td>Distance:</td>
                <td>{flight.distance}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="flight-card">
          <h2>Departure</h2>
          <div className="airport-code">{flight.departureAirport.code}</div>
          <div className="airport-name">{flight.departureAirport.name}</div>
          <div className="airport-location">{flight.departureAirport.city}, {flight.departureAirport.state}</div>
          
          <div className="time-info">
            <div className="time-label">Boarding Time:</div>
            <div className="time-value">{flight.boardingTime}</div>
          </div>
          
          <div className="gate-info">
            <span>Terminal: {flight.terminal}</span>
            <span>Gate: {flight.gate}</span>
          </div>
        </div>
        
        <div className="flight-card">
          <h2>Arrival</h2>
          <div className="airport-code">{flight.arrivalAirport.code}</div>
          <div className="airport-name">{flight.arrivalAirport.name}</div>
          <div className="airport-location">{flight.arrivalAirport.city}, {flight.arrivalAirport.state}</div>
          
          <div className="time-info">
            <div className="time-label">Estimated Arrival:</div>
            <div className="time-value">{flight.arrivalTime}</div>
          </div>
        </div>
      </div>

      {/* New Audio Communications Section */}
      <div className="flight-details">
        <div className="flight-card audio-section">
          <h2>🎧 Audio Communications</h2>
          <p className="audio-description">Listen to recorded air traffic control communications for this flight</p>
          
          {/* Audio Recording List */}
          <div className="audio-recordings-list">
            <h3>Available Recordings:</h3>
            {flight.audioRecordings.map((recording, index) => (
              <div 
                key={recording.id} 
                className={`audio-item ${selectedAudio === index ? 'active' : ''}`}
                onClick={() => handleAudioSelect(index)}
              >
                <div className="audio-item-header">
                  <span className="audio-title">{recording.title}</span>
                  <span className="audio-duration">{recording.duration}</span>
                </div>
                <div className="audio-item-details">
                  <span className="audio-description-text">{recording.description}</span>
                  <span className="audio-timestamp">Recorded at {recording.timestamp}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Audio Player */}
          <div className="audio-player">
            <h3>Now Playing: {currentAudio.title}</h3>
            
            {/* Audio element (hidden, for future use) */}
            <audio 
              ref={audioRef} 
              src={currentAudio.audioUrl} 
              style={{ display: 'none' }}
            />
            
            {/* Custom Audio Controls */}
            <div className="audio-controls">
              <button 
                className="play-pause-btn" 
                onClick={togglePlayPause}
                disabled={!currentAudio.audioUrl}
              >
                {isPlaying ? '⏸️' : '▶️'}
              </button>
              
              <div className="audio-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                  ></div>
                </div>
                <div className="time-display">
                  <span>{formatTime(currentTime)}</span>
                  <span>/</span>
                  <span>{currentAudio.duration}</span>
                </div>
              </div>
            </div>
            
            {/* Placeholder message when no audio available */}
            {!currentAudio.audioUrl && (
              <div className="audio-placeholder">
                <p>📡 Audio recording will be available here once uploaded</p>
                <p>File format: MP3, WAV, or OGG</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flight-actions">
        <Link to="/map" className="back-button">Back to Map</Link>
      </div>
    </div>
  );
}