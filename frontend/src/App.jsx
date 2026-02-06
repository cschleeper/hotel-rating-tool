import { useState } from 'react';
import PropertySearch from './components/PropertySearch';
import PropertyForm from './components/PropertyForm';
import RatingCalculator from './components/RatingCalculator';

const EMPTY_PROPERTY = {
  property_name: '',
  full_address: '',
  brand: '',
  room_count: '',
  stories: '',
  year_built: '',
  construction_type: 'Masonry Non-Combustible',
  square_footage: '',
  sprinklered: true,
  state: '',
  roof_age: '',
  protection_class: '4',
  amenities: {
    pool: false,
    restaurant: false,
    fitness_center: false,
    spa: false,
    business_center: false,
    meeting_space: false,
  },
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

      setProperty({
        ...EMPTY_PROPERTY,
        ...data.property,
        room_count: data.property.room_count ?? '',
        stories: data.property.stories ?? '',
        year_built: data.property.year_built ?? '',
        square_footage: data.property.square_footage ?? '',
        sprinklered: data.property.sprinklered ?? true,
        state: data.property.state ?? '',
        roof_age: EMPTY_PROPERTY.roof_age,
        protection_class: EMPTY_PROPERTY.protection_class,
        amenities: {
          ...EMPTY_PROPERTY.amenities,
          ...(data.property.amenities || {}),
        },
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
          <div className="flex items-center justify-between">
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
            <div className="text-right text-sm hidden sm:block">
              <p className="font-semibold">Colin Schleeper</p>
              <p className="text-navy-200 text-xs">Risk Advisor — Hospitality Division</p>
              <div className="flex items-center justify-end gap-3 mt-1 text-xs text-navy-200">
                <a href="mailto:colin.schleeper@cbiz.com" className="hover:text-white transition-colors">colin.schleeper@cbiz.com</a>
                <span className="text-navy-400">|</span>
                <a href="tel:+16093372202" className="hover:text-white transition-colors">(609) 337-2202</a>
              </div>
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
