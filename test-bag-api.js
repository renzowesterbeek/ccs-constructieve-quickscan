#!/usr/bin/env node

/**
 * BAG API Test Script
 * 
 * This script tests the BAG API functionality without requiring the full React app.
 * Run with: node test-bag-api.js
 */

const BAG_API_BASE_URL = 'https://api.bag.kadaster.nl/lvbag/individuelebevragingen/v2';

// Get API key from environment
const API_KEY = process.env.VITE_BAG_API_KEY || process.env.BAG_API_KEY;

if (!API_KEY) {
  console.error('❌ BAG API key not found!');
  console.error('Please set VITE_BAG_API_KEY or BAG_API_KEY environment variable');
  console.error('');
  console.error('Example:');
  console.error('  export VITE_BAG_API_KEY=your_api_key_here');
  console.error('  node test-bag-api.js');
  process.exit(1);
}

async function testBAGApi() {
  console.log('🧪 Testing BAG API...');
  console.log(`📍 API URL: ${BAG_API_BASE_URL}`);
  console.log(`🔑 API Key: ${API_KEY.substring(0, 8)}...`);
  console.log('');

  const testAddresses = [
    {
      name: 'Test Address 1',
      address: 'Dorpsstraat 15, 2631 CR Nootdorp',
      expected: 'Should return building year'
    },
    {
      name: 'Test Address 2', 
      address: 'Hoofdstraat 123, 1234 AB Amsterdam',
      expected: 'May or may not return building year'
    }
  ];

  for (const test of testAddresses) {
    console.log(`🔍 Testing: ${test.name}`);
    console.log(`📍 Address: ${test.address}`);
    
    try {
      const result = await testAddressLookup(test.address);
      console.log(`✅ Result: ${result ? `Building year: ${result}` : 'No building year found'}`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    console.log('');
  }
}

async function testAddressLookup(address) {
  // Parse address
  const parts = parseAddress(address);
  if (!parts) {
    throw new Error('Invalid address format');
  }

  // Search by postal code first
  let endpoint = `/adressen?postcode=${encodeURIComponent(parts.postcode)}&huisnummer=${encodeURIComponent(parts.houseNumber)}&exacteMatch=true&page=1&pageSize=20&inclusiefEindStatus=true`;
  
  if (parts.houseLetter) {
    endpoint += `&huisletter=${encodeURIComponent(parts.houseLetter)}`;
  }

  const response = await fetch(`${BAG_API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'X-Api-Key': API_KEY,
      'Accept': 'application/hal+json',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data._embedded?.adressen || data._embedded.adressen.length === 0) {
    return null;
  }

  const addressData = data._embedded.adressen[0];
  
  // Try to get building year from associated building
  if (addressData.pandIdentificaties && addressData.pandIdentificaties.length > 0) {
    const buildingYear = await getBuildingYearFromPand(addressData.pandIdentificaties[0]);
    if (buildingYear) {
      return buildingYear;
    }
  }

  return null;
}

async function getBuildingYearFromPand(pandId) {
  const response = await fetch(`${BAG_API_BASE_URL}/panden/${pandId}`, {
    method: 'GET',
    headers: {
      'X-Api-Key': API_KEY,
      'Accept': 'application/hal+json',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.pand?.oorspronkelijkBouwjaar || null;
}

function parseAddress(address) {
  try {
    const cleanAddress = address.trim().replace(/\s+/g, ' ');
    const parts = cleanAddress.split(',');
    
    if (parts.length < 2) {
      return null;
    }

    const streetPart = parts[0].trim();
    const postalCityPart = parts[1].trim();

    const streetMatch = streetPart.match(/^(.+?)\s+(\d+)\s*([A-Za-z])?\s*$/);
    if (!streetMatch) {
      return null;
    }

    const streetName = streetMatch[1].trim();
    const houseNumber = streetMatch[2].trim();
    const houseLetter = streetMatch[3] || undefined;

    const postalMatch = postalCityPart.match(/^(\d{4}\s*[A-Z]{2})\s+(.+)$/);
    if (!postalMatch) {
      return null;
    }

    const postcode = postalMatch[1].replace(/\s/g, '');
    const city = postalMatch[2].trim();

    return {
      streetName,
      houseNumber,
      houseLetter,
      postcode,
      city,
    };
  } catch (error) {
    return null;
  }
}

// Run the test
testBAGApi().catch(console.error); 