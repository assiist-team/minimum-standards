import { useEffect, useState, useMemo } from 'react';
import { Standard } from '@minimum-standards/shared-model';
import { useStandards } from './useStandards';
import {
  filterStandardsBySearch,
  filterStandardsByTab,
  sortStandardsBySummary,
} from '../utils/standardsFilter';
import debounce from 'lodash.debounce';

export interface UseStandardsLibraryResult {
  // All standards (unfiltered)
  allStandards: Standard[];
  // Filtered standards for active tab
  activeStandards: Standard[];
  // Filtered standards for archived tab
  archivedStandards: Standard[];
  // Search query state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  // Loading and error states
  loading: boolean;
  error: Error | null;
  // Archive/unarchive functions
  archiveStandard: (standardId: string) => Promise<void>;
  unarchiveStandard: (standardId: string) => Promise<void>;
  // Delete function
  deleteStandard: (standardId: string) => Promise<void>;
}

/**
 * Hook for Standards Library screen with debounced search and tab filtering.
 * 
 * Features:
 * - Debounced search query (~300ms)
 * - Filters Standards by summary string (case-insensitive substring matching)
 * - Separates Active and Archived Standards
 * - Alphabetical sorting by summary
 */
export function useStandardsLibrary(): UseStandardsLibraryResult {
  const {
    standards: allStandards,
    loading,
    error,
    archiveStandard: archiveStandardBase,
    unarchiveStandard: unarchiveStandardBase,
    deleteStandard: deleteStandardBase,
  } = useStandards();

  const [searchQueryInput, setSearchQueryInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Debounced search query for filtering
  useEffect(() => {
    const debounced = debounce((query: string) => {
      setSearchQuery(query);
    }, 300);

    debounced(searchQueryInput);

    return () => {
      debounced.cancel();
    };
  }, [searchQueryInput]);

  // Filter standards by search query
  const searchFilteredStandards = useMemo(() => {
    const filtered = filterStandardsBySearch(allStandards, searchQuery);
    return sortStandardsBySummary(filtered);
  }, [allStandards, searchQuery]);

  // Filter by tab (Active/Archived)
  const activeStandards = useMemo(() => {
    return filterStandardsByTab(searchFilteredStandards, 'active');
  }, [searchFilteredStandards]);

  const archivedStandards = useMemo(() => {
    return filterStandardsByTab(searchFilteredStandards, 'archived');
  }, [searchFilteredStandards]);

  return {
    allStandards,
    activeStandards,
    archivedStandards,
    searchQuery: searchQueryInput, // Return input value for UI display
    setSearchQuery: setSearchQueryInput,
    loading,
    error,
    archiveStandard: archiveStandardBase,
    unarchiveStandard: unarchiveStandardBase,
    deleteStandard: deleteStandardBase,
  };
}
