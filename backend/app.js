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
    // Skip tiny images (icons/spacers) and overly large ones
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

IMPORTANT — Search strategy:
1. First, search LoopNet for this property (e.g. "site:loopnet.com ${query}"). LoopNet listings have the most reliable building data: square footage, year built, stories, lot size, and construction details.
2. Also search CoStar, CREXi, and commercial real estate listing sites for additional property details.
3. Search the hotel brand's website and travel sites (TripAdvisor, Booking.com) for room count, amenities, and photos.
4. Search county property appraiser / tax assessor records for year built, square footage, and construction type if available.
5. Use Google Maps / street view results for exterior photos.

Return a JSON object with these fields:

- property_name (string)
- full_address (string)
- brand (string, e.g. "Marriott", "Hilton", "Independent")
- room_count (number)
- stories (number — from LoopNet/CRE listings if available, otherwise best estimate)
- year_built (number — from LoopNet/tax records if available)
- construction_type (string — from LoopNet/CRE data if available, otherwise estimate from brand standards and age: "Fire Resistive", "Modified Fire Resistive", "Non-Combustible", "Masonry Non-Combustible", "Joisted Masonry", or "Frame")
- square_footage (number — from LoopNet/tax records if available, otherwise estimate: rooms × 500-600 SF for limited-service, rooms × 700-900 SF for full-service)
- lot_size (number or null — lot size in acres if found on LoopNet or tax records)
- sprinklered (boolean — assume true for hotels built after 1990 or major brands)
- state (string — two-letter US state abbreviation)
- amenities (object with boolean fields: pool, restaurant, fitness_center, spa, business_center, meeting_space)
- confidence_level (string: "high" if key data from LoopNet/tax records, "medium" if from brand/travel sites, "low" if mostly estimated)
- data_sources (array of strings — list which sources you actually found data on, e.g. ["LoopNet", "TripAdvisor", "Marriott.com"])
- image_urls (array of strings — include up to 5 URLs of exterior photos of the building you found during search. Prioritize LoopNet listing photos, Google Maps street view, and hotel website exterior shots. These will be analyzed to verify construction type and story count.)

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
        // Build the vision message with images + text prompt
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

Analyze the building photo(s) above and return a JSON object with ONLY these fields — provide your best assessment from what you can see:

