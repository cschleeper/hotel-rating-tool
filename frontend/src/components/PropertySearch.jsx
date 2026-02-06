import { useState } from 'react';

export default function PropertySearch({ onSearch, isSearching, error }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-navy-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h2 className="text-lg font-semibold text-navy-800">AI-Powered Property Lookup</h2>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Enter a hotel name and/or address to automatically populate property details using AI-powered web search.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Marriott Marquis Times Square, New York"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800 transition-colors placeholder:text-slate-400"
            disabled={isSearching}
          />
        </div>
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="px-6 py-3 bg-navy-800 text-white rounded-lg text-sm font-medium hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-navy-800/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          {isSearching ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Searching...
            </>
          ) : (
            'Search'
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
