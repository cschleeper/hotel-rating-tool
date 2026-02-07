import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import config from './ratingConfig.js';

const app = express();

app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Fetch an image URL and return base64-encoded data, or null on failure
async function fetchImageAsBase64(url, timeoutMs = 8000) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PropertyBot/1.0)' },
      redirect: 'follow',
    });
    clearTimeout(timer);

    if (!resp.ok) return null;

    const contentType = resp.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) return null;

    const buffer = await resp.arrayBuffer();
    if (buffer.byteLength < 5000 || buffer.byteLength > 10_000_000) return null;

    const mediaType = contentType.split(';')[0].trim();
    const base64 = Buffer.from(buffer).toString('base64');
    return { media_type: mediaType, base64 };
  } catch {
    return null;
  }
}

// Property lookup endpoint using Claude with web search + vision
app.post('/api/property-lookup', async (req, res) => {
  const { query } = req.body;

  if (!query || query.trim().length === 0) {
    return res.status(400).json({ error: 'Please provide a hotel name and/or address.' });
  }

  try {
    // ---------------------------------------------------------------
    // STEP 1: Web search for property data + image URLs
    // ---------------------------------------------------------------
    console.log(`[Lookup] Step 1: Web search for "${query}"`);
    const searchResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 10,
        },
      ],
      messages: [
        {
          role: 'user',
          content: `You are a property data extraction assistant specializing in commercial real estate. Given a hotel name and/or address, search for information and return structured JSON.

Hotel to look up: "${query}"

IMPORTANT — Search strategy (follow this priority order):

SQUARE FOOTAGE is critical — use this hierarchy:
  Priority 1: LoopNet — search "site:loopnet.com ${query}" or "${query} loopnet square feet". Pull the "Total Size" field.
  Priority 2: County tax/assessor records — search "${query} county property records" or the property address + "tax assessor". Look for building square footage in assessment data.
  Priority 3: Commercial real estate databases — CoStar, CREXi, Reonomy, or similar if available in search results.
  Priority 4: Brand prototype data (LAST RESORT ONLY) — If NO square footage data found anywhere, estimate using these brand prototype specs:
    - Embassy Suites: ~975 SF/room (all-suite, dual atrium design)
    - Marriott/Hilton full service: ~700 SF/room
    - Select service (Courtyard, Hilton Garden Inn): ~550 SF/room
    - Limited service (Hampton, Fairfield): ~475 SF/room
    - Extended stay (Residence Inn, Home2): ~600 SF/room
    If using prototype estimate, set sf_source to "estimated from brand prototype - verify with actual data"

Other data search strategy:
1. Search LoopNet for building data: square footage, year built, stories, lot size, construction details.
2. Search county property appraiser / tax assessor records for year built, square footage, construction type.
3. Search CoStar, CREXi, and commercial real estate listing sites for additional property details.
4. Search the hotel brand's website and travel sites (TripAdvisor, Booking.com) for room count, amenities, and photos.
5. Use Google Maps / street view results for exterior photos.

Return a JSON object with these fields:

- property_name (string)
- full_address (string)
- brand (string, e.g. "Marriott", "Hilton", "Independent")
- service_type (string — one of: "full-service", "select-service", "limited-service", "extended-stay". Determine based on brand and amenity level. Embassy Suites and Homewood Suites are full-service.)
- location_type (string — one of: "urban", "suburban", "rural", "resort-coastal". Based on property location context.)
- location_zone (string — for FL/TX/SC/NC/GA/AL/MS/LA properties only: "inland", "coastal", or "twia". TWIA only for FL and TX. For all other states use "inland".)
- room_count (number)
- stories (number — from LoopNet/CRE listings if available, otherwise best estimate)
- year_built (number — from LoopNet/tax records if available)
- construction_type (string — from LoopNet/CRE data if available, otherwise estimate from brand standards and age: "Fire Resistive", "Modified Fire Resistive", "Non-Combustible", "Masonry Non-Combustible", "Joisted Masonry", or "Frame")
- square_footage (number — MUST search LoopNet and county records first. Only estimate from brand prototype as last resort.)
- sf_source (string — where the square footage data came from: "LoopNet", "county records", "CoStar", "CREXi", or "estimated from brand prototype - verify with actual data")
- lot_size (number or null — lot size in acres if found on LoopNet or tax records)
- sprinklered (boolean — assume true for hotels built after 1990 or major brands)
- state (string — two-letter US state abbreviation)
- flood_zone (string or null — FEMA flood zone if determinable from address. Common zones: "X", "X-shaded", "AE", "A", "VE", "V". If unsure, leave null.)
- distance_to_coast (string or null — estimated distance from the nearest coastline: "beachfront", "under 1 mile", "1-5 miles", "5-10 miles", "10-25 miles", "25+ miles", or null if inland state)
- amenities (object with boolean fields: pool, restaurant, fitness_center, spa, business_center, meeting_space)
- confidence_level (string: "high" if key data from LoopNet/tax records, "medium" if from brand/travel sites, "low" if mostly estimated)
- data_sources (array of strings — list which sources you actually found data on)
- image_urls (array of strings — include up to 5 URLs of exterior photos of the building)

Return ONLY valid JSON. No markdown, no code blocks.`,
        },
      ],
    });

    let searchText = '';
    for (const block of searchResponse.content) {
      if (block.type === 'text') searchText += block.text;
    }

    const jsonMatch = searchText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Failed to parse property data from AI response.' });
    }

    const initialData = JSON.parse(jsonMatch[0]);
    const imageUrls = Array.isArray(initialData.image_urls) ? initialData.image_urls : [];
    delete initialData.image_urls;

    console.log(`[Lookup] Step 1 complete. Found ${imageUrls.length} image URL(s).`);

    // ---------------------------------------------------------------
    // STEP 2: Fetch images and analyze with Claude Vision
    // ---------------------------------------------------------------
    if (imageUrls.length > 0) {
      console.log(`[Lookup] Step 2: Fetching images for vision analysis...`);
      const imageResults = await Promise.all(
        imageUrls.slice(0, 5).map((url) => fetchImageAsBase64(url))
      );
      const validImages = imageResults.filter(Boolean);
      console.log(`[Lookup] Successfully fetched ${validImages.length} of ${imageUrls.length} images.`);

      if (validImages.length > 0) {
        const visionContent = [];

        for (const img of validImages) {
          visionContent.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: img.media_type,
              data: img.base64,
            },
          });
        }

        visionContent.push({
          type: 'text',
          text: `You are an expert commercial property insurance underwriter analyzing photos of a hotel property.

The property has been identified as: ${initialData.property_name} at ${initialData.full_address}
Current estimates from text search: ${initialData.stories} stories, construction type: ${initialData.construction_type}

Analyze the building photo(s) above and return a JSON object with ONLY these fields:

- stories (number)
- construction_type (string — one of: "Fire Resistive", "Modified Fire Resistive", "Non-Combustible", "Masonry Non-Combustible", "Joisted Masonry", "Frame")
- roof_type (string — "flat", "pitched", "hip", "mansard", or "mixed")
- exterior_material (string — what you see: "brick", "stucco", "EIFS", "glass curtain wall", "concrete", "metal panel", "wood siding", "stone veneer", etc.)
- visible_amenities (object with booleans: pool, parking_structure, porte_cochere, solar_panels, outdoor_dining)
- estimated_condition (string: "excellent", "good", "fair", "poor")
- photo_notes (string — brief notes about anything relevant to insurance underwriting)

Return ONLY valid JSON. No markdown, no code blocks.`,
        });

        console.log(`[Lookup] Step 2: Sending ${validImages.length} image(s) to Claude Vision...`);
        const visionResponse = await anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
          messages: [{ role: 'user', content: visionContent }],
        });

        let visionText = '';
        for (const block of visionResponse.content) {
          if (block.type === 'text') visionText += block.text;
        }

        const visionMatch = visionText.match(/\{[\s\S]*\}/);
        if (visionMatch) {
          const visionData = JSON.parse(visionMatch[0]);
          console.log(`[Lookup] Vision analysis:`, JSON.stringify(visionData, null, 2));

          if (visionData.stories) initialData.stories = visionData.stories;
          if (visionData.construction_type) initialData.construction_type = visionData.construction_type;

          initialData.photo_analysis = {
            roof_type: visionData.roof_type || null,
            exterior_material: visionData.exterior_material || null,
            estimated_condition: visionData.estimated_condition || null,
            photo_notes: visionData.photo_notes || null,
            images_analyzed: validImages.length,
          };

          if (visionData.visible_amenities?.pool && !initialData.amenities?.pool) {
            initialData.amenities = { ...initialData.amenities, pool: true };
          }
        }
      }
    }

    // ---------------------------------------------------------------
    // STEP 3: Brand auto-population (fill missing fields from brand defaults)
    // ---------------------------------------------------------------
    if (initialData.brand) {
      const brandKey = findBrandKey(initialData.brand);
      if (brandKey && config.brandDefaults[brandKey]) {
        const defaults = config.brandDefaults[brandKey];
        if (!initialData.service_type) initialData.service_type = defaults.service_type;
        if (!initialData.construction_type) initialData.construction_type = defaults.construction;
        if (!initialData.stories) initialData.stories = defaults.stories;
        if (!initialData.room_count) initialData.room_count = defaults.rooms;
        if (!initialData.amenities) {
          initialData.amenities = { ...defaults.amenities };
        }
      }
    }

    console.log(`[Lookup] Done. Returning property data.`);
    res.json({ property: initialData });
  } catch (error) {
    console.error('Property lookup error:', error?.status, error?.error?.error?.message || error.message);
    if (error?.status === 429) {
      const retryAfter = error?.headers?.['retry-after'] || '60';
      res.status(429).json({
        error: `Rate limit exceeded — try again in ${retryAfter} seconds.`,
      });
    } else if (error?.status === 401) {
      res.status(401).json({
        error: 'Invalid API key. Check ANTHROPIC_API_KEY in backend/.env.',
      });
    } else {
      res.status(500).json({
        error: `Lookup failed: ${error?.error?.error?.message || error.message || 'Unknown error'}`,
      });
    }
  }
});

