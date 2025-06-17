import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <img 
              src="/logo/logo sign.svg" 
              alt="CCS Logo" 
              className="h-6 w-auto"
            />
            <span className="text-sm text-gray-500">
              © 2025 CCS. Constructieve Quickscan Optoppen.
            </span>
          </div>
          <div className="text-sm text-gray-500">
            <a 
              href="https://creativecitysolutions.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-800 transition-colors duration-200"
            >
              This is a tool by creativecitysolutions.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}; 