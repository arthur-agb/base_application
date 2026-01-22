// src/pages/Auth/SetupTwoFactor.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ThreeDots } from 'react-loader-spinner';

import { generateTwoFactor, enableTwoFactor, selectAuthError, clearError } from '../slices/authSlice';
import { fetchCurrentAuthUserProfile } from '../../users';
import { Logger } from '../../../utils';

export default function SetupTwoFactorPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const effectRan = useRef(false);

    // --- LOCAL STATE MANAGEMENT ---
    const [qrCode, setQrCode] = useState('');
    const [manualCode, setManualCode] = useState('');
    const [verificationToken, setVerificationToken] = useState('');
    
    // State for the initial QR code generation
    const [initialLoading, setInitialLoading] = useState(true); 
    
    // State for the final submission/verification step
    const [isEnabling, setIsEnabling] = useState(false);

    // We only need the error from Redux, not the loading state
    const submissionError = useSelector(selectAuthError);

    // Fetch the QR code and secret when the component mounts
    useEffect(() => {
        // This guard correctly prevents the effect from running on re-renders
        if (effectRan.current === false) {
            Logger.info("SetupTwoFactorPage: useEffect firing - will dispatch generateTwoFactor.");
            dispatch(clearError()); // Clear any previous auth errors

            // We manage loading state locally, not via Redux
            setInitialLoading(true);

            dispatch(generateTwoFactor())
                .unwrap()
                .then(data => {
                    setQrCode(data.qrCodeUrl);
                    setManualCode(data.secret);
                })
                .catch(err => {
                    // Log the error, the UI will show a message based on state
                    console.error("Failed to generate 2FA secret:", err);
                })
                .finally(() => {
                    setInitialLoading(false);
                });
            
            // Mark the effect as having run
            effectRan.current = true;
        } else {
            Logger.warn("SetupTwoFactorPage: useEffect skipped because effectRan is true.");
        }

        return () => {
            Logger.error(`SetupTwoFactorPage: Component WILL UNMOUNT.`);
        }
    }, [dispatch]); // Dependency array is correct

    const handleSubmit = (e) => {
        e.preventDefault();
        if (verificationToken.length !== 6) return;

        // Use the local loading state for the submission
        setIsEnabling(true);
        dispatch(enableTwoFactor(verificationToken))
            .unwrap()
            .then(() => {
                dispatch(fetchCurrentAuthUserProfile());
                navigate('/profile', { state: { from2faSetup: true } });
            })
            .catch(err => {
                console.error("Failed to enable 2FA:", err);
            })
            .finally(() => {
                setIsEnabling(false);
            });
    };

    return (
        <div className="flex min-h-dvh items-center justify-center bg-gray-100 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
            <div className="w-full max-w-lg space-y-8 rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        Set Up Two-Factor Authentication
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        Scan the QR code with your authenticator app (like Google Authenticator or Authy).
                    </p>
                </div>

                {initialLoading ? (
                    <div className="flex justify-center py-10">
                        <ThreeDots color="#4f46e5" height={50} width={50} />
                        <p className="ml-4 text-gray-600 dark:text-gray-300">Generating your unique code...</p>
                    </div>
                ) : qrCode ? (
                    <div className="flex flex-col items-center space-y-6">
                        <div className="rounded-lg border-4 border-white p-2 shadow-lg">
                            <img src={qrCode} alt="2FA QR Code" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Can't scan? Enter this code manually:</p>
                            <p className="mt-2 select-all rounded-md bg-gray-200 px-4 py-2 font-mono text-lg font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                {manualCode}
                            </p>
                        </div>
                    </div>
                ) : (
                     <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                        <p className="text-sm font-medium text-red-800 dark:text-red-300">
                            <strong>Error:</strong> Could not generate a 2FA secret. Please try refreshing the page.
                        </p>
                    </div>
                )}
                
                {qrCode && !initialLoading && (
                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <div>
                            <label htmlFor="token-2fa" className="sr-only">6-Digit Verification Code</label>
                            <input
                                id="token-2fa"
                                name="token"
                                type="text"
                                inputMode="numeric"
                                pattern="\d{6}"
                                required
                                autoComplete="one-time-code"
                                value={verificationToken}
                                onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, ''))}
                                maxLength="6"
                                placeholder="Enter 6-digit code to verify"
                                className="relative block w-full appearance-none rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-center text-2xl tracking-widest text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                            />
                        </div>

                        {submissionError && (
                            <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                                <p className="text-sm font-medium text-red-800 dark:text-red-300">{submissionError}</p>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isEnabling || verificationToken.length !== 6}
                                className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 dark:focus:ring-offset-gray-800"
                            >
                                {isEnabling ? 'Verifying...' : 'Verify & Enable'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}