import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AudioPlayer.css'

export default function AudioPlayer() {
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState([]);
  const [filteredPlaylist, setFilteredPlaylist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null); // null = show all
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [recordingsByDate, setRecordingsByDate] = useState({});

  useEffect(() => {
    const fetchPlaylist = () => {
      fetch('/api/playlist')
        .then(res => {
          if (!res.ok) {
            throw new Error('Backend server is offline');
          }
          return res.json();
        })
        .then(data => {
          setPlaylist(data);
          setLoading(false);
          setBackendError(false);
          
          // Process dates for timeline
          processRecordingDates(data);
        })
        .catch(err => {
          console.error('Error loading playlist:', err);
          setBackendError(true);
          setLoading(false);
        });
    };
    
    fetchPlaylist();
    const interval = setInterval(fetchPlaylist, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Process recording dates and group by day
  const processRecordingDates = async (data) => {
    try {
      const response = await fetch('/api/recording-dates');
      const dateData = await response.json();
      
      // Group recordings by date
      const grouped = {};
      dateData.forEach(item => {
        const date = new Date(item.date).toDateString();
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(item.filename);
      });
      
      setRecordingsByDate(grouped);
      
      // Set date range (past 30 days to today)
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      
      setDateRange({ start, end });
      
    } catch (error) {
      console.error('Error fetching recording dates:', error);
      // Fallback: use current dates
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      setDateRange({ start, end });
    }
  };

  // Filter playlist based on selected date
  useEffect(() => {
    if (!selectedDate) {
      setFilteredPlaylist(playlist);
    } else {
      const filtered = playlist.filter(track => {
        const trackDate = recordingsByDate[selectedDate]?.includes(track.url.split('/').pop());
        return trackDate;
      });
      setFilteredPlaylist(filtered);
    }
  }, [selectedDate, playlist, recordingsByDate]);
  
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [transcriptText, setTranscriptText] = useState('');
  const audioRef = useRef(null);

  useEffect(() => {
    const loadTranscript = async () => {
      const currentTranscript = filteredPlaylist[currentTrack]?.transcript;
      if (currentTranscript) {
        try {
          const response = await fetch(currentTranscript);
          const text = await response.text();
          setTranscriptText(text);
        } catch (error) {
          console.error('Error loading transcript:', error);
          setTranscriptText('Transcript not available.');
        }
      } else {
        setTranscriptText('No transcript available for this recording.');
      }
    };
    
    if (filteredPlaylist.length > 0) {
      loadTranscript();
    }
  }, [currentTrack, filteredPlaylist]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (currentTrack < filteredPlaylist.length - 1) {
        setCurrentTrack(currentTrack + 1);
      } else {
        setIsPlaying(false);
        setCurrentTrack(0);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack, filteredPlaylist.length]);

  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.play();
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [currentTrack, isPlaying]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleTrackSelect = (index) => {
    setCurrentTrack(index);
    setIsPlaying(true);
  };

  const handlePrevious = () => {
    if (currentTrack > 0) {
      setCurrentTrack(currentTrack - 1);
    }
  };

  const handleNext = () => {
    if (currentTrack < filteredPlaylist.length - 1) {
      setCurrentTrack(currentTrack + 1);
    }
  };

  const handleSeek = (e) => {
    const seekTime = (e.target.value / 100) * duration;
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date === selectedDate ? null : date);
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  // Generate array of dates for timeline
  const generateTimelineDates = () => {
    if (!dateRange.start || !dateRange.end) return [];
    
    const dates = [];
    const current = new Date(dateRange.start);
    
    while (current <= dateRange.end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  const timelineDates = generateTimelineDates();

  // Backend Error State
  if (backendError) {
    return (
      <div className="audio-player-page">
        {/* Fixed Navbar */}
        <nav className="audio-navbar">
          <div className="navbar-content">
            <div className="navbar-left">
              <h1 className="navbar-title">ACM</h1>
              <div className="navbar-divider"></div>
              <Link to="/map" className="navbar-btn">
                ← Back to Map
              </Link>
              <button className="navbar-btn" onClick={() => navigate('/settings')}>
                ⚙️ Settings
              </button>
            </div>
          </div>
        </nav>

        <div className="audio-player-container">
          <h1 className="audio-player-title">Audio Player</h1>
          
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h2>Backend Server Offline</h2>
            <p>Unable to connect to the audio server. Please make sure the backend is running.</p>
            <div className="error-details">
              <p><strong>To start the server:</strong></p>
              <code>node server.js</code>
            </div>
            <button 
              className="retry-button"
              onClick={() => window.location.reload()}
            >
              🔄 Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="audio-player-page">
        {/* Fixed Navbar */}
        <nav className="audio-navbar">
          <div className="navbar-content">
            <div className="navbar-left">
              <h1 className="navbar-title">ACM</h1>
              <div className="navbar-divider"></div>
              <Link to="/map" className="navbar-btn">
                ← Back to Map
              </Link>
              <button className="navbar-btn" onClick={() => navigate('/settings')}>
                ⚙️ Settings
              </button>
            </div>
          </div>
        </nav>

        <div className="audio-player-container">
          <h1 className="audio-player-title">Audio Player</h1>
          
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading playlist...</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty Playlist State
  if (playlist.length === 0) {
    return (
      <div className="audio-player-page">
        {/* Fixed Navbar */}
        <nav className="audio-navbar">
          <div className="navbar-content">
            <div className="navbar-left">
              <h1 className="navbar-title">ACM</h1>
              <div className="navbar-divider"></div>
              <Link to="/map" className="navbar-btn">
                ← Back to Map
              </Link>
              <button className="navbar-btn" onClick={() => navigate('/settings')}>
                ⚙️ Settings
              </button>
            </div>
          </div>
        </nav>

        <div className="audio-player-container">
          <h1 className="audio-player-title">Audio Player</h1>
          
          <div className="empty-state">
            <div className="empty-icon">🎵</div>
            <h2>No Audio Files Found</h2>
            <p>Your playlist is empty. Add some audio files to get started!</p>
            <div className="empty-instructions">
              <p><strong>To add audio files:</strong></p>
              <ol>
                <li>Place .mp3 or .WAV files in the <code>public/audio</code> folder</li>
                <li>Optionally add .txt transcripts with matching filenames</li>
                <li>Refresh this page</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="audio-player-page">
      {/* Fixed Navbar */}
      <nav className="audio-navbar">
        <div className="navbar-content">
          <div className="navbar-left">
            <h1 className="navbar-title">ACM</h1>
            <div className="navbar-divider"></div>
            <Link to="/map" className="navbar-btn">
              ← Back to Map
            </Link>
            <button className="navbar-btn" onClick={() => navigate('/settings')}>
              ⚙️ Settings
            </button>
          </div>
        </div>
      </nav>

      <div className="audio-player-container">
        <h1 className="audio-player-title">Audio Player</h1>
        
        {/* Timeline Filter */}
        <div className="timeline-filter-card">
          <div className="timeline-header">
            <h3 className="timeline-title">📅 Recording Timeline (Past 30 Days)</h3>
            {selectedDate && (
              <button onClick={clearDateFilter} className="clear-filter-btn">
                Clear Filter
              </button>
            )}
          </div>
          
          <div className="timeline-container">
            <div className="timeline-scroll">
              {timelineDates.map((date, index) => {
                const dateStr = date.toDateString();
                const hasRecordings = recordingsByDate[dateStr]?.length > 0;
                const isSelected = dateStr === selectedDate;
                
                return (
                  <div 
                    key={index} 
                    className={`timeline-tick ${hasRecordings ? 'has-recordings' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => hasRecordings && handleDateSelect(dateStr)}
                    title={`${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${hasRecordings ? ` - ${recordingsByDate[dateStr].length} recording(s)` : ''}`}
                  >
                    <div className="tick-mark"></div>
                    {hasRecordings && (
                      <div className="recording-indicator">
                        <span className="recording-count">{recordingsByDate[dateStr].length}</span>
                      </div>
                    )}
                    {(index % 5 === 0 || hasRecordings) && (
                      <div className="tick-label">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {selectedDate && (
            <div className="filter-status">
              Showing recordings from: <strong>{new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
              {' '}({filteredPlaylist.length} recording{filteredPlaylist.length !== 1 ? 's' : ''})
            </div>
          )}
        </div>

        <audio ref={audioRef} src={filteredPlaylist[currentTrack]?.url} />

        {/* Now Playing Card */}
        <div className="now-playing-card">
          <h2 className="now-playing-title">Now Playing</h2>
          <p className="current-track-title">
            {filteredPlaylist[currentTrack]?.title}
          </p>

          {/* Progress Bar */}
          <div className="progress-container">
            <input
              type="range"
              min="0"
              max="100"
              value={(currentTime / duration) * 100 || 0}
              onChange={handleSeek}
              className="progress-bar"
            />
            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="controls-container">
            <button
              onClick={handlePrevious}
              disabled={currentTrack === 0}
              className="control-btn"
            >
              ⏮️
            </button>

            <button
              onClick={togglePlayPause}
              className="play-pause-btn"
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>

            <button
              onClick={handleNext}
              disabled={currentTrack === filteredPlaylist.length - 1}
              className="control-btn"
            >
              ⏭️
            </button>
          </div>
        </div>

        {/* Playlist */}
        <div className="playlist-card">
          <h3 className="playlist-title">
            Playlist 
            {selectedDate && ` - ${new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
          </h3>
          <div className="playlist-items">
            {filteredPlaylist.length === 0 ? (
              <div className="empty-filter-message">
                <p>No recordings found for this date.</p>
                <button onClick={clearDateFilter} className="clear-filter-btn">
                  Show All Recordings
                </button>
              </div>
            ) : (
              filteredPlaylist.map((track, index) => (
                <div
                  key={track.id}
                  onClick={() => handleTrackSelect(index)}
                  className={`playlist-item ${currentTrack === index ? 'active' : ''}`}
                >
                  <div className="playlist-item-content">
                    <div className="playlist-item-info">
                      <span className="track-number">#{index + 1}</span>
                      <span className="track-title">{track.title}</span>
                    </div>
                    {currentTrack === index && isPlaying && (
                      <div className="playing-indicator">
                        <div className="playing-bar"></div>
                        <div className="playing-bar"></div>
                        <div className="playing-bar"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Transcript Section */}
        <div className="transcript-card">
          <h3 className="transcript-title">📝 Transcript</h3>
          <div className="transcript-content">
            <div className="transcript-text">
              {transcriptText ? (
                transcriptText.split('\n').map((line, index) => (
                  line.trim() ? <p key={index}>{line}</p> : <div key={index} className="line-break"></div>
                ))
              ) : (
                <p>Loading transcript...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}