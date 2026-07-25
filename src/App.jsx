import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

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
            <Route
              path="/"
              element={
                <div className="min-h-screen bg-gray-100 p-8">
                  <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
                    <h1 className="text-3xl font-bold mb-4">Chào mừng, {currentUser.name}!</h1>
                    <p className="text-gray-700 mb-2">Email: {currentUser.email}</p>
                    <p className="text-gray-700 mb-4">Vai trò: <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-sm font-semibold">{currentUser.role}</span></p>
                    <button
                      onClick={logout}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                      Đăng xuất
                    </button>
                    <p className="mt-4 text-gray-600">Đây là trang chính của ứng dụng sau khi đăng nhập.</p>
                    {/* Future content for authenticated users will go here */}
                  </div>
                </div>
              }
            />
            <Route path="/login" element={<Navigate to="/" />} />
            <Route path="/register" element={<Navigate to="/" />} />
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