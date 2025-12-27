// FAO Standard Codes and Species Data for BlueOS
// Reference: FAO ASFIS Species List and ISSCFG Fishing Gear Codes

// FAO Species with codes, scientific names, and images
export const FAO_SPECIES = [
  {
    code: 'YFT',
    name: 'Yellowfin Tuna',
    scientificName: 'Thunnus albacares',
    localName: 'Tuna',
    image: '/species/tuna.png',
    category: 'Tuna'
  },
  {
    code: 'SKJ',
    name: 'Skipjack Tuna',
    scientificName: 'Katsuwonus pelamis',
    localName: 'Skipjack',
    image: '/species/skipjack.png',
    category: 'Tuna'
  },
  {
    code: 'BET',
    name: 'Bigeye Tuna',
    scientificName: 'Thunnus obesus',
    localName: 'Bigeye',
    image: '/species/bigeye.png',
    category: 'Tuna'
  },
  {
    code: 'GRO',
    name: 'Grouper',
    scientificName: 'Epinephelus spp.',
    localName: 'Grouper',
    image: '/species/grouper.png',
    category: 'Reef Fish'
  },
  {
    code: 'SNP',
    name: 'Snapper',
    scientificName: 'Lutjanus spp.',
    localName: 'Snapper',
    image: '/species/snapper.png',
    category: 'Reef Fish'
  },
  {
    code: 'COM',
    name: 'Seer Fish',
    scientificName: 'Scomberomorus commerson',
    localName: 'King Mackerel / Seer',
    image: '/species/seerfish.png',
    category: 'Mackerel'
  },
  {
    code: 'SWO',
    name: 'Swordfish',
    scientificName: 'Xiphias gladius',
    localName: 'Swordfish',
    image: '/species/swordfish.png',
    category: 'Billfish'
  },
  {
    code: 'SAI',
    name: 'Sailfish',
    scientificName: 'Istiophorus platypterus',
    localName: 'Sailfish',
    image: '/species/sailfish.png',
    category: 'Billfish'
  },
  {
    code: 'DOL',
    name: 'Mahi-mahi',
    scientificName: 'Coryphaena hippurus',
    localName: 'Dolphinfish',
    image: '/species/mahimahi.png',
    category: 'Pelagic'
  },
  {
    code: 'CBA',
    name: 'Cobia',
    scientificName: 'Rachycentron canadum',
    localName: 'Cobia',
    image: '/species/cobia.png',
    category: 'Pelagic'
  },
  {
    code: 'POB',
    name: 'Pomfret',
    scientificName: 'Pampus argenteus',
    localName: 'Silver Pomfret',
    image: '/species/pomfret.png',
    category: 'Pomfret'
  },
  {
    code: 'MAC',
    name: 'Indian Mackerel',
    scientificName: 'Rastrelliger kanagurta',
    localName: 'Mackerel',
    image: '/species/mackerel.png',
    category: 'Mackerel'
  },
  {
    code: 'SAR',
    name: 'Sardine',
    scientificName: 'Sardinella spp.',
    localName: 'Oil Sardine',
    image: '/species/sardine.png',
    category: 'Small Pelagic'
  },
  {
    code: 'SQU',
    name: 'Squid',
    scientificName: 'Loligo spp.',
    localName: 'Squid',
    image: '/species/squid.png',
    category: 'Cephalopod'
  },
  {
    code: 'CTL',
    name: 'Cuttlefish',
    scientificName: 'Sepia spp.',
    localName: 'Cuttlefish',
    image: '/species/cuttlefish.png',
    category: 'Cephalopod'
  },
  {
    code: 'OCT',
    name: 'Octopus',
    scientificName: 'Octopus spp.',
    localName: 'Octopus',
    image: '/species/octopus.png',
    category: 'Cephalopod'
  },
  {
    code: 'PEN',
    name: 'Penaeid Shrimp',
    scientificName: 'Penaeus spp.',
    localName: 'Prawns',
    image: '/species/prawns.png',
    category: 'Crustacean'
  },
  {
    code: 'LOB',
    name: 'Spiny Lobster',
    scientificName: 'Panulirus spp.',
    localName: 'Lobster',
    image: '/species/lobster.png',
    category: 'Crustacean'
  },
  {
    code: 'CRB',
    name: 'Blue Swimming Crab',
    scientificName: 'Portunus pelagicus',
    localName: 'Crab',
    image: '/species/crab.png',
    category: 'Crustacean'
  },
  {
    code: 'BAR',
    name: 'Barracuda',
    scientificName: 'Sphyraena spp.',
    localName: 'Barracuda',
    image: '/species/barracuda.png',
    category: 'Pelagic'
  },
  {
    code: 'ANE',
    name: 'Anchovy',
    scientificName: 'Stolephorus spp.',
    localName: 'Anchovy',
    image: '/species/anchovy.png',
    category: 'Small Pelagic'
  },
  {
    code: 'TRE',
    name: 'Trevally',
    scientificName: 'Caranx spp.',
    localName: 'Horse Mackerel',
    image: '/species/trevally.png',
    category: 'Pelagic'
  }
];

