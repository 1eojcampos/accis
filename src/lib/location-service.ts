import { Client } from "@googlemaps/google-maps-services-js";

const client = new Client({});

interface PlacesResult {
  formatted_address?: string;
  geometry: {
    location: Location;
  };
}

interface Location {
  lat: number;
  lng: number;
}

interface DistanceResult {
  distance: number;  // in miles
  duration: string;
}

export async function getZipCodeCoordinates(zipCode: string): Promise<Location> {
  try {
    const response = await client.geocode({
      params: {
        address: zipCode,
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        components: { country: 'US', postal_code: zipCode }
      }
    });

    if (response.data.results.length === 0) {
      throw new Error('ZIP code not found');
    }

    return response.data.results[0].geometry.location;
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
}

export async function calculateDistanceBetweenZipCodes(
  originZip: string,
  destinationZip: string
): Promise<DistanceResult> {
  try {
    const response = await client.distancematrix({
      params: {
        origins: [originZip],
        destinations: [destinationZip],
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!
      }
    });

    if (!response.data.rows[0]?.elements[0]) {
      throw new Error('Could not calculate distance');
    }

    const element = response.data.rows[0].elements[0];
    
    return {
      distance: element.distance.value / 1609.34, // Convert meters to miles
      duration: element.duration.text
    };
  } catch (error) {
    console.error('Distance calculation error:', error);
    throw error;
  }
}

export async function findNearbyZipCodes(
  zipCode: string,
  radiusMiles: number
): Promise<string[]> {
  try {
    // First get the coordinates of the origin ZIP code
    const origin = await getZipCodeCoordinates(zipCode);
    
    // Convert radius from miles to meters (Google Maps uses meters)
    const radiusMeters = radiusMiles * 1609.34;

    const response = await client.placesNearby({
      params: {
        location: origin,
        radius: radiusMeters,
        type: 'postal_code',
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!
      }
    });

    // Extract ZIP codes from the results
    const nearbyZipCodes = response.data.results
      .map(result => {
        if (!result.formatted_address) return null;
        const zipMatch = result.formatted_address.match(/\b\d{5}\b/);
        return zipMatch ? zipMatch[0] : null;
      })
      .filter((zip): zip is string => zip !== null);

    return nearbyZipCodes;
  } catch (error) {
    console.error('Error finding nearby ZIP codes:', error);
    throw error;
  }
}
