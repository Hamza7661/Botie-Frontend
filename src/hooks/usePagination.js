import { useState, useCallback, useRef } from 'react';

export const usePagination = (fetchFunction, initialPage = 1, limit = 10) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const loadData = useCallback(async (page = 1, isRefresh = false, searchQuery = '') => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setError(null);
      
      if (page === 1) {
        setLoading(true);
      }

      const response = await fetchFunction({
        page,
        limit,
        search: searchQuery.trim(),
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }, abortControllerRef.current.signal);

      const { tasks, pagination } = response.data.data;
      const total = pagination.totalPages;
      const totalCount = pagination.totalTasks || 0;

      // Check if current page has no data and we're not on page 1
      if (tasks.length === 0 && page > 1) {
        // Go back one page
        const previousPage = page - 1;
        setCurrentPage(previousPage);
        // Adjust total pages to exclude the empty page
        setTotalPages(previousPage);
        // Recursively load the previous page
        return loadData(previousPage, isRefresh, searchQuery);
      }

      setData(tasks); // Always replace data for any page
      setCurrentPage(page); // Update current page
      setTotalPages(total);
      setTotalItems(totalCount);
      setHasMore(page < total);
    } catch (error) {
      if (error.name !== 'AbortError') {
        setError(error);
        console.error('Pagination error:', error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchFunction, limit]);

  const refresh = useCallback((searchQuery = '') => {
    setCurrentPage(1);
    setRefreshing(true);
    loadData(1, true, searchQuery);
  }, [loadData]);

  const loadMore = useCallback((searchQuery = '') => {
    if (hasMore && !loading && currentPage < totalPages) {
      const nextPage = currentPage + 1;
      loadData(nextPage, false, searchQuery);
    }
  }, [hasMore, loading, currentPage, totalPages, loadData]);

  const goToPage = useCallback((page, searchQuery = '') => {
    setCurrentPage(page);
    loadData(page, false, searchQuery);
  }, [loadData]);

  const reset = useCallback(() => {
    setData([]);
    setCurrentPage(initialPage);
    setTotalPages(1);
    setTotalItems(0);
    setHasMore(true);
    setError(null);
    setLoading(false);
    setRefreshing(false);
  }, [initialPage]);

  return {
    data,
    loading,
    refreshing,
    currentPage,
    totalPages,
    totalItems,
    hasMore,
    error,
    loadData,
    refresh,
    loadMore,
    goToPage,
    reset,
  };
}; 