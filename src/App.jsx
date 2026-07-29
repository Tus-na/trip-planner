import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EventsPage from './pages/EventsPage'; // Import EventsPage
import MembersPage from './pages/MembersPage'; // Import MembersPage

const App = () => {
  const { currentUser, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-lg text-gray-700">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        {currentUser ? (
          <>
            <Route path="/" element={<Navigate to="/events" />} /> {/* Redirect root to events */}
            <Route path="/events" element={<EventsPage />} /> {/* Events page */}
            <Route path="/members" element={<MembersPage />} /> {/* Members page */}
            <Route path="/login" element={<Navigate to="/events" />} />
            <Route path="/register" element={<Navigate to="/events" />} />
          </>
        ) : (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        )}
      </Routes>
    </div>
  );
};

export default App;