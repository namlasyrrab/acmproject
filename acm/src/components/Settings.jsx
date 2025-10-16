import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import './Settings.css';

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    autoRefresh: true,
    refreshInterval: 30,
    showFlightDetails: true,
    mapStyle: 'standard'
  });
  const [username, setUsername] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // Get username from Firebase auth
  useEffect(() => {
    const user = auth.currentUser;
    if (user && user.email) {
      const emailUsername = user.email.split('@')[0];
      setUsername(emailUsername);
      setUserEmail(user.email);
    }
  }, []);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    alert('Settings saved successfully!');
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert('Logged out successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Error logging out. Please try again.');
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <button className="back-button" onClick={handleBack}>
            ← Back
          </button>
          <h1>Settings</h1>
        </div>

        <div className="settings-content">
          {/* Welcome Section */}
          {username && (
            <div className="welcome-section">
              <h2>👋 Welcome back, {username}!</h2>
              <p className="welcome-message">{userEmail}</p>
            </div>
          )}

          <div className="settings-section">
            <h2>General</h2>
            
            <div className="setting-item">
              <div className="setting-info">
                <label>Enable Notifications</label>
                <p className="setting-description">Receive alerts for flight updates</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Dark Mode</label>
                <p className="setting-description">Use dark theme for the app</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="settings-section">
            <h2>Map Settings</h2>
            
            <div className="setting-item">
              <div className="setting-info">
                <label>Auto Refresh</label>
                <p className="setting-description">Automatically refresh flight data</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.autoRefresh}
                  onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Refresh Interval</label>
                <p className="setting-description">Time between automatic updates (seconds)</p>
              </div>
              <input
                type="number"
                className="setting-input"
                value={settings.refreshInterval}
                onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
                min="10"
                max="300"
                disabled={!settings.autoRefresh}
              />
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Map Style</label>
                <p className="setting-description">Choose map appearance</p>
              </div>
              <select
                className="setting-select"
                value={settings.mapStyle}
                onChange={(e) => handleSettingChange('mapStyle', e.target.value)}
              >
                <option value="standard">Standard</option>
                <option value="satellite">Satellite</option>
                <option value="terrain">Terrain</option>
              </select>
            </div>
          </div>

          <div className="settings-section">
            <h2>Display</h2>
            
            <div className="setting-item">
              <div className="setting-info">
                <label>Show Flight Details</label>
                <p className="setting-description">Display detailed flight information in popups</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.showFlightDetails}
                  onChange={(e) => handleSettingChange('showFlightDetails', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* Account Section - Only shows if user is logged in */}
          {username && (
            <div className="settings-section">
              <h2>Account</h2>
              <div className="account-actions">
                <button className="logout-button" onClick={handleLogout}>
                  🚪 Logout
                </button>
              </div>
            </div>
          )}

          <div className="settings-section">
            <h2>About</h2>
            <div className="about-info">
              <p><strong>App Version:</strong> 1.0.0</p>
              <p><strong>Build:</strong> 2025.10.03</p>
              <p><strong>Developer:</strong> ACM Team</p>
            </div>
          </div>

          <div className="settings-section">
            <h2>Thanks</h2>
            <div className="thanks-info">
              <p>I want to thank the following people for helping out on this project:</p>
              <p>Joshua Castro-Munoz for demo testing the project</p>
              <p>Lorem ipsum</p>
            </div>
          </div>

          <div className="settings-actions">
            <button className="save-button" onClick={handleSave}>
              Save Settings
            </button>
            <button className="reset-button" onClick={() => {
              setSettings({
                notifications: true,
                darkMode: false,
                autoRefresh: true,
                refreshInterval: 30,
                showFlightDetails: true,
                mapStyle: 'standard'
              });
            }}>
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}