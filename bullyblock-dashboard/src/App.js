import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Incidents from './pages/Incidents';
import IncidentDetail from './pages/IncidentDetail';
import Analytics from './pages/Analytics';
import Register from './pages/Register';
import { AuthProvider, AuthContext } from './AuthContext';
import { IncidentsProvider } from './IncidentsContext';
import './App.css';

const App = () => {
  // Prevent browser caching of sensitive pages
  useEffect(() => {
    const setNoCacheHeaders = () => {
      window.history.replaceState(null, null, window.location.href);
    };
    window.addEventListener('popstate', setNoCacheHeaders);

    return () => {
      window.removeEventListener('popstate', setNoCacheHeaders);
    };
  }, []);

  return (
    <AuthProvider>
      <IncidentsProvider> {}
        <Router>
          <div className="App">
            <header className="App-header">
              <Navbar />
            </header>
            <main>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/incidents" element={<PrivateRoute><Incidents /></PrivateRoute>} />
                <Route path="/incidents/:id" element={<PrivateRoute><IncidentDetail /></PrivateRoute>} />
                <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
                <Route path="*" element={<Navigate to="/login" />} />
              </Routes>
            </main>
            <footer>
              <Footer />
            </footer>
          </div>
        </Router>
      </IncidentsProvider>
    </AuthProvider>
  );
};

// PrivateRoute component to handle authentication checks
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default App;