import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'eu-west-1' });
const sesClient = new SESClient({ region: process.env.AWS_REGION || 'eu-west-1' });

const S3_BUCKET = process.env.S3_BUCKET || 'ccs-quickscan-packages';
const EMAIL_FROM = process.env.EMAIL_FROM || 'renzo@creativecitysolutions.com';
const EMAIL_TO = process.env.EMAIL_TO || 'renzo@creativecitysolutions.com';

interface FileUpload {
  name: string;
  data: string; // Base64 encoded file content
  type: string;
  size: number;
  stepId: string;
}

interface QuickscanPackage {
  files: FileUpload[];
  summary: {
    projectAddress: string;
    buildingYear: string;
    timestamp: string;
    formData: Record<string, any>;
  };
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Enable CORS
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Content-Type': 'application/json',
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: '',
      };
    }

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { files, summary }: QuickscanPackage = body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing or invalid files array' }),
      };
    }

    if (!summary || !summary.timestamp) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required summary data' }),
      };
    }

    const timestamp = summary.timestamp;
    const projectAddress = summary.projectAddress || 'Onbekend_Adres';
    const buildingYear = summary.buildingYear || 'Onbekend_Jaar';
    
    // Clean project address for folder name
    const cleanAddress = projectAddress.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const folderName = `Quickscan_${cleanAddress}_${buildingYear}_${timestamp}`;

    // Upload files to S3 with organized folder structure
    const uploadedFiles: Array<{ name: string; s3Key: string; size: number; type: string; stepId: string }> = [];
    
    for (const file of files) {
      try {
        // Decode base64 file data
        const fileBuffer = Buffer.from(file.data, 'base64');
        
        // Create organized folder structure
        const stepNameMapping = {
          upload_archief: '01_Archieftekeningen',
          upload_palenplan: '02_Palenplan',
          upload_sondering: '03_Sonderingen',
          upload_schadefotos: '04_Schadefotos',
          upload_archieffotos: '05_Archief_Fotos',
          upload_structuurtekening: '06_Structuurtekeningen',
          upload_buitenfotos: '07_Buitenfotos',
          upload_andere_archief: '08_Andere_Archief',
          upload_alle_overige_archief: '09_Alle_Overige_Archief'
        };
        
        const categoryName = stepNameMapping[file.stepId as keyof typeof stepNameMapping] || file.stepId;
        const s3Key = `packages/${folderName}/${categoryName}/${file.name}`;
        
        const uploadCommand = new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: s3Key,
          Body: fileBuffer,
          ContentType: file.type,
          Metadata: {
            'project-address': String(projectAddress),
            'building-year': String(buildingYear),
            'timestamp': String(timestamp),
            'step-id': String(file.stepId),
            'original-name': String(file.name),
            'file-size': String(file.size),
          },
        });

        await s3Client.send(uploadCommand);
        
        uploadedFiles.push({
          name: file.name,
          s3Key,
          size: file.size,
          type: file.type,
          stepId: file.stepId
        });
        
      } catch (fileError) {
        console.error(`Failed to upload file ${file.name}:`, fileError);
        // Continue with other files
      }
    }

    // Create and upload summary JSON
    const summaryData = {
      timestamp,
      projectAddress: summary.projectAddress,
      buildingYear: summary.buildingYear,
      formData: summary.formData,
      uploadedFiles: uploadedFiles.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
        stepId: f.stepId,
        s3Key: f.s3Key
      }))
    };

    const summaryKey = `packages/${folderName}/00_Summary_Quickscan.json`;
    const summaryCommand = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: summaryKey,
      Body: JSON.stringify(summaryData, null, 2),
      ContentType: 'application/json',
      Metadata: {
        'project-address': String(projectAddress),
        'building-year': String(buildingYear),
        'timestamp': String(timestamp),
        'file-count': String(uploadedFiles.length),
      },
    });

    await s3Client.send(summaryCommand);

    // Generate presigned URL for the summary file (expires in 7 days)
    let downloadUrl = '';
    try {
      const getObjectCommand = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: summaryKey,
      });

      downloadUrl = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 604800 }); // 7 days
    } catch (presignedUrlError) {
      console.warn('Failed to generate presigned URL:', presignedUrlError);
    }

    // Send email notification
    const emailSubject = `Nieuwe Quickscan Package: ${projectAddress || 'Onbekend Adres'}`;
    const emailBody = generateEmailBody(folderName, projectAddress, buildingYear, timestamp, downloadUrl, uploadedFiles);

    const emailCommand = new SendEmailCommand({
      Source: EMAIL_FROM,
      Destination: {
        ToAddresses: [EMAIL_TO],
      },
      Message: {
        Subject: {
          Data: emailSubject,
          Charset: 'UTF-8',
        },
        Body: {
          Text: {
            Data: emailBody,
            Charset: 'UTF-8',
          },
          Html: {
            Data: generateEmailHtml(folderName, projectAddress, buildingYear, timestamp, downloadUrl, uploadedFiles),
            Charset: 'UTF-8',
          },
        },
      },
    });

    await sesClient.send(emailCommand);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Files uploaded and email sent successfully',
        downloadUrl: downloadUrl || 'Presigned URL generation failed, but files uploaded successfully',
        folderName,
        uploadedFiles: uploadedFiles.length,
        totalSize: uploadedFiles.reduce((sum, f) => sum + f.size, 0),
      }),
    };

  } catch (error) {
    console.error('Error processing quickscan files:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

function generateEmailBody(
  folderName: string,
  projectAddress: string,
  buildingYear: string,
  timestamp: string,
  downloadUrl: string,
  uploadedFiles: Array<{ name: string; s3Key: string; size: number; type: string; stepId: string }>
): string {
  const fileCount = uploadedFiles?.length || 0;
  const totalSize = uploadedFiles?.reduce((sum, file) => sum + file.size, 0) || 0;
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);

  // Group files by category
  const filesByCategory: Record<string, string[]> = {};
  uploadedFiles.forEach(file => {
    const stepNameMapping = {
      upload_archief: 'Archieftekeningen',
      upload_palenplan: 'Palenplan',
      upload_sondering: 'Sonderingen',
      upload_schadefotos: 'Schadefotos',
      upload_archieffotos: 'Archief Fotos',
      upload_structuurtekening: 'Structuurtekeningen',
      upload_buitenfotos: 'Buitenfotos',
      upload_andere_archief: 'Andere Archief',
      upload_alle_overige_archief: 'Alle Overige Archief'
    };
    const categoryName = stepNameMapping[file.stepId as keyof typeof stepNameMapping] || file.stepId;
    if (!filesByCategory[categoryName]) {
      filesByCategory[categoryName] = [];
    }
    filesByCategory[categoryName].push(`${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
  });

  const categoryList = Object.entries(filesByCategory)
    .map(([category, files]) => `${category}:\n  ${files.join('\n  ')}`)
    .join('\n\n');

  return `
Nieuwe Quickscan Package Ontvangen

Project: ${folderName}
Projectadres: ${projectAddress || 'Onbekend'}
Bouwjaar: ${buildingYear || 'Onbekend'}
Tijdstip: ${new Date(timestamp).toLocaleString('nl-NL')}

Geüploade bestanden: ${fileCount} bestanden (${totalSizeMB} MB totaal)

Bestanden per categorie:
${categoryList}

${downloadUrl ? `Download link voor summary (geldig voor 7 dagen):
${downloadUrl}` : 'Download link kon niet worden gegenereerd, maar bestanden zijn geüpload naar S3.'}

---
Dit is een automatische notificatie van de CCS Constructieve Quickscan tool.
Voor vragen: renzo@creativecitysolutions.com
  `.trim();
}

function generateEmailHtml(
  folderName: string,
  projectAddress: string,
  buildingYear: string,
  timestamp: string,
  downloadUrl: string,
  uploadedFiles: Array<{ name: string; s3Key: string; size: number; type: string; stepId: string }>
): string {
  const fileCount = uploadedFiles?.length || 0;
  const totalSize = uploadedFiles?.reduce((sum, file) => sum + file.size, 0) || 0;
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);

  // Group files by category
  const filesByCategory: Record<string, Array<{ name: string; size: number }>> = {};
  uploadedFiles.forEach(file => {
    const stepNameMapping = {
      upload_archief: 'Archieftekeningen',
      upload_palenplan: 'Palenplan',
      upload_sondering: 'Sonderingen',
      upload_schadefotos: 'Schadefotos',
      upload_archieffotos: 'Archief Fotos',
      upload_structuurtekening: 'Structuurtekeningen',
      upload_buitenfotos: 'Buitenfotos',
      upload_andere_archief: 'Andere Archief',
      upload_alle_overige_archief: 'Alle Overige Archief'
    };
    const categoryName = stepNameMapping[file.stepId as keyof typeof stepNameMapping] || file.stepId;
    if (!filesByCategory[categoryName]) {
      filesByCategory[categoryName] = [];
    }
    filesByCategory[categoryName].push({ name: file.name, size: file.size });
  });

  const categorySections = Object.entries(filesByCategory)
    .map(([category, files]) => `
        <div class="category">
          <h4>${category} (${files.length} bestand${files.length > 1 ? 'en' : ''})</h4>
          <ul>
            ${files.map(file => `<li>${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)</li>`).join('')}
          </ul>
        </div>
      `).join('');

  const downloadSection = downloadUrl 
    ? `<a href="${downloadUrl}" class="download-btn">📥 Download Summary</a>
       <p><em>Deze download link is 7 dagen geldig.</em></p>`
    : `<p><em>Download link kon niet worden gegenereerd, maar bestanden zijn geüpload naar S3.</em></p>`;

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .download-btn { 
            display: inline-block; 
            background-color: #007bff; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0; 
        }
        .file-list { background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .category { margin-bottom: 15px; }
        .category h4 { margin: 0 0 8px 0; color: #495057; }
        .category ul { margin: 0; padding-left: 20px; }
        .category li { margin-bottom: 4px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>📦 Nieuwe Quickscan Package Ontvangen</h2>
        </div>
        
        <h3>Project Details</h3>
        <p><strong>Project:</strong> ${folderName}</p>
        <p><strong>Projectadres:</strong> ${projectAddress || 'Onbekend'}</p>
        <p><strong>Bouwjaar:</strong> ${buildingYear || 'Onbekend'}</p>
        <p><strong>Tijdstip:</strong> ${new Date(timestamp).toLocaleString('nl-NL')}</p>
        
        <h3>Geüploade Bestanden</h3>
        <p><strong>Aantal bestanden:</strong> ${fileCount} (${totalSizeMB} MB totaal)</p>
        
        <div class="file-list">
            <h4>Bestanden per categorie:</h4>
            ${categorySections}
        </div>
        
        ${downloadSection}
        
        <div class="footer">
            <p>Dit is een automatische notificatie van de CCS Constructieve Quickscan tool.</p>
            <p>Voor vragen: <a href="mailto:renzo@creativecitysolutions.com">renzo@creativecitysolutions.com</a></p>
        </div>
    </div>
</body>
</html>
  `.trim();
} 