function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function StatCard({ label, value, subtitle, color = 'navy' }) {
  const colorMap = {
    navy: 'bg-navy-800',
    green: 'bg-emerald-600',
    amber: 'bg-amber-500',
    red: 'bg-red-600',
  };

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
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Estimated Premium"
          value={formatCurrency(rating.total_estimated_premium)}
          subtitle="Annual premium"
        />
        <StatCard
          label="Premium per Room"
          value={formatCurrency(rating.premium_per_room)}
          subtitle={`${property.room_count || '—'} rooms`}
          color="green"
        />
        <StatCard
          label="Total Insurable Value"
          value={formatCurrency(rating.total_insurable_value)}
          subtitle="Building + Contents + BI"
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
              <PremiumRow label="General Liability" value={rating.general_liability_premium} />
              {rating.liquor_liability_premium > 0 && (
                <PremiumRow label="Liquor Liability" value={rating.liquor_liability_premium} />
              )}
              <PremiumRow label="Umbrella / Excess" value={rating.umbrella_excess_premium} />
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="text-sm font-bold text-navy-800">Total Premium</span>
                <span className="text-sm font-bold text-navy-800">
                  {formatCurrency(rating.total_estimated_premium)}
                </span>
              </div>
            </div>
          </div>

          {/* Rating Factors */}
          <div>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">Rating Factors</h3>
            <div className="space-y-3">
              <FactorRow label="ISO Loss Cost (per $100)" value={`$${rating.loss_cost_per_100.toFixed(3)}`} />
              <FactorRow label="Loss Cost Multiplier" value={`${rating.lcm.toFixed(2)}x`} />
              <FactorRow label="Final Rate (per $100 TIV)" value={`$${rating.base_rate_per_100.toFixed(3)}`} />
              <FactorRow label="Sprinklered" value={rating.sprinklered ? 'Yes' : 'No'} />
              <FactorRow label="Building Age Factor" value={`${rating.age_factor.toFixed(2)}x`} />
              <FactorRow label="Stories Factor" value={`${rating.stories_factor.toFixed(2)}x`} />
              <FactorRow label="Roof Age Factor" value={`${rating.roof_factor.toFixed(2)}x`} />
              <FactorRow label="Geographic Modifier" value={`${rating.geo_modifier.toFixed(2)}x`} />
              <FactorRow label="Protection Class Factor" value={`${rating.protection_class_factor.toFixed(2)}x`} />
              <FactorRow label="Amenities Factor" value={`${rating.amenities_factor.toFixed(2)}x`} />
              <div className="pt-2 border-t border-slate-100">
                <FactorRow label="Premium per SF" value={`$${rating.premium_per_sf.toFixed(2)}`} />
              </div>
            </div>
          </div>

          {/* TIV Breakdown */}
          <div className="md:col-span-2 pt-6 border-t border-slate-200 mt-2">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">Total Insurable Value Breakdown</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 font-medium">Building Value</p>
                <p className="text-lg font-semibold text-navy-800 mt-1">{formatCurrency(rating.building_value)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 font-medium">Contents (FF&E)</p>
                <p className="text-lg font-semibold text-navy-800 mt-1">{formatCurrency(rating.contents_value)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 font-medium">Business Income</p>
                <p className="text-lg font-semibold text-navy-800 mt-1">{formatCurrency(rating.business_income_value)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Premium Breakdown Bar */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Premium Distribution</h3>
          <div className="w-full h-8 rounded-full overflow-hidden flex">
            <BarSegment
              value={rating.property_premium}
              total={rating.total_estimated_premium}
              color="bg-navy-800"
              label="Property"
            />
            <BarSegment
              value={rating.general_liability_premium}
              total={rating.total_estimated_premium}
              color="bg-navy-600"
              label="GL"
            />
            {rating.liquor_liability_premium > 0 && (
              <BarSegment
                value={rating.liquor_liability_premium}
                total={rating.total_estimated_premium}
                color="bg-amber-500"
                label="Liquor"
              />
            )}
            <BarSegment
              value={rating.umbrella_excess_premium}
              total={rating.total_estimated_premium}
              color="bg-slate-400"
              label="Umbrella"
            />
          </div>
          <div className="flex flex-wrap gap-4 mt-3">
            <Legend color="bg-navy-800" label="Property" />
            <Legend color="bg-navy-600" label="General Liability" />
            {rating.liquor_liability_premium > 0 && <Legend color="bg-amber-500" label="Liquor Liability" />}
            <Legend color="bg-slate-400" label="Umbrella/Excess" />
          </div>
        </div>
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
