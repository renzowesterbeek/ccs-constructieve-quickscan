interface FileUpload {
  name: string;
  data: string; // Base64 encoded file content
  type: string;
  size: number;
  stepId: string;
}

interface PackageUploadRequest {
  files: FileUpload[];
  summary: {
    projectAddress: string;
    buildingYear: string;
    timestamp: string;
    formData: Record<string, any>;
  };
}

interface PackageUploadResponse {
  success: boolean;
  message: string;
  downloadUrls?: Array<{
    name: string;
    url: string;
    size: number;
    type: string;
    stepId: string;
  }>;
  folderName?: string;
  uploadedFiles?: number;
  totalSize?: number;
  error?: string;
}

interface FileDownloadResponse {
  success: boolean;
  downloadUrl?: string;
  fileName?: string;
  expiresIn?: string;
  error?: string;
}

interface FolderListingResponse {
  success: boolean;
  folderName?: string;
  files?: Array<{
    name: string;
    size: number;
    lastModified?: string;
  }>;
  error?: string;
}

export class PackageService {
  private static API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  /**
   * Debug method to log the current API URL and test connection
   */
  static debugConnection(): void {
    console.log('🔍 Debug: API_BASE_URL =', this.API_BASE_URL);
    console.log('🔍 Debug: Environment variable =', import.meta.env.VITE_API_BASE_URL);
    console.log('🔍 Debug: All env vars =', import.meta.env);
    console.log('🔍 Debug: Is using fallback URL?', !import.meta.env.VITE_API_BASE_URL);
  }

  /**
   * Upload quickscan files to S3 and send email notification
   */
  static async uploadFiles(request: PackageUploadRequest): Promise<PackageUploadResponse> {
    try {
      console.log('🚀 Attempting to upload files to:', `${this.API_BASE_URL}/upload-package`);
      
      const response = await fetch(`${this.API_BASE_URL}/upload-package`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('📡 Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Failed to upload files:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Get download URL for a specific file
   */
  static async getFileDownloadUrl(folderName: string, fileName: string): Promise<FileDownloadResponse> {
    try {
      console.log('🔍 Getting download URL for:', `${folderName}/${fileName}`);
      
      const response = await fetch(`${this.API_BASE_URL}/download/${encodeURIComponent(folderName)}/${encodeURIComponent(fileName)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('📡 Download URL response:', data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Failed to get download URL:', error);
      throw error;
    }
  }

  /**
   * List files in a folder
   */
  static async listFolderFiles(folderName: string): Promise<FolderListingResponse> {
    try {
      console.log('📁 Listing files in folder:', folderName);
      
      const response = await fetch(`${this.API_BASE_URL}/files/${encodeURIComponent(folderName)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('📡 Folder listing response:', data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Failed to list folder files:', error);
      throw error;
    }
  }

  /**
   * Download a file using its URL
   */
  static async downloadFile(url: string, fileName: string): Promise<void> {
    try {
      console.log('📥 Downloading file:', fileName);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log('✅ File downloaded successfully:', fileName);
    } catch (error) {
      console.error('❌ Failed to download file:', error);
      throw error;
    }
  }

  /**
   * Download all files from a package
   */
  static async downloadAllFiles(downloadUrls: Array<{ name: string; url: string; size: number; type: string; stepId: string }>): Promise<void> {
    try {
      console.log('📦 Downloading all files:', downloadUrls.length);
      
      for (const file of downloadUrls) {
        try {
          await this.downloadFile(file.url, file.name);
          // Add a small delay between downloads to avoid overwhelming the browser
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`❌ Failed to download ${file.name}:`, error);
          // Continue with other files
        }
      }
      
      console.log('✅ All files downloaded');
    } catch (error) {
      console.error('❌ Failed to download all files:', error);
      throw error;
    }
  }

  /**
   * Convert file to base64
   */
  static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Check if the backend service is available
   */
  static async checkHealth(): Promise<boolean> {
    try {
      console.log('🏥 Health check: Testing connection to:', `${this.API_BASE_URL}/upload-package`);
      
      // Try a simple POST request with minimal data
      const response = await fetch(`${this.API_BASE_URL}/upload-package`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: [],
          summary: {
            projectAddress: 'health-check',
            buildingYear: '2024',
            timestamp: new Date().toISOString(),
            formData: {}
          }
        }),
      });

      console.log('🏥 Health check response status:', response.status);
      
      if (response.status === 400) {
        // 400 is expected for empty files, but means the endpoint is reachable
        console.log('✅ Backend is reachable (400 expected for health check)');
        return true;
      }
      
      return response.ok;
    } catch (error) {
      console.warn('❌ Backend service not available:', error);
      console.warn('❌ Health check error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  }
} 