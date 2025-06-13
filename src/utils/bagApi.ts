// BAG API Integration for building year lookup
// API Documentation: https://lvbag.github.io/BAG-API/Technische%20specificatie/

const BAG_API_BASE_URL = import.meta.env.VITE_BAG_API_BASE_URL || 'https://api.bag.kadaster.nl/lvbag/individuelebevragingen/v2';
const API_KEY = import.meta.env.VITE_BAG_API_KEY;

if (!API_KEY) {
  console.warn('BAG API key not found in environment variables. BAG lookup will be disabled.');
}

export interface BAGAddress {
  openbareRuimteNaam: string;
  huisnummer: string;
  huisletter?: string;
  huisnummertoevoeging?: string;
  postcode: string;
  woonplaatsNaam: string;
}

export interface BAGVerblijfsobject {
  identificatie: string;
  oorspronkelijkBouwjaar: number;
  status: string;
  verblijfsobjectGeometrie: {
    point: {
      coordinates: [number, number];
    };
  };
  hoofdadres: {
    identificatie: string;
    openbareRuimteNaam: string;
    huisnummer: string;
    huisletter?: string;
    huisnummertoevoeging?: string;
    postcode: string;
    woonplaatsNaam: string;
  };
}

export interface BAGResponse {
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
  private static async makeRequest(endpoint: string): Promise<any> {
    if (!API_KEY) {
      throw new Error('BAG API key not configured');
    }

    const url = `${BAG_API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Api-Key': API_KEY,
          'Accept': 'application/hal+json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`BAG API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('BAG API request failed:', error);
      throw error;
    }
  }

  /**
   * Search for addresses by postal code and house number
   */
  public static async searchByPostalCodeAndNumber(
    postalCode: string,
    houseNumber: string
  ): Promise<BAGVerblijfsobject[]> {
    if (!API_KEY) {
      console.warn('BAG API key not available, skipping search');
      return [];
    }

    const endpoint = `/verblijfsobjecten?postcode=${encodeURIComponent(postalCode)}&huisnummer=${encodeURIComponent(houseNumber)}`;
    
    try {
      const response: BAGResponse = await this.makeRequest(endpoint);
      return response._embedded?.verblijfsobjecten || [];
    } catch (error) {
      console.error('Failed to search BAG by postal code and number:', error);
      return [];
    }
  }

  /**
   * Search for addresses by street name and house number
   */
  public static async searchByStreetAndNumber(
    streetName: string,
    houseNumber: string,
    city: string
  ): Promise<BAGVerblijfsobject[]> {
    if (!API_KEY) {
      console.warn('BAG API key not available, skipping search');
      return [];
    }

    const endpoint = `/verblijfsobjecten?openbareRuimteNaam=${encodeURIComponent(streetName)}&huisnummer=${encodeURIComponent(houseNumber)}&woonplaatsNaam=${encodeURIComponent(city)}`;
    
    try {
      const response: BAGResponse = await this.makeRequest(endpoint);
      return response._embedded?.verblijfsobjecten || [];
    } catch (error) {
      console.error('Failed to search BAG by street and number:', error);
      return [];
    }
  }

  /**
   * Get building year for a specific address
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
        return null;
      }

      let results: BAGVerblijfsobject[] = [];

      // Try postal code search first (more accurate)
      if (addressParts.postcode && addressParts.houseNumber) {
        results = await this.searchByPostalCodeAndNumber(
          addressParts.postcode,
          addressParts.houseNumber
        );
      }

      // If no results, try street name search
      if (results.length === 0 && addressParts.streetName && addressParts.houseNumber && addressParts.city) {
        results = await this.searchByStreetAndNumber(
          addressParts.streetName,
          addressParts.houseNumber,
          addressParts.city
        );
      }

      // Return the building year of the first result
      if (results.length > 0) {
        return results[0].oorspronkelijkBouwjaar;
      }

      return null;
    } catch (error) {
      console.error('Failed to get building year:', error);
      return null;
    }
  }

  /**
   * Parse address string into components
   * Expected format: "Hoofdstraat 123, 1234 AB Amsterdam"
   */
  private static parseAddress(address: string): {
    streetName?: string;
    houseNumber?: string;
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

      // Extract street name and house number
      const streetMatch = streetPart.match(/^(.+?)\s+(\d+[a-zA-Z]?)$/);
      if (!streetMatch) {
        return null;
      }

      const streetName = streetMatch[1].trim();
      const houseNumber = streetMatch[2].trim();

      // Extract postal code and city
      const postalMatch = postalCityPart.match(/^(\d{4}\s*[A-Z]{2})\s+(.+)$/);
      if (!postalMatch) {
        return null;
      }

      const postcode = postalMatch[1].replace(/\s/g, ''); // Remove spaces from postal code
      const city = postalMatch[2].trim();

      return {
        streetName,
        houseNumber,
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
} 