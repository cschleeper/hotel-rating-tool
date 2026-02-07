import { useState } from 'react';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function StatCard({ label, value, subtitle, color = 'navy' }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color === 'navy' ? 'text-navy-800' : `text-${color === 'green' ? 'emerald-600' : color === 'amber' ? 'amber-600' : 'red-600'}`}`}>
        {value}
      </p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}

function RiskGradeBadge({ grade }) {
  const letter = grade?.charAt(0) || '?';
  const colorMap = {
    A: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    B: 'bg-blue-100 text-blue-800 border-blue-200',
    C: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    D: 'bg-orange-100 text-orange-800 border-orange-200',
    E: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold ${colorMap[letter] || colorMap.C}`}>
      <span className="text-lg">{letter}</span>
      <span className="font-medium">{grade?.split(' - ')[1] || ''}</span>
    </div>
  );
}

export default function RatingCalculator({ rating, property }) {
  const [umbrellaDetailOpen, setUmbrellaDetailOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Warnings */}
      {rating.warnings && rating.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-sm font-semibold text-amber-800">Underwriting Alerts</h3>
          </div>
          <ul className="space-y-1.5">
            {rating.warnings.map((warning, i) => (
              <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">-</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Estimated Premium"
          value={formatCurrency(rating.total_estimated_premium)}
          subtitle={rating.flood_insurance_estimate > 0 ? `${formatCurrency(rating.total_with_flood)} incl. flood` : 'Annual premium'}
        />
        <StatCard
          label="Property Premium"
          value={formatCurrency(rating.property_premium)}
          subtitle={`Rate: $${rating.blended_rate_per_100.toFixed(2)} / $100`}
          color="navy"
        />
        <StatCard
          label="GL Premium (All-In)"
          value={formatCurrency(rating.general_liability_premium)}
          subtitle={`$${rating.hotel_gl_rate.toFixed(2)} / $1K room rev`}
          color="navy"
        />
        <StatCard
          label="Cost per Room"
          value={formatCurrency(rating.premium_per_room)}
          subtitle={`${property.room_count || '—'} rooms`}
          color="green"
        />
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Risk Grade</p>
          <div className="mt-2">
            <RiskGradeBadge grade={rating.risk_grade} />
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <svg className="w-5 h-5 text-navy-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-lg font-semibold text-navy-800">Rating Breakdown</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Premium Components */}
          <div>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">Premium Components</h3>
            <div className="space-y-3">
              <PremiumRow label="Property Premium" value={rating.property_premium} />
              <PremiumRow label="General Liability (All-In)" value={rating.general_liability_premium} />
              <PremiumRow label="Umbrella / Excess" value={rating.umbrella_excess_premium} />
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="text-sm font-bold text-navy-800">Total Premium</span>
                <span className="text-sm font-bold text-navy-800">
                  {formatCurrency(rating.total_estimated_premium)}
                </span>
              </div>
              {rating.flood_insurance_estimate > 0 && (
                <>
                  <div className="pt-2">
                    <PremiumRow label="Est. Flood Insurance (separate policy)" value={rating.flood_insurance_estimate} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-emerald-700">Total incl. Flood</span>
                    <span className="text-sm font-bold text-emerald-700">
                      {formatCurrency(rating.total_with_flood)}
                    </span>
                  </div>
                </>
              )}
              {rating.named_storm_deductible_amount > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Named Storm Deductible ({rating.named_storm_deductible} of TIV)</span>
                    <span className="text-xs font-medium text-slate-500">{formatCurrency(rating.named_storm_deductible_amount)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rating Factors */}
          <div>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">Rating Factors</h3>
            <div className="space-y-3">
              <FactorRow label="Construction Type" value={rating.construction_type} />
              <FactorRow label="Building Base Rate" value={`$${rating.base_rate.toFixed(3)} /\u00A0$100`} />
              <FactorRow
                label={rating.sprinklered ? 'Sprinkler Status' : 'Non-Sprinkler (+60%)'}
                value={rating.sprinklered ? 'Sprinklered' : `$${rating.sprinkler_adjusted_rate.toFixed(3)} /\u00A0$100`}
              />
              <FactorRow label="Building Modified Rate" value={`$${rating.modified_rate.toFixed(3)} /\u00A0$100`} />
              <FactorRow label={`Contents Rate (×${rating.contents_rate_multiplier})`} value={`$${rating.contents_modified_rate.toFixed(3)} /\u00A0$100`} />
              <FactorRow label={`BI Rate (×${rating.bi_rate_multiplier})`} value={`$${rating.bi_modified_rate.toFixed(3)} /\u00A0$100`} />
              <div className="pt-2 border-t border-slate-100">
                <FactorRow label="Blended Rate (all property)" value={`$${rating.blended_rate_per_100.toFixed(3)} /\u00A0$100`} />
              </div>
              <div className="pt-2 border-t border-slate-100">
                <FactorRow label="Building Age Factor" value={`${rating.age_factor.toFixed(2)}x`} />
                <FactorRow label="Stories Factor" value={`${rating.stories_factor.toFixed(2)}x`} />
                <FactorRow label="Roof Age Factor" value={`${rating.roof_factor.toFixed(2)}x`} />
                <FactorRow
                  label={rating.location_zone_applied ? `Geographic (${rating.location_zone})` : 'Geographic Modifier'}
                  value={`${rating.geo_modifier.toFixed(2)}x`}
                />
                <FactorRow label="Protection Class Factor" value={`${rating.protection_class_factor.toFixed(2)}x`} />
                {rating.location_type_factor !== 1.00 && (
                  <FactorRow label={`Location Type (${rating.location_type})`} value={`${rating.location_type_factor.toFixed(2)}x`} />
                )}
                {rating.wind_tier_factor !== 1.00 && (
                  <FactorRow label={`Wind Tier (${rating.wind_tier})`} value={`${rating.wind_tier_factor.toFixed(2)}x`} />
                )}
                {rating.flood_zone_factor !== 1.00 && (
                  <FactorRow label={`Flood Zone (${rating.flood_zone})`} value={`${rating.flood_zone_factor.toFixed(2)}x`} />
                )}
                {rating.named_storm_credit !== 1.00 && (
                  <FactorRow label={`Storm Deductible (${rating.named_storm_deductible})`} value={`${rating.named_storm_credit.toFixed(2)}x`} />
                )}
              </div>
              <div className="pt-2 border-t border-slate-100">
                <FactorRow label="GL Rate (hotel)" value={`$${rating.hotel_gl_rate.toFixed(2)} /\u00A0$1K room rev`} />
                <FactorRow label="Room Revenue / Room" value={formatCurrency(rating.room_revenue_per_room)} />
                <FactorRow label="Total Room Revenue" value={formatCurrency(rating.estimated_room_revenue)} />
                {rating.gl_restaurant_component > 0 && (
                  <FactorRow label="Restaurant GL" value={formatCurrency(rating.gl_restaurant_component)} />
                )}
                {rating.gl_liquor_component > 0 && (
                  <FactorRow label="Liquor GL" value={formatCurrency(rating.gl_liquor_component)} />
                )}
              </div>
              <div className="pt-2 border-t border-slate-100">
                <FactorRow label="Premium per SF" value={`$${rating.premium_per_sf.toFixed(2)}`} />
              </div>
            </div>
          </div>

          {/* TIV Breakdown */}
          <div className="md:col-span-2 pt-6 border-t border-slate-200 mt-2">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">Total Insurable Value Breakdown</h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 font-medium">Building Value</p>
                <p className="text-lg font-semibold text-navy-800 mt-1">{formatCurrency(rating.building_value)}</p>
                <p className="text-xs text-slate-400 mt-1">
                  @ ${rating.building_modified_rate.toFixed(3)}/100 = {formatCurrency(rating.building_premium)}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 font-medium">Contents (FF&E)</p>
                <p className="text-lg font-semibold text-navy-800 mt-1">{formatCurrency(rating.contents_value)}</p>
                <p className="text-xs text-slate-400 mt-1">
                  @ ${rating.contents_modified_rate.toFixed(3)}/100 = {formatCurrency(rating.contents_premium)}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 font-medium">Business Income</p>
                <p className="text-lg font-semibold text-navy-800 mt-1">{formatCurrency(rating.business_income_value)}</p>
                <p className="text-xs text-slate-400 mt-1">
                  @ ${rating.bi_modified_rate.toFixed(3)}/100 = {formatCurrency(rating.bi_premium)}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 font-medium">Equipment Breakdown</p>
                <p className="text-lg font-semibold text-navy-800 mt-1">{formatCurrency(rating.equipment_breakdown_premium)}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Flat fee (age-adjusted)
                </p>
              </div>
              <div className="bg-navy-50 rounded-lg p-4 border border-navy-200">
                <p className="text-xs text-navy-600 font-medium">Total Insurable Value</p>
                <p className="text-lg font-semibold text-navy-800 mt-1">{formatCurrency(rating.total_insurable_value)}</p>
                <p className="text-xs text-navy-500 mt-1">
                  Property: {formatCurrency(rating.property_premium)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Umbrella Detail — Collapsible */}
        {rating.umbrella_detail && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setUmbrellaDetailOpen(!umbrellaDetailOpen)}
              className="flex items-center gap-2 w-full text-left"
            >
              <svg
                className={`w-4 h-4 text-slate-500 transition-transform ${umbrellaDetailOpen ? 'rotate-90' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                Umbrella / Excess Detail — {rating.umbrella_detail.umbrella_limit}
              </h3>
              <span className="ml-auto text-sm font-semibold text-navy-800">
                {formatCurrency(rating.umbrella_excess_premium)}
              </span>
            </button>

            {umbrellaDetailOpen && (
              <div className="mt-4 bg-slate-50 rounded-lg p-4 space-y-2">
                <FactorRow label="Base Premium (per-room)" value={formatCurrency(rating.umbrella_detail.base_premium)} />
                {Object.entries(rating.umbrella_detail.amenity_surcharges).map(([key, val]) => (
                  <FactorRow key={key} label={`Surcharge: ${key.replace(/_/g, ' ')}`} value={`+${formatCurrency(val)}`} />
                ))}
                {rating.umbrella_detail.amenity_surcharge_total > 0 && (
                  <FactorRow label="Total Amenity Surcharges" value={formatCurrency(rating.umbrella_detail.amenity_surcharge_total)} />
                )}
                <div className="pt-2 border-t border-slate-200">
                  <FactorRow label="Premium Before Modifiers" value={formatCurrency(rating.umbrella_detail.premium_before_modifiers)} />
                </div>
                <FactorRow
                  label={`Litigation Modifier (${rating.umbrella_detail.litigation_environment})`}
                  value={`${rating.umbrella_detail.litigation_modifier.toFixed(2)}x`}
                />
                {rating.umbrella_detail.fleet_modifier !== 1.00 && (
                  <FactorRow
                    label={`Fleet Modifier (${rating.umbrella_detail.fleet_size} vehicles)`}
                    value={`${rating.umbrella_detail.fleet_modifier.toFixed(2)}x`}
                  />
                )}
                {rating.umbrella_detail.sir_modifier !== 1.00 && (
                  <FactorRow
                    label={`SIR Discount (${rating.umbrella_detail.sir})`}
                    value={`${rating.umbrella_detail.sir_modifier.toFixed(2)}x`}
                  />
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-sm font-bold text-navy-800">Final Umbrella Premium</span>
                  <span className="text-sm font-bold text-navy-800">{formatCurrency(rating.umbrella_detail.total_premium)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Visual Premium Breakdown Bar */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Premium Distribution</h3>
          <div className="w-full h-8 rounded-full overflow-hidden flex">
            <BarSegment
              value={rating.building_premium}
              total={rating.total_estimated_premium}
              color="bg-navy-800"
              label="Building"
            />
            <BarSegment
              value={rating.contents_premium}
              total={rating.total_estimated_premium}
              color="bg-navy-700"
              label="Contents"
            />
            <BarSegment
              value={rating.bi_premium}
              total={rating.total_estimated_premium}
              color="bg-navy-500"
              label="BI"
            />
            <BarSegment
              value={rating.general_liability_premium}
              total={rating.total_estimated_premium}
              color="bg-navy-600"
              label="GL"
            />
            <BarSegment
              value={rating.umbrella_excess_premium}
              total={rating.total_estimated_premium}
              color="bg-slate-400"
              label="Umbrella"
            />
          </div>
          <div className="flex flex-wrap gap-4 mt-3">
            <Legend color="bg-navy-800" label="Building" />
            <Legend color="bg-navy-700" label="Contents" />
            <Legend color="bg-navy-500" label="Business Income" />
            <Legend color="bg-navy-600" label="General Liability" />
            <Legend color="bg-slate-400" label="Umbrella/Excess" />
          </div>
        </div>

        {/* Program Summary */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">Program Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-navy-50 rounded-lg p-4 border border-navy-200">
              <p className="text-xs text-navy-600 font-medium">Total Program (excl. Flood)</p>
              <p className="text-xl font-bold text-navy-800 mt-1">{formatCurrency(rating.total_estimated_premium)}</p>
              <p className="text-xs text-navy-500 mt-1">
                Property {formatCurrency(rating.property_premium)} + GL {formatCurrency(rating.general_liability_premium)}
                {' '}+ Umbrella {formatCurrency(rating.umbrella_excess_premium)}
              </p>
            </div>
            {rating.flood_insurance_estimate > 0 && (
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                <p className="text-xs text-emerald-600 font-medium">Total Program (incl. Flood)</p>
                <p className="text-xl font-bold text-emerald-800 mt-1">{formatCurrency(rating.total_with_flood)}</p>
                <p className="text-xs text-emerald-500 mt-1">
                  Includes est. {formatCurrency(rating.flood_insurance_estimate)} flood premium ({rating.flood_zone} zone)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Market Note */}
        {rating.market_note && (
          <div className="mt-6 pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500 italic">{rating.market_note}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PremiumRow({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-medium text-slate-900">{formatCurrency(value)}</span>
    </div>
  );
}

function FactorRow({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-mono font-medium text-slate-900">{value}</span>
    </div>
  );
}

function BarSegment({ value, total, color, label }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  if (pct < 1) return null;

  return (
    <div
      className={`${color} h-full relative group transition-all`}
      style={{ width: `${pct}%` }}
      title={`${label}: ${formatCurrency(value)} (${pct.toFixed(1)}%)`}
    />
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-3 h-3 rounded ${color}`} />
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}
