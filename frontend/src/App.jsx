import { useState } from 'react';
import PropertySearch from './components/PropertySearch';
import PropertyForm from './components/PropertyForm';
import RatingCalculator from './components/RatingCalculator';

const EMPTY_PROPERTY = {
  property_name: '',
  full_address: '',
  brand: '',
  service_type: 'full-service',
  location_type: 'suburban',
  location_zone: 'inland',
  room_count: '',
  stories: '',
  year_built: '',
  construction_type: 'Masonry Non-Combustible',
  square_footage: '',
  sprinklered: true,
  state: '',
  roof_age: '',
  protection_class: '4',
  wind_tier: 'Inland',
  flood_zone: 'X',
  named_storm_deductible: '2%',
  amenities: {
    pool: false,
    restaurant: false,
    fitness_center: false,
    spa: false,
    business_center: false,
    meeting_space: false,
  },
  // Umbrella / Excess fields
  umbrella_limit: '$25M',
  umbrella_sir: '$25K',
  fleet_size: 0,
  litigation_environment: 'moderate',
  has_valet: false,
  has_bar_liquor: false,
  confidence_level: '',
};

export default function App() {
  const [property, setProperty] = useState(EMPTY_PROPERTY);
  const [rating, setRating] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [ratingError, setRatingError] = useState('');

  const handleSearch = async (query) => {
    setIsSearching(true);
    setSearchError('');
    setRating(null);

    try {
      const res = await fetch('/api/property-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Search failed');
      }

      // Map AI distance_to_coast to wind tier
      const coastToTier = {
        'beachfront': 'Tier 1',
        'under 1 mile': 'Tier 2',
        '1-5 miles': 'Tier 3',
        '5-10 miles': 'Tier 4',
        '10-25 miles': 'Tier 5',
        '25+ miles': 'Inland',
      };
      const windTier = coastToTier[data.property.distance_to_coast] || EMPTY_PROPERTY.wind_tier;

      setProperty({
        ...EMPTY_PROPERTY,
        ...data.property,
        room_count: data.property.room_count ?? '',
        stories: data.property.stories ?? '',
        year_built: data.property.year_built ?? '',
        square_footage: data.property.square_footage ?? '',
        sprinklered: data.property.sprinklered ?? true,
        state: data.property.state ?? '',
        service_type: data.property.service_type || EMPTY_PROPERTY.service_type,
        location_type: data.property.location_type || EMPTY_PROPERTY.location_type,
        location_zone: data.property.location_zone || EMPTY_PROPERTY.location_zone,
        roof_age: EMPTY_PROPERTY.roof_age,
        protection_class: EMPTY_PROPERTY.protection_class,
        wind_tier: windTier,
        flood_zone: data.property.flood_zone || EMPTY_PROPERTY.flood_zone,
        named_storm_deductible: EMPTY_PROPERTY.named_storm_deductible,
        amenities: {
          ...EMPTY_PROPERTY.amenities,
          ...(data.property.amenities || {}),
        },
        // Preserve umbrella defaults
        umbrella_limit: EMPTY_PROPERTY.umbrella_limit,
        umbrella_sir: EMPTY_PROPERTY.umbrella_sir,
        fleet_size: EMPTY_PROPERTY.fleet_size,
        litigation_environment: EMPTY_PROPERTY.litigation_environment,
        has_valet: EMPTY_PROPERTY.has_valet,
        has_bar_liquor: EMPTY_PROPERTY.has_bar_liquor,
      });
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCalculate = async () => {
    setIsCalculating(true);
    setRatingError('');

    try {
      const payload = {
        property: {
          ...property,
          room_count: Number(property.room_count) || 0,
          stories: Number(property.stories) || 0,
          year_built: Number(property.year_built) || 2000,
          square_footage: Number(property.square_footage) || 0,
          roof_age: Number(property.roof_age) || 10,
          protection_class: Number(property.protection_class) || 4,
          fleet_size: Number(property.fleet_size) || 0,
        },
      };

      const res = await fetch('/api/calculate-rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Calculation failed');
      }

      setRating(data.rating);
    } catch (err) {
      setRatingError(err.message);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleClear = () => {
    setProperty(EMPTY_PROPERTY);
    setRating(null);
    setSearchError('');
    setRatingError('');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-navy-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Hotel Property Intelligence</h1>
              <p className="text-sm text-navy-200 font-light">Insurance Rating & Analytics</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Search Section */}
        <PropertySearch
          onSearch={handleSearch}
          isSearching={isSearching}
          error={searchError}
        />

        {/* Property Form */}
        <PropertyForm
          property={property}
          onChange={setProperty}
          onCalculate={handleCalculate}
          onClear={handleClear}
          isCalculating={isCalculating}
        />

        {/* Rating Results */}
        {ratingError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm">
            {ratingError}
          </div>
        )}

        {rating && <RatingCalculator rating={rating} property={property} />}
      </main>

      {/* Footer */}
      <footer className="bg-navy-800 text-navy-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm">
          <p>Hotel Property Intelligence & Insurance Rating Tool</p>
          <p className="text-navy-300 mt-1">Estimates are for illustrative purposes only. Consult a licensed insurance professional for actual quotes.</p>
        </div>
      </footer>
    </div>
  );
}
