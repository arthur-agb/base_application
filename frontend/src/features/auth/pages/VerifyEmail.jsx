// VerifyEmail.jsx
import React, { useState, useEffect, useRef } from 'react'; // 1. Import useRef
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { verifyEmail, resendVerificationEmail } from '../slices/authSlice'; 

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [status, setStatus] = useState('initial_check');
  const [message, setMessage] = useState('');
  const [emailForResend, setEmailForResend] = useState('');

  // 2. Create a ref to track if verification has been attempted
  const verificationAttempted = useRef(false);

  useEffect(() => {
    // 3. Check the ref. If true, we've already run this logic, so we exit.
    if (verificationAttempted.current) {
      return;
    }

    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token found. Please use the link sent to your email or request a new verification email below.');
      return;
    }

    const verifyUserToken = async () => {
      // 4. Set the ref to true IMMEDIATELY before the first API call.
      // This ensures the second invocation of the effect will be blocked.
      verificationAttempted.current = true;
      setStatus('verifying');
      setMessage('');

      try {
        const successMessage = await dispatch(verifyEmail(token)).unwrap();
        
        setStatus('success');
        setMessage(successMessage);
        console.log('[VerifyEmail] Token verification successful.');
      } catch (errorMessage) {
        console.error('[VerifyEmail] Token verification failed:', errorMessage);
        setStatus('error');
        setMessage(errorMessage);
      }
    };

    verifyUserToken();
    
  // 5. The effect no longer depends on 'status' to run. It only needs to run once when the component mounts.
  }, [dispatch, searchParams]);

  // ... (The rest of your component remains unchanged)
  const handleResendEmailChange = (e) => {
    setEmailForResend(e.target.value);
    if (status === 'resend_error' || status === 'resend_success') { // Clear previous resend messages on new input
        setMessage('');
        setStatus('resend_prompt');
    }
  };

  const handleResendSubmit = async (e) => {
    e.preventDefault();
    if (!emailForResend) {
      setStatus('resend_error');
      setMessage('Please enter your email address to resend the verification link.');
      return;
    }
    setStatus('resending');
    setMessage('');
    try {
      console.log('[VerifyEmail] Attempting to resend verification to:', emailForResend);

      const successMessage = await dispatch(resendVerificationEmail(emailForResend)).unwrap();

      setStatus('resend_success');
      setMessage(successMessage);
      setEmailForResend(''); 
    } catch (errorMessage) {
      console.error('[VerifyEmail] Resend verification failed:', errorMessage);
      setStatus('resend_error');
      setMessage(errorMessage);
    }
  };

  const showResendForm = status === 'error' || status === 'resend_prompt' || status === 'resending' || status === 'resend_error' || status === 'resend_success';

  return (
    // ... JSX is unchanged
    <div className="flex min-h-dvh items-center justify-center bg-gray-100 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
        <div>
          <img
            alt="AGB Integration"
            src="/mm_icon.svg" // Assuming same icon path as Register.jsx
            className="mx-auto h-12 w-auto"
          />
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Momentum Manager
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            by AGB Integration
          </p>
          <h3 className="mt-4 text-center text-xl font-semibold text-gray-800 dark:text-gray-200">
            Email Verification
          </h3>
        </div>

        {/* Loading State for Initial Verification */}
        {status === 'verifying' && (
          <div className="flex flex-col items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">Verifying your email...</p>
          </div>
        )}

        {/* Success Message */}
        {status === 'success' && message && (
          <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  {message}
                </p>
                <p className="mt-2 text-sm text-green-700 dark:text-green-400">
                  You can now try to{' '}
                  <a
                    href="/login"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/login');
                    }}
                    className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    log in
                  </a>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message (from token verification or general error before resend prompt) */}
        {status === 'error' && message && (
          <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800 dark:text-red-300" role="alert">
                  {message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Resend Verification Form & Messages */}
        {showResendForm && (
          <form onSubmit={handleResendSubmit} className="mt-8 space-y-6">
             {/* Message for Resend Success */}
            {status === 'resend_success' && message && (
                <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">{message}</p>
                </div>
            )}
            {/* Message for Resend Error */}
            {status === 'resend_error' && message && (
                 <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                    <p className="text-sm font-medium text-red-800 dark:text-red-300" role="alert">{message}</p>
                </div>
            )}

            {/* Only show email input if not in a success state from resend, or explicitly prompting */}
            {(status === 'error' || status === 'resend_prompt' || status === 'resend_error' ) && (
              <>
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                  Need a new verification link? Enter your email below.
                </p>
                <div className="rounded-md shadow-sm">
                  <div>
                    <label htmlFor="email-resend" className="sr-only">Email address for resend</label>
                    <input
                      id="email-resend"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={emailForResend}
                      onChange={handleResendEmailChange}
                      placeholder="Enter your email address"
                      disabled={status === 'resending'}
                      className="relative block w-full appearance-none rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 disabled:opacity-75 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={status === 'resending'}
                    className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-indigo-400 dark:focus:ring-offset-gray-800"
                  >
                    {status === 'resending' ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      'Resend Verification Email'
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        {/* Link to Registration Page if verification failed badly */}
        {(status === 'error' || status === 'resend_error') && (
          <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            Issue with verification? Try{' '}
            <a
              href="/register"
              onClick={(e) => {
                e.preventDefault();
                navigate('/register');
              }}
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              registering again
            </a>
            {' '}or{' '}
            <a
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                navigate('/login');
              }}
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              go to Sign In
            </a>.
          </p>
        )}
      </div>
    </div>
  );
}