- stories (number — count the visible floors carefully. Look for windows per floor, ground floor, roof structures)
- construction_type (string — one of: "Fire Resistive", "Modified Fire Resistive", "Non-Combustible", "Masonry Non-Combustible", "Joisted Masonry", "Frame". Look for: concrete/steel frame = Fire Resistive; brick/masonry walls with concrete = Masonry Non-Combustible; wood siding/frame = Frame; metal panels = Non-Combustible)
- roof_type (string — "flat", "pitched", "hip", "mansard", or "mixed")
- exterior_material (string — what you see: "brick", "stucco", "EIFS", "glass curtain wall", "concrete", "metal panel", "wood siding", "stone veneer", etc.)
- visible_amenities (object with booleans: pool, parking_structure, porte_cochere, solar_panels, outdoor_dining)
- estimated_condition (string: "excellent", "good", "fair", "poor")
- photo_notes (string — brief notes about anything relevant to insurance underwriting you observe)

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

          // Merge vision results — vision overrides text search for visual fields
          if (visionData.stories) initialData.stories = visionData.stories;
          if (visionData.construction_type) initialData.construction_type = visionData.construction_type;

          // Attach vision metadata so the frontend can display it
          initialData.photo_analysis = {
            roof_type: visionData.roof_type || null,
            exterior_material: visionData.exterior_material || null,
            estimated_condition: visionData.estimated_condition || null,
            photo_notes: visionData.photo_notes || null,
            images_analyzed: validImages.length,
          };

          // Merge any visible amenities
          if (visionData.visible_amenities?.pool && !initialData.amenities?.pool) {
            initialData.amenities = { ...initialData.amenities, pool: true };
          }
        }
      }
    }

    console.log(`[Lookup] Done. Returning property data.`);
    res.json({ property: initialData });
  } catch (error) {
    console.error('Property lookup error:', error);
    res.status(500).json({
      error: 'Failed to look up property. Please check your API key and try again.',
    });
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

function calculateInsuranceRating(property) {
  const {
    room_count = 100,
    stories = 3,
    year_built = 2000,
    construction_type = 'Masonry Non-Combustible',
    square_footage = 50000,
    sprinklered = true,
    state = '',
    roof_age = 10,
    protection_class = config.defaultProtectionClass,
    amenities = {},
  } = property;

  const currentYear = new Date().getFullYear();
  const buildingAge = currentYear - (year_built || 2000);

  // --- Base rate from config (sprinklered vs non-sprinklered) ---
  // Loss cost × LCM = final rate
  const rateTable = sprinklered
    ? config.baseRatesPer100.sprinklered
    : config.baseRatesPer100.nonSprinklered;
  const lossCostPer100 = rateTable[construction_type] || config.defaultBaseRate;
  const baseRatePer100 = lossCostPer100 * config.lossCostMultiplier;

  // --- TIV calculation from config ---
  const buildingCostPerSF =
    config.tivMultipliers.buildingCostPerSF[construction_type] ||
    config.tivMultipliers.defaultBuildingCostPerSF;

  const ageAdjustment = lookupBracket(config.tivMultipliers.ageAdjustments, buildingAge, 'multiplier');
  const buildingValue = Math.round(square_footage * buildingCostPerSF * ageAdjustment);
  const contentsValue = Math.round(room_count * config.tivMultipliers.contentsPerRoom);
  const businessIncomeValue = Math.round(room_count * config.tivMultipliers.businessIncomePerRoom);
  const totalInsurableValue = buildingValue + contentsValue + businessIncomeValue;

  // --- Rating factors from config ---
  const ageFactor = lookupBracket(config.buildingAgeModifiers, buildingAge, 'modifier');
  const storiesFactor = lookupBracket(config.storiesModifiers, stories, 'modifier', 'maxStories');
  const roofFactor = lookupBracket(config.roofAgeModifiers, roof_age, 'modifier');
  const geoModifier = config.geographicModifiers[state.toUpperCase()] || config.defaultGeoModifier;
  const protectionFactor = config.protectionClassModifiers[protection_class] ||
    config.protectionClassModifiers[config.defaultProtectionClass];

  // --- Amenities factor from config ---
  let amenitiesFactor = 1.0;
  for (const [key, addend] of Object.entries(config.amenityModifiers)) {
    if (amenities[key]) amenitiesFactor += addend;
  }

  // --- Property premium: (TIV / 100) × base rate × all modifiers ---
  const propertyPremium = Math.round(
    (totalInsurableValue / 100) *
    baseRatePer100 *
    ageFactor *
    storiesFactor *
    roofFactor *
    geoModifier *
    protectionFactor
  );

  // --- Liability premiums from config ---
  const glPremium = Math.round(
    room_count * config.liabilityRates.glPerRoom * amenitiesFactor
  );
  const liquorLiability = amenities.restaurant
    ? Math.round(room_count * config.liabilityRates.liquorPerRoom)
    : 0;
  const umbrellaExcessPremium = Math.round(
    (propertyPremium + glPremium) * config.liabilityRates.umbrellaFactor
  );

  const totalPremium = propertyPremium + glPremium + liquorLiability + umbrellaExcessPremium;

  return {
    // TIV breakdown
    building_value: buildingValue,
    contents_value: contentsValue,
    business_income_value: businessIncomeValue,
    total_insurable_value: totalInsurableValue,

    // Rate info
    loss_cost_per_100: lossCostPer100,
    lcm: config.lossCostMultiplier,
    base_rate_per_100: baseRatePer100,
    sprinklered,

    // All applied factors
    age_factor: ageFactor,
    stories_factor: storiesFactor,
    roof_factor: roofFactor,
    geo_modifier: geoModifier,
    protection_class_factor: protectionFactor,
    amenities_factor: amenitiesFactor,

    // Premium components
    property_premium: propertyPremium,
    general_liability_premium: glPremium,
    liquor_liability_premium: liquorLiability,
    umbrella_excess_premium: umbrellaExcessPremium,
    total_estimated_premium: totalPremium,

    // Per-unit metrics
    premium_per_room: Math.round(totalPremium / (room_count || 1)),
    premium_per_sf: +(totalPremium / (square_footage || 1)).toFixed(2),

    // Risk grade from config
    risk_grade: getRiskGrade(totalPremium, room_count),
  };
}

// Lookup helper: finds the first bracket where value <= bracket threshold
function lookupBracket(brackets, value, field, thresholdKey = 'maxAge') {
  for (const bracket of brackets) {
    if (value <= bracket[thresholdKey]) return bracket[field];
  }
  return brackets[brackets.length - 1][field];
}

function getRiskGrade(totalPremium, roomCount) {
  const perRoom = totalPremium / (roomCount || 1);
  for (const tier of config.riskGradeThresholds) {
    if (perRoom <= tier.maxPerRoom) return `${tier.grade} - ${tier.label}`;
  }
  return 'E - Poor';
}

export default app;
