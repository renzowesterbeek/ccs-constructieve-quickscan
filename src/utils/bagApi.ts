// BAG API Integration for building year lookup
// API Documentation: https://lvbag.github.io/BAG-API/Technische%20specificatie/

const BAG_API_BASE_URL = import.meta.env.VITE_BAG_API_BASE_URL || 'https://api.bag.kadaster.nl/lvbag/individuelebevragingen/v2';
const API_KEY = import.meta.env.VITE_BAG_API_KEY;

if (!API_KEY) {
  console.warn('BAG API key not found in environment variables. BAG lookup will be disabled.');
  console.warn('To enable BAG API:');
  console.warn('1. Request API key at: https://formulieren.kadaster.nl/aanvraag_bag_api_individuele_bevragingen_productie');
  console.warn('2. Create .env file with: VITE_BAG_API_KEY=your_api_key_here');
}

export interface BAGAddress {
  openbareRuimteNaam: string;
  korteNaam: string;
  huisnummer: number;
  huisletter?: string;
  huisnummertoevoeging?: string;
  postcode: string;
  woonplaatsNaam: string;
  nummeraanduidingIdentificatie: string;
  openbareRuimteIdentificatie: string;
  woonplaatsIdentificatie: string;
  adresseerbaarObjectIdentificatie: string;
  pandIdentificaties: string[];
  adresregel5: string;
  adresregel6: string;
  _links: {
    self: { href: string };
    openbareRuimte: { href: string };
    nummeraanduiding: { href: string };
    woonplaats: { href: string };
    adresseerbaarObject: { href: string };
    panden: Array<{ href: string }>;
  };
}

export interface BAGVerblijfsobject {
  verblijfsobject: {
    type: string;
    heeftAlsHoofdAdres: string;
    identificatie: string;
    domein: string;
    geometrie?: {
      punt: {
        type: string;
        coordinates: [number, number, number];
      };
    };
    gebruiksdoelen: string[];
    oppervlakte: number;
    status: string;
    geconstateerd: string;
    documentdatum: string;
    documentnummer: string;
    oorspronkelijkBouwjaar?: number;
    voorkomen: {
      tijdstipRegistratie: string;
      versie: number;
      beginGeldigheid: string;
      tijdstipRegistratieLV: string;
    };
    maaktDeelUitVan: string[];
  };
  _links: {
    self: { href: string };
    heeftAlsHoofdAdres: { href: string };
    maaktDeelUitVan: Array<{ href: string }>;
  };
}

export interface BAGAddressResponse {
  _links: {
    self: {
      href: string;
    };
  };
  _embedded: {
    adressen: BAGAddress[];
  };
}

export interface BAGVerblijfsobjectResponse {
  _embedded: {
    verblijfsobjecten: BAGVerblijfsobject[];
  };
  _links: {
    self: {
      href: string;
    };
  };
}

