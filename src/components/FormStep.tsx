import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, AlertCircle, HelpCircle, X, Search, Loader2 } from 'lucide-react';
import type { FlowStep, UploadedFile } from '../types/flow';
import { BAGApiService } from '../utils/bagApi';
import type { BAGAddress } from '../utils/bagApi';

interface FormStepProps {
  step: FlowStep;
  value: any;
  onChange: (value: any) => void;
  onFileUpload?: (files: UploadedFile[]) => void;
  onNext?: () => void;
  isRequired: boolean;
  error?: string;
  formData?: Record<string, any>;
  uploadedFiles?: UploadedFile[];
  isDemoMode?: boolean;
}

export const FormStep: React.FC<FormStepProps> = ({
  step,
  value,
  onChange,
  onFileUpload,
  onNext,
  isRequired,
  error,
  formData,
  uploadedFiles,
  isDemoMode = false
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [bagLoading, setBagLoading] = useState(false);
  const [bagError, setBagError] = useState<string>('');

  // Autocomplete state voor adres
  const [addressSuggestions, setAddressSuggestions] = useState<BAGAddress[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressInput, setAddressInput] = useState(value || '');
  const [addressLoading, setAddressLoading] = useState(false);

  // BAG API integration for building year lookup
  useEffect(() => {
    if (step.id === 'project_bouwjaar' && formData?.project_address && !value) {
      const address = formData.project_address;
      
      // Only proceed if address format is valid and API is available
      if (BAGApiService.isValidAddressFormat(address) && BAGApiService.isApiAvailable()) {
        setBagLoading(true);
        setBagError('');
        
        BAGApiService.getBuildingYear(address)
          .then((buildingYear) => {
            if (buildingYear) {
              onChange(buildingYear);
            }
          })
          .catch((error) => {
            console.error('BAG API lookup failed:', error);
            setBagError('Kon bouwjaar niet automatisch ophalen. Voer handmatig in.');
          })
          .finally(() => {
            setBagLoading(false);
          });
      } else if (!BAGApiService.isApiAvailable()) {
        setBagError('BAG API niet beschikbaar. Voer bouwjaar handmatig in.');
      }
    }
  }, [step.id, formData?.project_address, value, onChange]);

  // Auto-upload demo files when in demo mode
  useEffect(() => {
    if (isDemoMode && step.type === 'file' && !value && onFileUpload) {
      // Create demo files based on step type
      const demoFiles: UploadedFile[] = [];
      
      if (step.id.includes('archief')) {
        demoFiles.push({
          file: new File(['demo archief content'], 'demo-archieftekening.pdf', { type: 'application/pdf' }),
          stepId: step.id,
          name: 'demo-archieftekening.pdf',
          size: 2 * 1024 * 1024, // 2MB
          type: 'application/pdf'
        });
      } else if (step.id.includes('foto')) {
        demoFiles.push({
          file: new File(['demo foto content'], 'demo-foto.jpg', { type: 'image/jpeg' }),
          stepId: step.id,
          name: 'demo-foto.jpg',
          size: 1 * 1024 * 1024, // 1MB
          type: 'image/jpeg'
        });
      } else if (step.id.includes('palenplan')) {
        demoFiles.push({
          file: new File(['demo palenplan content'], 'demo-palenplan.pdf', { type: 'application/pdf' }),
          stepId: step.id,
          name: 'demo-palenplan.pdf',
          size: 1.5 * 1024 * 1024, // 1.5MB
          type: 'application/pdf'
        });
      } else if (step.id.includes('sondering')) {
        demoFiles.push({
          file: new File(['demo sondering content'], 'demo-sondering.cpt', { type: 'application/octet-stream' }),
          stepId: step.id,
          name: 'demo-sondering.cpt',
          size: 512 * 1024, // 512KB
          type: 'application/octet-stream'
        });
      } else {
        // Generic demo file
        demoFiles.push({
          file: new File(['demo content'], 'demo-bestand.pdf', { type: 'application/pdf' }),
          stepId: step.id,
          name: 'demo-bestand.pdf',
          size: 1024 * 1024, // 1MB
          type: 'application/pdf'
        });
      }
      
      onFileUpload(demoFiles);
      onChange(demoFiles);
    }
  }, [isDemoMode, step.type, step.id, value, onFileUpload, onChange]);

  // Suggesties ophalen bij typen
  useEffect(() => {
    if (step.id === 'project_address' && addressInput && addressInput.length > 3) {
      setAddressLoading(true);
      // Fallback: alles als zoekterm
      const zoekterm = encodeURIComponent(addressInput);
      fetch(`https://api.bag.kadaster.nl/lvbag/individuelebevragingen/v2/adressen?zoekterm=${zoekterm}&page=1&pageSize=5`, {
        headers: {
          'X-Api-Key': import.meta.env.VITE_BAG_API_KEY,
          'Accept': 'application/hal+json',
        }
      })
        .then(res => res.json())
        .then(data => {
          setAddressSuggestions(data._embedded?.adressen || []);
          setShowSuggestions(true);
        })
        .catch(() => setAddressSuggestions([]))
        .finally(() => setAddressLoading(false));
    } else {
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  }, [addressInput, step.id]);

  // Adres selecteren uit suggesties
  const handleAddressSelect = (suggestion: BAGAddress) => {
    const formatted = `${suggestion.openbareRuimteNaam} ${suggestion.huisnummer}${suggestion.huisletter || ''}${suggestion.huisnummertoevoeging || ''}, ${suggestion.postcode}, ${suggestion.woonplaatsNaam}`;
    setAddressInput(formatted);
    setShowSuggestions(false);
    onChange(formatted);
  };

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
      organisatie_naam: 'Organisatie',
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onNext) {
      e.preventDefault();
      onNext();
    }
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
            className="form-input w-full"
            placeholder={step.example || ''}
            required={isRequired}
            onKeyDown={handleKeyPress}
          />
        );

      case 'int':
        return (
          <div className="space-y-2">
            <input
              type="number"
              value={value || ''}
              onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : '')}
              className="form-input w-full"
              placeholder={step.example || ''}
              required={isRequired}
              onKeyDown={handleKeyPress}
            />
            
            {/* BAG API integration for building year */}
            {step.id === 'project_bouwjaar' && formData?.project_address && (
              <div className="flex items-center space-x-2 text-sm">
                {bagLoading ? (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Bouwjaar ophalen uit BAG...</span>
                  </div>
                ) : bagError ? (
                  <div className="flex items-center space-x-2 text-orange-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{bagError}</span>
                  </div>
                ) : value ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Bouwjaar automatisch opgehaald uit BAG</span>
                  </div>
                ) : BAGApiService.isApiAvailable() ? (
                  <div className="flex items-center space-x-2 text-gray-500">
                    <Search className="h-4 w-4" />
                    <span>Bouwjaar wordt automatisch opgehaald</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-gray-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>BAG API niet beschikbaar - handmatig invoeren</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'float':
        return (
          <input
            type="number"
            step="0.01"
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : '')}
            className="form-input w-full"
            placeholder={step.example || ''}
            required={isRequired}
            onKeyDown={handleKeyPress}
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
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // Regular dropdown
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="form-select w-full"
            required={isRequired}
            onKeyDown={handleKeyPress}
          >
            <option value="">Selecteer een optie</option>
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
                onKeyDown={handleKeyPress}
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
                onKeyDown={handleKeyPress}
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
                onKeyDown={handleKeyPress}
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

      case 'address':
        return (
          <div className="relative">
            <input
              type="text"
              value={addressInput}
              onChange={e => {
                setAddressInput(e.target.value);
                setShowSuggestions(true);
              }}
              className="form-input w-full"
              placeholder={step.example || ''}
              required={isRequired}
              autoComplete="off"
              onKeyDown={handleKeyPress}
            />
            {addressLoading && (
              <div className="absolute right-2 top-2"><Loader2 className="h-4 w-4 animate-spin text-primary-600" /></div>
            )}
            {showSuggestions && addressSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded shadow mt-1 max-h-56 overflow-auto">
                {addressSuggestions.map((s) => (
                  <li
                    key={s.nummeraanduidingIdentificatie}
                    className="px-4 py-2 cursor-pointer hover:bg-primary-50 text-sm"
                    onClick={() => handleAddressSelect(s)}
                  >
                    {s.openbareRuimteNaam} {s.huisnummer}{s.huisletter || ''}{s.huisnummertoevoeging || ''}, {s.postcode}, {s.woonplaatsNaam}
                  </li>
                ))}
              </ul>
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
            {/* Only show help button if not in demo mode */}
            {!isDemoMode && (step.help_text || step.example) && (
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
        
        {/* Show help information if: in demo mode OR user clicked help button */}
        {((isDemoMode && (step.help_text || step.example)) || showHelp) && (
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
              {/* Only show close button if not in demo mode */}
              {!isDemoMode && (
                <button
                  type="button"
                  onClick={() => setShowHelp(false)}
                  className="ml-2 text-primary-600 hover:text-primary-800"
                  title="Sluit help"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
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
      
      {/* Enter key hint */}
      {onNext && (step.type === 'string' || step.type === 'int' || step.type === 'float') && (
        <div className="mt-2 text-xs text-gray-500">
          Druk op Enter om door te gaan
        </div>
      )}
      
      {error && (
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
}; 