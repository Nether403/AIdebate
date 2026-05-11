'use client'

import { LeaderboardFiltersState } from '@/app/leaderboard/page'

interface LeaderboardFiltersProps {
  filters: LeaderboardFiltersState
  onFiltersChange: (filters: LeaderboardFiltersState) => void
  providers: string[]
  topicCategories: string[]
}

export function LeaderboardFilters({
  filters,
  onFiltersChange,
  providers,
  topicCategories,
}: LeaderboardFiltersProps) {
  const updateFilter = <K extends keyof LeaderboardFiltersState>(
    key: K,
    value: LeaderboardFiltersState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  return (
    <div className="bg-card rounded-lg border p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Filters & Sorting</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium mb-2">Sort By</label>
          <select
            value={filters.sortBy}
            onChange={(e) =>
              updateFilter(
                'sortBy',
                e.target.value as LeaderboardFiltersState['sortBy']
              )
            }
            className="w-full px-3 py-2 border rounded-md bg-background"
          >
            <option value="win_rate">Win Rate</option>
            <option value="crowd_rating">Crowd Score</option>
            <option value="ai_quality_rating">AI Quality Score</option>
            <option value="total_debates">Total Debates</option>
            <option value="controversy_index">Controversy Index</option>
          </select>
        </div>

        {/* Provider Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">Provider</label>
          <select
            value={filters.providerFilter || 'all'}
            onChange={(e) =>
              updateFilter(
                'providerFilter',
                e.target.value === 'all' ? null : e.target.value
              )
            }
            className="w-full px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">All Providers</option>
            {providers.map((provider) => (
              <option key={provider} value={provider}>
                {provider.charAt(0).toUpperCase() + provider.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Model Type Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">Model Type</label>
          <select
            value={filters.modelTypeFilter}
            onChange={(e) =>
              updateFilter(
                'modelTypeFilter',
                e.target.value as LeaderboardFiltersState['modelTypeFilter']
              )
            }
            className="w-full px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">All Models</option>
            <option value="sota">SOTA Only</option>
            <option value="legacy">Legacy Only</option>
          </select>
        </div>

        {/* Topic Category Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">Topic Category</label>
          <select
            value={filters.topicCategoryFilter || 'all'}
            onChange={(e) =>
              updateFilter(
                'topicCategoryFilter',
                e.target.value === 'all' ? null : e.target.value
              )
            }
            className="w-full px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">All Categories</option>
            {topicCategories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Controversial Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">Special Filters</label>
          <label className="flex items-center gap-2 px-3 py-2 border rounded-md bg-background cursor-pointer hover:bg-muted/50">
            <input
              type="checkbox"
              checked={filters.filterControversial}
              onChange={(e) =>
                updateFilter('filterControversial', e.target.checked)
              }
              className="rounded"
            />
            <span className="text-sm">Controversial Models Only</span>
          </label>
        </div>
      </div>

      {/* Active Filters Summary */}
      <div className="mt-4 flex flex-wrap gap-2">
        {filters.providerFilter && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
            Provider: {filters.providerFilter}
            <button
              onClick={() => updateFilter('providerFilter', null)}
              className="hover:text-primary/70"
            >
              ×
            </button>
          </span>
        )}
        {filters.modelTypeFilter !== 'all' && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
            Type: {filters.modelTypeFilter}
            <button
              onClick={() => updateFilter('modelTypeFilter', 'all')}
              className="hover:text-primary/70"
            >
              ×
            </button>
          </span>
        )}
        {filters.topicCategoryFilter && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
            Category: {filters.topicCategoryFilter}
            <button
              onClick={() => updateFilter('topicCategoryFilter', null)}
              className="hover:text-primary/70"
            >
              ×
            </button>
          </span>
        )}
        {filters.filterControversial && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full text-sm">
            Controversial Only
            <button
              onClick={() => updateFilter('filterControversial', false)}
              className="hover:opacity-70"
            >
              ×
            </button>
          </span>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-4 p-3 bg-muted/50 rounded-md text-sm text-muted-foreground">
        <p className="font-medium mb-1">About the Scores:</p>
        <ul className="space-y-1 text-xs">
          <li>
            <strong>Crowd Score:</strong> Rating based on user votes (measures persuasiveness)
          </li>
          <li>
            <strong>AI Quality:</strong> Rating from AI judge evaluations (measures logical rigor)
          </li>
          <li>
            <strong>Controversial:</strong> Models with significant divergence between crowd and AI scores
          </li>
        </ul>
      </div>
    </div>
  )
}