export class BAGApiService {
  private static async makeRequest(endpoint: string, includeGeometry: boolean = false): Promise<any> {
    if (!API_KEY) {
      throw new Error('BAG API key not configured');
    }

    const url = `${BAG_API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'X-Api-Key': API_KEY,
      'Accept': 'application/hal+json',
      'Content-Type': 'application/json',
    };

    // Add CRS header for geometry requests
    if (includeGeometry) {
      headers['Accept-Crs'] = 'epsg:28992';
    }
    
    try {
      console.log(`🔍 BAG API Request: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      console.log(`📡 BAG API Response Status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ BAG API Error ${response.status}:`, errorText);
        throw new Error(`BAG API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ BAG API Response:`, data);
      return data;
    } catch (error) {
      console.error('❌ BAG API request failed:', error);
      throw error;
    }
  }

  /**
   * Search for addresses by postal code and house number
   * Uses the /adressen endpoint as per official documentation
   */
  public static async searchByPostalCodeAndNumber(
    postalCode: string,
    houseNumber: string,
    houseLetter?: string
  ): Promise<BAGAddress[]> {
    if (!API_KEY) {
      console.warn('BAG API key not available, skipping search');
      return [];
    }

    let endpoint = `/adressen?postcode=${encodeURIComponent(postalCode)}&huisnummer=${encodeURIComponent(houseNumber)}&exacteMatch=true&page=1&pageSize=20&inclusiefEindStatus=true`;
    
    if (houseLetter) {
      endpoint += `&huisletter=${encodeURIComponent(houseLetter)}`;
    }
    
    try {
      const response: BAGAddressResponse = await this.makeRequest(endpoint);
      return response._embedded?.adressen || [];
    } catch (error) {
      console.error('Failed to search BAG by postal code and number:', error);
      return [];
    }
  }

  /**
   * Search for addresses by street name and house number
   * Uses the /adressen endpoint as per official documentation
   */
  public static async searchByStreetAndNumber(
    streetName: string,
    houseNumber: string,
    city: string,
    houseLetter?: string
  ): Promise<BAGAddress[]> {
    if (!API_KEY) {
      console.warn('BAG API key not available, skipping search');
      return [];
    }

    let endpoint = `/adressen?openbareRuimteNaam=${encodeURIComponent(streetName)}&huisnummer=${encodeURIComponent(houseNumber)}&woonplaatsNaam=${encodeURIComponent(city)}&exacteMatch=true&page=1&pageSize=20&inclusiefEindStatus=true`;
    
    if (houseLetter) {
      endpoint += `&huisletter=${encodeURIComponent(houseLetter)}`;
    }
    
    try {
      const response: BAGAddressResponse = await this.makeRequest(endpoint);
      return response._embedded?.adressen || [];
    } catch (error) {
      console.error('Failed to search BAG by street and number:', error);
      return [];
    }
  }

  /**
   * Get building year for a specific address
   * First searches for address, then gets building year from associated building
   */
  public static async getBuildingYear(address: string): Promise<number | null> {
    if (!API_KEY) {
      console.warn('BAG API key not available, cannot lookup building year');
      return null;
    }

    try {
      // Parse the address to extract components
      const addressParts = this.parseAddress(address);
      
      if (!addressParts) {
        console.warn('Invalid address format, cannot parse:', address);
        return null;
      }

      let results: BAGAddress[] = [];

      // Try postal code search first (more accurate)
      if (addressParts.postcode && addressParts.houseNumber) {
        results = await this.searchByPostalCodeAndNumber(
          addressParts.postcode,
          addressParts.houseNumber,
          addressParts.houseLetter
        );
      }

      // If no results, try street name search
      if (results.length === 0 && addressParts.streetName && addressParts.houseNumber && addressParts.city) {
        results = await this.searchByStreetAndNumber(
          addressParts.streetName,
          addressParts.houseNumber,
          addressParts.city,
          addressParts.houseLetter
        );
      }

      // If we found an address, get the building year from the associated building
      if (results.length > 0) {
        const address = results[0];
        
        // Get building year from the first associated building
        if (address.pandIdentificaties && address.pandIdentificaties.length > 0) {
          const buildingYear = await this.getBuildingYearFromPand(address.pandIdentificaties[0]);
          if (buildingYear) {
            return buildingYear;
          }
        }
        
        // Fallback: try to get building year from verblijfsobject
        if (address.adresseerbaarObjectIdentificatie) {
          const buildingYear = await this.getBuildingYearFromVerblijfsobject(address.adresseerbaarObjectIdentificatie);
          if (buildingYear) {
            return buildingYear;
          }
        }
      }

      console.warn('No building year found for address:', address);
      return null;
    } catch (error) {
      console.error('Failed to get building year:', error);
      return null;
    }
  }

  /**
   * Get building year from a specific building (pand)
   */
  private static async getBuildingYearFromPand(pandId: string): Promise<number | null> {
    try {
      const endpoint = `/panden/${pandId}`;
      const response = await this.makeRequest(endpoint);
      
      if (response.pand && response.pand.oorspronkelijkBouwjaar) {
        return response.pand.oorspronkelijkBouwjaar;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get building year from pand:', error);
      return null;
    }
  }

  /**
   * Get building year from a specific verblijfsobject
   */
  private static async getBuildingYearFromVerblijfsobject(verblijfsobjectId: string): Promise<number | null> {
    try {
      const endpoint = `/verblijfsobjecten/${verblijfsobjectId}`;
      const response = await this.makeRequest(endpoint);
      
      if (response.verblijfsobject && response.verblijfsobject.oorspronkelijkBouwjaar) {
        return response.verblijfsobject.oorspronkelijkBouwjaar;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get building year from verblijfsobject:', error);
      return null;
    }
  }

  /**
   * Parse address string into components
   * Expected format: "Hoofdstraat 123, 1234 AB Amsterdam" or "Hoofdstraat 123A, 1234 AB Amsterdam"
   */
  private static parseAddress(address: string): {
    streetName?: string;
    houseNumber?: string;
    houseLetter?: string;
    postcode?: string;
    city?: string;
  } | null {
    try {
      // Remove extra spaces and normalize
      const cleanAddress = address.trim().replace(/\s+/g, ' ');
      
      // Split by comma to separate street and postal code/city
      const parts = cleanAddress.split(',');
      
      if (parts.length < 2) {
        return null;
      }

      const streetPart = parts[0].trim();
      const postalCityPart = parts[1].trim();

      // Extract street name and house number (with optional letter)
      // Matches: "Hoofdstraat 123" or "Hoofdstraat 123A" or "Hoofdstraat 123 A"
      const streetMatch = streetPart.match(/^(.+?)\s+(\d+)\s*([A-Za-z])?\s*$/);
      if (!streetMatch) {
        return null;
      }

      const streetName = streetMatch[1].trim();
      const houseNumber = streetMatch[2].trim();
      const houseLetter = streetMatch[3] || undefined;

      // Extract postal code and city
      // Matches: "1234 AB Amsterdam" or "1234AB Amsterdam"
      const postalMatch = postalCityPart.match(/^(\d{4}\s*[A-Z]{2})\s+(.+)$/);
      if (!postalMatch) {
        return null;
      }

      const postcode = postalMatch[1].replace(/\s/g, ''); // Remove spaces from postal code
      const city = postalMatch[2].trim();

      return {
        streetName,
        houseNumber,
        houseLetter,
        postcode,
        city,
      };
    } catch (error) {
      console.error('Failed to parse address:', error);
      return null;
    }
  }

  /**
   * Validate if an address format is supported
   */
  public static isValidAddressFormat(address: string): boolean {
    const parsed = this.parseAddress(address);
    return parsed !== null;
  }

  /**
   * Check if BAG API is available (has API key)
   */
  public static isApiAvailable(): boolean {
    return !!API_KEY;
  }

  /**
   * Test the BAG API connection
   */
  public static async testConnection(): Promise<boolean> {
    if (!API_KEY) {
      console.warn('BAG API key not available for testing');
      return false;
    }

    try {
      // Test with a known address
      const testAddress = "Dorpsstraat 15, 2631 CR Nootdorp";
      const buildingYear = await this.getBuildingYear(testAddress);
      
      if (buildingYear) {
        console.log('✅ BAG API test successful, found building year:', buildingYear);
        return true;
      } else {
        console.warn('⚠️ BAG API test completed but no building year found');
        return true; // API is working, just no data for this address
      }
    } catch (error) {
      console.error('❌ BAG API test failed:', error);
      return false;
    }
  }
} 