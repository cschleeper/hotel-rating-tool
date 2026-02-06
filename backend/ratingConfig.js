// ============================================================================
// HOTEL INSURANCE RATING CONFIGURATION
// ============================================================================
// All rating variables in one place. Edit values here to adjust premiums
// across the entire application. No code changes needed elsewhere.
// ============================================================================

const ratingConfig = {

  // --------------------------------------------------------------------------
  // 1. BASE RATES PER $100 OF TIV BY CONSTRUCTION TYPE
  // --------------------------------------------------------------------------
  // These are the starting property rates per $100 of insured value.
  // Sprinklered properties receive a significant discount because automatic
  // fire suppression dramatically reduces expected loss severity.
  //
  // ISO Construction Classes:
  //   Frame (ISO 1)                  - Wood frame, highest fire risk
  //   Joisted Masonry (ISO 2)        - Masonry walls, wood roof/floor
  //   Non-Combustible (ISO 3)        - Metal frame, metal/concrete walls
  //   Masonry Non-Combustible (ISO 4) - Masonry walls, metal/concrete roof
  //   Modified Fire Resistive (ISO 5) - Similar to 6 but lower rated assemblies
  //   Fire Resistive (ISO 6)          - Concrete/steel, lowest fire risk
  // --------------------------------------------------------------------------
  baseRatesPer100: {
    sprinklered: {
      'Frame':                      0.18,
      'Joisted Masonry':            0.14,
      'Non-Combustible':            0.10,
      'Masonry Non-Combustible':    0.11,
      'Modified Fire Resistive':    0.08,
      'Fire Resistive':             0.06,
    },
    nonSprinklered: {
      'Frame':                      0.42,
      'Joisted Masonry':            0.33,
      'Non-Combustible':            0.24,
      'Masonry Non-Combustible':    0.26,
      'Modified Fire Resistive':    0.19,
      'Fire Resistive':             0.15,
    },
  },

  // Default rate if construction type is not recognized
  defaultBaseRate: 0.20,

  // --------------------------------------------------------------------------
  // 2. GEOGRAPHIC MODIFIERS BY STATE
  // --------------------------------------------------------------------------
  // Multiplier applied to property premium based on state location.
  // Accounts for catastrophe exposure (hurricane, earthquake, tornado, hail),
  // litigation environment, regulatory costs, and local labor/material costs.
  //
  // 1.00 = baseline (average state)
  // >1.00 = higher risk / cost state
  // <1.00 = lower risk / cost state
  // --------------------------------------------------------------------------
  geographicModifiers: {
    'AL': 1.15,   // Alabama - hurricane, tornado
    'AK': 1.10,   // Alaska - remote, high construction costs
    'AZ': 0.90,   // Arizona - low cat exposure
    'AR': 1.05,   // Arkansas - tornado alley fringe
    'CA': 1.35,   // California - earthquake, wildfire, litigation
    'CO': 1.00,   // Colorado - hail
    'CT': 1.05,   // Connecticut
    'DE': 1.00,   // Delaware
    'FL': 1.50,   // Florida - hurricane, sinkhole, litigation
    'GA': 1.10,   // Georgia - hurricane fringe
    'HI': 1.20,   // Hawaii - hurricane, remote
    'ID': 0.85,   // Idaho - low cat
    'IL': 1.05,   // Illinois - tornado
    'IN': 1.00,   // Indiana
    'IA': 1.00,   // Iowa - tornado, hail
    'KS': 1.10,   // Kansas - tornado, hail
    'KY': 0.95,   // Kentucky
    'LA': 1.40,   // Louisiana - hurricane, flood, litigation
    'ME': 0.90,   // Maine
    'MD': 1.05,   // Maryland
    'MA': 1.10,   // Massachusetts - nor'easter
    'MI': 0.95,   // Michigan
    'MN': 0.95,   // Minnesota
    'MS': 1.20,   // Mississippi - hurricane
    'MO': 1.05,   // Missouri - tornado
    'MT': 0.85,   // Montana
    'NE': 1.00,   // Nebraska - hail
    'NV': 0.85,   // Nevada - low cat
    'NH': 0.90,   // New Hampshire
    'NJ': 1.10,   // New Jersey - nor'easter, coastal
    'NM': 0.85,   // New Mexico
    'NY': 1.20,   // New York - nor'easter, high costs, litigation
    'NC': 1.15,   // North Carolina - hurricane
    'ND': 0.90,   // North Dakota
    'OH': 0.95,   // Ohio
    'OK': 1.15,   // Oklahoma - tornado, hail
    'OR': 0.95,   // Oregon - earthquake risk
    'PA': 1.00,   // Pennsylvania
    'RI': 1.05,   // Rhode Island
    'SC': 1.20,   // South Carolina - hurricane
    'SD': 0.90,   // South Dakota
    'TN': 1.00,   // Tennessee
    'TX': 1.25,   // Texas - hurricane, tornado, hail, litigation
    'UT': 0.85,   // Utah
    'VT': 0.90,   // Vermont
    'VA': 1.05,   // Virginia - hurricane fringe
    'WA': 1.00,   // Washington - earthquake risk
    'WV': 0.90,   // West Virginia
    'WI': 0.95,   // Wisconsin
    'WY': 0.85,   // Wyoming
    'DC': 1.10,   // District of Columbia
  },

  // Fallback if state is not found or not provided
  defaultGeoModifier: 1.00,

  // --------------------------------------------------------------------------
  // 3. ROOF AGE MODIFIERS
  // --------------------------------------------------------------------------
  // Older roofs are the #1 source of property claims in hospitality.
  // Roof condition directly impacts water damage and wind peril pricing.
  // Roof age is measured in years since last full replacement.
  //
  // Many carriers will not write a risk with a roof over 20 years old
  // without an inspection, so the surcharge increases steeply.
  // --------------------------------------------------------------------------
  roofAgeModifiers: [
    { maxAge: 5,   modifier: 0.90, label: '0–5 years (excellent)' },
    { maxAge: 10,  modifier: 1.00, label: '6–10 years (good)' },
    { maxAge: 15,  modifier: 1.10, label: '11–15 years (fair)' },
    { maxAge: 20,  modifier: 1.25, label: '16–20 years (aging)' },
    { maxAge: 999, modifier: 1.50, label: '20+ years (poor — may need inspection)' },
  ],

  // --------------------------------------------------------------------------
  // 4. PROTECTION CLASS MODIFIERS
  // --------------------------------------------------------------------------
  // ISO Public Protection Classification (PPC) grades from 1 (best) to 10
  // (unprotected). Based on fire department capability, water supply, and
  // emergency communications. Most urban hotels are class 1–4.
  //
  // Class 10 means no recognized fire protection — very rare for hotels
  // but common in remote or unincorporated areas.
  // --------------------------------------------------------------------------
  protectionClassModifiers: {
    1:  0.85,   // Superior fire protection
    2:  0.90,
    3:  0.95,
    4:  1.00,   // Baseline — typical urban
    5:  1.05,
    6:  1.10,
    7:  1.15,
    8:  1.25,   // Semi-rural
    9:  1.40,   // Rural, limited water
    10: 1.60,   // No recognized protection
  },

  // Default if protection class is not provided
  defaultProtectionClass: 4,

  // --------------------------------------------------------------------------
  // 5. AMENITY MODIFIERS
  // --------------------------------------------------------------------------
  // Each amenity adds incremental liability and/or property risk.
  // These are additive — e.g., pool (0.08) + restaurant (0.06) = 1.14x.
  // Applied as a multiplier on the general liability premium.
  //
  // Adjust these based on your book's actual loss experience.
  // --------------------------------------------------------------------------
  amenityModifiers: {
    pool:            0.08,   // Drowning / slip-and-fall exposure
    restaurant:      0.06,   // Food contamination, grease fire, liquor
    spa:             0.05,   // Burns, allergic reactions, slip-and-fall
    fitness_center:  0.03,   // Equipment injury
    meeting_space:   0.04,   // Higher occupancy / crowd exposure
    business_center: 0.02,   // Minimal added risk
  },

  // --------------------------------------------------------------------------
  // 6. BUILDING AGE MODIFIERS
  // --------------------------------------------------------------------------
  // Older buildings have outdated electrical, plumbing, and HVAC systems
  // that increase fire and water damage frequency. Applied to property premium.
  // --------------------------------------------------------------------------
  buildingAgeModifiers: [
    { maxAge: 5,   modifier: 0.95, label: '0–5 years' },
    { maxAge: 15,  modifier: 1.00, label: '6–15 years' },
    { maxAge: 30,  modifier: 1.10, label: '16–30 years' },
    { maxAge: 50,  modifier: 1.20, label: '31–50 years' },
    { maxAge: 999, modifier: 1.35, label: '50+ years' },
  ],

  // --------------------------------------------------------------------------
  // 7. STORIES MODIFIERS
  // --------------------------------------------------------------------------
  // Taller buildings present greater fire suppression difficulty,
  // higher evacuation risk, and increased wind exposure at upper floors.
  // --------------------------------------------------------------------------
  storiesModifiers: [
    { maxStories: 3,  modifier: 1.00, label: '1–3 stories' },
    { maxStories: 5,  modifier: 1.05, label: '4–5 stories' },
    { maxStories: 10, modifier: 1.15, label: '6–10 stories' },
    { maxStories: 999, modifier: 1.25, label: '10+ stories' },
  ],

  // --------------------------------------------------------------------------
  // 8. TIV (TOTAL INSURABLE VALUE) MULTIPLIERS
  // --------------------------------------------------------------------------
  // Used to estimate replacement cost when actual appraisal is not available.
  //
  // building_cost_per_sf: Replacement cost per square foot by construction type.
  //   Based on Marshall & Swift / RSMeans data for hotel/motel occupancy.
  //
  // contents_cost_per_room: Furniture, fixtures, and equipment (FF&E) per room.
  //   Limited-service hotels ~$15k/room; full-service ~$35k; luxury ~$60k+.
  //
  // business_income_per_room: Estimated 12-month business income per room.
  //   Used for Business Income / Extra Expense coverage.
  //   Based on average daily rate × occupancy × 365.
  // --------------------------------------------------------------------------
  tivMultipliers: {
    // Replacement cost per SF by construction type
    buildingCostPerSF: {
      'Frame':                      150,
      'Joisted Masonry':            175,
      'Non-Combustible':            210,
      'Masonry Non-Combustible':    200,
      'Modified Fire Resistive':    230,
      'Fire Resistive':             250,
    },

    // Default if construction type not matched
    defaultBuildingCostPerSF: 200,

    // FF&E contents value per guest room
    contentsPerRoom: 25000,

    // Annual business income estimate per room
    // (assumes ~$150 ADR × 65% occupancy × 365 days ≈ $35,600/room/year)
    businessIncomePerRoom: 35600,

    // Age adjustment to building replacement cost
    // Newer buildings cost more to replace due to current code requirements
    ageAdjustments: [
      { maxAge: 5,   multiplier: 1.15, label: 'New construction premium' },
      { maxAge: 15,  multiplier: 1.05, label: 'Modern construction' },
      { maxAge: 40,  multiplier: 1.00, label: 'Standard' },
      { maxAge: 999, multiplier: 0.90, label: 'Older — may have lower specs' },
    ],
  },

  // --------------------------------------------------------------------------
  // 9. LIABILITY RATES
  // --------------------------------------------------------------------------
  // Per-room rates for general liability and liquor liability premiums.
  // --------------------------------------------------------------------------
  liabilityRates: {
    // General liability base rate per room per year
    glPerRoom: 150,

    // Liquor liability rate per room (only applies if restaurant/bar present)
    liquorPerRoom: 45,

    // Umbrella/excess as a percentage of combined property + GL premium
    umbrellaFactor: 0.15,
  },

  // --------------------------------------------------------------------------
  // 10. RISK GRADE THRESHOLDS
  // --------------------------------------------------------------------------
  // Risk grade is based on total premium per room. Lower = better risk.
  // Used for quick underwriting triage and benchmarking.
  // --------------------------------------------------------------------------
  riskGradeThresholds: [
    { maxPerRoom: 400,  grade: 'A', label: 'Excellent' },
    { maxPerRoom: 600,  grade: 'B', label: 'Good' },
    { maxPerRoom: 900,  grade: 'C', label: 'Average' },
    { maxPerRoom: 1200, grade: 'D', label: 'Below Average' },
    { maxPerRoom: Infinity, grade: 'E', label: 'Poor' },
  ],
};

export default ratingConfig;
