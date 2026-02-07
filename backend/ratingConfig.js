// ============================================================================
// HOTEL INSURANCE RATING CONFIGURATION
// ============================================================================
// All rating variables in one place. Edit values here to adjust premiums
// across the entire application. No code changes needed elsewhere.
//
// MARKET POSITIONING:
// These rates reflect competitive admitted market pricing.
// E&S or distressed accounts may be 25-50% higher.
//
// SOURCES:
//   - Market data and industry benchmarks (admitted carrier calibration)
//   - ISO Commercial Lines Manual (CLM) — construction class relativities
//   - NFSA (National Fire Sprinkler Assoc.) — sprinkler vs. non-sprinkler relativities
//   - RSMeans 2025 construction cost data
//   - HVS U.S. Hotel Development Cost Survey 2025
//   - CBRE Hotels — Insurance Cost PAR benchmarks (2022-2024)
//   - STR/CoStar — RevPAR, ADR, occupancy by chain scale (2024-2025)
//   - NAIC — roof age surcharge data
//   - ISO PPC (Public Protection Classification) relativities
// ============================================================================

const ratingConfig = {

  // --------------------------------------------------------------------------
  // MARKET POSITIONING NOTE
  // --------------------------------------------------------------------------
  marketNote: 'These rates reflect competitive admitted market pricing. ' +
    'E&S or distressed accounts may be 25-50% higher.',

  // --------------------------------------------------------------------------
  // 1. SERVICE TYPE DEFINITIONS
  // --------------------------------------------------------------------------
  serviceTypes: {
    'full-service': {
      label: 'Full-Service Hotel',
      description: 'Full food & beverage, meeting space, concierge, bell staff',
      examples: 'Marriott, Hilton, Hyatt Regency, Sheraton, Embassy Suites',
    },
    'select-service': {
      label: 'Select-Service Hotel',
      description: 'Limited F&B (grab-and-go or breakfast only), fitness, pool',
      examples: 'Courtyard, Hilton Garden Inn, Hyatt Place',
    },
    'limited-service': {
      label: 'Limited-Service Hotel',
      description: 'Minimal amenities, continental breakfast, basic fitness',
      examples: 'Hampton Inn, Holiday Inn Express, La Quinta',
    },
    'extended-stay': {
      label: 'Extended Stay',
      description: 'In-room kitchenettes, weekly/monthly rates, limited daily housekeeping',
      examples: 'Extended Stay America, TownePlace Suites, Candlewood Suites, Residence Inn',
    },
  },

  // --------------------------------------------------------------------------
  // 2. PROPERTY BASE RATES (per $100, sprinklered)
  // --------------------------------------------------------------------------
  // These are BUILDING base rates. Contents and BI use multipliers on top.
  //   Contents (BPP) rate = base rate × 1.68
  //   Business Income rate = base rate × 1.38
  // Non-sprinklered buildings receive a 60% surcharge on these rates.
  // --------------------------------------------------------------------------
  propertyBaseRates: {
    'Frame':                      0.38,
    'Joisted Masonry':            0.24,
    'Non-Combustible':            0.16,
    'Masonry Non-Combustible':    0.14,
    'Modified Fire Resistive':    0.125,
    'Fire Resistive':             0.115,
  },

  // Contents and BI rate multipliers (applied on top of building base rate)
  contentsRateMultiplier: 1.68,
  biRateMultiplier: 1.38,

  // Equipment breakdown — flat annual premium by service type
  equipmentBreakdown: {
    'full-service':     7500,
    'select-service':   5000,
    'limited-service':  3500,
    'extended-stay':    4500,
  },

  nonSprinkleredSurcharge: 0.60,

  // --------------------------------------------------------------------------
  // 3. TIV (TOTAL INSURABLE VALUE) BY SERVICE TYPE — PER ROOM
  // --------------------------------------------------------------------------
  // All TIV components are calculated on a per-room basis.
  // Building, Contents, and BI values by service type.
  // --------------------------------------------------------------------------
  tivMultipliers: {
    buildingCostPerRoom: {
      'full-service':     323000,
      'select-service':   200000,
      'limited-service':  150000,
      'extended-stay':    175000,
    },
    defaultBuildingCostPerRoom: 323000,

    contentsPerRoom: {
      'full-service':     19000,
      'select-service':   14000,
      'limited-service':  10000,
      'extended-stay':    16000,
    },
    defaultContentsPerRoom: 19000,

    businessIncomePerRoom: {
      'full-service':     24000,
      'select-service':   18000,
      'limited-service':  14000,
      'extended-stay':    20000,
    },
    defaultBIPerRoom: 24000,
  },

  // --------------------------------------------------------------------------
  // 4. BRAND LOOKUP TABLE
  // --------------------------------------------------------------------------
  // 14 brands with default property characteristics for auto-population.
  // --------------------------------------------------------------------------
  brandDefaults: {
    'Marriott': {
      service_type: 'full-service',
      construction: 'Masonry Non-Combustible',
      stories: 8,
      rooms: 300,
      amenities: { pool: true, restaurant: true, fitness_center: true, spa: false, business_center: true, meeting_space: true },
    },
    'Hilton': {
      service_type: 'full-service',
      construction: 'Masonry Non-Combustible',
      stories: 8,
      rooms: 280,
      amenities: { pool: true, restaurant: true, fitness_center: true, spa: false, business_center: true, meeting_space: true },
    },
    'Hyatt': {
      service_type: 'full-service',
      construction: 'Fire Resistive',
      stories: 10,
      rooms: 300,
      amenities: { pool: true, restaurant: true, fitness_center: true, spa: true, business_center: true, meeting_space: true },
    },
    'IHG': {
      service_type: 'full-service',
      construction: 'Masonry Non-Combustible',
      stories: 6,
      rooms: 250,
      amenities: { pool: true, restaurant: true, fitness_center: true, spa: false, business_center: true, meeting_space: true },
    },
    'Wyndham': {
      service_type: 'select-service',
      construction: 'Masonry Non-Combustible',
      stories: 4,
      rooms: 150,
      amenities: { pool: true, restaurant: false, fitness_center: true, spa: false, business_center: true, meeting_space: false },
    },
    'Choice': {
      service_type: 'limited-service',
      construction: 'Joisted Masonry',
      stories: 3,
      rooms: 100,
      amenities: { pool: true, restaurant: false, fitness_center: true, spa: false, business_center: false, meeting_space: false },
    },
    'Best Western': {
      service_type: 'limited-service',
      construction: 'Joisted Masonry',
      stories: 3,
      rooms: 80,
      amenities: { pool: true, restaurant: false, fitness_center: true, spa: false, business_center: false, meeting_space: false },
    },
    'La Quinta': {
      service_type: 'limited-service',
      construction: 'Masonry Non-Combustible',
      stories: 3,
      rooms: 120,
      amenities: { pool: true, restaurant: false, fitness_center: true, spa: false, business_center: true, meeting_space: false },
    },
    'Extended Stay America': {
      service_type: 'extended-stay',
      construction: 'Non-Combustible',
      stories: 3,
      rooms: 120,
      amenities: { pool: false, restaurant: false, fitness_center: true, spa: false, business_center: false, meeting_space: false },
    },
    'Residence Inn': {
      service_type: 'extended-stay',
      construction: 'Masonry Non-Combustible',
      stories: 4,
      rooms: 120,
      amenities: { pool: true, restaurant: false, fitness_center: true, spa: false, business_center: true, meeting_space: true },
    },
    'Embassy Suites': {
      service_type: 'full-service',
      construction: 'Fire Resistive',
      stories: 8,
      rooms: 220,
      amenities: { pool: true, restaurant: true, fitness_center: true, spa: false, business_center: true, meeting_space: true },
    },
    'Hampton Inn': {
      service_type: 'limited-service',
      construction: 'Masonry Non-Combustible',
      stories: 4,
      rooms: 120,
      amenities: { pool: true, restaurant: false, fitness_center: true, spa: false, business_center: true, meeting_space: false },
    },
    'Holiday Inn Express': {
      service_type: 'limited-service',
      construction: 'Masonry Non-Combustible',
      stories: 4,
      rooms: 100,
      amenities: { pool: true, restaurant: false, fitness_center: true, spa: false, business_center: true, meeting_space: false },
    },
    'Courtyard by Marriott': {
      service_type: 'select-service',
      construction: 'Masonry Non-Combustible',
      stories: 4,
      rooms: 150,
      amenities: { pool: true, restaurant: true, fitness_center: true, spa: false, business_center: true, meeting_space: true },
    },
    'Homewood Suites': {
      service_type: 'full-service',
      construction: 'Masonry Non-Combustible',
      stories: 5,
      rooms: 130,
      amenities: { pool: true, restaurant: false, fitness_center: true, spa: false, business_center: true, meeting_space: true },
    },
  },

  // --------------------------------------------------------------------------
  // 5. BRAND TIER CLASSIFICATION
  // --------------------------------------------------------------------------
  brandTier: {
    luxury: ['Ritz-Carlton', 'Four Seasons', 'St. Regis', 'Waldorf Astoria', 'Park Hyatt', 'Mandarin Oriental', 'Peninsula', 'Rosewood', 'Aman', 'Montage', 'Auberge'],
    upperUpscale: ['JW Marriott', 'W Hotels', 'Westin', 'Grand Hyatt', 'Conrad', 'InterContinental', 'Kimpton', 'Loews', 'Omni'],
    upscale: ['Marriott', 'Hilton', 'Hyatt Regency', 'Sheraton', 'Renaissance', 'Autograph Collection', 'Curio', 'Tribute'],
    upperMidscale: ['Courtyard', 'Hilton Garden Inn', 'Hampton Inn', 'Hyatt Place', 'Holiday Inn', 'Crowne Plaza', 'Best Western Plus'],
    midscale: ['La Quinta', 'Best Western', 'Wyndham', 'Ramada', 'Radisson', 'Country Inn'],
    economy: ['Comfort Inn', 'Quality Inn', 'Days Inn', 'Super 8', 'Motel 6', 'Red Roof Inn', 'Econo Lodge', 'Microtel'],
  },

  fullServiceTiers: ['luxury', 'upperUpscale', 'upscale'],

  // Brand tier property rate multipliers — luxury and upper-upscale
  // properties have significantly higher replacement costs and loss exposure.
  brandTierPropertyMultiplier: {
    luxury:       1.50,
    upperUpscale: 1.25,
    upscale:      1.00,
    upperMidscale: 1.00,
    midscale:     1.00,
    economy:      1.00,
  },

  // --------------------------------------------------------------------------
  // 6. GEOGRAPHIC MODIFIERS BY STATE
  // --------------------------------------------------------------------------
  // PA = 1.0 baseline. All other states relative to PA.
  // FL and TX use 3-tier structure (inland/coastal/TWIA).
  // SE coastal states (SC, NC, GA, AL, MS, LA) use inland/coastal split.
  // --------------------------------------------------------------------------
  geographicModifiers: {
    // Midwest / Mid-Atlantic baseline (1.0)
    'PA': 1.00,  'OH': 1.00,  'MI': 1.00,  'IN': 1.00,
    'WI': 1.00,  'MN': 1.00,  'IL': 1.00,

    // Northeast (1.15)
    'NY': 1.15,  'NJ': 1.15,  'CT': 1.15,  'MA': 1.15,

    // High-CAT states — use inland value as base
    'FL': 1.45,
    'TX': 1.10,
    'CA': 1.60,

    // Southeast — inland values
    'GA': 1.20,  'SC': 1.20,  'NC': 1.20,
    'AL': 1.30,  'MS': 1.30,  'LA': 1.50,

    // Other states
    'AK': 1.20,  'AZ': 0.90,  'AR': 1.10,  'CO': 1.00,
    'DE': 1.00,  'DC': 1.10,  'HI': 1.40,  'ID': 0.85,
    'IA': 1.00,  'KS': 1.10,  'KY': 0.95,  'ME': 0.90,
    'MD': 1.05,  'MO': 1.10,  'MT': 0.85,  'NE': 1.00,
    'NV': 0.90,  'NH': 0.95,  'NM': 0.85,  'ND': 0.90,
    'OK': 1.15,  'OR': 0.95,  'RI': 1.10,  'SD': 0.90,
    'TN': 1.00,  'UT': 0.85,  'VT': 0.90,  'VA': 1.05,
    'WA': 1.05,  'WV': 0.90,  'WY': 0.85,
  },

  // 3-tier geo modifiers for FL and TX (inland/coastal/TWIA)
  geoModifierTiers: {
    'FL': { inland: 1.45, coastal: 1.75, twia: 2.10 },
    'TX': { inland: 1.10, coastal: 1.40, twia: 1.70 },
  },

  // 2-tier geo modifiers for SE coastal states (inland/coastal)
  coastalGeoOverrides: {
    'SC': { inland: 1.20, coastal: 1.50 },
    'NC': { inland: 1.20, coastal: 1.50 },
    'GA': { inland: 1.20, coastal: 1.50 },
    'AL': { inland: 1.30, coastal: 1.60 },
    'MS': { inland: 1.30, coastal: 1.60 },
    'LA': { inland: 1.50, coastal: 1.80 },
  },

  defaultGeoModifier: 1.00,

  // States that support location_zone selection
  tieredGeoStates: ['FL', 'TX', 'SC', 'NC', 'GA', 'AL', 'MS', 'LA'],

  // --------------------------------------------------------------------------
  // 7. LOCATION TYPE MODIFIERS
  // --------------------------------------------------------------------------
  locationTypeModifiers: {
    'urban':          1.05,
    'suburban':       1.00,
    'rural':          0.95,
    'resort-coastal': 1.10,
  },

  // --------------------------------------------------------------------------
  // 8. BUILDING AGE MODIFIERS
  // --------------------------------------------------------------------------
  buildingAgeModifiers: [
    { maxAge: 10,  modifier: 1.00, label: '0-10 years (standard)' },
    { maxAge: 20,  modifier: 1.03, label: '11-20 years' },
    { maxAge: 30,  modifier: 1.06, label: '21-30 years' },
    { maxAge: 40,  modifier: 1.10, label: '31-40 years' },
    { maxAge: 999, modifier: 1.15, label: '40+ years' },
  ],

  // --------------------------------------------------------------------------
  // 9. ROOF AGE MODIFIERS
  // --------------------------------------------------------------------------
  roofAgeModifiers: [
    { maxAge: 5,   modifier: 0.95, label: '0-5 years (new roof credit)' },
    { maxAge: 10,  modifier: 1.00, label: '6-10 years (standard)' },
    { maxAge: 15,  modifier: 1.05, label: '11-15 years' },
    { maxAge: 20,  modifier: 1.10, label: '16-20 years (surcharge per industry data)' },
    { maxAge: 999, modifier: 1.20, label: '20+ years (many carriers move to ACV)' },
  ],

  // --------------------------------------------------------------------------
  // 10. PROTECTION CLASS MODIFIERS
  // --------------------------------------------------------------------------
  protectionClassModifiers: {
    1:  0.95,
    2:  0.95,
    3:  0.95,
    4:  1.00,
    5:  1.00,
    6:  1.00,
    7:  1.10,
    8:  1.10,
    9:  1.20,
    10: 1.35,
  },

  defaultProtectionClass: 4,

  // --------------------------------------------------------------------------
  // 11. STORIES MODIFIERS
  // --------------------------------------------------------------------------
  storiesModifiers: [
    { maxStories: 5,   modifier: 1.00, label: '1-5 stories' },
    { maxStories: 10,  modifier: 1.00, label: '6-10 stories' },
    { maxStories: 20,  modifier: 1.05, label: '11-20 stories' },
    { maxStories: 999, modifier: 1.10, label: '20+ stories (high-rise)' },
  ],

  // --------------------------------------------------------------------------
  // 12. GL RATES (per $1,000 revenue)
  // --------------------------------------------------------------------------
  // GL is applied to ROOM REVENUE only (not total hotel revenue).
  // Restaurant and liquor liability are calculated separately on F&B revenue
  // but included in the total GL premium as a single line item.
  // --------------------------------------------------------------------------
  glRates: {
    hotelWithPool:        9.50,
    hotelWithoutPool:     6.50,
    restaurantWithLiquor: 13.50,
    liquorLiability:      48.00,

    // F&B revenue as % of room revenue (for restaurant/liquor GL)
    fbRevenuePercent:     0.13,
    // Liquor sales as % of F&B revenue
    liquorSalesPercent:   0.40,

    // Resort activities GL surcharge (per $1,000 revenue) — applies when
    // resort offers excursions, water sports, golf, kids programs, or other
    // activities with elevated bodily injury exposure.
    resortActivitiesRate: 18.50,
    // Resort activities revenue as % of room revenue
    resortActivitiesRevenuePercent: 0.08,
  },

  // Room revenue per room by service type (for GL basis — NOT total hotel revenue)
  roomRevenuePerRoom: {
    'full-service':     33500,
    'select-service':   22000,
    'limited-service':  16000,
    'extended-stay':    18000,
  },
  defaultRoomRevenuePerRoom: 33500,

  // --------------------------------------------------------------------------
  // 13. UMBRELLA / EXCESS LIABILITY
  // --------------------------------------------------------------------------
  // Per-room base rates by limit tier, plus amenity surcharges.
  // If bar/liquor is checked, it replaces (not stacks with) restaurant surcharge.
  // --------------------------------------------------------------------------
  umbrella: {
    // Per-room base rates by limit tier
    limitTiers: {
      '$10M':  { perRoom: 150, label: '$10M Umbrella' },
      '$25M':  { perRoom: 200, label: '$25M Umbrella' },
      '$50M':  { perRoom: 220, label: '$50M Umbrella' },
      '$100M': { perRoom: 'incremental', baseLimit: '$50M', incrementalPerRoom: 65, label: '$100M Umbrella' },
      '$125M': { perRoom: 'incremental', baseLimit: '$100M', incrementalPerRoom: 10, label: '$125M Umbrella' },
    },

    // Amenity surcharges (per room)
    // Note: bar_liquor replaces restaurant surcharge (don't double-count)
    amenitySurcharges: {
      pool:       25,
      restaurant: 35,
      bar_liquor: 45,
      valet:      15,
    },

    // Geographic litigation environment modifiers
    litigationModifiers: {
      'low':       0.90,
      'moderate':  1.00,
      'high':      1.15,
      'very-high': 1.25,
    },

    // Fleet size modifiers
    fleetModifiers: [
      { maxVehicles: 5,   modifier: 1.00, label: '1-5 vehicles (base)' },
      { maxVehicles: 15,  modifier: 1.05, label: '6-15 vehicles (+5%)' },
      { maxVehicles: 999, modifier: 1.10, label: '16+ vehicles (+10%)' },
    ],

    // Self-insured retention (SIR) discounts
    sirOptions: {
      '$10K':  1.05,
      '$25K':  1.00,
      '$50K':  0.90,
      '$100K': 0.80,
    },
  },

  // --------------------------------------------------------------------------
  // 14. WARNING THRESHOLDS
  // --------------------------------------------------------------------------
  warningThresholds: {
    catZoneStates: ['FL', 'TX', 'LA', 'MS', 'AL', 'SC', 'NC', 'GA', 'CA', 'HI'],
    oldRoofAge: 15,
    highPPC: 8,
    highTIV: 50000000,
    nonSprinkleredWarning: true,
  },

  // --------------------------------------------------------------------------
  // 15. COINSURANCE FACTORS
  // --------------------------------------------------------------------------
  coinsuranceFactors: {
    80:  1.00,
    90:  0.95,
    100: 0.90,
    0:   1.50,
  },

  // --------------------------------------------------------------------------
  // 17. COASTAL / WIND EXPOSURE
  // --------------------------------------------------------------------------
  windTierModifiers: {
    'Inland':  1.00,
    'Tier 5':  1.10,
    'Tier 4':  1.25,
    'Tier 3':  1.60,
    'Tier 2':  2.25,
    'Tier 1':  3.25,
  },

  coastalStates: [
    'FL', 'TX', 'LA', 'MS', 'AL',
    'SC', 'NC', 'GA', 'VA',
    'NY', 'NJ', 'CT', 'RI', 'MA', 'NH', 'ME',
    'DE', 'MD', 'DC',
    'HI',
  ],

  // --------------------------------------------------------------------------
  // 18. FLOOD ZONE MODIFIERS
  // --------------------------------------------------------------------------
  floodZoneModifiers: {
    'X':          1.00,
    'X-shaded':   1.05,
    'AE':         1.15,
    'A':          1.20,
    'AH':         1.15,
    'AO':         1.15,
    'VE':         1.35,
    'V':          1.40,
  },

  defaultFloodZone: 'X',

  // --------------------------------------------------------------------------
  // 19. NAMED STORM / WIND-HAIL DEDUCTIBLE CREDITS
  // --------------------------------------------------------------------------
  namedStormDeductibleCredits: {
    '1%':  1.10,
    '2%':  1.00,
    '3%':  0.90,
    '5%':  0.80,
    '10%': 0.65,
  },

  defaultNamedStormDeductible: '2%',

  // --------------------------------------------------------------------------
  // 20. ESTIMATED ANNUAL FLOOD INSURANCE PREMIUM
  // --------------------------------------------------------------------------
  floodInsuranceEstimates: {
    'X':          0,
    'X-shaded':   2500,
    'AE':         15000,
    'A':          20000,
    'AH':         12000,
    'AO':         12000,
    'VE':         45000,
    'V':          55000,
  },
};

export default ratingConfig;
