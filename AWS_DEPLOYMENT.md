# AWS Deployment Guide - CCS Constructieve Quickscan

This guide covers multiple ways to deploy the CCS Constructieve Quickscan application on AWS.

## 🚀 Option 1: AWS Amplify (Recommended)

**Perfect for**: Production deployment with CI/CD
**Difficulty**: ⭐ Very Easy
**Cost**: ~$1-5/month
**Time**: 10-15 minutes

### Prerequisites
- AWS Account
- Git repository (GitHub/GitLab/BitBucket)

### Steps

1. **Push your code to Git**
   ```bash
   git add .
   git commit -m "Ready for AWS deployment"
   git push origin main
   ```

2. **Deploy via AWS Console**
   - Go to AWS Amplify Console
   - Click "New app" > "Host web app"
   - Connect your Git provider
   - Select repository and branch
   - Build settings (auto-detected):
     ```yaml
     version: 1
     frontend:
       phases:
         preBuild:
           commands:
             - npm install
         build:
           commands:
             - npm run build
       artifacts:
         baseDirectory: dist
         files:
           - '**/*'
     ```
   - Click "Save and deploy"

3. **Configure Domain (Optional)**
   - Add custom domain in Amplify settings
   - SSL certificate is automatically provided

### Advantages
- ✅ Automatic deployments on Git push
- ✅ Built-in CI/CD pipeline
- ✅ Global CDN included
- ✅ SSL certificates managed
- ✅ Branch previews available

---

## 🌐 Option 2: S3 + CloudFront

**Perfect for**: Cost-effective static hosting
**Difficulty**: ⭐⭐ Easy
**Cost**: ~$0.50-2/month
**Time**: 20-30 minutes

### Prerequisites
- AWS CLI configured
- AWS Account

### Steps

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Create S3 bucket**
   ```bash
   # Replace with your unique bucket name
   aws s3 mb s3://ccs-quickscan-your-company
   
   # Enable static website hosting
   aws s3 website s3://ccs-quickscan-your-company \
     --index-document index.html \
     --error-document index.html
   ```

3. **Upload files**
   ```bash
   aws s3 sync ./dist s3://ccs-quickscan-your-company --delete
   ```

4. **Set bucket policy for public access**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::ccs-quickscan-your-company/*"
       }
     ]
   }
   ```

5. **Create CloudFront distribution** (for global CDN + SSL)
   - Origin: Your S3 bucket website endpoint
   - Default root object: `index.html`
   - Error pages: 404 → `/index.html` (for React routing)

### Using the deployment script
```bash
# Update bucket name in package.json first
npm run deploy:s3
```

---

## ⚡ Option 3: Quick S3 Test

**Perfect for**: Quick testing/demos
**Difficulty**: ⭐ Very Easy
**Cost**: Minimal
**Time**: 5 minutes

```bash
# Build
npm run build

# Create bucket and upload (replace bucket name)
aws s3 mb s3://ccs-quickscan-test-123
aws s3 sync ./dist s3://ccs-quickscan-test-123 --acl public-read
aws s3 website s3://ccs-quickscan-test-123 --index-document index.html

# Your app will be available at:
# http://ccs-quickscan-test-123.s3-website-us-east-1.amazonaws.com
```

---

## 🐳 Option 4: Container Deployment

**Perfect for**: Enterprise/scaling needs
**Difficulty**: ⭐⭐⭐ Moderate
**Cost**: ~$5-20/month

### Using AWS App Runner

1. **Create Dockerfile**
   ```dockerfile
   FROM nginx:alpine
   COPY dist/ /usr/share/nginx/html/
   COPY nginx.conf /etc/nginx/nginx.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Deploy to App Runner**
   - Use container image or connect to GitHub
   - Auto-scaling included
   - HTTPS enabled by default

---

## 💰 Cost Comparison

| Method | Monthly Cost | Traffic Handling | SSL | CDN |
|--------|-------------|------------------|-----|-----|
| **Amplify** | $1-5 | High | ✅ | ✅ |
| **S3 + CloudFront** | $0.50-2 | Very High | ✅ | ✅ |
| **S3 only** | $0.10-0.50 | Medium | ❌ | ❌ |
| **App Runner** | $5-20 | Very High | ✅ | ✅ |

---

## 🔧 Environment Configuration

### For production deployment, consider:

1. **Environment variables** (if needed in future):
   ```bash
   # In Amplify console or container
   REACT_APP_API_URL=https://api.ccs.com
   REACT_APP_ENVIRONMENT=production
   ```

2. **Custom domain setup**
3. **Analytics integration**
4. **Error monitoring**

---

## 🚀 Recommended Workflow

### For Production:
1. **Start with AWS Amplify** for ease of use
2. **Add custom domain** for branding
3. **Monitor costs** and optimize if needed

### For Development/Testing:
1. **Use S3 static hosting** for quick tests
2. **Use `npm run preview`** for local testing

---

## 📝 Next Steps

After deployment:
1. Test the application thoroughly
2. Set up monitoring (CloudWatch, AWS X-Ray)
3. Configure backups if needed
4. Set up CI/CD for automated deployments
5. Consider adding a backend API if needed

## 🆘 Troubleshooting

### Common Issues:
- **404 errors**: Ensure error document points to `index.html`
- **Asset loading**: Check that assets are publicly accessible
- **Routing issues**: Configure CloudFront for SPA routing

### Support:
- AWS Documentation
- AWS Support (if you have a support plan)
- Community forums 