import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateBill from './pages/CreateBill';
import Bills from './pages/Bills';
import Calendar from './pages/Calendar';
import Items from './pages/Items';
import './styles/pages.css';

/**
 * Main App component with routing
 * Routes:
 * - / : Home page (public)
 * - /login : Owner login (public)
 * - /new-bill : Create new bill (public)
 * - /dashboard : Owner dashboard (protected)
 * - /bills : Bills management (protected)
 * - /calendar : Booking calendar (protected)
 * - /items : Manage items & prices (protected)
 */
function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/new-bill" element={<CreateBill />} />

        {/* Protected Routes (Owner Only) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bills"
          element={
            <ProtectedRoute>
              <Bills />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/items"
          element={
            <ProtectedRoute>
              <Items />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
