import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { subscribeToAuthState } from '../services/authService';

/**
 * ProtectedRoute component - ensures only authenticated users can access owner routes
 * @param {object} props - Component props
 * @param {React.Component} props.children - Component to render if authenticated
 * @returns {React.Component} Protected component or redirect to login
 */
export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = subscribeToAuthState((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  // If user is authenticated, render the component
  if (user) {
    return children;
  }

  // Otherwise redirect to login
  return <Navigate to="/login" replace />;
}
