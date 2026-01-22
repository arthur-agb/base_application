import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
// The import from the previous turn was correct and should be used.
import { login, googleLogin, selectAuthError, selectAuthLoading, selectIsAuthenticated } from '../slices/authSlice';
import { useEffect } from 'react';


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Use the selectors to get state from the Redux store.
  const loginError = useSelector(selectAuthError);
  const isLoading = useSelector(selectAuthLoading);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleEmailChange = (e) => setEmail(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const loginResponsePayload = await dispatch(login({ email, password })).unwrap();

      if (loginResponsePayload.twoFactorRequired) {
        console.log('[Login] 2FA required. Navigating to /verify-2fa');
        navigate('/verify-2fa', { state: { email: loginResponsePayload.email } });
        return;
      }

      const { status } = loginResponsePayload;
      console.log(`[Login] Thunk fulfilled. User status: ${status}`);

      // --- MODIFICATION: Simplified navigation logic ---
      switch (status) {
        case 'ACTIVE':
          // For active users, always navigate to the root. 
          // The ProtectedRoute component will handle tenant selection automatically.
          navigate('/');
          break;
        case 'PENDING_APPROVAL':
          navigate('/pending-approval');
          break;
        case 'PENDING_VERIFICATION':
          navigate('/request-verification', { state: { email } });
          break;
        default:
          console.warn('[Login] Unhandled status:', status);
          navigate('/'); // Default navigation to the root
          break;
      }

    } catch (error) {
      console.error('[Login] Login failed in handleSubmit:', error);
    }
  };

  const handleGoogleLogin = async (response) => {
    try {
      const loginResponsePayload = await dispatch(googleLogin(response.credential)).unwrap();

      if (loginResponsePayload.twoFactorRequired) {
        navigate('/verify-2fa', { state: { email: loginResponsePayload.email } });
        return;
      }

      const { status } = loginResponsePayload;
      switch (status) {
        case 'ACTIVE':
          navigate('/');
          break;
        case 'PENDING_APPROVAL':
          navigate('/pending-approval');
          break;
        default:
          navigate('/');
          break;
      }
    } catch (error) {
      console.error('[Login] Google Login failed:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) return;

    /* global google */
    const initializeGoogleSignIn = () => {
      if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleLogin,
          auto_select: true, // Enable automatic selection if one account is logged in
        });
        google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          { theme: 'outline', size: 'large', width: 350, text: 'continue_with' }
        );
        // Display the One Tap prompt
        google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log('Google One Tap prompt not displayed or skipped:', notification);
          }
        });
      }
    };

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleSignIn;
    document.head.appendChild(script);

    return () => {
      if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.cancel();
      }
      document.head.removeChild(script);
    };
  }, [isAuthenticated]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-100 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
        <div>
          <img
            alt="Momentum Manager"
            src="/mm_icon.svg"
            className="mx-auto h-12 w-auto"
          />
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Momentum Manager
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            by AGB Integration
          </p>
          <h3 className="mt-4 text-center text-xl font-semibold text-gray-800 dark:text-gray-200">
            Sign In
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Email address"
                className="relative block w-full appearance-none rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Password"
                className="relative block w-full appearance-none rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          {loginError && (
            <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">{loginError}</p>
            </div>
          )}
          <div>
            <button
              id="login-submit-button"
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 dark:focus:ring-offset-gray-800"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                Sign in or create an account with
              </span>
            </div>
          </div>

          <div className="mt-6">
            <div id="google-signin-button" className="w-full flex justify-center"></div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          Not a member?{' '}
          <a
            href="/register"
            onClick={(e) => {
              e.preventDefault();
              navigate('/register');
            }}
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
}