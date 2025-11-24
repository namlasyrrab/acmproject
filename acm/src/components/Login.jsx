import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebaseConfig'
import { useNavigate, Link } from 'react-router-dom'
import { MapContainer, TileLayer } from 'react-leaflet'
import './Auth.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  // Boca Raton Airport coordinates
  const bocaRatonAirport = {
    lat: 26.3785,
    lng: -80.1077
  };

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      console.log('Login successful')
      navigate('/map')
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message)
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
        <h2>Login</h2>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
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
              placeholder="Your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            className="btn-primary"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </div>
      </div>
    </div>
  )
}
