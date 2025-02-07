import React, { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Incidents from './pages/Incidents';
import Analytics from './pages/Analytics';
import Register from './pages/Register';
import { AuthProvider, AuthContext } from './AuthContext';
import './App.css';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <header className="App-header">
            <Navbar />
          </header>
          <main> {}
            <Routes>
              <Route path="/login" element={<Login />} />
              { /* TODO -- Reinsert commented private route before deployment */ }
              <Route path="/dashboard" element={<Dashboard /*{<PrivateRoute><Dashboard /></PrivateRoute>}*/ />} />
              <Route path="/incidents" element={<Incidents /*{<PrivateRoute><Incidents /></PrivateRoute>}*/ />} />
              <Route path="/analytics" element={<Analytics /*{<PrivateRoute><Analytics /></PrivateRoute>}*/ />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </main> {}
          <Footer /> {}
        </div>
      </Router>
    </AuthProvider>
  );
};

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default App;
