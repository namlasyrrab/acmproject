// src/components/MapNavbar.jsx
import { Link } from 'react-router-dom';

export default function MapNavbar({
  showLiveAircraft,
  setShowLiveAircraft,
  showRadius,
  setShowRadius,
  demoMode,
  setDemoMode,
  searchRadius,
  setSearchRadius,
  apiCallCount
}) {
  return (
    <div style={{
      position: 'sticky',  // ← Add this
      top: 0,              // ← Add this
      zIndex: 1000,
      width: '100%',
      background: 'white',
      padding: '15px 30px',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      display: 'flex',
      gap: '20px',
      alignItems: 'center',
      justifyContent: 'flex-start', // Spread items across
      flexWrap: 'wrap',
      borderBottom: '1px solid #e0e0e0',
    }}>
    {/* Left section - Controls */}
      <div style={{
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        {/* Add this brand section */}
        <div style={{
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: '#e04141',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        }}>
            ✈️ ACM
        </div>
        
        <div style={{
            height: '30px',
            width: '1px',
            backgroundColor: '#e0e0e0'
        }}></div>

        {/* Audio Recordings Link */}
        <Link 
          to="/audio" 
          style={{
            padding: '10px 20px',
            backgroundColor: '#e04141',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.9rem',
            transition: 'background-color 0.3s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#c63030'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#e04141'}
        >
          🎧 Audio
        </Link>

        {/* Settings Link */}
        <Link 
          to="/settings" 
          style={{
            padding: '10px 20px',
            backgroundColor: '#4285f4',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.9rem',
            transition: 'background-color 0.3s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#3367d6'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#4285f4'}
        >
          ⚙️ Settings
        </Link>
      </div>

        <div style={{
        height: '30px',
        width: '1px',
        backgroundColor: '#e0e0e0'
        }}></div>

      {/* Middle section - Controls */}
      <div style={{
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        {/* Live Aircraft Toggle */}
        <button
          onClick={() => setShowLiveAircraft(!showLiveAircraft)}
          style={{
            padding: '10px 15px',
            backgroundColor: showLiveAircraft ? '#10b981' : '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          ✈️ Live: {showLiveAircraft ? 'ON' : 'OFF'}
        </button>

        {/* Show Radius Checkbox */}
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          fontSize: '0.9rem',
          cursor: 'pointer',
          whiteSpace: 'nowrap'
        }}>
          <input
            type="checkbox"
            checked={showRadius}
            onChange={(e) => setShowRadius(e.target.checked)}
          />
          Show Radius
        </label>

        {/* Demo Mode Checkbox */}
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          fontSize: '0.9rem',
          cursor: 'pointer',
          whiteSpace: 'nowrap'
        }}>
          <input
            type="checkbox"
            checked={demoMode}
            onChange={(e) => setDemoMode(e.target.checked)}
          />
          🎬 Demo Mode
        </label>

        {/* Search Radius Slider */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          minWidth: '200px'
        }}>
          <label style={{ 
            fontSize: '0.9rem', 
            fontWeight: '600',
            whiteSpace: 'nowrap'
          }}>
            Radius: {searchRadius} km
          </label>
          <input
            type="range"
            min="10"
            max="150"
            step="10"
            value={searchRadius}
            onChange={(e) => setSearchRadius(Number(e.target.value))}
            style={{ width: '120px' }}
          />
        </div>

        {/* API Counter - NOW IN MIDDLE SECTION */}
        <div style={{ 
            padding: '8px 16px', 
            backgroundColor: apiCallCount >= 95 ? '#fee2e2' : apiCallCount >= 80 ? '#fff3cd' : '#f0f9ff',
            borderRadius: '6px',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            border: `2px solid ${apiCallCount >= 95 ? '#ef4444' : apiCallCount >= 80 ? '#f59e0b' : '#3b82f6'}`,
            whiteSpace: 'nowrap'
        }}>
            {apiCallCount >= 95 ? '🚨' : apiCallCount >= 80 ? '⚠️' : '📊'} API: {apiCallCount}/100
        </div>
      </div>
    </div>
  );
}