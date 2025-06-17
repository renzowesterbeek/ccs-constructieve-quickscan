import React, { useState } from 'react';
import { TestTube, CheckCircle, AlertCircle, Loader2, Info } from 'lucide-react';
import { BAGApiService } from '../utils/bagApi';

export const BAGApiTest: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    buildingYear?: number;
  } | null>(null);
  const [testAddress, setTestAddress] = useState('Dorpsstraat 15, 2631 CR Nootdorp');

  const runTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      // Test if API is available
      if (!BAGApiService.isApiAvailable()) {
        setTestResult({
          success: false,
          message: 'BAG API key not configured. Please add VITE_BAG_API_KEY to your .env file.'
        });
        return;
      }

      // Test with the provided address
      const buildingYear = await BAGApiService.getBuildingYear(testAddress);
      
      if (buildingYear) {
        setTestResult({
          success: true,
          message: `✅ BAG API test successful! Found building year: ${buildingYear}`,
          buildingYear
        });
      } else {
        setTestResult({
          success: false,
          message: '⚠️ BAG API is working but no building year found for this address. This might be normal for some addresses.'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `❌ BAG API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const isApiAvailable = BAGApiService.isApiAvailable();

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-200">
      <div className="flex items-center space-x-2 mb-4">
        <TestTube className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">BAG API Test</h3>
      </div>

      {/* API Status */}
      <div className="mb-4">
        <div className="flex items-center space-x-2">
          {isApiAvailable ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <span className={`text-sm ${isApiAvailable ? 'text-green-600' : 'text-red-600'}`}>
            {isApiAvailable ? 'API Key Configured' : 'API Key Missing'}
          </span>
        </div>
      </div>

      {/* Instructions */}
      {!isApiAvailable && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">To enable BAG API:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Request an API key at: <a href="https://formulieren.kadaster.nl/aanvraag_bag_api_individuele_bevragingen_productie" target="_blank" rel="noopener noreferrer" className="underline">Kadaster BAG API Portal</a></li>
                <li>Create a <code className="bg-blue-100 px-1 rounded">.env</code> file in the project root</li>
                <li>Add: <code className="bg-blue-100 px-1 rounded">VITE_BAG_API_KEY=your_api_key_here</code></li>
                <li>Restart the development server</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Test Address Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Test Address (Dutch format)
        </label>
        <input
          type="text"
          value={testAddress}
          onChange={(e) => setTestAddress(e.target.value)}
          placeholder="Straatnaam 123, 1234 AB Plaatsnaam"
          className="form-input w-full"
          disabled={!isApiAvailable}
        />
        <p className="text-xs text-gray-500 mt-1">
          Example: "Dorpsstraat 15, 2631 CR Nootdorp"
        </p>
      </div>

      {/* Test Button */}
      <button
        onClick={runTest}
        disabled={!isApiAvailable || isTesting}
        className={`w-full py-2 px-4 rounded-2xl font-medium transition-colors duration-200 ${
          isApiAvailable && !isTesting
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isTesting ? (
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Testing BAG API...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <TestTube className="h-4 w-4" />
            <span>Test BAG API</span>
          </div>
        )}
      </button>

      {/* Test Results */}
      {testResult && (
        <div className={`mt-4 p-4 rounded-lg border ${
          testResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start space-x-2">
            {testResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            )}
            <div className="text-sm">
              <p className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                {testResult.message}
              </p>
              {testResult.buildingYear && (
                <p className="text-green-700 mt-1">
                  Building year: <strong>{testResult.buildingYear}</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="mt-4 text-xs text-gray-500">
        <p>This test verifies that your BAG API key is working and can retrieve building year data.</p>
        <p className="mt-1">The BAG API is used to automatically fill in building years based on addresses.</p>
      </div>
    </div>
  );
}; 