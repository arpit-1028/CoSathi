/**
 * =====================================================================
 * CoSathi Geo Service: Google Maps & Geographic Distance Engine
 * =====================================================================
 *
 * Core Capabilities:
 * 1. Geographic Distance & Duration calculation (Google Maps Distance Matrix with spherical Haversine fallback).
 * 2. Forward Geocoding & Address Suggestions (Google Geocoding API with local NCR catalogue fallback).
 * 3. Reverse Geocoding ([lng, lat] -> Structured Address).
 * 4. Waypoint Route Interpolation & En-Route GPS Simulation for active jobs.
 * 5. Strict Zero-Surveillance Privacy: Coords rounded to safe precision (~100m) and restricted to active assigned pairs.
 */

// Well-known Delhi-NCR landmarks and coordinates for instant offline fallback
const NCR_LOCAL_CATALOGUE = [
  {
    name: 'Connaught Place',
    formattedAddress: 'Connaught Place, Central Delhi, New Delhi, 110001',
    city: 'Delhi',
    pincode: '110001',
    coordinates: [77.2197, 28.6315], // [lng, lat]
    keywords: ['connaught', 'cp', 'rajiv chowk', 'barakhamba', 'central delhi'],
  },
  {
    name: 'Lajpat Nagar',
    formattedAddress: 'Lajpat Nagar II, Central South Delhi, New Delhi, 110024',
    city: 'Delhi',
    pincode: '110024',
    coordinates: [77.2433, 28.5700],
    keywords: ['lajpat', 'lajpat nagar', 'central market', 'amar colony', 'defence colony'],
  },
  {
    name: 'Hauz Khas',
    formattedAddress: 'Hauz Khas Enclave, South Delhi, New Delhi, 110016',
    city: 'Delhi',
    pincode: '110016',
    coordinates: [77.2065, 28.5494],
    keywords: ['hauz khas', 'iit delhi', 'sda', 'green park', 'aurobindo'],
  },
  {
    name: 'Rohini Sector 7',
    formattedAddress: 'Sector 7, Rohini, North West Delhi, Delhi, 110085',
    city: 'Delhi',
    pincode: '110085',
    coordinates: [77.1147, 28.7041],
    keywords: ['rohini', 'pitampura', 'sector 7', 'north west delhi'],
  },
  {
    name: 'Dwarka Sector 10',
    formattedAddress: 'Sector 10, Dwarka, South West Delhi, Delhi, 110075',
    city: 'Delhi',
    pincode: '110075',
    coordinates: [77.0601, 28.5823],
    keywords: ['dwarka', 'sector 10', 'janakpuri', 'uttam nagar'],
  },
  {
    name: 'Mayur Vihar Phase 1',
    formattedAddress: 'Mayur Vihar Phase 1, East Delhi, Delhi, 110091',
    city: 'Delhi',
    pincode: '110091',
    coordinates: [77.2946, 28.6083],
    keywords: ['mayur vihar', 'akshardham', 'east delhi', 'patparganj'],
  },
  {
    name: 'Sector 62 Noida',
    formattedAddress: 'Sector 62, Noida, Gautam Buddha Nagar, Uttar Pradesh, 201309',
    city: 'Noida',
    pincode: '201309',
    coordinates: [77.3639, 28.6280],
    keywords: ['sector 62', 'noida 62', 'noida', 'electronic city'],
  },
  {
    name: 'Indirapuram Ghaziabad',
    formattedAddress: 'Indirapuram, Ghaziabad, Uttar Pradesh, 201014',
    city: 'Ghaziabad',
    pincode: '201014',
    coordinates: [77.3713, 28.6415],
    keywords: ['indirapuram', 'vaishali', 'ghaziabad', 'shipra'],
  },
  {
    name: 'Cyber City Gurugram',
    formattedAddress: 'DLF Cyber City, DLF Phase 2, Sector 24, Gurugram, Haryana, 122002',
    city: 'Gurugram',
    pincode: '122002',
    coordinates: [77.0878, 28.4952],
    keywords: ['cyber city', 'gurgaon', 'gurugram', 'dlf', 'phase 2'],
  },
  {
    name: 'Saket',
    formattedAddress: 'Press Enclave Marg, Saket, South Delhi, New Delhi, 110017',
    city: 'Delhi',
    pincode: '110017',
    coordinates: [77.2150, 28.5244],
    keywords: ['saket', 'select citywalk', 'malviya nagar', 'max hospital'],
  },
];

