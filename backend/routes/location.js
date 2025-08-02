import express from 'express';
import { Client } from '@googlemaps/google-maps-services-js';

const router = express.Router();
const client = new Client({});

// Validate ZIP code format
const isValidZipCode = (zipCode) => /^\d{5}$/.test(zipCode);

router.get('/nearby-zipcodes', async (req, res) => {
  try {
    const { zipCode, radius } = req.query;
    
    if (!isValidZipCode(zipCode)) {
      return res.status(400).json({ error: 'Invalid ZIP code format' });
    }

    const response = await client.geocode({
      params: {
        address: zipCode,
        components: { country: 'US', postal_code: zipCode },
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.results.length === 0) {
      return res.status(404).json({ error: 'ZIP code not found' });
    }

    const origin = response.data.results[0].geometry.location;
    const radiusMeters = radius * 1609.34; // Convert miles to meters

    const placesResponse = await client.placesNearby({
      params: {
        location: origin,
        radius: radiusMeters,
        type: 'postal_code',
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    const nearbyZipCodes = placesResponse.data.results
      .map(result => {
        const zipMatch = result.formatted_address.match(/\b\d{5}\b/);
        return zipMatch ? zipMatch[0] : null;
      })
      .filter(zip => zip !== null);

    res.json({ zipCodes: nearbyZipCodes });
  } catch (error) {
    console.error('Error finding nearby ZIP codes:', error);
    res.status(500).json({ error: 'Failed to find nearby ZIP codes' });
  }
});

router.get('/distance', async (req, res) => {
  try {
    const { origin, destination } = req.query;
    
    if (!isValidZipCode(origin) || !isValidZipCode(destination)) {
      return res.status(400).json({ error: 'Invalid ZIP code format' });
    }

    const response = await client.distancematrix({
      params: {
        origins: [origin],
        destinations: [destination],
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    if (!response.data.rows[0]?.elements[0]) {
      return res.status(404).json({ error: 'Could not calculate distance' });
    }

    const element = response.data.rows[0].elements[0];
    
    res.json({
      distance: element.distance.value / 1609.34, // Convert meters to miles
      duration: element.duration.text
    });
  } catch (error) {
    console.error('Error calculating distance:', error);
    res.status(500).json({ error: 'Failed to calculate distance' });
  }
});

export default router;