// Insurance rating calculation endpoint
app.post('/api/calculate-rating', async (req, res) => {
  const { property } = req.body;

  if (!property) {
    return res.status(400).json({ error: 'Property data is required.' });
  }

  try {
    const rating = calculateInsuranceRating(property);
    res.json({ rating });
  } catch (error) {
    console.error('Rating calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate insurance rating.' });
  }
});

// Find the best matching brand key from config.brandDefaults
function findBrandKey(brand) {
  if (!brand) return null;
  const brandLower = brand.toLowerCase();
  for (const key of Object.keys(config.brandDefaults)) {
    if (brandLower.includes(key.toLowerCase()) || key.toLowerCase().includes(brandLower)) {
      return key;
    }
  }
  return null;
}

function getBrandTier(brand) {
  if (!brand) return null;
  const brandLower = brand.toLowerCase();
  for (const [tier, brands] of Object.entries(config.brandTier)) {
    if (brands.some(b => brandLower.includes(b.toLowerCase()))) return tier;
  }
  return null;
}

function calculateInsuranceRating(property) {
  const {
    room_count = 100,
    stories = 3,
    year_built = 2000,
    construction_type = 'Masonry Non-Combustible',
    square_footage = 50000,
    sprinklered = true,
    state = '',
    brand = '',
    roof_age = 10,
    protection_class = config.defaultProtectionClass,
    wind_tier = 'Inland',
    flood_zone = config.defaultFloodZone,
    named_storm_deductible = config.defaultNamedStormDeductible,
    amenities = {},
    service_type,
    location_type = 'suburban',
    location_zone = 'inland',
    // Umbrella fields
    umbrella_limit = '$25M',
    umbrella_sir = '$25K',
    fleet_size = 0,
    litigation_environment = 'moderate',
    has_valet = false,
    has_bar_liquor = false,
    has_resort_activities = false,
  } = property;

  const currentYear = new Date().getFullYear();
  const buildingAge = currentYear - (year_built || 2000);
  const stateUpper = state.toUpperCase();

  // --- Determine service type ---
  const brandTier = getBrandTier(brand);
  let effectiveServiceType = service_type;
  if (!effectiveServiceType) {
    if (brandTier && !config.fullServiceTiers.includes(brandTier)) {
      effectiveServiceType = 'select-service';
    } else {
      effectiveServiceType = 'full-service';
    }
  }

  // --- TIV Calculation by service type (per-room basis) ---
  const buildingCostPerRoom =
    config.tivMultipliers.buildingCostPerRoom[effectiveServiceType] ||
    config.tivMultipliers.defaultBuildingCostPerRoom;

  const contentsPerRoom =
    config.tivMultipliers.contentsPerRoom[effectiveServiceType] ||
    config.tivMultipliers.defaultContentsPerRoom;

  const biPerRoom =
    config.tivMultipliers.businessIncomePerRoom[effectiveServiceType] ||
    config.tivMultipliers.defaultBIPerRoom;

  const buildingValue = Math.round(room_count * buildingCostPerRoom);
  const contentsValue = Math.round(room_count * contentsPerRoom);
  const businessIncomeValue = Math.round(room_count * biPerRoom);
  const totalInsurableValue = buildingValue + contentsValue + businessIncomeValue;

  // --- Property Base Rate by Construction Type ---
  const baseRate = config.propertyBaseRates[construction_type] ||
    config.propertyBaseRates['Masonry Non-Combustible'];
  const sprinklerAdjustedRate = sprinklered
    ? baseRate
    : baseRate * (1 + config.nonSprinkleredSurcharge);

  // --- Rating Modifiers ---
  const isCoastalState = config.coastalStates.includes(stateUpper);
  const ageFactor = lookupBracket(config.buildingAgeModifiers, buildingAge, 'modifier');
  const storiesFactor = lookupBracket(config.storiesModifiers, stories, 'modifier', 'maxStories');
  const roofFactor = lookupBracket(config.roofAgeModifiers, roof_age, 'modifier');
  const protectionFactor = config.protectionClassModifiers[protection_class] ||
    config.protectionClassModifiers[config.defaultProtectionClass];

  // --- Location Type Modifier ---
  const locationTypeFactor = config.locationTypeModifiers[location_type] || 1.00;

  // --- Geographic Modifier (with location zone logic) ---
  let geoModifier;
  let windTierFactor = 1.00;
  let locationZoneApplied = false;

  // Check if this state uses tiered geo modifiers
  if (config.geoModifierTiers[stateUpper]) {
    // FL or TX: 3-tier (inland/coastal/twia)
    const tiers = config.geoModifierTiers[stateUpper];
    geoModifier = tiers[location_zone] || tiers.inland;
    locationZoneApplied = true;
  } else if (config.coastalGeoOverrides[stateUpper]) {
    // SE coastal states: 2-tier (inland/coastal)
    const tiers = config.coastalGeoOverrides[stateUpper];
    const zone = location_zone === 'twia' ? 'coastal' : location_zone;
    geoModifier = tiers[zone] || tiers.inland;
    locationZoneApplied = true;
  } else {
    // All other states: single modifier
    geoModifier = config.geographicModifiers[stateUpper] || config.defaultGeoModifier;
    // For non-tiered coastal states, wind tier still applies
    if (isCoastalState) {
      windTierFactor = config.windTierModifiers[wind_tier] || 1.00;
    }
  }

  const floodZoneFactor = config.floodZoneModifiers[flood_zone] || 1.00;
  const namedStormCredit = (isCoastalState && wind_tier !== 'Inland')
    ? (config.namedStormDeductibleCredits[named_storm_deductible] || 1.00)
    : 1.00;

  // Combined modifier stack
  const modifierProduct =
    geoModifier *
    (locationZoneApplied ? 1.00 : windTierFactor) *
    floodZoneFactor *
    namedStormCredit *
    protectionFactor *
    ageFactor *
    storiesFactor *
    roofFactor *
    locationTypeFactor;

  // --- Brand Tier Property Multiplier ---
  // Luxury and upper-upscale properties carry significantly higher rates
  const brandTierMultiplier = (brandTier && config.brandTierPropertyMultiplier[brandTier])
    ? config.brandTierPropertyMultiplier[brandTier]
    : 1.00;

  // --- Modified Rates by Coverage Type ---
  // Building uses base rate; Contents and BI use multiplied rates
  const buildingModifiedRate = sprinklerAdjustedRate * modifierProduct * brandTierMultiplier;
  const contentsModifiedRate = buildingModifiedRate * config.contentsRateMultiplier;
  const biModifiedRate = buildingModifiedRate * config.biRateMultiplier;

  const buildingPremium = Math.round((buildingValue / 100) * buildingModifiedRate);
  const contentsPremium = Math.round((contentsValue / 100) * contentsModifiedRate);
  const biPremium = Math.round((businessIncomeValue / 100) * biModifiedRate);

  // Equipment breakdown (subject to building age factor)
  const equipBreakdownBase = config.equipmentBreakdown[effectiveServiceType] || config.equipmentBreakdown['full-service'];
  const equipBreakdownPremium = Math.round(equipBreakdownBase * ageFactor);

  const propertyPremium = buildingPremium + contentsPremium + biPremium + equipBreakdownPremium;

  // --- Blended & Effective Rates ---
  const modifiedRate = buildingModifiedRate; // for display (building base rate after modifiers)
  const blendedRatePer100 = totalInsurableValue > 0
    ? propertyPremium / (totalInsurableValue / 100)
    : 0;

  // --- GL Premium (room-revenue-based, all-in including restaurant & liquor) ---
  const roomRevenuePerRoom = config.roomRevenuePerRoom[effectiveServiceType] || config.defaultRoomRevenuePerRoom;
  const estimatedRoomRevenue = room_count * roomRevenuePerRoom;

  const hotelGLRate = amenities.pool
    ? config.glRates.hotelWithPool
    : config.glRates.hotelWithoutPool;

  // Base hotel GL on room revenue
  let glPremium = Math.round((estimatedRoomRevenue / 1000) * hotelGLRate);

  // Restaurant GL and liquor liability (included in GL total, not separate)
  let restaurantGLComponent = 0;
  let liquorGLComponent = 0;
  if (amenities.restaurant) {
    const fbRevenue = estimatedRoomRevenue * config.glRates.fbRevenuePercent;
    restaurantGLComponent = Math.round((fbRevenue / 1000) * config.glRates.restaurantWithLiquor);

    const liquorSales = fbRevenue * config.glRates.liquorSalesPercent;
    liquorGLComponent = Math.round((liquorSales / 1000) * config.glRates.liquorLiability);

    glPremium += restaurantGLComponent + liquorGLComponent;
  }

  // Resort activities GL surcharge (excursions, water sports, golf, kids programs)
  let resortActivitiesGLComponent = 0;
  if (has_resort_activities) {
    const activitiesRevenue = estimatedRoomRevenue * config.glRates.resortActivitiesRevenuePercent;
    resortActivitiesGLComponent = Math.round((activitiesRevenue / 1000) * config.glRates.resortActivitiesRate);
    glPremium += resortActivitiesGLComponent;
  }

  // --- Umbrella / Excess (per-room pricing) ---
  const umbrellaResult = calculateUmbrellaExcess({
    room_count,
    umbrella_limit,
    umbrella_sir,
    fleet_size,
    litigation_environment,
    has_valet,
    has_bar_liquor,
    amenities,
  });

  // --- Auto-Warnings ---
  const warnings = generateWarnings({
    stateUpper,
    roof_age,
    protection_class,
    sprinklered,
    totalInsurableValue,
    construction_type,
    location_zone,
    stories,
  });

  // --- Flood & Named Storm ---
  const floodInsuranceEstimate = config.floodInsuranceEstimates[flood_zone] || 0;
  const namedStormDeductiblePct = parseFloat(named_storm_deductible) / 100;
  const namedStormDeductibleAmt = isCoastalState && wind_tier !== 'Inland'
    ? Math.round(totalInsurableValue * namedStormDeductiblePct)
    : 0;

  // --- Totals (GL is all-in: hotel + restaurant + liquor) ---
  const totalPremium = propertyPremium + glPremium + umbrellaResult.total_premium;
  const totalWithFlood = totalPremium + floodInsuranceEstimate;

  // --- Effective rate per $100 ---
  const effectiveRatePer100 = totalInsurableValue > 0
    ? totalPremium / (totalInsurableValue / 100)
    : 0;

  return {
    // TIV breakdown
    building_value: buildingValue,
    contents_value: contentsValue,
    business_income_value: businessIncomeValue,
    total_insurable_value: totalInsurableValue,
    service_type: effectiveServiceType,

    // Property rate progression
    base_rate: +baseRate.toFixed(4),
    sprinkler_adjusted_rate: +sprinklerAdjustedRate.toFixed(4),
    modified_rate: +modifiedRate.toFixed(4),
    blended_rate_per_100: +blendedRatePer100.toFixed(4),
    effective_rate_per_100: +effectiveRatePer100.toFixed(4),

    // Per-bucket rates (tiered: building base, contents ×1.70, BI ×1.40)
    building_starting_rate: +sprinklerAdjustedRate.toFixed(4),
    building_modified_rate: +buildingModifiedRate.toFixed(4),
    building_premium: buildingPremium,
    contents_starting_rate: +(sprinklerAdjustedRate * config.contentsRateMultiplier).toFixed(4),
    contents_modified_rate: +contentsModifiedRate.toFixed(4),
    contents_premium: contentsPremium,
    contents_rate_multiplier: config.contentsRateMultiplier,
    bi_starting_rate: +(sprinklerAdjustedRate * config.biRateMultiplier).toFixed(4),
    bi_modified_rate: +biModifiedRate.toFixed(4),
    bi_premium: biPremium,
    bi_rate_multiplier: config.biRateMultiplier,
    equipment_breakdown_premium: equipBreakdownPremium,
    equipment_breakdown_base: equipBreakdownBase,

    // TIV warnings
    tiv_warnings: [],

    // Flags
    sprinklered,
    construction_type,

    // All applied factors
    age_factor: ageFactor,
    stories_factor: storiesFactor,
    roof_factor: roofFactor,
    geo_modifier: geoModifier,
    protection_class_factor: protectionFactor,
    wind_tier_factor: locationZoneApplied ? 1.00 : windTierFactor,
    flood_zone_factor: floodZoneFactor,
    named_storm_credit: namedStormCredit,
    location_type_factor: locationTypeFactor,
    location_zone_applied: locationZoneApplied,
    brand_tier: brandTier,
    brand_tier_multiplier: brandTierMultiplier,

    // Coastal exposure details
    is_coastal_state: isCoastalState,
    wind_tier,
    flood_zone,
    location_type,
    location_zone: locationZoneApplied ? location_zone : null,
    named_storm_deductible,
    named_storm_deductible_amount: namedStormDeductibleAmt,
    flood_insurance_estimate: floodInsuranceEstimate,

    // GL detail
    estimated_room_revenue: estimatedRoomRevenue,
    hotel_gl_rate: hotelGLRate,
    room_revenue_per_room: roomRevenuePerRoom,
    gl_restaurant_component: restaurantGLComponent,
    gl_liquor_component: liquorGLComponent,
    gl_resort_activities_component: resortActivitiesGLComponent,

    // Premium components
    property_premium: propertyPremium,
    general_liability_premium: glPremium,
    umbrella_excess_premium: umbrellaResult.total_premium,
    umbrella_detail: umbrellaResult,
    total_estimated_premium: totalPremium,
    total_with_flood: totalWithFlood,

    // Auto-warnings
    warnings,

    // Per-unit metrics
    premium_per_room: Math.round(totalPremium / (room_count || 1)),
    premium_per_sf: +(totalPremium / (square_footage || 1)).toFixed(2),

    // Market note
    market_note: config.marketNote,
  };
}

