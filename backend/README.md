# CCS Quickscan Backend Service

Backend service for handling S3 uploads and email notifications for the CCS Constructieve Quickscan application.

## Features

- **S3 Upload**: Securely upload ZIP packages to AWS S3
- **Email Notifications**: Send HTML email notifications with download links
- **Presigned URLs**: Generate secure, time-limited download links (7 days)
- **CORS Support**: Configured for cross-origin requests from the frontend
- **Auto-cleanup**: S3 lifecycle policy removes old packages after 30 days

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **Node.js 18+** and npm
3. **AWS CLI** configured with appropriate credentials
4. **Serverless Framework** (will be installed as dev dependency)

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure AWS SES

Before deploying, you need to configure AWS SES for email sending:

```bash
# Verify your email domain in SES
aws ses verify-domain-identity --domain creativecitysolutions.com

# Or verify a specific email address for testing
aws ses verify-email-identity --email-address noreply@creativecitysolutions.com
aws ses verify-email-identity --email-address renzo@creativecitysolutions.com
```

**Important**: If your SES account is in sandbox mode, you can only send emails to verified addresses.

### 3. Environment Configuration

Create a `.env` file in the backend directory:

```bash
# AWS Configuration
AWS_REGION=eu-west-1
S3_BUCKET=ccs-quickscan-backend-packages-dev
EMAIL_FROM=noreply@creativecitysolutions.com
EMAIL_TO=renzo@creativecitysolutions.com

# For production
# S3_BUCKET=ccs-quickscan-backend-packages-prod
```

## Deployment

### Development Deployment

```bash
# Deploy to dev environment
npm run deploy:dev
```

### Production Deployment

```bash
# Deploy to production environment
npm run deploy:prod
```

### Local Development

```bash
# Start local development server
npm run dev
```

The local server will be available at `http://localhost:3001`

## API Endpoints

### POST /upload-package

Uploads a quickscan package to S3 and sends email notification.

**Request Body:**
```json
{
  "files": [
    {
      "name": "document.pdf",
      "data": "base64-encoded-file-content",
      "type": "application/pdf",
      "size": 1024000,
      "stepId": "upload_archief"
    }
  ],
  "summary": {
    "projectAddress": "Hoofdstraat 123, 1234 AB Amsterdam",
    "buildingYear": "1985",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "formData": { /* form data object */ }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Files uploaded and email sent successfully",
  "downloadUrls": [
    {
      "name": "00_Summary_Quickscan.json",
      "url": "https://s3.amazonaws.com/...",
      "size": 2048,
      "type": "application/json",
      "stepId": "summary"
    },
    {
      "name": "document.pdf",
      "url": "https://s3.amazonaws.com/...",
      "size": 1024000,
      "type": "application/pdf",
      "stepId": "upload_archief"
    }
  ],
  "folderName": "Quickscan_Hoofdstraat_123_1985_2024-01-15T10-30-00-000Z",
  "uploadedFiles": 1,
  "totalSize": 1026048
}
```

### GET /download/{folderName}/{fileName}

Generates a presigned download URL for a specific file.

**Parameters:**
- `folderName`: The package folder name
- `fileName`: The name of the file to download

**Response:**
```json
{
  "success": true,
  "downloadUrl": "https://s3.amazonaws.com/...",
  "fileName": "document.pdf",
  "expiresIn": "7 days"
}
```

### GET /files/{folderName}

Lists all files in a package folder.

**Parameters:**
- `folderName`: The package folder name

**Response:**
```json
{
  "success": true,
  "folderName": "Quickscan_Hoofdstraat_123_1985_2024-01-15T10-30-00-000Z",
  "files": [
    {
      "name": "00_Summary_Quickscan.json",
      "size": 2048,
      "lastModified": "2024-01-15T10:30:00.000Z"
    },
    {
      "name": "01_Archieftekeningen/document.pdf",
      "size": 1024000,
      "lastModified": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

## Frontend Integration

Update your frontend environment variables:

```bash
# .env
VITE_API_BASE_URL=https://your-api-gateway-url.amazonaws.com/dev
```

## Email Template

The service sends HTML emails with:

- Project details (address, building year, timestamp)
- File count and total size
- Download link (7 days valid)
- Professional styling

## S3 Bucket Structure

```
ccs-quickscan-backend-packages-{stage}/
├── packages/
│   ├── 2024-01-15T10-30-00-000Z/
│   │   └── Quickscan_ProjectName_2024_01_15.zip
│   └── 2024-01-16T14-20-00-000Z/
│       └── Quickscan_AnotherProject_2024_01_16.zip
```

## Security Features

- **Private S3 Bucket**: No public access
- **Presigned URLs**: Time-limited access (7 days)
- **CORS Configuration**: Restricted to specific origins
- **IAM Roles**: Least privilege access
- **Auto-cleanup**: Files deleted after 30 days

## Monitoring

### CloudWatch Logs

Lambda function logs are automatically sent to CloudWatch:

```bash
# View logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/ccs-quickscan-backend"
```

### SES Monitoring

Monitor email delivery in the SES console:

```bash
# Check sending statistics
aws ses get-send-statistics
```

## Troubleshooting

### Common Issues

1. **SES Sandbox Mode**
   - Solution: Request production access or verify recipient emails

2. **CORS Errors**
   - Check API Gateway CORS configuration
   - Verify frontend origin is allowed

3. **S3 Upload Failures**
   - Check IAM permissions
   - Verify bucket exists and is accessible

4. **Large File Uploads**
   - Lambda timeout: 30 seconds
   - Max payload: 10MB (API Gateway limit)
   - Consider direct S3 upload for larger files

### Debug Commands

```bash
# Check Lambda function status
aws lambda get-function --function-name ccs-quickscan-backend-uploadPackage-dev

# Test API endpoint
curl -X POST https://your-api-gateway-url.amazonaws.com/dev/upload-package \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Check S3 bucket contents
aws s3 ls s3://ccs-quickscan-backend-packages-dev/packages/
```

## Cost Estimation

**Monthly costs (estimated):**

- **Lambda**: ~$0.20 (1000 requests)
- **S3**: ~$0.50 (10GB storage + requests)
- **SES**: ~$0.10 (1000 emails)
- **API Gateway**: ~$1.00 (1M requests)

**Total**: ~$1.80/month for typical usage

## Cleanup

To remove all resources:

```bash
# Remove the entire stack
npm run remove
```

## Support

For issues or questions:
- Email: renzo@creativecitysolutions.com
- Check CloudWatch logs for detailed error information 