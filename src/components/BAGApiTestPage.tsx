import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { BAGApiTest } from './BAGApiTest';
import { Footer } from './Footer';
import { Header } from './Header';
import packageJson from '../../package.json';

interface BAGApiTestPageProps {
  onBack: () => void;
}

export const BAGApiTestPage: React.FC<BAGApiTestPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-white">
      <Header title="BAG API Test" subtitle="CCS" />

      {/* Main content */}
      <main className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <div className="mb-6">
            <button
              onClick={onBack}
              className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-800 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Terug naar Home</span>
            </button>
          </div>

          {/* Page header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              BAG API Test Tool
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Test en configureer de BAG API integratie voor automatische bouwjaar opvraging
            </p>
          </div>

          {/* BAG API Test Component */}
          <div className="max-w-2xl mx-auto">
            <BAGApiTest />
          </div>

          {/* Additional information */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                Over de BAG API
              </h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>
                  De Basisregistratie Adressen en Gebouwen (BAG) API wordt gebruikt om automatisch 
                  het bouwjaar van een gebouw op te halen op basis van het ingevoerde adres.
                </p>
                <p>
                  Dit zorgt voor meer accurate en betrouwbare gegevens in de quickscan, zonder 
                  dat gebruikers handmatig het bouwjaar hoeven in te voeren.
                </p>
                <p>
                  <strong>Let op:</strong> Een geldige API key is vereist om de BAG API te kunnen gebruiken.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}; 