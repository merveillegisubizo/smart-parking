import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

// Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import ParkingSlots from './components/parking/ParkingSlots';
import CarEntry from './components/parking/CarEntry';
import CarExit from './components/parking/CarExit';
import Reports from './components/reports/Reports';
import Payments from './components/payments/Payments';
import Layout from './components/layout/Layout';

// Set axios defaults
axios.defaults.baseURL = 'http://localhost:5000';
axios.defaults.withCredentials = true;

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await axios.get('/api/user');
        setUser(data.user);
      } catch (error) {
        console.error('Not authenticated');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Logout function
  const handleLogout = async () => {
    try {
      await axios.post('/api/logout');
      setUser(null);
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

    if (!user) {
      return <Navigate to="/login" />;
    }

    return <Layout user={user} onLogout={handleLogout}>{children}</Layout>;
  };

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />

      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/parking-slots" element={<ProtectedRoute><ParkingSlots /></ProtectedRoute>} />
      <Route path="/car-entry" element={<ProtectedRoute><CarEntry /></ProtectedRoute>} />
      <Route path="/car-exit" element={<ProtectedRoute><CarExit /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