/**
 * Spherical Haversine distance in kilometers
 */
const calculateHaversineKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return 3.5;
  }
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
};

/**
 * Privacy safe coordinate rounding (~100m resolution)
 * Prevents exact surveillance of private worker residential coordinates
 */
const roundToPrivacyCoord = (coord) => {
  if (typeof coord !== 'number') return coord;
  return Math.round(coord * 1000) / 1000;
};

/**
 * Sanitize coordinates for public/customer response
 */
const sanitizeLocationForCustomer = (coords) => {
  if (!Array.isArray(coords) || coords.length < 2) return [77.209, 28.614];
  return [roundToPrivacyCoord(coords[0]), roundToPrivacyCoord(coords[1])];
};

/**
 * Distance & Duration Calculation:
 * Attempts Google Distance Matrix API if valid key is set.
 * Otherwise uses calibrated urban road factor (Haversine * 1.28) and Delhi average speed (22 km/h).
 */
const getDistanceAndDuration = async (originCoords, destCoords) => {
  // Coords in [lng, lat] format
  const [oLng, oLat] = originCoords;
  const [dLng, dLat] = destCoords;

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const hasValidKey = apiKey && apiKey !== 'your_google_maps_api_key_here' && apiKey.length > 15;

  if (hasValidKey && typeof fetch === 'function') {
    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${oLat},${oLng}&destinations=${dLat},${dLng}&mode=driving&language=en&key=${apiKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
      if (res.ok) {
        const data = await res.json();
        if (
          data.status === 'OK' &&
          data.rows?.[0]?.elements?.[0]?.status === 'OK'
        ) {
          const element = data.rows[0].elements[0];
          const distanceKm = Math.round((element.distance.value / 1000) * 10) / 10;
          const durationMins = Math.max(1, Math.round(element.duration.value / 60));
          return {
            distanceKm,
            durationMinutes: durationMins,
            durationText: `${durationMins} mins`,
            distanceText: `${distanceKm} km`,
            isCalculatedByGoogle: true,
            source: 'google_distance_matrix',
          };
        }
      }
    } catch (err) {
      console.warn('[GeoService] Google Maps API request failed, falling back to local model:', err.message);
    }
  }

  // Local Calibrated Urban Fallback
  const straightLineKm = calculateHaversineKm(oLat, oLng, dLat, dLng);
  // Real road route is ~1.28x straight line in Delhi-NCR street layout
  const roadDistanceKm = Math.max(0.4, Math.round(straightLineKm * 1.28 * 10) / 10);
  // Average urban speed with traffic is ~22 km/h + 2 minutes initial traffic dispatch delay
  const durationMinutes = Math.max(2, Math.round((roadDistanceKm / 22) * 60 + 2));

  return {
    distanceKm: roadDistanceKm,
    durationMinutes,
    durationText: `${durationMinutes} mins`,
    distanceText: `${roadDistanceKm} km`,
    isCalculatedByGoogle: false,
    source: 'haversine_calibrated_urban',
  };
};

/**
 * Forward Geocode Address String -> Coordinates & Details
 */
