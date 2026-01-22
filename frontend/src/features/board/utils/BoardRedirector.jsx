import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { getProjectByKey } from '../../projects';

// Simple Loading Spinner Component (or use a library)
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
  </div>
);

// Error Message Component
const ErrorMessage = ({ error }) => (
  <div className="flex justify-center items-center h-screen">
    <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-md dark:bg-red-900 dark:text-red-300 dark:border-red-700">
      <h3 className="font-bold mb-2">Error</h3>
      <p>Could not load board information.</p>
      {error && <p className="text-sm mt-1">Details: {typeof error === 'string' ? error : error.message || 'Unknown error'}</p>}
    </div>
  </div>
);

const BoardRedirector = () => {
  const { key } = useParams(); // Get project key from URL
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true; // Prevent state updates on unmounted component

    const fetchBoardIdAndRedirect = async () => {
      if (!key) {
        setError('Project key not found in URL.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Dispatch the thunk to get project details (assuming it includes boards)
        // .unwrap() throws error on rejection, which is caught below
        const resultAction = await dispatch(getProjectByKey(key)).unwrap();

        // Check if component is still mounted before updating state/navigating
        if (!isMounted) return;

        // Extract the board ID (assuming the first board is the target)
        const boardId = resultAction?.project?.boards?.[0]?.id;

        if (boardId) {
          // Redirect to the actual board page
          console.log(`Redirecting to board ID: ${boardId}`);
          navigate(`/boards/${boardId}`, { replace: true }); // Use replace to avoid adding redirector to history
        } else {
          // Handle case where project exists but has no boards or board ID
          console.error('Project found, but no board ID available for key:', key);
          setError('Project found, but it does not have an associated board.');
          setLoading(false);
        }

      } catch (err) {
        console.error('Failed to fetch project/board details for key:', key, err);
         if (isMounted) {
            // Extract error message if available from Redux Toolkit's rejection
            const errorMessage = err?.message || (typeof err === 'string' ? err : 'Failed to fetch project details.');
            setError(errorMessage);
            setLoading(false);
         }
      }
    };

    fetchBoardIdAndRedirect();

    // Cleanup function
    return () => {
      isMounted = false;
    };

  }, [key, dispatch, navigate]); // Re-run if key, dispatch, or navigate changes

  // Render Loading or Error state
  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  // Should ideally not be reached if redirect works, but good as a fallback
  return null;
};

export default BoardRedirector;