// FAO ISSCFG Fishing Gear/Method Codes
export const FAO_FISHING_METHODS = [
  {
    code: 'OTB',
    name: 'Bottom Otter Trawl',
    category: 'Trawling',
    description: 'Bottom trawl with otter boards'
  },
  {
    code: 'OTM',
    name: 'Midwater Otter Trawl',
    category: 'Trawling',
    description: 'Midwater/pelagic trawl'
  },
  {
    code: 'PTB',
    name: 'Pair Trawl',
    category: 'Trawling',
    description: 'Bottom pair trawl'
  },
  {
    code: 'GNS',
    name: 'Set Gillnet',
    category: 'Gillnetting',
    description: 'Anchored gillnet'
  },
  {
    code: 'GND',
    name: 'Drift Gillnet',
    category: 'Gillnetting',
    description: 'Drifting gillnet'
  },
  {
    code: 'GTR',
    name: 'Trammel Net',
    category: 'Gillnetting',
    description: 'Trammel net'
  },
  {
    code: 'LLS',
    name: 'Set Longline',
    category: 'Longlining',
    description: 'Bottom set longline'
  },
  {
    code: 'LLD',
    name: 'Drifting Longline',
    category: 'Longlining',
    description: 'Surface drifting longline'
  },
  {
    code: 'PS',
    name: 'Purse Seine',
    category: 'Purse Seining',
    description: 'Surrounding net with purse line'
  },
  {
    code: 'RN',
    name: 'Ring Net',
    category: 'Purse Seining',
    description: 'Ring net without purse line'
  },
  {
    code: 'FPO',
    name: 'Pot/Trap',
    category: 'Trap Fishing',
    description: 'Fish pots and traps'
  },
  {
    code: 'LHP',
    name: 'Handline',
    category: 'Handlining',
    description: 'Hand operated pole and line'
  },
  {
    code: 'LTL',
    name: 'Trolling Line',
    category: 'Handlining',
    description: 'Trolling lines'
  },
  {
    code: 'PLN',
    name: 'Pole and Line',
    category: 'Pole and Line',
    description: 'Pole and line with live bait'
  },
  {
    code: 'SSC',
    name: 'Scottish Seine',
    category: 'Seine',
    description: 'Scottish/fly dragging seine'
  },
  {
    code: 'SB',
    name: 'Beach Seine',
    category: 'Seine',
    description: 'Shore operated seine'
  }
];

// FAO Major Fishing Areas for Indian Ocean
export const FAO_FISHING_ZONES = {
  51: {
    name: 'Western Indian Ocean',
    description: 'FAO Area 51 - Western Indian Ocean',
    bounds: {
      west: 30,
      east: 80,
      north: 30,
      south: -45
    }
  },
  57: {
    name: 'Eastern Indian Ocean',
    description: 'FAO Area 57 - Eastern Indian Ocean',
    bounds: {
      west: 80,
      east: 150,
      north: 30,
      south: -55
    }
  },
  71: {
    name: 'Western Central Pacific',
    description: 'FAO Area 71 - Western Central Pacific',
    bounds: {
      west: 100,
      east: 180,
      north: 30,
      south: 0
    }
  }
};

// Function to determine FAO zone from GPS coordinates
export const getFAOZone = (lat, lng) => {
  // Indian coast is primarily in FAO Zone 51 (West) and 57 (East)
  // The dividing line is approximately 80°E
  
  if (lat === null || lng === null || lat === undefined || lng === undefined) {
    return null;
  }
  
  // Check for Indian Ocean zones
  if (lng >= 30 && lng < 80) {
    // Western Indian Ocean
    return {
      code: 51,
      name: 'Western Indian Ocean',
      subArea: getSubArea51(lat, lng)
    };
  } else if (lng >= 80 && lng < 150) {
    // Eastern Indian Ocean (Bay of Bengal, Andaman Sea)
    return {
      code: 57,
      name: 'Eastern Indian Ocean',
      subArea: getSubArea57(lat, lng)
    };
  } else if (lng >= 150 || lng < 30) {
    // Pacific or Atlantic (rare for Indian fishers)
    return {
      code: 71,
      name: 'Western Central Pacific',
      subArea: null
    };
  }
  
  return { code: 51, name: 'Indian Ocean', subArea: null };
};

// Sub-areas for FAO Zone 51
const getSubArea51 = (lat, lng) => {
  if (lat > 20) {
    return '51.1'; // Arabian Sea (North)
  } else if (lat > 10) {
    return '51.2'; // Laccadive Sea
  } else if (lat > 0) {
    return '51.3'; // South-West India Coast
  }
  return '51.4'; // Southern Indian Ocean
};