const geocodeAddress = async (query) => {
  if (!query || typeof query !== 'string') {
    return {
      success: true,
      result: NCR_LOCAL_CATALOGUE[1], // Lajpat Nagar default
      source: 'default_fallback',
    };
  }

  const cleanQuery = query.toLowerCase().trim();

  // 1. Try Google Geocoding API if key configured
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const hasValidKey = apiKey && apiKey !== 'your_google_maps_api_key_here' && apiKey.length > 15;

  if (hasValidKey && typeof fetch === 'function') {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&components=country:IN&key=${apiKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'OK' && data.results?.length > 0) {
          const top = data.results[0];
          const lat = top.geometry.location.lat;
          const lng = top.geometry.location.lng;

          // Extract postal code and city
          let pincode = '110001';
          let city = 'Delhi';
          for (const comp of top.address_components) {
            if (comp.types.includes('postal_code')) pincode = comp.long_name;
            if (comp.types.includes('locality')) city = comp.long_name;
          }

          return {
            success: true,
            result: {
              name: top.formatted_address.split(',')[0],
              formattedAddress: top.formatted_address,
              city,
              pincode,
              coordinates: [lng, lat],
            },
            source: 'google_geocoding',
          };
        }
      }
    } catch (err) {
      console.warn('[GeoService] Google Geocoding failed, falling back to catalogue:', err.message);
    }
  }

  // 2. Catalogue search
  const found = NCR_LOCAL_CATALOGUE.find((item) =>
    item.keywords.some((kw) => cleanQuery.includes(kw))
  );

  if (found) {
    return {
      success: true,
      result: {
        ...found,
        formattedAddress: query.length > found.formattedAddress.length ? query : found.formattedAddress,
      },
      source: 'ncr_local_catalogue',
    };
  }

  // 3. Fallback to Delhi default
  return {
    success: true,
    result: {
      name: query,
      formattedAddress: `${query}, Delhi NCR, India`,
      city: 'Delhi',
      pincode: '110024',
      coordinates: [77.2433, 28.5700], // Lajpat Nagar center
    },
    source: 'fuzzy_local_fallback',
  };
};

/**
 * Reverse Geocode: Coordinates [lng, lat] -> Structured Address
 */
const reverseGeocode = async (lng, lat) => {
  if (lng === undefined || lat === undefined) {
    return {
      success: true,
      formattedAddress: 'Lajpat Nagar II, New Delhi, 110024',
      city: 'Delhi',
      pincode: '110024',
    };
  }

  // Find closest landmark in NCR catalogue
  let closest = NCR_LOCAL_CATALOGUE[0];
  let minDistance = Infinity;

  for (const item of NCR_LOCAL_CATALOGUE) {
    const dist = calculateHaversineKm(lat, lng, item.coordinates[1], item.coordinates[0]);
    if (dist < minDistance) {
      minDistance = dist;
      closest = item;
    }
  }

  return {
    success: true,
    formattedAddress: `${closest.name}, Near Landmark (approx ${Math.round(minDistance * 10) / 10} km), ${closest.city}, ${closest.pincode}`,
    city: closest.city,
    pincode: closest.pincode,
    nearestLandmark: closest.name,
    distanceToLandmarkKm: Math.round(minDistance * 10) / 10,
    coordinates: [lng, lat],
  };
};

/**
 * Generate interpolated route waypoints between worker start and customer destination
 * Used for live demo GPS simulation when physical en-route tracking is simulated
 */
const generateRouteWaypoints = (startCoords, endCoords, steps = 8) => {
  const [startLng, startLat] = startCoords;
  const [endLng, endLat] = endCoords;

  const waypoints = [];
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    // Add realistic subtle road curvature using sinusoidal wiggle
    const curveWiggle = Math.sin(ratio * Math.PI) * 0.0035;
    const lng = startLng + (endLng - startLng) * ratio + curveWiggle;
    const lat = startLat + (endLat - startLat) * ratio;

    // Remaining distance & duration
    const distRemaining = calculateHaversineKm(lat, lng, endLat, endLng);
    const etaMins = Math.max(1, Math.round((distRemaining / 22) * 60 + 1));

    waypoints.push({
      step: i,
      totalSteps: steps,
      progressPercent: Math.round(ratio * 100),
      coordinates: [roundToPrivacyCoord(lng), roundToPrivacyCoord(lat)],
      distanceRemainingKm: Math.round(distRemaining * 10) / 10,
      etaMinutes: etaMins,
      isArrived: i === steps,
    });
  }

  return waypoints;
};

module.exports = {
  calculateHaversineKm,
  roundToPrivacyCoord,
  sanitizeLocationForCustomer,
  getDistanceAndDuration,
  geocodeAddress,
  reverseGeocode,
  generateRouteWaypoints,
  NCR_LOCAL_CATALOGUE,
};
