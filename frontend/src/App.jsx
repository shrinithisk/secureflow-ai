import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import axios from 'axios';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [view, setView] = useState('login'); // login, register, dashboard

  useEffect(() => {
    if (token) {
      setView('dashboard');
    }
  }, [token]);

  const handleLoginSuccess = (userToken, loggedUsername) => {
    setToken(userToken);
    setUsername(loggedUsername);
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken('');
    setUsername('');
    setView('login');
  };

  return (
    <div className="min-h-screen bg-[#070b15]">
      {view === 'login' && (
        <Login 
          onLoginSuccess={handleLoginSuccess} 
        />
      )}
      
      {view === 'dashboard' && (
        <Dashboard 
          username={username} 
          onLogout={handleLogout} 
        />
      )}
    </div>
  );
}

export default App;
