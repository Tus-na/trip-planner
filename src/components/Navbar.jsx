import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CalendarDays, Users, Wallet, LayoutDashboard, LogOut } from 'lucide-react';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return null; // Don't show navbar if not logged in
  }

  const navItems = [
    { path: '/events', icon: CalendarDays, label: 'Lịch trình' },
    { path: '/members', icon: Users, label: 'Thành viên' },
    { path: '/expenses', icon: Wallet, label: 'Chi tiêu' },
    { path: '/dashboard', icon: LayoutDashboard, label: 'Thống kê' },
  ];

  return (
    <nav className="bg-blue-600 p-4 text-white shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/events" className="text-2xl font-bold">
          Trip Planner
        </Link>
        <div className="flex items-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-2 text-lg hover:text-blue-200 transition-colors duration-200 ${
                location.pathname === item.path ? 'font-bold text-blue-100' : ''
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
          <div className="relative group">
            <button className="flex items-center space-x-2 text-lg hover:text-blue-200 transition-colors duration-200">
              <img
                src={currentUser.avatar_url || `https://ui-avatars.com/api/?name=${currentUser.full_name || 'User'}&background=0D8ABC&color=fff`}
                alt="Avatar"
                className="h-8 w-8 rounded-full border-2 border-white"
              />
              <span>{currentUser.full_name || 'Người dùng'}</span>
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
              <p className="block px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                {currentUser.role === 'LEAD' ? 'Trưởng đoàn' : 'Thành viên'}
              </p>
              <button
                onClick={logout}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;