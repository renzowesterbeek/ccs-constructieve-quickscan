import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { QuickScan } from './components/QuickScan';
import packageJson from '../package.json';

function App() {
  const [yamlContent, setYamlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check for demo mode in URL
    const urlParams = new URLSearchParams(window.location.search);
    const demoMode = urlParams.get('demo') === 'true';
    setIsDemoMode(demoMode);

    // Load the YAML file
    fetch('/quickscan_flow.yml')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load flow definition');
        }
        return response.text();
      })
      .then(content => {
        setYamlContent(content);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laden van quickscan definitie...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Fout bij laden</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-3">
              <img 
                src="/logo/CCS_Logo.svg" 
                alt="CCS Logo" 
                className="h-8 w-auto"
              />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Constructieve Quickscan Optoppen
                </h1>
                <p className="text-xs text-gray-500">
                  CCS Engineering
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {isDemoMode && (
                <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">
                  Demo Mode
                </div>
              )}
              <div className="text-xs text-gray-500">
                v{packageJson.version}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="py-6">
        <QuickScan yamlContent={yamlContent} isDemoMode={isDemoMode} />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="text-center text-sm text-gray-500">
            © 2024 CCS Engineering. Constructieve Quickscan Tool.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
