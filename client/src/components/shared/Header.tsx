import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isAdmin } from '../../utils/authUtils';
import { Menu, X } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">LifeLink</h1>
        </Link>

        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>

        {isMenuOpen && user && (
          <div className="absolute top-full right-4 bg-white border border-gray-200 rounded-lg shadow-lg mt-2 w-48 z-50">
            <div className="p-3 border-b border-gray-200">
              <p className="font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
            <nav className="p-2 space-y-1">
              <Link to="/profile" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm transition-colors">
                Profile
              </Link>
              <Link to="/requests" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm transition-colors">
                Requests
              </Link>
              <Link to="/donors" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm transition-colors">
                Donors
              </Link>
              <Link to="/donations" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm transition-colors">
                My Donations
              </Link>
              
              {/* Admin-only link */}
              {isAdmin(user.role) && (
                <Link 
                  to="/admin" 
                  className="block px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg text-sm font-medium transition-colors border-t border-gray-200 mt-2 pt-2"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Admin Dashboard
                  </span>
                </Link>
              )}
              
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

