import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import Login from './components/Login'
import Signup from './components/Signup'
import MapView from './components/MapView'
import FlightInfo from './components/FlightInfo'
import ProtectedRoute from './routes/ProtectedRoute'
import './App.css'
import './components/FlightInfo.css'
import AudioPlayer from './components/AudioPlayer'
import acmLogo from './assets/ACM Logo.png'
import Settings from './components/Settings'
import { useState } from 'react'

// Route info component to show current route
function RouteInfo() {
  const location = useLocation();
  
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      right: '10px',
      padding: '10px',
      background: '#f0f0f0',
      border: '1px solid #ccc',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999 // Make sure it's on top of everything
    }}>
      <p><strong>Current Route:</strong> {location.pathname}</p>
    </div>
  );
}

function Home() {
  const [clickCount, setClickCount] = useState(0);
  const [showPopup, setShowPopup] = useState(false);

  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    // Check if it's 41 or 67 clicks
    if (newCount === 41 || newCount === 67) {
      setShowPopup(true);
      // Don't reset counter here anymore
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    // Counter continues from where it was
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <h1>ACM Home</h1>
        <p className="tagline">Welcome to ACM. Please log in or sign up to continue.</p>
        <div className="home-links">
          <a href="/login">Login</a>
          <a href="/signup">Sign Up</a>
        </div>
        
        {/* Clickable Logo */}
        <img 
          src={acmLogo} 
          className="image-logo" 
          alt="ACM Logo" 
          onClick={handleLogoClick}
          style={{ cursor: 'pointer' }}
        />
        
        {/* Click Counter Display */}
        {clickCount > 0 && (
          <div className="click-counter">
            Clicks: {clickCount}
          </div>
        )}
        
        {/* Settings Button */}
        <Link 
          to="/settings"
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            padding: '12px 24px',
            backgroundColor: '#4285f4',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 1000,
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#3367d6';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(66, 133, 244, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#4285f4';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
          }}
        >
          ⚙️ Settings
        </Link>
      </div>

      {/* Easter Egg Popup */}
      {showPopup && (
        <div 
          className="easter-egg-overlay"
          onClick={closePopup}
        >
          <div 
            className="easter-egg-popup"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>🎉 Haha funny number 🎉</h2>
            <p>You found the secret!</p>
            <button 
              className="close-easter-egg"
              onClick={closePopup}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/audio" element={<AudioPlayer />} />
        <Route path="/settings" element={<Settings />} />
        <Route 
          path="/map" 
          element={
            <ProtectedRoute>
              <MapView />
            </ProtectedRoute>
          }
        />
        {/* New route for flight information */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      
      {/* Add the RouteInfo component outside of Routes so it appears on every page */}
      <RouteInfo />
    </>
  );
}

export default App;