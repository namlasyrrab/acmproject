import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AudioPlayer.css'

export default function AudioPlayer() {
  const [playlist, setPlaylist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);

  useEffect(() => {
    const fetchPlaylist = () => {
      fetch('http://localhost:3001/api/playlist')
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
  
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [transcriptText, setTranscriptText] = useState('');
  const audioRef = useRef(null);

  useEffect(() => {
    const loadTranscript = async () => {
      const currentTranscript = playlist[currentTrack]?.transcript;
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
    
    if (playlist.length > 0) {
      loadTranscript();
    }
  }, [currentTrack, playlist]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (currentTrack < playlist.length - 1) {
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
  }, [currentTrack, playlist.length]);

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
    if (currentTrack < playlist.length - 1) {
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

  // Backend Error State
  if (backendError) {
    return (
      <div className="audio-player-page">
        <div className="audio-player-container">
          {/* Back to Map Button */}
          <Link 
            to="/map" 
            className="back-to-map-btn"
          >
            ← Back to Map
          </Link>

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
        <div className="audio-player-container">
          {/* Back to Map Button */}
          <Link 
            to="/map" 
            className="back-to-map-btn"
          >
            ← Back to Map
          </Link>

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
        <div className="audio-player-container">
          {/* Back to Map Button */}
          <Link 
            to="/map" 
            className="back-to-map-btn"
          >
            ← Back to Map
          </Link>

          <h1 className="audio-player-title">Audio Player</h1>
          
          <div className="empty-state">
            <div className="empty-icon">🎵</div>
            <h2>No Audio Files Found</h2>
            <p>Your playlist is empty. Add some audio files to get started!</p>
            <div className="empty-instructions">
              <p><strong>To add audio files:</strong></p>
              <ol>
                <li>Place .mp3 files in the <code>public/audio</code> folder</li>
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
      <div className="audio-player-container">
        {/* Back to Map Button */}
        <Link 
          to="/map" 
          className="back-to-map-btn"
        >
          ← Back to Map
        </Link>

        <h1 className="audio-player-title">Audio Player</h1>
        
        <audio ref={audioRef} src={playlist[currentTrack]?.url} />

        {/* Now Playing Card */}
        <div className="now-playing-card">
          <h2 className="now-playing-title">Now Playing</h2>
          <p className="current-track-title">
            {playlist[currentTrack]?.title}
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
              disabled={currentTrack === playlist.length - 1}
              className="control-btn"
            >
              ⏭️
            </button>
          </div>
        </div>

        {/* Playlist */}
        <div className="playlist-card">
          <h3 className="playlist-title">Playlist</h3>
          <div className="playlist-items">
            {playlist.map((track, index) => (
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
            ))}
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