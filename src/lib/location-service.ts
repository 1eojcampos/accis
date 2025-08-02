/// <reference types="@types/google.maps" />

interface Location {
  lat: number;
  lng: number;
}

interface DistanceResult {
  distance: number;  // in miles
  duration: string;
}

declare global {
  interface Window {
    google: typeof google;
  }
}

// Helper function to load Google Maps script
function loadGoogleMapsScript(): Promise<void> {
  if (typeof window.google !== 'undefined') {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    // Create a callback function name
    const callbackName = `googleMapsCallback${Date.now()}`;
    
    // Add the callback to the window object
    (window as any)[callbackName] = () => {
      resolve();
      // Clean up by deleting the callback
      delete (window as any)[callbackName];
    };

    // Create the script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,geometry&callback=${callbackName}&loading=async`;
    script.async = true;
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    
    // Append the script to the document
    document.head.appendChild(script);
  });
}

export async function getZipCodeCoordinates(zipCode: string): Promise<Location> {
  try {
    await loadGoogleMapsScript();
    
    return new Promise((resolve, reject) => {
      const geocoder = new google.maps.Geocoder();
      
      geocoder.geocode(
        { 
          address: zipCode,
          componentRestrictions: { 
            country: 'US',
            postalCode: zipCode 
          }
        },
        (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
            const location = results[0].geometry.location;
            resolve({
              lat: location.lat(),
              lng: location.lng()
            });
          } else {
            reject(new Error('ZIP code not found'));
          }
        }
      );
    });
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
    await loadGoogleMapsScript();
    
    const [originCoords, destCoords] = await Promise.all([
      getZipCodeCoordinates(originZip),
      getZipCodeCoordinates(destinationZip)
    ]);

    // Calculate distance using the geometry library
    const originLatLng = new google.maps.LatLng(originCoords.lat, originCoords.lng);
    const destLatLng = new google.maps.LatLng(destCoords.lat, destCoords.lng);
    
    const distanceInMeters = google.maps.geometry.spherical.computeDistanceBetween(
      originLatLng,
      destLatLng
    );
    
    const distanceInMiles = distanceInMeters / 1609.34; // Convert meters to miles
    
    // Estimate duration based on average speed (45 mph)
    const durationInHours = distanceInMiles / 45;
    const hours = Math.floor(durationInHours);
    const minutes = Math.round((durationInHours - hours) * 60);
    
    const durationText = hours > 0 
      ? `${hours} hour${hours > 1 ? 's' : ''} ${minutes} min`
      : `${minutes} min`;

    return {
      distance: Math.round(distanceInMiles * 10) / 10, // Round to 1 decimal place
      duration: durationText
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
    await loadGoogleMapsScript();
    
    // First get the coordinates of the origin ZIP code
    const origin = await getZipCodeCoordinates(zipCode);
    
    // For US ZIP codes, we'll use a grid search approach
    // Most ZIP codes are roughly 4-5 miles apart
    // We'll create a grid of points around the origin and check each one
    const nearbyZips = new Set<string>();
    
    // Create a grid of points
    const stepSize = 3; // miles between each point
    const steps = Math.ceil(radiusMiles / stepSize);
    
    const promises: Promise<string | null>[] = [];
    
    // Search in a square grid pattern
    for (let x = -steps; x <= steps; x++) {
      for (let y = -steps; y <= steps; y++) {
        // Calculate the point's position
        const point = new google.maps.LatLng(
          origin.lat + (x * stepSize * 0.0145), // approx degrees per mile
          origin.lng + (y * stepSize * 0.0145 / Math.cos(origin.lat * Math.PI / 180))
        );
        
        // Check if this point is within our search radius
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
          new google.maps.LatLng(origin.lat, origin.lng),
          point
        ) / 1609.34; // Convert to miles
        
        if (distance <= radiusMiles) {
          // Create a geocoder promise for this point
          promises.push(
            new Promise<string | null>((resolve) => {
              const geocoder = new google.maps.Geocoder();
              geocoder.geocode(
                { location: point },
                (results, status) => {
                  if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
                    // Find postal code in address components
                    const postalCode = results[0].address_components?.find(
                      component => component.types.includes('postal_code')
                    )?.short_name;
                    resolve(postalCode || null);
                  } else {
                    resolve(null);
                  }
                }
              );
            })
          );
        }
      }
    }
    
    // Wait for all geocoding requests to complete
    const results = await Promise.all(promises);
    
    // Filter out duplicates and nulls
    const validZips = results.filter((zip): zip is string => 
      zip !== null && /^\d{5}$/.test(zip)
    );
    
    return Array.from(new Set(validZips));
    
  } catch (error) {
    console.error('Error finding nearby ZIP codes:', error);
    throw error;
  }
}
