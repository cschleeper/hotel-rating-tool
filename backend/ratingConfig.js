// ============================================================================
// HOTEL INSURANCE RATING CONFIGURATION
// ============================================================================
// All rating variables in one place. Edit values here to adjust premiums
// across the entire application. No code changes needed elsewhere.
//
// SOURCES:
//   - ISO Commercial Lines Manual (CLM) — Basic Group I class rated loss costs
//   - NFSA (National Fire Sprinkler Assoc.) — ISO-sourced sprinkler vs. non-sprinkler sample rates
//   - RSMeans 2019 base + cumulative cost index adjustment (~27% to 2025)
//   - HVS U.S. Hotel Development Cost Survey 2025
//   - CBRE Hotels — Insurance Cost PAR benchmarks (2022-2024)
//   - STR/CoStar — RevPAR, ADR, occupancy by chain scale (2024-2025)
//   - Shepherd Insurance / NAIC — roof age surcharge data
//   - ISO PPC (Public Protection Classification) relativities
// ============================================================================

const ratingConfig = {

  // --------------------------------------------------------------------------
  // 1. BASE RATES PER $100 OF TIV BY CONSTRUCTION TYPE
  // --------------------------------------------------------------------------
  // ISO loss costs for hotel/motel occupancy (class codes 0742-0747).
  //
  // NFSA published ISO-sourced sample rates for hotels:
  //   Non-sprinklered building: $0.257 / $100
  //   Sprinklered building:     $0.088 / $100  (66% reduction)
  // These are at a mid-range construction type (approx. Masonry Non-Combustible).
  //
  // The rates below are ISO loss costs BEFORE the Loss Cost Multiplier (LCM).
  // The LCM (section 1b) converts loss costs to final rates.
  // Final rate = loss cost × LCM
  //
  // ISO Construction Classes:
  //   Frame (ISO 1)                  - Wood frame, highest fire risk
  //   Joisted Masonry (ISO 2)        - Masonry walls, wood roof/floor
  //   Non-Combustible (ISO 3)        - Metal frame, metal/concrete walls
  //   Masonry Non-Combustible (ISO 4) - Masonry walls, metal/concrete roof
  //   Modified Fire Resistive (ISO 5) - Similar to 6 but lower rated assemblies
  //   Fire Resistive (ISO 6)          - Concrete/steel, lowest fire risk
  //
  // Source: NFSA "Fire Sprinklers Save Lives and Money" (ISO sample data);
  //         ISO CLM relativity between construction classes
  // --------------------------------------------------------------------------
  baseRatesPer100: {
    // Sprinklered loss costs — ~66% credit from non-sprinklered per NFSA/ISO
    sprinklered: {
      'Frame':                      0.145,  // Highest risk even with sprinklers
      'Joisted Masonry':            0.115,
      'Non-Combustible':            0.080,
      'Masonry Non-Combustible':    0.088,  // NFSA published rate
      'Modified Fire Resistive':    0.068,
      'Fire Resistive':             0.055,  // Lowest risk
    },
    // Non-sprinklered loss costs
    nonSprinklered: {
      'Frame':                      0.425,  // ~3x sprinklered
      'Joisted Masonry':            0.338,
      'Non-Combustible':            0.235,
      'Masonry Non-Combustible':    0.257,  // NFSA published rate
      'Modified Fire Resistive':    0.200,
      'Fire Resistive':             0.162,
    },
  },

  // --------------------------------------------------------------------------
  // 1b. LOSS COST MULTIPLIER (LCM)
  // --------------------------------------------------------------------------
  // Each carrier files their own LCM with the state DOI. It accounts for
  // the carrier's expenses, profit, and contingencies on top of ISO loss costs.
  //
  // Typical range: 1.50 – 2.50
  //   1.50 = very competitive / low-expense carrier
  //   1.75 = average
  //   2.00 = standard market
  //   2.50 = specialty / E&S market
  //
  // Adjust this to match the carrier you're quoting against.
  // --------------------------------------------------------------------------
  lossCostMultiplier: 1.75,

  // Default rate if construction type is not recognized
  defaultBaseRate: 0.20,

  // --------------------------------------------------------------------------
  // 2. GEOGRAPHIC MODIFIERS BY STATE
  // --------------------------------------------------------------------------
  // Multiplier applied to property premium based on state location.
  // Accounts for catastrophe exposure (hurricane, earthquake, tornado, hail),
  // litigation environment, regulatory costs, and local labor/material costs.
  //
  // Calibrated against state-level commercial property premium data:
  //   NY: $6,200 avg | FL: $5,800 | CA: $5,600 | TX: $4,200 | OH: $4,300
  //   (Source: Insuranceopedia 2024-2025 commercial property data)
  //
  // 1.00 = baseline (average state)
  // >1.00 = higher risk / cost state
  // <1.00 = lower risk / cost state
  // --------------------------------------------------------------------------
  geographicModifiers: {
    'AL': 1.15,   // Alabama — hurricane, tornado
    'AK': 1.10,   // Alaska — remote, high construction costs
    'AZ': 0.90,   // Arizona — low cat exposure
    'AR': 1.05,   // Arkansas — tornado alley fringe
    'CA': 1.30,   // California — earthquake, wildfire, litigation ($5,600 avg)
    'CO': 1.00,   // Colorado — hail exposure
    'CT': 1.05,   // Connecticut
    'DE': 1.00,   // Delaware
    'FL': 1.45,   // Florida — hurricane, sinkhole, assignment of benefits litigation ($5,800 avg)
    'GA': 1.10,   // Georgia — hurricane fringe ($4,700 avg)
    'HI': 1.20,   // Hawaii — hurricane, remote, high material costs
    'ID': 0.85,   // Idaho — low cat
    'IL': 1.08,   // Illinois — tornado ($4,900 avg)
    'IN': 1.00,   // Indiana
    'IA': 1.00,   // Iowa — tornado, hail
    'KS': 1.10,   // Kansas — tornado, hail
    'KY': 0.95,   // Kentucky
    'LA': 1.40,   // Louisiana — hurricane, flood, nuclear verdicts
    'ME': 0.90,   // Maine
    'MD': 1.05,   // Maryland
    'MA': 1.10,   // Massachusetts — nor'easter
    'MI': 0.95,   // Michigan
    'MN': 0.95,   // Minnesota
    'MS': 1.20,   // Mississippi — hurricane
    'MO': 1.05,   // Missouri — tornado, nuclear verdicts
    'MT': 0.85,   // Montana
    'NE': 1.00,   // Nebraska — hail
    'NV': 0.85,   // Nevada — low cat
    'NH': 0.90,   // New Hampshire
    'NJ': 1.12,   // New Jersey — nor'easter, coastal, high costs
    'NM': 0.85,   // New Mexico
    'NY': 1.38,   // New York — nor'easter, highest avg premium ($6,200 avg)
    'NC': 1.15,   // North Carolina — hurricane ($4,400 avg)
    'ND': 0.90,   // North Dakota
    'OH': 0.95,   // Ohio ($4,300 avg)
    'OK': 1.15,   // Oklahoma — tornado, hail
    'OR': 0.95,   // Oregon — earthquake risk
    'PA': 1.05,   // Pennsylvania ($4,800 avg)
    'RI': 1.05,   // Rhode Island
    'SC': 1.20,   // South Carolina — hurricane
    'SD': 0.90,   // South Dakota
    'TN': 1.00,   // Tennessee
    'TX': 1.25,   // Texas — hurricane coast, tornado, hail, litigation ($4,200 avg but high cat)
    'UT': 0.85,   // Utah
    'VT': 0.90,   // Vermont
    'VA': 1.05,   // Virginia — hurricane fringe
    'WA': 1.05,   // Washington — earthquake risk ($5,100 avg)
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
  //
  // Industry data (Shepherd Insurance / NAIC / carrier guidelines):
  //   0-14 years:  Standard rates, full replacement cost coverage
  //   15-19 years: 10-20% surcharge on most standard policies
  //   20-24 years: ~70% of carriers switch from RC to ACV; significant surcharge
  //   25+ years:   ~40% of standard carriers refuse renewal; specialty market
  //
  // Moody's RMS: older roofs contribute up to 50% more damage in hurricane events.
  // --------------------------------------------------------------------------
  roofAgeModifiers: [
    { maxAge: 5,   modifier: 0.90, label: '0–5 years (excellent — new roof credit)' },
    { maxAge: 10,  modifier: 0.95, label: '6–10 years (good)' },
    { maxAge: 14,  modifier: 1.00, label: '11–14 years (standard)' },
    { maxAge: 19,  modifier: 1.15, label: '15–19 years (10-20% surcharge per NAIC)' },
    { maxAge: 24,  modifier: 1.35, label: '20–24 years (many carriers move to ACV)' },
    { maxAge: 999, modifier: 1.50, label: '25+ years (specialty market — inspection required)' },
  ],

  // --------------------------------------------------------------------------
  // 4. PROTECTION CLASS MODIFIERS
  // --------------------------------------------------------------------------
  // ISO Public Protection Classification (PPC) grades from 1 (best) to 10.
  // Based on fire department capability, water supply, and emergency comms.
  //
  // ISO CLM typically bases loss costs at PC 5, with multipliers adjusting
  // up or down. Most urban hotels are class 1–4. Class 10 = unprotected
  // (many carriers will not write PC 8B-10 at all).
  //
  // Source: ISO CLM state exception pages (directional; exact tables proprietary)
  // --------------------------------------------------------------------------
  protectionClassModifiers: {
    1:  0.80,   // Superior — major metro, full-time paid FD, excellent water
    2:  0.85,
    3:  0.90,
    4:  0.95,
    5:  1.00,   // Baseline — ISO CLM base in most states
    6:  1.10,
    7:  1.20,
    8:  1.35,   // Semi-rural — volunteer FD, limited water
    9:  1.55,   // Rural — distant FD, poor water supply
    10: 1.80,   // Unprotected — most carriers decline
  },

  // Default if protection class is not provided (urban hotel assumption)
  defaultProtectionClass: 4,

  // --------------------------------------------------------------------------
  // 5. AMENITY MODIFIERS
  // --------------------------------------------------------------------------
  // Each amenity adds incremental GL and/or property risk exposure.
  // These are additive — e.g., pool (0.08) + restaurant (0.06) = 1.14x.
  // Applied as a multiplier on the general liability premium.
  //
  // ISO CGL class codes differentiate hotels with/without pools:
  //   45190: Hotels <4 stories, WITH pools/beaches
  //   45191: Hotels 4+ stories, WITH pools/beaches
  //   45192: Hotels <4 stories, WITHOUT pools/beaches
  //   45193: Hotels 4+ stories, WITHOUT pools/beaches
  //
  // Adjust these based on your book's actual loss experience.
  // --------------------------------------------------------------------------
  amenityModifiers: {
    pool:            0.08,   // Drowning / slip-and-fall — ISO splits class on this
    restaurant:      0.06,   // Food contamination, grease fire, liquor exposure
    spa:             0.05,   // Burns, allergic reactions, slip-and-fall
    fitness_center:  0.03,   // Equipment injury
    meeting_space:   0.04,   // Higher occupancy / crowd exposure
    business_center: 0.02,   // Minimal added risk
  },

  // --------------------------------------------------------------------------
  // 6. BUILDING AGE MODIFIERS
  // --------------------------------------------------------------------------
  // Older buildings have outdated electrical, plumbing, and HVAC systems
  // that increase fire and water damage frequency.
  //
  // NAIC data: buildings >50 years face premiums 10-20% higher.
  // Applied to property premium.
  // --------------------------------------------------------------------------
  buildingAgeModifiers: [
    { maxAge: 5,   modifier: 0.95, label: '0–5 years (new construction)' },
    { maxAge: 15,  modifier: 1.00, label: '6–15 years (modern)' },
    { maxAge: 30,  modifier: 1.10, label: '16–30 years' },
    { maxAge: 50,  modifier: 1.20, label: '31–50 years (10-20% surcharge per NAIC)' },
    { maxAge: 999, modifier: 1.35, label: '50+ years (outdated systems, code deficiencies)' },
  ],

  // --------------------------------------------------------------------------
  // 7. STORIES MODIFIERS
  // --------------------------------------------------------------------------
  // Taller buildings present greater fire suppression difficulty,
  // higher evacuation risk, and increased wind exposure at upper floors.
  // ISO rates hotels 4+ stories differently from <4 stories (separate GL codes).
  // --------------------------------------------------------------------------
  storiesModifiers: [
    { maxStories: 3,   modifier: 1.00, label: '1–3 stories (ISO <4 story class)' },
    { maxStories: 5,   modifier: 1.05, label: '4–5 stories' },
    { maxStories: 10,  modifier: 1.15, label: '6–10 stories' },
    { maxStories: 20,  modifier: 1.25, label: '11–20 stories' },
    { maxStories: 999, modifier: 1.35, label: '20+ stories (high-rise)' },
  ],

  // --------------------------------------------------------------------------
  // 8. TIV (TOTAL INSURABLE VALUE) MULTIPLIERS
  // --------------------------------------------------------------------------
  // Used to estimate replacement cost when actual appraisal is not available.
  //
  // BUILDING COST PER SF:
  //   Source: RSMeans 2019 base data + ~27% cumulative cost index to 2025
  //   Hotel 4-7 story (brick/RC, 135,000 SF model):
  //     Union: $197/SF → 2025 adjusted: ~$250/SF
  //     Open shop: $181/SF → 2025 adjusted: ~$230/SF
  //   Hotel 8-24 story (brick/RC, 450,000 SF model):
  //     Union: $212/SF → 2025 adjusted: ~$269/SF
  //     Open shop: $195/SF → 2025 adjusted: ~$247/SF
  //
  //   Also calibrated against HVS 2025 cost-per-key data:
  //     Economy: $134-$234/SF | Midscale: $175-$282/SF
  //     Select-service: $200-$350/SF | Full-service: $260-$410/SF
  //     Luxury: $332-$550+/SF
  //
  // CONTENTS (FF&E) PER ROOM:
  //   Source: HVS 2025, Artone industry benchmarks
  //     Economy:        $4,500 – $7,000/room
  //     Midscale:       $4,500 – $8,500/room
  //     Upscale:        $12,000 – $35,000/room
  //     Upper Upscale:  $25,000 – $45,000/room
  //     Luxury:         $35,000 – $65,000/room
  //   FF&E = 7-10% of total construction costs; 10-15% above historical as of 2025
  //
  // BUSINESS INCOME PER ROOM:
  //   Source: STR/CoStar 2024-2025
  //     U.S. avg ADR: $159.58 | Avg occupancy: 63% | RevPAR: $102.78
  //     BI/room/year = ADR × occupancy × 365
  //     $159.58 × 0.63 × 365 ≈ $36,700/room/year
  // --------------------------------------------------------------------------
  tivMultipliers: {
    // Replacement cost per SF by construction type (2025 RSMeans adjusted)
    buildingCostPerSF: {
      'Frame':                      180,   // Wood frame, lowest cost
      'Joisted Masonry':            215,   // Masonry walls + wood internals
      'Non-Combustible':            245,   // Metal/concrete
      'Masonry Non-Combustible':    235,   // Masonry + concrete/metal roof
      'Modified Fire Resistive':    260,   // Near fire-resistive specs
      'Fire Resistive':             275,   // Concrete/steel, highest cost
    },

    // Default if construction type not matched
    defaultBuildingCostPerSF: 235,

    // FF&E contents value per guest room (midscale default)
    // Adjust for hotel tier:
    //   Economy: $5,500 | Midscale: $8,000 | Select-service: $15,000
    //   Upscale: $25,000 | Upper Upscale: $35,000 | Luxury: $55,000
    contentsPerRoom: 15000,

    // Annual business income estimate per room
    // U.S. avg: ADR $159.58 × 63% occupancy × 365 = ~$36,700/room/year
    // Source: STR YTD 2025
    businessIncomePerRoom: 36700,

    // Age adjustment to building replacement cost
    // Newer buildings cost more to replace due to current code requirements
    // and modern material/labor costs
    ageAdjustments: [
      { maxAge: 5,   multiplier: 1.15, label: 'New construction — current code premium' },
      { maxAge: 15,  multiplier: 1.05, label: 'Modern construction' },
      { maxAge: 40,  multiplier: 1.00, label: 'Standard' },
      { maxAge: 999, multiplier: 0.90, label: 'Older — may have lower material specs' },
    ],
  },

  // --------------------------------------------------------------------------
  // 9. LIABILITY RATES
  // --------------------------------------------------------------------------
  // Per-room rates for general liability and liquor liability premiums.
  //
  // GL: ISO CGL codes 45190-45193 rate per room (non-auditable).
  //   Industry avg GL premium: ~$720/year for typical hotel
  //   State variation: CA $1,120 | NY $1,180 | TX $1,050 | FL $1,090
  //   Per-room rate calibrated to produce realistic premiums for 100+ room hotels.
  //
  // LIQUOR LIABILITY:
  //   Avg hotel liquor liability: ~$612/year (Source: Insuranceopedia 2025)
  //   State highs: NV $3,250 | WA $3,200 | LA $3,180 | MA $3,120
  //   Per-room rate is a simplified proxy; actual rating uses alcohol revenue.
  //   Past liquor claims can increase premiums 300-400%.
  //
  // UMBRELLA/EXCESS:
  //   Trending up: +9.5% in Q1 2025, +8.7% in Q4 2024.
  //   Priced as % of underlying property + GL.
  // --------------------------------------------------------------------------
  liabilityRates: {
    // General liability base rate per room per year
    glPerRoom: 125,

    // Liquor liability rate per room (only applies if restaurant/bar present)
    liquorPerRoom: 40,

    // Umbrella/excess as a percentage of combined property + GL premium
    umbrellaFactor: 0.15,
  },

  // --------------------------------------------------------------------------
  // 10. RISK GRADE THRESHOLDS
  // --------------------------------------------------------------------------
  // Risk grade based on total premium per room for underwriting triage.
  //
  // Benchmarked against CBRE insurance cost PAR data:
  //   Limited-service:  $528 PAR (2022)
  //   All hotels avg:   $939 PAR (2022)
  //   Resort:           $2,464 PAR (2022)
  //   Insurance = ~1.7% of total hotel revenue (2023-2024)
  // --------------------------------------------------------------------------
  riskGradeThresholds: [
    { maxPerRoom: 500,  grade: 'A', label: 'Excellent' },
    { maxPerRoom: 750,  grade: 'B', label: 'Good' },
    { maxPerRoom: 1000, grade: 'C', label: 'Average' },
    { maxPerRoom: 1500, grade: 'D', label: 'Below Average' },
    { maxPerRoom: Infinity, grade: 'E', label: 'Poor' },
  ],

  // --------------------------------------------------------------------------
  // 11. COINSURANCE FACTORS
  // --------------------------------------------------------------------------
  // ISO coinsurance relativity factors. Most hotel policies are written at
  // 80% or 90% coinsurance. Agreed Value eliminates coinsurance penalty.
  //
  // Source: ISO CLM
  // --------------------------------------------------------------------------
  coinsuranceFactors: {
    80:  1.00,   // Baseline
    90:  0.95,   // 5% credit for higher coinsurance
    100: 0.90,   // 10% credit
    0:   1.50,   // No coinsurance — 50% surcharge
  },
};

export default ratingConfig;
