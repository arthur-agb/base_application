// src/pages/VerifyTwoFactor.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { verifyTwoFactor, clearError } from '../slices/authSlice';

export default function VerifyTwoFactor() {
  const [token, setToken] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Retrieve the email passed from the login page.
  const email = location.state?.email;

  // If the user lands here without an email (e.g., direct navigation),
  // send them back to the login page.
  useEffect(() => {
    if (!email) {
      console.warn("No email found in location state. Redirecting to login.");
      navigate('/login');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || token.length !== 6) {
        return; // Basic validation
    }

    setIsLoading(true);
    setError(null);

    try {
      await dispatch(verifyTwoFactor({ email, token })).unwrap();
      console.log('[2FA] Verification successful. Navigating to dashboard.');
      navigate('/'); // On success, redirect to the main dashboard.

    } catch (err) {
      console.error('[2FA] Verification failed:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-100 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
        <div>
          <img alt="AGB Integration" src="/mm_icon.svg" className="mx-auto h-12 w-auto" />
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Two-Factor Authentication
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter the 6-digit code from your authenticator app for <strong>{email}</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="token-2fa" className="sr-only">
              6-Digit Code
            </label>
            <input
              id="token-2fa"
              name="token"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              required
              autoComplete="one-time-code"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))} // Allow only digits
              maxLength="6"
              placeholder="123456"
              className="relative block w-full appearance-none rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-center text-2xl tracking-widest text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>
          
          {error && (
            <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || token.length !== 6}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 dark:focus:ring-offset-gray-800"
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}