import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebaseConfig'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer } from 'react-leaflet'
import './Auth.css'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [passwordErrors, setPasswordErrors] = useState([])
  const navigate = useNavigate()

  // Boca Raton Airport coordinates
  const bocaRatonAirport = {
    lat: 26.3785,
    lng: -80.1077
  };

  // Password validation function
  const validatePassword = (pass) => {
    const errors = []
    
    if (pass.length < 8) {
      errors.push('At least 8 characters')
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) {
      errors.push('At least 1 special character (!@#$%^&*)')
    }
    
    if (!/[A-Z]/.test(pass)) {
      errors.push('At least 1 uppercase letter')
    }
    
    if (!/[a-z]/.test(pass)) {
      errors.push('At least 1 lowercase letter')
    }
    
    if (!/[0-9]/.test(pass)) {
      errors.push('At least 1 number')
    }
    
    return errors
  }

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    
    // Validate password in real-time
    if (newPassword.length > 0) {
      const errors = validatePassword(newPassword)
      setPasswordErrors(errors)
    } else {
      setPasswordErrors([])
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    // Check password requirements before submitting
    const errors = validatePassword(password)
    if (errors.length > 0) {
      setError('Password does not meet all requirements')
      setLoading(false)
      return
    }
    
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      navigate('/map')
    } catch (err) {
      setError(err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Blurred Map Background */}
      <div className="auth-map-background">
        <MapContainer 
          center={[bocaRatonAirport.lat, bocaRatonAirport.lng]} 
          zoom={11} 
          zoomControl={false}
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          touchZoom={false}
          keyboard={false}
          attributionControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer 
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </MapContainer>
      </div>

      <div className="auth-container">
        <h2>Sign Up</h2>
        
        {error && (
          <div className="error">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              id="email"
              type="email" 
              placeholder="Your email" 
              value={email}
              onChange={e => setEmail(e.target.value)} 
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              placeholder="Choose a secure password" 
              value={password}
              onChange={handlePasswordChange} 
              required
            />
            
            {/* Password Requirements Display */}
            {password.length > 0 && (
              <div className="password-requirements">
                <p className="requirements-title">Password must contain:</p>
                <ul>
                  <li className={password.length >= 8 ? 'requirement-met' : 'requirement-unmet'}>
                    {password.length >= 8 ? '✓' : '○'} At least 8 characters
                  </li>
                  <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'requirement-met' : 'requirement-unmet'}>
                    {/[!@#$%^&*(),.?":{}|<>]/.test(password) ? '✓' : '○'} At least 1 special character (!@#$%^&*)
                  </li>
                  <li className={/[A-Z]/.test(password) ? 'requirement-met' : 'requirement-unmet'}>
                    {/[A-Z]/.test(password) ? '✓' : '○'} At least 1 uppercase letter
                  </li>
                  <li className={/[a-z]/.test(password) ? 'requirement-met' : 'requirement-unmet'}>
                    {/[a-z]/.test(password) ? '✓' : '○'} At least 1 lowercase letter
                  </li>
                  <li className={/[0-9]/.test(password) ? 'requirement-met' : 'requirement-unmet'}>
                    {/[0-9]/.test(password) ? '✓' : '○'} At least 1 number
                  </li>
                </ul>
              </div>
            )}
          </div>
          
          <button 
            className="btn-primary" 
            type="submit"
            disabled={loading || passwordErrors.length > 0}
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        
        <div className="auth-footer">
          Already have an account? <a href="/login">Log In</a>
        </div>
      </div>
    </div>
  )
}