// --------------------------------------------------------------------------
// UMBRELLA / EXCESS LIABILITY CALCULATOR
// --------------------------------------------------------------------------
// Per-room base rates by limit tier, plus amenity surcharges.
// Bar/liquor surcharge replaces restaurant surcharge (don't double-count).
// --------------------------------------------------------------------------
function calculateUmbrellaExcess({
  room_count,
  umbrella_limit,
  umbrella_sir,
  fleet_size,
  litigation_environment,
  has_valet,
  has_bar_liquor,
  amenities,
}) {
  const uc = config.umbrella;
  const rooms = room_count || 100;

  // --- Base premium by limit tier ---
  let basePremium = 0;
  const tierConfig = uc.limitTiers[umbrella_limit] || uc.limitTiers['$25M'];

  if (tierConfig.perRoom === 'incremental') {
    const baseTierConfig = uc.limitTiers[tierConfig.baseLimit];
    if (baseTierConfig.perRoom === 'incremental') {
      // $125M: base is $100M which is itself incremental on $50M
      const baseTier50 = uc.limitTiers[baseTierConfig.baseLimit];
      const base50Premium = baseTier50.perRoom * rooms;
      const base100Premium = base50Premium + (baseTierConfig.incrementalPerRoom * rooms);
      basePremium = base100Premium + (tierConfig.incrementalPerRoom * rooms);
    } else {
      basePremium = (baseTierConfig.perRoom * rooms) + (tierConfig.incrementalPerRoom * rooms);
    }
  } else {
    basePremium = tierConfig.perRoom * rooms;
  }

  // --- Amenity surcharges (per room) ---
  let amenitySurchargeTotal = 0;
  const amenitySurchargeBreakdown = {};

  if (amenities.pool) {
    const amt = uc.amenitySurcharges.pool * rooms;
    amenitySurchargeTotal += amt;
    amenitySurchargeBreakdown.pool = amt;
  }

  // Bar/liquor replaces restaurant surcharge (don't double-count)
  if (has_bar_liquor) {
    const amt = uc.amenitySurcharges.bar_liquor * rooms;
    amenitySurchargeTotal += amt;
    amenitySurchargeBreakdown.bar_liquor = amt;
  } else if (amenities.restaurant) {
    const amt = uc.amenitySurcharges.restaurant * rooms;
    amenitySurchargeTotal += amt;
    amenitySurchargeBreakdown.restaurant = amt;
  }

  if (has_valet) {
    const amt = uc.amenitySurcharges.valet * rooms;
    amenitySurchargeTotal += amt;
    amenitySurchargeBreakdown.valet = amt;
  }

  const premiumBeforeModifiers = basePremium + amenitySurchargeTotal;

  // --- Litigation modifier ---
  const litigationKey = litigation_environment || 'moderate';
  const litigationModifier = uc.litigationModifiers[litigationKey] || 1.00;

  // --- Fleet modifier ---
  const fleetCount = fleet_size || 0;
  let fleetModifier = 1.00;
  for (const bracket of uc.fleetModifiers) {
    if (fleetCount <= bracket.maxVehicles) {
      fleetModifier = bracket.modifier;
      break;
    }
  }

  // --- SIR discount ---
  const sirKey = umbrella_sir || '$25K';
  const sirModifier = uc.sirOptions[sirKey] || 1.00;

  // --- Final premium ---
  const totalPremium = Math.round(premiumBeforeModifiers * litigationModifier * fleetModifier * sirModifier);

  return {
    umbrella_limit,
    base_premium: Math.round(basePremium),
    amenity_surcharges: amenitySurchargeBreakdown,
    amenity_surcharge_total: Math.round(amenitySurchargeTotal),
    premium_before_modifiers: Math.round(premiumBeforeModifiers),
    litigation_modifier: litigationModifier,
    litigation_environment: litigationKey,
    fleet_modifier: fleetModifier,
    fleet_size: fleetCount,
    sir_modifier: sirModifier,
    sir: sirKey,
    total_premium: totalPremium,
  };
}

