import React from 'react';
import packageJson from '../../package.json';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  isDemoMode?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  title = "Constructieve Quickscan Optoppen", 
  subtitle = "CCS Research & Development",
  isDemoMode = false 
}) => {
  const handleLogoClick = () => {
    // Navigate to home page
    window.location.href = '/';
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex-1 flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={handleLogoClick}
              className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
            >
              <img 
                src="/logo/logo sign.svg" 
                alt="CCS Logo" 
                className="h-6 w-auto sm:h-8"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
                  {title}
                </h1>
                <p className="text-xs text-gray-500 text-left sm:text-left">
                  {subtitle}
                </p>
              </div>
            </button>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            {isDemoMode && (
              <div className="bg-yellow-100 text-yellow-800 px-2 sm:px-3 py-1 rounded-full text-xs font-medium">
                Demo Mode
              </div>
            )}
            <div className="text-xs text-gray-500 hidden sm:block">
              v{packageJson.version}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}; 