// Sub-areas for FAO Zone 57
const getSubArea57 = (lat, lng) => {
  if (lat > 20 && lng < 95) {
    return '57.1'; // Bay of Bengal (North)
  } else if (lat > 10 && lng < 100) {
    return '57.2'; // Bay of Bengal (Central)
  } else if (lat > 0 && lng < 100) {
    return '57.3'; // Bay of Bengal (South) / Andaman Sea
  }
  return '57.4'; // Eastern Indian Ocean
};

// Indian Ports with coordinates
export const PORTS = [
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, faoZone: 57 },
  { name: 'Nagapattinam', state: 'Tamil Nadu', lat: 10.7672, lng: 79.8449, faoZone: 57 },
  { name: 'Thuthookudi', state: 'Tamil Nadu', lat: 8.7642, lng: 78.1348, faoZone: 51 },
  { name: 'Ramanathapuram', state: 'Tamil Nadu', lat: 9.3639, lng: 78.8395, faoZone: 51 },
  { name: 'Kanyakumari', state: 'Tamil Nadu', lat: 8.0883, lng: 77.5385, faoZone: 51 },
  { name: 'Cuddalore', state: 'Tamil Nadu', lat: 11.7480, lng: 79.7714, faoZone: 57 },
  { name: 'Karaikal', state: 'Puducherry', lat: 10.9254, lng: 79.8380, faoZone: 57 },
  { name: 'Puducherry', state: 'Puducherry', lat: 11.9416, lng: 79.8083, faoZone: 57 },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185, faoZone: 57 },
  { name: 'Kakinada', state: 'Andhra Pradesh', lat: 16.9891, lng: 82.2475, faoZone: 57 },
  { name: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673, faoZone: 51 },
  { name: 'Mangalore', state: 'Karnataka', lat: 12.9141, lng: 74.8560, faoZone: 51 },
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777, faoZone: 51 },
  { name: 'Veraval', state: 'Gujarat', lat: 20.9064, lng: 70.3629, faoZone: 51 }
];

// Quality grades following international standards
export const QUALITY_GRADES = [
  { code: 'A', name: 'Premium/Export Grade', description: 'Excellent quality, suitable for export' },
  { code: 'B', name: 'Standard Grade', description: 'Good quality for domestic market' },
  { code: 'C', name: 'Processing Grade', description: 'Suitable for processing only' },
  { code: 'R', name: 'Rejected', description: 'Not fit for human consumption' }
];

// Freshness indicators (EU standard)
export const FRESHNESS_GRADES = [
  { code: 'E', name: 'Extra', score: '0-1', description: 'Just caught, highest freshness' },
  { code: 'A', name: 'Excellent', score: '1-2', description: 'Very fresh, minimal changes' },
  { code: 'B', name: 'Good', score: '2-3', description: 'Fresh, acceptable for sale' },
  { code: 'C', name: 'Fair', score: '3-4', description: 'Showing signs of deterioration' }
];

// Temperature requirements by species category
export const TEMPERATURE_REQUIREMENTS = {
  'Tuna': { min: -2, max: 4, optimal: 0 },
  'Reef Fish': { min: 0, max: 4, optimal: 2 },
  'Mackerel': { min: -1, max: 3, optimal: 0 },
  'Billfish': { min: -2, max: 4, optimal: 0 },
  'Pelagic': { min: 0, max: 4, optimal: 2 },
  'Pomfret': { min: 0, max: 4, optimal: 2 },
  'Small Pelagic': { min: 0, max: 4, optimal: 2 },
  'Cephalopod': { min: -2, max: 2, optimal: 0 },
  'Crustacean': { min: 0, max: 4, optimal: 2 }
};

// Helper function to get species by code
export const getSpeciesByCode = (code) => {
  return FAO_SPECIES.find(s => s.code === code) || null;
};

// Helper function to get species by name (partial match)
export const searchSpecies = (query) => {
  if (!query) return FAO_SPECIES;
  const q = query.toLowerCase();
  return FAO_SPECIES.filter(s => 
    s.name.toLowerCase().includes(q) || 
    s.code.toLowerCase().includes(q) ||
    s.localName.toLowerCase().includes(q) ||
    s.scientificName.toLowerCase().includes(q)
  );
};

// Helper function to get fishing method by code
export const getFishingMethodByCode = (code) => {
  return FAO_FISHING_METHODS.find(m => m.code === code) || null;
};

// Format species display string
export const formatSpeciesDisplay = (species) => {
  if (!species) return '';
  if (typeof species === 'string') {
    const found = FAO_SPECIES.find(s => s.code === species || s.name === species);
    if (found) return `${found.code} (${found.name})`;
    return species;
  }
  return `${species.code} (${species.name})`;
};

// Format fishing method display string
export const formatFishingMethod = (method) => {
  if (!method) return '';
  if (typeof method === 'string') {
    const found = FAO_FISHING_METHODS.find(m => m.code === method || m.name === method || m.category === method);
    if (found) return `${found.code} - ${found.name}`;
    return method;
  }
  return `${method.code} - ${method.name}`;
};
