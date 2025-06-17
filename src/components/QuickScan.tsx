import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, FileText, Download, Upload, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import JSZip from 'jszip';
import { FlowEngine } from '../utils/flowEngine';
import { PackageService } from '../utils/packageService';
import { FormStep } from './FormStep';
import { StartScreen } from './StartScreen';
import type { FlowStep, UploadedFile } from '../types/flow';

interface QuickScanProps {
  yamlContent: string;
  isDemoMode?: boolean;
}

export const QuickScan: React.FC<QuickScanProps> = ({ yamlContent, isDemoMode = false }) => {
  const [flowEngine] = useState(() => new FlowEngine(yamlContent));
  const [currentStep, setCurrentStep] = useState<FlowStep | undefined>();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [terminationReason, setTerminationReason] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState<string>('');

  // Demo data for different steps
  const getDemoData = (stepId: string): any => {
    const demoData: Record<string, any> = {
      project_address: 'Hoofdstraat 123, 1234 AB Amsterdam',
      project_bouwjaar: 1985,
      showstopper_archief_start: 'ja',
      vraag_andere_archieftekeningen: 'ja',
      vraag_palenplan: 'ja',
      vraag_sondering: 'ja',
      vraag_schade: 'geen',
      wrapup_confirm: true,
      digital_signature: 'Demo Gebruiker',
      organisatie_naam: 'Demo Organisatie BV',
      keuze_constructeur: 'Automatische selectie'
    };
    return demoData[stepId];
  };

  useEffect(() => {
    if (isStarted) {
      setCurrentStep(flowEngine.getCurrentStep());
      // Initialize formData with existing values from flowEngine
      setFormData(flowEngine.getFormData());
    }
  }, [flowEngine, isStarted]);

  const handleStart = () => {
    setIsStarted(true);
    setCurrentStep(flowEngine.getCurrentStep());
    setFormData(flowEngine.getFormData());
  };

  const handleValueChange = (value: any) => {
    const stepId = flowEngine.getCurrentStepId();
    flowEngine.setFormData(stepId, value);
    
    // Update React state to trigger re-render
    setFormData((prev: Record<string, any>) => ({
      ...prev,
      [stepId]: value
    }));
    
    setError('');
  };

  const handleFileUpload = (files: UploadedFile[]) => {
    if (isDemoMode) {
      // In demo mode, create fake file entries
      const demoFiles: UploadedFile[] = files.length > 0 ? files : [{
        file: new File(['demo content'], 'demo-file.pdf', { type: 'application/pdf' }),
        stepId: flowEngine.getCurrentStepId(),
        name: 'demo-bestand.pdf',
        size: 1024 * 1024, // 1MB
        type: 'application/pdf'
      }];
      setUploadedFiles(prev => [...prev, ...demoFiles]);
      handleValueChange(demoFiles);
    } else {
      setUploadedFiles(prev => [...prev, ...files]);
    }
  };

  const handleNext = () => {
    if (!flowEngine.canProceed()) {
      if (isDemoMode) {
        // In demo mode, auto-fill with demo data
        const stepId = flowEngine.getCurrentStepId();
        const demoValue = getDemoData(stepId);
        if (demoValue !== undefined) {
          handleValueChange(demoValue);
        }
      } else {
        setError('Dit veld is verplicht');
        return;
      }
    }

    const success = flowEngine.proceedToNext();
    if (success) {
      const nextStep = flowEngine.getCurrentStep();
      if (nextStep?.terminate) {
        setIsCompleted(true);
        setTerminationReason(nextStep.result || 'Onbekende reden van beëindiging');
      } else {
        setCurrentStep(nextStep);
      }
      setError('');
      // Keep formData in sync
      setFormData(flowEngine.getFormData());
    } else {
      setIsCompleted(true);
      setTerminationReason('Quickscan voltooid - alle stappen doorlopen');
    }
  };

  const handlePrevious = () => {
    // Simple previous implementation - in a more complex app,
    // you'd maintain a step history
    const allSteps = flowEngine.getAllSteps();
    const currentIndex = allSteps.findIndex(step => step.id === flowEngine.getCurrentStepId());
    if (currentIndex > 0) {
      const previousStep = allSteps[currentIndex - 1];
      flowEngine.setCurrentStep(previousStep.id);
      setCurrentStep(previousStep);
      setError('');
      // Keep formData in sync
      setFormData(flowEngine.getFormData());
    }
  };

  const generatePackage = async () => {
    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadMessage('Bestanden worden geüpload naar S3...');

    try {
      const formData = flowEngine.getFormData();
      const timestamp = new Date().toISOString();
      const projectAddress = formData.project_address || 'Onbekend_Adres';
      const buildingYear = formData.project_bouwjaar || 'Onbekend_Jaar';
      
      // Check if backend service is available
      const isBackendAvailable = await PackageService.checkHealth();
      
      if (isBackendAvailable) {
        // Upload individual files to S3
        setUploadMessage('Bestanden worden geconverteerd en geüpload...');
        
        // Convert uploaded files to base64
        const fileUploads = await Promise.all(
          uploadedFiles.map(async (uploadedFile) => ({
            name: uploadedFile.name,
            data: await PackageService.fileToBase64(uploadedFile.file),
            type: uploadedFile.type,
            size: uploadedFile.size,
            stepId: uploadedFile.stepId
          }))
        );
        
        const uploadResponse = await PackageService.uploadFiles({
          files: fileUploads,
          summary: {
            projectAddress: formData.project_address || 'Onbekend',
            buildingYear: formData.project_bouwjaar || 'Onbekend',
            timestamp,
            formData
          }
        });

        if (uploadResponse.success) {
          setUploadStatus('success');
          setUploadMessage(`Package succesvol geüpload! ${uploadResponse.uploadedFiles} bestanden (${(uploadResponse.totalSize! / 1024 / 1024).toFixed(2)} MB). Email notificatie verzonden naar renzo@creativecitysolutions.com`);
        } else {
          throw new Error(uploadResponse.error || 'Upload failed');
        }
      } else {
        // Fallback to local ZIP download only
        setUploadMessage('Backend service niet beschikbaar - lokaal ZIP genereren...');
        
        // Create ZIP file locally as fallback
        const zip = new JSZip();
        
        // Add summary JSON to ZIP
        const summary = {
          timestamp,
          projectAddress: formData.project_address,
          buildingYear: formData.project_bouwjaar,
          formData,
          uploadedFiles: uploadedFiles.map(f => ({
            name: f.name,
            size: f.size,
            type: f.type,
            stepId: f.stepId
          }))
        };
        
        zip.file('00_Summary_Quickscan.json', JSON.stringify(summary, null, 2));
        
        // Create a readable summary report
        const readableSummary = generateReadableSummary(formData, uploadedFiles);
        zip.file('01_Samenvatting_Quickscan.txt', readableSummary);
        
        // Add uploaded files with logical names
        const stepNameMapping = {
          upload_archief: '02_Archieftekeningen',
          upload_palenplan: '03_Palenplan',
          upload_sondering: '04_Sonderingen',
          upload_schadefotos: '05_Schadefotos',
          upload_archieffotos: '06_Archief_Fotos',
          upload_structuurtekening: '07_Structuurtekeningen'
        };
        
        // Count files per category for numbering
        const fileCounts: Record<string, number> = {};
        
        for (const uploadedFile of uploadedFiles) {
          const categoryName = stepNameMapping[uploadedFile.stepId as keyof typeof stepNameMapping] || uploadedFile.stepId;
          
          if (!fileCounts[categoryName]) {
            fileCounts[categoryName] = 0;
          }
          fileCounts[categoryName]++;
          
          const fileExtension = uploadedFile.name.split('.').pop() || '';
          const fileName = `${categoryName}_${fileCounts[categoryName]}.${fileExtension}`;
          
          try {
            zip.file(fileName, uploadedFile.file);
          } catch (error) {
            console.warn('Failed to add file to ZIP:', uploadedFile.name, error);
          }
        }
        
        // Generate and download ZIP
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const cleanAddress = projectAddress.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
        const fileName = `Quickscan_${cleanAddress}_${buildingYear}_${timestamp.replace(/[:.]/g, '-')}.zip`;
        
        const zipUrl = URL.createObjectURL(zipBlob);
        const zipLink = document.createElement('a');
        zipLink.href = zipUrl;
        zipLink.download = fileName;
        zipLink.click();
        URL.revokeObjectURL(zipUrl);
        
        setUploadStatus('success');
        setUploadMessage('Package lokaal gedownload als ZIP (backend service niet beschikbaar)');
      }
    } catch (error) {
      console.error('Failed to upload files:', error);
      setUploadStatus('error');
      setUploadMessage(`Fout bij het uploaden van bestanden: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
      
      // Show alert as fallback
      alert('Er is een fout opgetreden bij het uploaden van de bestanden.');
    } finally {
      setIsUploading(false);
    }
  };

  const generateReadableSummary = (formData: Record<string, any>, uploadedFiles: UploadedFile[]): string => {
    const timestamp = new Date().toLocaleString('nl-NL');
    
    return `CONSTRUCTIEVE QUICKSCAN - SAMENVATTING
================================

Gegenereerd op: ${timestamp}
Project: ${formData.project_address || 'Niet opgegeven'}
Bouwjaar: ${formData.project_bouwjaar || 'Niet opgegeven'}

PROJECTGEGEVENS
---------------
Projectadres: ${formData.project_address || 'Niet opgegeven'}
Bouwjaar volgens BAG: ${formData.project_bouwjaar || 'Niet opgegeven'}

ARCHIEF & DOCUMENTEN
--------------------
Originele tekeningen beschikbaar: ${formData.showstopper_archief_start || 'Niet beantwoord'}
Palenplan aanwezig: ${formData.vraag_palenplan || 'Niet beantwoord'}
Sonderingen beschikbaar: ${formData.vraag_sondering || 'Niet beantwoord'}

SCHADES
-------
Zichtbare constructieve schades: ${formData.vraag_schade || 'Niet beantwoord'}

GEÜPLOADE BESTANDEN
-------------------
${uploadedFiles.length > 0 
  ? uploadedFiles.map((file, index) => `${index + 1}. ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) - ${file.stepId}`).join('\n')
  : 'Geen bestanden geüpload'
}

BEVESTIGING
-----------
Informatie volledig en correct: ${formData.wrapup_confirm ? 'Ja' : 'Nee'}
Verantwoordelijke persoon: ${formData.digital_signature || 'Niet opgegeven'}
Organisatie: ${formData.organisatie_naam || 'Niet opgegeven'}

---
Dit bestand is automatisch gegenereerd door de CCS Constructieve Quickscan tool.
Voor vragen: <a href="mailto:contact@creativecitysolutions.com" className="text-primary-600 hover:text-primary-800 transition-colors duration-200">contact@creativecitysolutions.com</a>
`;
  };

  // Show start screen if not started yet
  if (!isStarted) {
    return <StartScreen onStart={handleStart} isDemoMode={isDemoMode} />;
  }

  if (isCompleted) {
    const isTerminated = terminationReason && !terminationReason.includes('voltooid');
    const isSuccessful = !isTerminated;
    
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-2xl mx-auto p-6">
        <div className="text-center space-y-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
            isSuccessful ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <FileText className={`w-8 h-8 ${
              isSuccessful ? 'text-green-600' : 'text-red-600'
            }`} />
          </div>
          
          <div>
            <h2 className={`text-2xl font-bold text-gray-900 mb-2 ${
              isSuccessful ? '' : 'text-red-700'
            }`}>
              {isSuccessful ? 'Quickscan Voltooid!' : 'Quickscan Beëindigd'}
            </h2>
            <p className={`text-gray-600 ${
              isTerminated ? 'text-red-600 font-medium' : ''
            }`}>
              {terminationReason}
            </p>
          </div>

          {isSuccessful && (
            <div className="bg-white rounded-3xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Verzamelde informatie:</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Projectadres:</span> {flowEngine.getFormValue('project_address')}
                </div>
                <div>
                  <span className="font-medium">Bouwjaar:</span> {flowEngine.getFormValue('project_bouwjaar')}
                </div>
                <div>
                  <span className="font-medium">Geüploade bestanden:</span> {uploadedFiles.length}
                </div>
                <div>
                  <span className="font-medium">Ingevulde stappen:</span> {Object.keys(flowEngine.getFormData()).length}
                </div>
              </div>
            </div>
          )}

          {isTerminated && (
            <div className="bg-red-50 rounded-3xl p-6 border border-red-200">
              <h3 className="font-semibold text-red-800 mb-4">Reden van beëindiging:</h3>
              <p className="text-red-700 text-sm leading-relaxed">
                {terminationReason}
              </p>
              <div className="mt-4 p-3 bg-white rounded-lg border border-red-200">
                <p className="text-sm text-gray-600">
                  <strong>Wat nu?</strong> Neem contact op met CCS Engineering voor verdere ondersteuning of om de quickscan opnieuw te starten met aanvullende informatie.
                </p>
              </div>
            </div>
          )}

          {isSuccessful && (
            <div className="space-y-4">
              {/* Upload Status Display */}
              {uploadStatus !== 'idle' && (
                <div className={`rounded-lg p-4 border ${
                  uploadStatus === 'success' ? 'bg-green-50 border-green-200' :
                  uploadStatus === 'error' ? 'bg-red-50 border-red-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    {uploadStatus === 'uploading' && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    )}
                    {uploadStatus === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {uploadStatus === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        uploadStatus === 'success' ? 'text-green-800' :
                        uploadStatus === 'error' ? 'text-red-800' :
                        'text-blue-800'
                      }`}>
                        {uploadMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={generatePackage}
                  disabled={isUploading}
                  className={`inline-flex items-center space-x-2 ${
                    isUploading 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'btn-primary hover:bg-primary-700'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Bezig met uploaden...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload naar S3 & Stuur Email</span>
                    </>
                  )}
                </button>

                {/* Fallback download button */}
                <button
                  onClick={async () => {
                    // Generate and download locally only
                    const formData = flowEngine.getFormData();
                    const timestamp = new Date().toISOString();
                    const projectAddress = formData.project_address || 'Onbekend_Adres';
                    const buildingYear = formData.project_bouwjaar || 'Onbekend_Jaar';
                    const cleanAddress = projectAddress.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
                    const fileName = `Quickscan_${cleanAddress}_${buildingYear}_${timestamp.replace(/[:.]/g, '-')}.zip`;
                    
                    const zip = new JSZip();
                    const summary = {
                      timestamp,
                      projectAddress: formData.project_address,
                      buildingYear: formData.project_bouwjaar,
                      formData,
                      uploadedFiles: uploadedFiles.map(f => ({
                        name: f.name,
                        size: f.size,
                        type: f.type,
                        stepId: f.stepId
                      }))
                    };
                    
                    zip.file('00_Summary_Quickscan.json', JSON.stringify(summary, null, 2));
                    zip.file('01_Samenvatting_Quickscan.txt', generateReadableSummary(formData, uploadedFiles));
                    
                    const stepNameMapping = {
                      upload_archief: '02_Archieftekeningen',
                      upload_palenplan: '03_Palenplan',
                      upload_sondering: '04_Sonderingen',
                      upload_schadefotos: '05_Schadefotos',
                      upload_archieffotos: '06_Archief_Fotos',
                      upload_structuurtekening: '07_Structuurtekeningen'
                    };
                    
                    const fileCounts: Record<string, number> = {};
                    for (const uploadedFile of uploadedFiles) {
                      const categoryName = stepNameMapping[uploadedFile.stepId as keyof typeof stepNameMapping] || uploadedFile.stepId;
                      if (!fileCounts[categoryName]) fileCounts[categoryName] = 0;
                      fileCounts[categoryName]++;
                      const fileExtension = uploadedFile.name.split('.').pop() || '';
                      const zipFileName = `${categoryName}_${fileCounts[categoryName]}.${fileExtension}`;
                      zip.file(zipFileName, uploadedFile.file);
                    }
                    
                    const zipBlob = await zip.generateAsync({ type: 'blob' });
                    const zipUrl = URL.createObjectURL(zipBlob);
                    const zipLink = document.createElement('a');
                    zipLink.href = zipUrl;
                    zipLink.download = fileName;
                    zipLink.click();
                    URL.revokeObjectURL(zipUrl);
                  }}
                  className="btn-secondary inline-flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Alleen Lokaal ZIP Downloaden</span>
                </button>
              </div>

              {/* Info about the process */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Wat gebeurt er?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Bestanden worden direct geüpload naar AWS S3 (geen ZIP)</li>
                  <li>• Georganiseerde mapstructuur in S3 per categorie</li>
                  <li>• Email notificatie wordt verzonden naar renzo@creativecitysolutions.com</li>
                  <li>• Download link wordt gegenereerd (7 dagen geldig)</li>
                  <li>• Veel sneller dan ZIP genereren en uploaden</li>
                </ul>
              </div>
            </div>
          )}

          {isTerminated && (
            <div className="space-y-3">
              <button
                onClick={() => {
                  setIsStarted(false);
                  setIsCompleted(false);
                  setTerminationReason('');
                  setUploadedFiles([]);
                  setFormData({});
                }}
                className="btn-secondary inline-flex items-center space-x-2"
              >
                <span>Opnieuw Starten</span>
              </button>
              <div className="text-sm text-gray-500">
                <a href="mailto:contact@creativecitysolutions.com" className="text-primary-600 hover:text-primary-800 transition-colors duration-200">
                  contact@creativecitysolutions.com
                </a>
              </div>
            </div>
          )}

          {/* Partner Footer */}
          <div className="mt-12 pt-8 border-t border-gray-300">
            <div className="text-center mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Onze Partners</h4>
            </div>
            
            <div className="flex justify-center items-center space-x-6">
              <img 
                src="/logo/everspartners.png" 
                alt="Evers Partners" 
                className="h-8 w-auto object-contain opacity-70"
              />
              <img 
                src="/logo/vanrossum.png" 
                alt="Van Rossum Constructeurs" 
                className="h-8 w-auto object-contain opacity-70"
              />
              <img 
                src="/logo/pieters.png" 
                alt="Pieters Bouwadvies" 
                className="h-8 w-auto object-contain opacity-70"
              />
            </div>
            
            <div className="text-center mt-6">
              <p className="text-xs text-gray-500">
                © 2024 CCS Engineering. Alle rechten voorbehouden.
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  if (!currentStep) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-2xl mx-auto p-6 text-center">
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  const progress = flowEngine.getProgress();
  const isRequired = flowEngine.isStepRequired();
  const currentValue = formData[currentStep.id];

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-2xl mx-auto p-6">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
          <span>Voortgang</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step title */}
      {currentStep.title && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{currentStep.title}</h2>
        </div>
      )}

      {/* Form step */}
      <div className="mb-8">
        <FormStep
          step={currentStep}
          value={currentValue}
          onChange={handleValueChange}
          onFileUpload={handleFileUpload}
          isRequired={isRequired}
          error={error}
          formData={formData}
          uploadedFiles={uploadedFiles}
          isDemoMode={isDemoMode}
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          className="btn-secondary inline-flex items-center space-x-2"
          disabled={flowEngine.getCurrentStepId() === flowEngine.getAllSteps()[0]?.id}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Vorige</span>
        </button>

        <button
          onClick={handleNext}
          className="btn-primary inline-flex items-center space-x-2"
        >
          <span>Volgende</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Step info */}
      <div className="mt-6 text-center text-sm text-gray-500">
        Stap {flowEngine.getAllSteps().findIndex(s => s.id === currentStep.id) + 1} van {flowEngine.getAllSteps().filter(s => s.type && !s.terminate).length}
      </div>
      </div>
    </div>
  );
}; 