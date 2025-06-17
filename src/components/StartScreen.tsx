import React from 'react';
import { ArrowRight } from 'lucide-react';

interface StartScreenProps {
  onStart: () => void;
  isDemoMode?: boolean;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart, isDemoMode = false }) => {
  return (
    <div className="min-h-screen bg-white py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Demo Mode Actief
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    U bevindt zich in demo mode. Alle bestanden worden automatisch gegenereerd en er worden demo gegevens gebruikt. 
                    Dit is bedoeld om de vragenlijst te demonstreren zonder echte bestanden te uploaden.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header with Logo */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img 
              src="/logo/CCS_Logo.svg" 
              alt="CCS Logo" 
              className="h-16 w-auto"
            />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Constructieve Quickscan Optoppen
          </h1>
          
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
            Eerste haalbaarheidsverkenning naar de mogelijkheden voor optopping van na-oorlogse flats
          </p>
        </div>

        {/* Main Info Card */}
        <div className="bg-white rounded-3xl p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Wat biedt deze quickscan?</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            De quickscan dient als eerste haalbaarheidsverkenning naar de mogelijkheden voor 
            optopping van na-oorlogse flats, uitgevoerd in bewoonde staat. Met minimale kosten 
            toetsen wij of de bestaande hoofddraagconstructie geschikt is voor één of meerdere 
            extra bouwlagen.
          </p>
          <p className="text-primary-700 font-medium">
            De resultaten vormen een onderbouwde basis voor vervolgonderzoek en verdere besluitvorming.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="bg-white rounded-3xl p-6 mb-6 border border-gray-200">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Transparante Prijzen</h3>
              <p className="text-gray-800 text-lg font-medium mb-2">
                €3.000 - €4.000 incl. BTW per gebouw
              </p>
              <p className="text-gray-600 text-sm">
                (indicatief - exacte prijs op basis van project)
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Clusterkorting</h3>
              <p className="text-gray-700 mb-2">
                Meerdere gebouwen? Vraag naar onze clusterkorting!
              </p>
              <p className="text-gray-600 text-sm">
                <a href="mailto:contact@creativecitysolutions.com" className="text-primary-600 hover:text-primary-800 transition-colors duration-200">
                  contact@creativecitysolutions.com
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* CTA Card */}
        <div className="bg-white rounded-3xl p-6 text-center border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Klaar om te beginnen?
          </h3>
          <p className="text-gray-600 mb-6">
            Start de quickscan en krijg inzicht in de mogelijkheden van uw gebouw.
          </p>
          <button
            onClick={onStart}
            className="w-full bg-brand-dark-green hover:bg-primary-800 text-white font-semibold py-3 px-6 rounded-2xl text-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <span>Start Quickscan</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-gray-500 mt-3">
            Duurt ongeveer 10-15 minuten
          </p>
        </div>

        {/* Partner Section */}
        <div className="mt-8 pt-6 border-t border-gray-300">
          <div className="text-center mb-4">
            <h4 className="text-lg font-medium text-gray-700 mb-2">Onze Partners</h4>
            <p className="text-sm text-gray-600">
              Samenwerking met ervaren constructeurs voor de beste resultaten
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center justify-items-center">
            <div className="bg-white rounded-2xl p-4 w-full max-w-xs flex items-center justify-center border border-gray-200">
              <img 
                src="/logo/everspartners.png" 
                alt="Evers Partners" 
                className="h-10 w-auto object-contain"
              />
            </div>
            
            <div className="bg-white rounded-2xl p-4 w-full max-w-xs flex items-center justify-center border border-gray-200">
              <img 
                src="/logo/vanrossum.png" 
                alt="Van Rossum Constructeurs" 
                className="h-10 w-auto object-contain"
              />
            </div>
            
            <div className="bg-white rounded-2xl p-4 w-full max-w-xs flex items-center justify-center border border-gray-200">
              <img 
                src="/logo/pieters.png" 
                alt="Pieters Bouwadvies" 
                className="h-10 w-auto object-contain"
              />
            </div>
          </div>
          
          {/* Demo Mode Link */}
          {!isDemoMode && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 mb-2">
                Wilt u eerst de vragenlijst bekijken zonder bestanden te uploaden?
              </p>
              <a 
                href="?demo=true" 
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
              >
                Start Demo Mode
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 