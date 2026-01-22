import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
// useNavigate is kept in case you want to add a link back to login from the success message view
import { useNavigate } from 'react-router-dom';
import { register, googleLogin, selectIsAuthenticated } from '../slices/authSlice';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';

export default function Register() {
  // --- State Variables ---
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [registrationError, setRegistrationError] = useState('');
  const [registrationSuccessMessage, setRegistrationSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); // For loading state

  // --- Hooks ---
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Kept for potential future use (e.g., link to login from success)
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // --- Input Change Handler ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear errors when user types in relevant fields
    if (name === 'password' || name === 'confirmPassword') {
      if (passwordError) setPasswordError('');
    }
    if (registrationError) setRegistrationError('');
    if (registrationSuccessMessage) setRegistrationSuccessMessage(''); // Clear success message on new input
  };

  // --- Form Submission Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    // Clear previous messages
    setPasswordError('');
    setRegistrationError('');
    setRegistrationSuccessMessage('');
    setIsLoading(true);

    // --- Validation ---
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match.');
      console.error('[Register] Passwords do not match');
      setIsLoading(false);
      return; // Stop submission if passwords don't match
    }

    // --- API Call ---
    try {
      console.log('[Register] Attempting registration for:', formData.email);
      // Dispatch the register action
      // Assuming the updated API endpoint handles email verification sending
      await dispatch(
        register({
          name: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      ).unwrap(); // .unwrap() handles promise states

      console.log('[Register] API call successful. Awaiting email verification.');
      setRegistrationSuccessMessage(
        'Registration successful! Please check your email (and spam/junk folders) to verify your account.',
      );
      setFormData({ // Clear form fields
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
      // No navigation: user stays on page to see the message

    } catch (error) {
      console.error('[Register] Registration failed:', error);

      // Extract a user-friendly error message
      // Prioritize error message from backend if available and structured
      let errorMessage = 'Registration failed. Please try again or contact support.';
      if (error) {
        if (typeof error === 'string' && error.trim()) {
          errorMessage = error.trim();
        } else if (error.message) {
          // Example: check for specific backend error structures if known
          // if (error.data && error.data.message) errorMessage = error.data.message;
          // else
          errorMessage = error.message;
        } else if (error.error) { // Handle cases where error is an object with an 'error' property
          errorMessage = error.error;
        }
      }
      // Examples of more specific error messages based on potential backend responses:
      // if (error?.status === 409) { // Conflict - e.g., email already exists
      //   errorMessage = "This email is already registered. If it's yours, try logging in or use the 'Forgot Password' option. If it's not verified, please check your email for a verification link.";
      // } else if (error?.status === 400) { // Bad Request - e.g., invalid email format
      //  errorMessage = "Please provide a valid email address and ensure all fields are correctly filled.";
      // }

      setRegistrationError(errorMessage);
    } finally {
      setIsLoading(false);
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
      console.error('[Register] Google Login failed:', error);
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
          auto_select: true,
        });
        google.accounts.id.renderButton(
          document.getElementById('google-signup-button'),
          { theme: 'outline', size: 'large', width: 350, text: 'continue_with' }
        );
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

  // --- Component Render ---
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-100 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
        <div>
          <img
            alt="AGB Integration"
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
            Create Account
          </h3>
        </div>

        {/* --- Display Success Message --- */}
        {registrationSuccessMessage && !registrationError && (
          <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  {registrationSuccessMessage}
                </p>
                <p className="mt-2 text-sm text-green-700 dark:text-green-400">
                  You can close this page or <a
                    href="/login"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/login');
                    }}
                    className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    go to login
                  </a>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* --- Registration Form (Conditionally Rendered) --- */}
        {!registrationSuccessMessage && (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4 rounded-md shadow-sm">
              <div>
                <label htmlFor="username" className="sr-only">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  autoFocus
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Username"
                  disabled={isLoading}
                  className="relative block w-full appearance-none rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 disabled:opacity-75 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="email-address" className="sr-only">Email address</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email address"
                  disabled={isLoading}
                  className="relative block w-full appearance-none rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 disabled:opacity-75 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  disabled={isLoading}
                  className="relative block w-full appearance-none rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 disabled:opacity-75 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  disabled={isLoading}
                  className={`relative block w-full appearance-none rounded-md border bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 disabled:opacity-75 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-indigo-500 sm:text-sm ${passwordError
                    ? 'border-red-500 dark:border-red-600 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                    }`}
                />
              </div>
            </div>

            {passwordError && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {passwordError}
              </p>
            )}

            {registrationError && (
              <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800 dark:text-red-300" role="alert">
                      {registrationError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-indigo-400 dark:focus:ring-offset-gray-800"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Sign Up'
                )}
              </button>
            </div>
          </form>
        )}

        {!registrationSuccessMessage && (
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
              <div id="google-signup-button" className="w-full flex justify-center"></div>
            </div>
          </div>
        )}

        {/* --- Link to Login Page (Conditionally Rendered) --- */}
        {!registrationSuccessMessage && (
          <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <a
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                navigate('/login');
              }}
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Sign In
            </a>
          </p>
        )}
      </div>
    </div>
  );
}