import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, HelpCircle, X } from 'lucide-react';
import type { FlowStep, UploadedFile } from '../types/flow';

interface FormStepProps {
  step: FlowStep;
  value: any;
  onChange: (value: any) => void;
  onFileUpload?: (files: UploadedFile[]) => void;
  isRequired: boolean;
  error?: string;
  formData?: Record<string, any>;
  uploadedFiles?: UploadedFile[];
}

export const FormStep: React.FC<FormStepProps> = ({
  step,
  value,
  onChange,
  onFileUpload,
  isRequired,
  error,
  formData,
  uploadedFiles
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const generateSummary = () => {
    if (!formData || !uploadedFiles) return null;

    const stepLabels: Record<string, string> = {
      project_address: 'Projectadres',
      project_bouwjaar: 'Bouwjaar volgens BAG',
      showstopper_archief_start: 'Originele tekeningen beschikbaar',
      vraag_palenplan: 'Palenplan aanwezig',
      vraag_sondering: 'Sonderingen beschikbaar',
      vraag_schade: 'Zichtbare constructieve schades',
      digital_signature: 'Verantwoordelijke persoon',
      keuze_constructeur: 'Gekozen constructeur'
    };

    const summaryItems = [];

    // Add form data
    Object.entries(formData).forEach(([key, value]) => {
      if (value && stepLabels[key]) {
        let displayValue = value;
        
        // Format boolean values
        if (typeof value === 'boolean') {
          displayValue = value ? 'Ja' : 'Nee';
        }
        
        // Format file arrays
        if (Array.isArray(value) && value.length > 0 && value[0].name) {
          displayValue = `${value.length} bestand(en) geüpload`;
        }

        summaryItems.push({
          label: stepLabels[key],
          value: displayValue
        });
      }
    });

    // Add file count
    if (uploadedFiles.length > 0) {
      summaryItems.push({
        label: 'Totaal geüploade bestanden',
        value: `${uploadedFiles.length} bestand(en)`
      });
    }

    return summaryItems;
  };

  const isImageUrl = (url: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.tif'];
    const lowercaseUrl = url.toLowerCase();
    return imageExtensions.some(ext => lowercaseUrl.endsWith(ext)) || 
           lowercaseUrl.startsWith('data:image/') ||
           lowercaseUrl.includes('image') && (lowercaseUrl.includes('http') || lowercaseUrl.includes('/'));
  };

  const isImageFile = (file: UploadedFile): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    return imageExtensions.includes(fileExt) || file.type.startsWith('image/');
  };

  const createImagePreview = (file: UploadedFile): string => {
    return URL.createObjectURL(file.file);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || !onFileUpload) return;

    const uploadedFiles: UploadedFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file extension
      if (step.allowed_extensions) {
        const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!step.allowed_extensions.includes(fileExt)) {
          continue;
        }
      }
      
      // Validate file size
      if (step.max_mb && file.size > step.max_mb * 1024 * 1024) {
        continue;
      }

      uploadedFiles.push({
        file,
        stepId: step.id,
        name: file.name,
        size: file.size,
        type: file.type
      });
    }

    onFileUpload(uploadedFiles);
    onChange(uploadedFiles);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const renderInput = () => {
    switch (step.type) {
      case 'string':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="form-input"
            placeholder={step.question}
            required={isRequired}
          />
        );

      case 'int':
      case 'float':
        return (
          <input
            type="number"
            step={step.type === 'float' ? 'any' : '1'}
            value={value || ''}
            onChange={(e) => onChange(step.type === 'int' ? parseInt(e.target.value) : parseFloat(e.target.value))}
            className="form-input"
            placeholder={step.question}
            required={isRequired}
          />
        );

      case 'choice':
        // If logos are provided, show as cards with images instead of dropdown
        if (step.logos && step.logos.length > 0) {
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {step.options?.map((option, index) => {
                  const logoUrl = step.logos?.[index];
                  const isSelected = value === option;
                  
                  return (
                    <div
                      key={option}
                      onClick={() => onChange(option)}
                      className={`relative rounded-lg border-2 cursor-pointer transition-all duration-200 p-4 ${
                        isSelected 
                          ? 'border-primary-500 bg-primary-50 shadow-md' 
                          : 'border-gray-300 hover:border-gray-400 hover:shadow-sm'
                      }`}
                    >
                      {logoUrl && (
                        <div className="flex justify-center mb-3">
                          <img 
                            src={logoUrl} 
                            alt={`Logo ${option}`}
                            className="h-16 w-auto object-contain"
                            onError={(e) => {
                              console.warn(`Failed to load logo: ${logoUrl}`);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="text-center">
                        <div className={`font-medium ${isSelected ? 'text-primary-700' : 'text-gray-900'}`}>
                          {option}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="h-5 w-5 text-primary-500" />
                        </div>
                      )}
                      <input
                        type="radio"
                        name={step.id}
                        value={option}
                        checked={isSelected}
                        onChange={() => onChange(option)}
                        className="sr-only"
                        required={isRequired}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
        
        // Fallback to regular dropdown if no logos
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="form-select"
            required={isRequired}
          >
            <option value="">Selecteer een optie...</option>
            {step.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name={step.id}
                checked={value === true}
                onChange={() => onChange(true)}
                className="form-radio"
                required={isRequired}
              />
              <span className="ml-2">Ja</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name={step.id}
                checked={value === false}
                onChange={() => onChange(false)}
                className="form-radio"
                required={isRequired}
              />
              <span className="ml-2">Nee</span>
            </label>
          </div>
        );

      case 'file':
        return (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="text-lg font-medium text-gray-900 mb-2">
                Upload bestanden
              </div>
              <div className="text-sm text-gray-600 mb-4">
                Sleep bestanden hierheen of klik om te selecteren
              </div>
              {step.allowed_extensions && (
                <div className="text-xs text-gray-500 mb-2">
                  Toegestane formaten: {step.allowed_extensions.join(', ')}
                </div>
              )}
              {step.max_mb && (
                <div className="text-xs text-gray-500">
                  Maximale grootte: {step.max_mb} MB
                </div>
              )}
              <input
                type="file"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                id={`file-${step.id}`}
                multiple={step.multiple}
                accept={step.allowed_extensions?.join(',')}
                required={isRequired}
              />
              <label
                htmlFor={`file-${step.id}`}
                className="inline-block mt-4 btn-primary cursor-pointer"
              >
                Selecteer bestanden
              </label>
            </div>
            
            {value && Array.isArray(value) && value.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Geüploade bestanden:</h4>
                
                {/* Show image thumbnails if any images are uploaded */}
                {value.filter((file: UploadedFile) => isImageFile(file)).length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-700">Foto voorbeelden:</h5>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {value
                        .filter((file: UploadedFile) => isImageFile(file))
                        .map((file: UploadedFile, index: number) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-50">
                              <img
                                src={createImagePreview(file)}
                                alt={file.name}
                                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                onLoad={(e) => {
                                  // Clean up previous object URL to prevent memory leaks
                                  const img = e.target as HTMLImageElement;
                                  if (img.src.startsWith('blob:')) {
                                    setTimeout(() => {
                                      // Don't revoke immediately to ensure the image loads
                                    }, 100);
                                  }
                                }}
                              />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <p className="text-xs truncate">{file.name}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                
                {/* Show all files list */}
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">Alle bestanden:</h5>
                  {value.map((file: UploadedFile, index: number) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-green-50 rounded border">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm flex-1">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                      {isImageFile(file) && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          foto
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-red-500">
            Onbekend veldtype: {step.type}
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              {step.question}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            {(step.help_text || step.example) && (
              <button
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="flex items-center text-primary-600 hover:text-primary-800 transition-colors"
                title="Toon help informatie"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            )}
          </div>
        
        {showHelp && (step.help_text || step.example) && (
          <div className="mb-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {step.help_text && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-primary-900 mb-1">Uitleg:</h4>
                    <p className="text-sm text-primary-800">{step.help_text}</p>
                  </div>
                )}
                {step.example && (
                  <div>
                    <h4 className="text-sm font-medium text-primary-900 mb-1">Voorbeeld:</h4>
                    {isImageUrl(step.example) ? (
                      <div className="mt-2">
                        <img 
                          src={step.example} 
                          alt="Voorbeeld afbeelding"
                          className="max-w-full h-auto rounded border shadow-sm"
                          style={{ maxHeight: '200px' }}
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-primary-700 italic">{step.example}</p>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="ml-2 text-primary-600 hover:text-primary-800"
                title="Sluit help"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        
        {/* Show summary for wrapup_confirm step */}
        {step.id === 'wrapup_confirm' && formData && uploadedFiles && (
          <div className="mb-6 p-6 bg-white rounded-3xl border border-gray-200">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Samenvatting van uw gegevens</h4>
            <div className="space-y-3">
              {generateSummary()?.map((item, index) => (
                <div key={index} className="flex justify-between items-start py-2 border-b border-gray-200 last:border-b-0">
                  <span className="text-sm font-medium text-gray-700 flex-1">
                    {item.label}:
                  </span>
                  <span className="text-sm text-gray-900 flex-1 text-right">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded text-sm text-primary-800">
              <strong>Let op:</strong> Controleer alle bovenstaande gegevens zorgvuldig voordat u bevestigt. 
              Onjuiste informatie kan leiden tot verkeerde conclusies in de quickscan.
            </div>
          </div>
        )}
        
        {renderInput()}
      </div>
      
      {error && (
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
}; 