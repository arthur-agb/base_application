
// src/features/auth/pages/SelectTenantPage.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectTenant, logout } from '../slices/authSlice'; // Assuming `selectTenant` thunk exists

export default function SelectTenantPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user } = useSelector((state) => state.auth);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Defensive navigation: if user somehow lands here without multiple companies, redirect them.
  useEffect(() => {
    if (!user?.companies || user.companies.length <= 1) {
      navigate('/');
    }
  }, [user, navigate]);
  
  const handleSelectTenant = async (companyId) => {
    setError(null);
    setIsLoading(true);
    try {
      // This thunk should make a backend call to set the user's active tenant
      // and return an updated JWT or session confirmation.
      await dispatch(selectTenant({ companyId })).unwrap();
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to select organization. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-100 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
        <div>
          <img
            alt="AGB Integration"
            src="/mm_icon.svg"
            className="mx-auto h-12 w-auto"
          />
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Choose Your Workspace
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
            You are a member of multiple organizations. Please select one to continue.
          </p>
        </div>

        <div className="space-y-4">
          {user?.companies?.map((company) => (
            <button
              key={company.id}
              onClick={() => handleSelectTenant(company.id)}
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 dark:focus:ring-offset-gray-800"
            >
              {isLoading ? 'Loading...' : company.name}
            </button>
          ))}
        </div>

        {error && (
            <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
            </div>
        )}

        <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
            <p className="text-center text-sm">
                Not the right account?{' '}
                <button
                    onClick={handleLogout}
                    className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                    Logout
                </button>
            </p>
        </div>
      </div>
    </div>
  );
}