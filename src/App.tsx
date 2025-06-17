import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { QuickScan } from './components/QuickScan';
import { BAGApiTestPage } from './components/BAGApiTestPage';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import packageJson from '../package.json';

function App() {
  const [yamlContent, setYamlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [autoStartDemo, setAutoStartDemo] = useState(false);

  useEffect(() => {
    // Check for demo mode in URL
    const urlParams = new URLSearchParams(window.location.search);
    const demoMode = urlParams.get('demo') === 'true';
    setIsDemoMode(demoMode);
    
    // If demo mode is detected, set auto-start flag
    if (demoMode) {
      setAutoStartDemo(true);
    }

    // Listen for URL changes
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);

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

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
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

  // Render BAG API Test page
  if (currentPath === '/bag-test-api') {
    return <BAGApiTestPage onBack={() => window.location.href = '/'} />;
  }

  // Render main app with QuickScan
  return (
    <div className="min-h-screen bg-white">
      <Header isDemoMode={isDemoMode} />

      {/* Main content */}
      <main className="py-6">
        <QuickScan 
          yamlContent={yamlContent} 
          isDemoMode={isDemoMode} 
          autoStartDemo={autoStartDemo}
        />
      </main>

      <Footer />
    </div>
  );
}

export default App;
