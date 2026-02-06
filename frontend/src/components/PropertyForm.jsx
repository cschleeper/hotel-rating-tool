const CONSTRUCTION_TYPES = [
  'Fire Resistive',
  'Modified Fire Resistive',
  'Non-Combustible',
  'Masonry Non-Combustible',
  'Joisted Masonry',
  'Frame',
];

const US_STATES = [
  ['', 'Select state...'],
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
  ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
  ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'],
  ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'],
  ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'],
  ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
  ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'],
  ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'],
  ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'],
  ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'],
  ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'],
  ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
];

const AMENITY_LABELS = {
  pool: 'Pool',
  restaurant: 'Restaurant / Bar',
  fitness_center: 'Fitness Center',
  spa: 'Spa',
  business_center: 'Business Center',
  meeting_space: 'Meeting Space',
};

function ConfidenceBadge({ level }) {
  if (!level) return null;

  const colors = {
    high: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[level] || colors.low}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)} Confidence
    </span>
  );
}

export default function PropertyForm({ property, onChange, onCalculate, onClear, isCalculating }) {
  const updateField = (field, value) => {
    onChange({ ...property, [field]: value });
  };

  const updateAmenity = (amenity, value) => {
    onChange({
      ...property,
      amenities: { ...property.amenities, [amenity]: value },
    });
  };

  const hasData = property.property_name || property.full_address || property.room_count;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-navy-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-lg font-semibold text-navy-800">Property Details</h2>
        </div>
        <ConfidenceBadge level={property.confidence_level} />
      </div>

      {/* Property Info - Two Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {/* Left Column */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Property Name</label>
          <input
            type="text"
            value={property.property_name}
            onChange={(e) => updateField('property_name', e.target.value)}
            placeholder="Hotel name"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
          <input
            type="text"
            value={property.brand}
            onChange={(e) => updateField('brand', e.target.value)}
            placeholder="e.g. Marriott, Hilton, Independent"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Address</label>
          <input
            type="text"
            value={property.full_address}
            onChange={(e) => updateField('full_address', e.target.value)}
            placeholder="Street, City, State, ZIP"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Number of Rooms</label>
          <input
            type="number"
            value={property.room_count}
            onChange={(e) => updateField('room_count', e.target.value)}
            placeholder="e.g. 200"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Square Footage</label>
          <input
            type="number"
            value={property.square_footage}
            onChange={(e) => updateField('square_footage', e.target.value)}
            placeholder="e.g. 150000"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Year Built</label>
          <input
            type="number"
            value={property.year_built}
            onChange={(e) => updateField('year_built', e.target.value)}
            placeholder="e.g. 1995"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Stories</label>
          <input
            type="number"
            value={property.stories}
            onChange={(e) => updateField('stories', e.target.value)}
            placeholder="e.g. 5"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Construction Type</label>
          <select
            value={property.construction_type}
            onChange={(e) => updateField('construction_type', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800 bg-white"
          >
            {CONSTRUCTION_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Sprinklered</label>
          <button
            type="button"
            onClick={() => updateField('sprinklered', !property.sprinklered)}
            className={`w-full px-3 py-2 border rounded-lg text-sm font-medium transition-colors text-left ${
              property.sprinklered
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-red-50 border-red-300 text-red-800'
            }`}
          >
            {property.sprinklered ? 'Yes — Sprinklered' : 'No — Non-Sprinklered'}
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
          <select
            value={property.state}
            onChange={(e) => updateField('state', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800 bg-white"
          >
            {US_STATES.map(([code, name]) => (
              <option key={code} value={code}>{code ? `${code} — ${name}` : name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Roof Age (years)</label>
          <input
            type="number"
            value={property.roof_age}
            onChange={(e) => updateField('roof_age', e.target.value)}
            placeholder="e.g. 10"
            min="0"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Protection Class (1-10)</label>
          <select
            value={property.protection_class}
            onChange={(e) => updateField('protection_class', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800 bg-white"
          >
            {[1,2,3,4,5,6,7,8,9,10].map((pc) => (
              <option key={pc} value={pc}>{pc}{pc === 4 ? ' (typical urban)' : pc === 10 ? ' (unprotected)' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Photo Analysis Results */}
      {property.photo_analysis && (
        <div className="mt-6 pt-5 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-navy-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-sm font-medium text-navy-800">
              Photo Analysis
              <span className="ml-2 text-xs font-normal text-slate-500">
                ({property.photo_analysis.images_analyzed} image{property.photo_analysis.images_analyzed !== 1 ? 's' : ''} analyzed)
              </span>
            </h3>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {property.photo_analysis.exterior_material && (
                <div>
                  <span className="text-slate-500 text-xs block">Exterior</span>
                  <span className="font-medium text-slate-800">{property.photo_analysis.exterior_material}</span>
                </div>
              )}
              {property.photo_analysis.roof_type && (
                <div>
                  <span className="text-slate-500 text-xs block">Roof Type</span>
                  <span className="font-medium text-slate-800 capitalize">{property.photo_analysis.roof_type}</span>
                </div>
              )}
              {property.photo_analysis.estimated_condition && (
                <div>
                  <span className="text-slate-500 text-xs block">Condition</span>
                  <span className="font-medium text-slate-800 capitalize">{property.photo_analysis.estimated_condition}</span>
                </div>
              )}
            </div>
            {property.photo_analysis.photo_notes && (
              <p className="mt-3 text-xs text-slate-600 leading-relaxed border-t border-blue-200 pt-3">
                {property.photo_analysis.photo_notes}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Amenities */}
      <div className="mt-6 pt-5 border-t border-slate-200">
        <h3 className="text-sm font-medium text-slate-700 mb-3">Amenities & Features</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {Object.entries(AMENITY_LABELS).map(([key, label]) => (
            <label
              key={key}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors text-sm ${
                property.amenities[key]
                  ? 'bg-navy-50 border-navy-300 text-navy-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                checked={property.amenities[key] || false}
                onChange={(e) => updateAmenity(key, e.target.checked)}
                className="rounded border-slate-300 text-navy-800 focus:ring-navy-800/20"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 pt-5 border-t border-slate-200 flex items-center gap-3">
        <button
          onClick={onCalculate}
          disabled={isCalculating}
          className="px-6 py-2.5 bg-navy-800 text-white rounded-lg text-sm font-medium hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-navy-800/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isCalculating ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Calculating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Calculate Rating
            </>
          )}
        </button>
        {hasData && (
          <button
            onClick={onClear}
            className="px-4 py-2.5 text-slate-600 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
}
