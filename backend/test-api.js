#!/usr/bin/env node

/**
 * Test script for CCS Quickscan Backend API
 * Usage: node test-api.js [API_URL]
 */

const https = require('https');
const { URL } = require('url');

// Configuration
const API_URL = process.argv[2] || 'https://your-api-gateway-url.amazonaws.com/dev';

console.log('🧪 Testing CCS Quickscan Backend API');
console.log('=====================================');
console.log(`API URL: ${API_URL}`);
console.log('');

// Test data
const testData = {
  zipData: 'UEsDBBQAAAAIAA...', // Base64 encoded minimal ZIP
  fileName: 'test-package.zip',
  projectAddress: 'Teststraat 123, 1234 AB Amsterdam',
  buildingYear: '1985',
  timestamp: new Date().toISOString(),
  formData: {
    project_address: 'Teststraat 123, 1234 AB Amsterdam',
    project_bouwjaar: '1985'
  },
  uploadedFiles: [
    {
      name: 'test-document.pdf',
      size: 1024,
      type: 'application/pdf',
      stepId: 'upload_archief'
    }
  ]
};

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CCS-Quickscan-Test/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test functions
async function testCORS() {
  console.log('1. Testing CORS preflight...');
  try {
    const response = await makeRequest('OPTIONS', '/upload-package');
    
    if (response.statusCode === 200) {
      console.log('✅ CORS preflight successful');
      console.log(`   Status: ${response.statusCode}`);
      
      const corsHeaders = response.headers['access-control-allow-origin'];
      if (corsHeaders) {
        console.log(`   CORS Origin: ${corsHeaders}`);
      }
    } else {
      console.log('❌ CORS preflight failed');
      console.log(`   Status: ${response.statusCode}`);
    }
  } catch (error) {
    console.log('❌ CORS test error:', error.message);
  }
  console.log('');
}

async function testHealth() {
  console.log('2. Testing API health...');
  try {
    const response = await makeRequest('GET', '/health');
    
    if (response.statusCode === 200) {
      console.log('✅ API health check successful');
      console.log(`   Status: ${response.statusCode}`);
    } else {
      console.log('⚠️  API health check returned unexpected status');
      console.log(`   Status: ${response.statusCode}`);
    }
  } catch (error) {
    console.log('⚠️  Health check endpoint not available (this is normal)');
  }
  console.log('');
}

async function testUpload() {
  console.log('3. Testing package upload...');
  try {
    const response = await makeRequest('POST', '/upload-package', testData);
    
    if (response.statusCode === 200) {
      console.log('✅ Package upload successful');
      console.log(`   Status: ${response.statusCode}`);
      
      if (response.body && response.body.success) {
        console.log('   Message:', response.body.message);
        if (response.body.downloadUrl) {
          console.log('   Download URL: Available');
        }
        if (response.body.s3Key) {
          console.log('   S3 Key:', response.body.s3Key);
        }
      }
    } else {
      console.log('❌ Package upload failed');
      console.log(`   Status: ${response.statusCode}`);
      
      if (response.body && response.body.error) {
        console.log('   Error:', response.body.error);
      }
    }
  } catch (error) {
    console.log('❌ Upload test error:', error.message);
  }
  console.log('');
}

async function testInvalidRequest() {
  console.log('4. Testing invalid request handling...');
  try {
    const response = await makeRequest('POST', '/upload-package', {
      // Missing required fields
      fileName: 'test.zip'
    });
    
    if (response.statusCode === 400) {
      console.log('✅ Invalid request properly rejected');
      console.log(`   Status: ${response.statusCode}`);
      
      if (response.body && response.body.error) {
        console.log('   Error:', response.body.error);
      }
    } else {
      console.log('⚠️  Unexpected response for invalid request');
      console.log(`   Status: ${response.statusCode}`);
    }
  } catch (error) {
    console.log('❌ Invalid request test error:', error.message);
  }
  console.log('');
}

// Main test execution
async function runTests() {
  try {
    await testCORS();
    await testHealth();
    await testUpload();
    await testInvalidRequest();
    
    console.log('🎉 API testing completed!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Check your email for notifications');
    console.log('2. Verify S3 bucket contents');
    console.log('3. Test download links');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testCORS,
  testHealth,
  testUpload,
  testInvalidRequest,
  runTests
}; 