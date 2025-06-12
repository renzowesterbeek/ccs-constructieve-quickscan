import React from 'react';
import { ArrowRight } from 'lucide-react';

interface StartScreenProps {
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-brand-light-green py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header with Logo */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <img 
              src="/logo/CCS_Logo.svg" 
              alt="CCS Logo" 
              className="h-20 w-auto"
            />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Constructieve Quickscan Optoppen
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Eerste haalbaarheidsverkenning naar de mogelijkheden voor optopping van na-oorlogse flats
          </p>
        </div>

        {/* Main Info Card */}
        <div className="bg-white rounded-3xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Wat biedt deze quickscan?</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            De quickscan dient als eerste haalbaarheidsverkenning naar de mogelijkheden voor 
            optopping van na-oorlogse flats, uitgevoerd in bewoonde staat. Met minimale kosten 
            toetsen wij of de bestaande hoofddraagconstructie geschikt is voor één of meerdere 
            extra bouwlagen.
          </p>
          <p className="text-lg text-primary-700 font-medium">
            De resultaten vormen een onderbouwde basis voor vervolgonderzoek en verdere besluitvorming.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="bg-white rounded-3xl p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Transparante Prijzen</h3>
              <p className="text-gray-800 text-lg font-medium mb-2">
                €2.500 - €3.000 incl. BTW per gebouw
              </p>
              <p className="text-gray-600 text-sm">
                (indicatief - exacte prijs op basis van project)
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Clusterkorting</h3>
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
        <div className="bg-white rounded-3xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Klaar om te beginnen?
          </h3>
          <p className="text-gray-600 mb-8">
            Start de quickscan en krijg inzicht in de mogelijkheden van uw gebouw.
          </p>
          <button
            onClick={onStart}
            className="w-full bg-brand-dark-green hover:bg-primary-800 text-white font-semibold py-4 px-8 rounded-2xl text-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <span>Start Quickscan</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-gray-500 mt-4">
            Duurt ongeveer 10-15 minuten
          </p>
        </div>

        {/* Partner Footer */}
        <div className="mt-12 pt-8 border-t border-gray-300">
          <div className="text-center mb-6">
            <h4 className="text-lg font-medium text-gray-700 mb-4">Onze Partners</h4>
            <p className="text-sm text-gray-600">
              Samenwerking met ervaren constructeurs voor de beste resultaten
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center justify-items-center">
            <div className="bg-white rounded-2xl p-6 w-full max-w-xs flex items-center justify-center">
              <img 
                src="/logo/everspartners.png" 
                alt="Evers Partners" 
                className="h-12 w-auto object-contain"
              />
            </div>
            
            <div className="bg-white rounded-2xl p-6 w-full max-w-xs flex items-center justify-center">
              <img 
                src="/logo/vanrossum.png" 
                alt="Van Rossum Constructeurs" 
                className="h-12 w-auto object-contain"
              />
            </div>
            
            <div className="bg-white rounded-2xl p-6 w-full max-w-xs flex items-center justify-center">
              <img 
                src="/logo/pieters.png" 
                alt="Pieters Bouwadvies" 
                className="h-12 w-auto object-contain"
              />
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}; 