// --------------------------------------------------------------------------
// AUTO-WARNINGS GENERATOR
// --------------------------------------------------------------------------
function generateWarnings({ stateUpper, roof_age, protection_class, sprinklered, totalInsurableValue, construction_type, location_zone, stories }) {
  const warnings = [];
  const wt = config.warningThresholds;

  if (wt.catZoneStates.includes(stateUpper)) {
    warnings.push(`Property is in a CAT-exposed state (${stateUpper}). Expect higher wind/hail deductibles and limited carrier appetite.`);
  }

  if (location_zone === 'twia') {
    warnings.push('Property is in a TWIA (Texas Windstorm Insurance Association) or similar wind pool zone. Wind coverage may require separate placement.');
  }

  if (roof_age >= wt.oldRoofAge) {
    warnings.push(`Roof age (${roof_age} years) exceeds ${wt.oldRoofAge}-year threshold. Many carriers require roof inspection or apply ACV valuation.`);
  }

  if (protection_class >= wt.highPPC) {
    warnings.push(`Protection Class ${protection_class} indicates limited fire department response. Carrier appetite may be restricted.`);
  }

  if (wt.nonSprinkleredWarning && !sprinklered) {
    warnings.push('Non-sprinklered building. 60% surcharge applied. Many carriers require sprinkler systems for hotels over 3 stories.');
  }

  if (totalInsurableValue > wt.highTIV) {
    warnings.push(`Total Insurable Value ($${(totalInsurableValue / 1000000).toFixed(1)}M) exceeds $50M threshold. May require layered/shared program structure.`);
  }

  if (construction_type === 'Frame' || construction_type === 'Joisted Masonry') {
    warnings.push(`${construction_type} construction type carries higher fire risk. Limited carrier options for large properties.`);
  }

  if (stories >= 10 && !sprinklered) {
    warnings.push('High-rise (10+ stories) without sprinkler system is extremely difficult to place in the standard market.');
  }

  return warnings;
}

// Lookup helper: finds the first bracket where value <= bracket threshold
function lookupBracket(brackets, value, field, thresholdKey = 'maxAge') {
  for (const bracket of brackets) {
    if (value <= bracket[thresholdKey]) return bracket[field];
  }
  return brackets[brackets.length - 1][field];
}

export default app;
