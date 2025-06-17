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
  downloadUrl?: string;
  folderName?: string;
  uploadedFiles?: number;
  totalSize?: number;
  error?: string;
}

export class PackageService {
  private static readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://your-api-gateway-url.amazonaws.com/dev';

  /**
   * Upload quickscan files to S3 and send email notification
   */
  static async uploadFiles(request: PackageUploadRequest): Promise<PackageUploadResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/upload-package`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('Failed to upload files:', error);
      throw error;
    }
  }

  /**
   * Convert a File to base64 string
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Convert multiple files to base64
   */
  static async filesToBase64(files: File[]): Promise<Array<{ name: string; data: string; type: string; size: number }>> {
    const results = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        data: await this.fileToBase64(file),
        type: file.type,
        size: file.size
      }))
    );
    return results;
  }

  /**
   * Check if the backend service is available
   */
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/upload-package`, {
        method: 'OPTIONS',
      });
      return response.ok;
    } catch (error) {
      console.warn('Backend service not available:', error);
      return false;
    }
  }
} 