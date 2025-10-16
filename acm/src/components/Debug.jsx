import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Link } from 'react-router-dom'

export default function Debug() {
  const [supabaseStatus, setSupabaseStatus] = useState('Checking...')
  const [authStatus, setAuthStatus] = useState('Checking...')
  const [session, setSession] = useState(null)
  const [routesTest, setRoutesTest] = useState({})
  
  useEffect(() => {
    // Check if Supabase client is correctly initialized
    const testSupabase = async () => {
      try {
        if (!supabase) {
          setSupabaseStatus('❌ Supabase client not initialized')
          return
        }
        
        // Check if we can ping Supabase
        const { data, error } = await supabase.from('locations').select('count', { count: 'exact', head: true })
        
        if (error) {
          console.error('Supabase error:', error)
          setSupabaseStatus(`❌ Supabase error: ${error.message}`)
        } else {
          const locationsCount = data || 0
          setSupabaseStatus(`✅ Supabase connected! Found ${locationsCount} locations.`)
        }
      } catch (err) {
        console.error('Supabase error:', err)
        setSupabaseStatus(`❌ Connection error: ${err.message}`)
      }
    }
    
    // Check authentication status
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth error:', error)
          setAuthStatus(`❌ Auth error: ${error.message}`)
        } else if (data.session) {
          setSession(data.session)
          setAuthStatus(`✅ Authenticated as: ${data.session.user.email}`)
        } else {
          setAuthStatus('❌ Not authenticated')
        }
      } catch (err) {
        console.error('Auth check error:', err)
        setAuthStatus(`❌ Auth check failed: ${err.message}`)
      }
    }
    
    // Test route components
    const testRoutes = () => {
      try {
        const routes = {
          app: true,
          login: !!require('../Components/Login').default,
          signup: !!require('../Components/Signup').default,
          mapView: !!require('../Components/MapView').default,
          protectedRoute: !!require('../routes/ProtectedRoute').default
        }
        setRoutesTest(routes)
      } catch (err) {
        console.error('Route test error:', err)
        setRoutesTest({ error: err.message })
      }
    }
    
    testSupabase()
    checkAuth()
    testRoutes()
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
      <h1>React App Debug Page</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h2>Supabase Connection</h2>
        <p><strong>Status:</strong> {supabaseStatus}</p>
        <p><strong>Auth Status:</strong> {authStatus}</p>
        
        {session && (
          <div>
            <h3>Session Info</h3>
            <pre>{JSON.stringify(session, null, 2)}</pre>
          </div>
        )}
      </div>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h2>Route Components</h2>
        <ul>
          {Object.entries(routesTest).map(([name, status]) => (
            <li key={name}>
              {name}: {status === true ? '✅' : '❌'} 
              {typeof status === 'string' && <span> - Error: {status}</span>}
            </li>
          ))}
        </ul>
      </div>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h2>Navigation Test</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/login" style={{ padding: '8px 15px', backgroundColor: '#4285f4', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
            Go to Login
          </Link>
          <Link to="/signup" style={{ padding: '8px 15px', backgroundColor: '#34a853', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
            Go to Signup
          </Link>
          <Link to="/map" style={{ padding: '8px 15px', backgroundColor: '#ea4335', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
            Go to Map (Protected)
          </Link>
        </div>
      </div>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h2>Environment Check</h2>
        <ul>
          <li>React Version: {React?.version || 'Unknown'}</li>
          <li>Running in: {process.env.NODE_ENV || 'Unknown environment'}</li>
          <li>Base URL: {window.location.origin}</li>
        </ul>
      </div>
    </div>
  )
}