import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { ThreeDots } from 'react-loader-spinner';
import { generateTwoFactor, enableTwoFactor, clearError } from '../slices/authSlice';

import { layoutContants } from '../../../components/layout';

/**
 * A modal for setting up Two-Factor Authentication.
 * It guides the user through scanning a QR code and verifying with a token.
 * * @param {object} props
 * @param {boolean} props.isOpen - Controls the visibility of the modal.
 * @param {Function} props.onClose - Function to call when the modal should be closed.
 * @param {Function} props.onSuccess - Function to call when 2FA is successfully enabled.
 */
const SetupTwoFactorModal = ({ isOpen, onClose, onSuccess }) => {
    const dispatch = useDispatch();

    // Internal state for the modal
    const [qrCode, setQrCode] = useState('');
    const [manualCode, setManualCode] = useState('');
    const [verificationToken, setVerificationToken] = useState('');
    
    // Status management: 'idle', 'generating', 'ready', 'enabling', 'error'
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState('');

    const { HEADER_HEIGHT_NUMBER, HEADER_HEIGHT_STRING } = layoutContants;
    const dynamicMobileMarginTop = `mt-[${HEADER_HEIGHT_STRING}]`; 
    const dynamicMobileHeight = `h-[calc(100vh-${HEADER_HEIGHT_NUMBER * 2}px)]`;

    // Fetch the QR code and secret when the modal opens
    useEffect(() => {
        // Only run when the modal is opened and is in an initial or error state
        if (isOpen && (status === 'idle' || status === 'error')) {
            dispatch(clearError()); 
            setStatus('generating');
            setError('');

            dispatch(generateTwoFactor())
                .unwrap()
                .then(data => {
                    setQrCode(data.qrCodeUrl);
                    setManualCode(data.secret);
                    setStatus('ready');
                })
                .catch(err => {
                    console.error("Failed to generate 2FA secret:", err);
                    setError(err.message || 'Could not generate a 2FA secret. Please try again.');
                    setStatus('error');
                });
        }
        
        // Reset state when the modal is closed
        if (!isOpen) {
            setQrCode('');
            setManualCode('');
            setVerificationToken('');
            setError('');
            setStatus('idle');
        }
    }, [isOpen, dispatch, status, HEADER_HEIGHT_NUMBER]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (verificationToken.length !== 6) return;

        setStatus('enabling');
        setError('');

        dispatch(enableTwoFactor(verificationToken))
            .unwrap()
            .then(() => {
                onSuccess(); // Trigger success callback from parent
            })
            .catch(err => {
                console.error("Failed to enable 2FA:", err);
                setError(err.message || 'Verification failed. Please check the code and try again.');
                setStatus('ready'); // Return to 'ready' state to allow re-entry
            });
    };

    if (!isOpen) return null;

    // Styling derived from EpicFormModal.jsx
    const commonInputClass = "block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500";
    const commonButtonClass = "px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed";
    const cancelButtonClass = "px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800";

    return (
        <div 
            className="fixed sm:absolute inset-0 z-30 flex justify-center items-start sm:items-center p-4" 
            onClick={onClose}
        >
            <div 
                className={`bg-white dark:bg-gray-800 shadow-xl flex flex-col w-full rounded-none sm:rounded-lg ${dynamicMobileHeight} sm:h-auto ${dynamicMobileMarginTop} sm:mt-0 sm:max-h-[90%] sm:max-w-md border border-gray-300 dark:border-gray-600 transition-all duration-300 ease-in-out`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-shrink-0 px-6 py-4 border-b border-gray-300 dark:border-gray-600 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        Set Up Two-Factor Authentication
                    </h2>
                    <button onClick={onClose} aria-label="Close" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-indigo-500">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-grow p-4 sm:p-4 space-y-4 text-center overflow-x-hidden">
                    {status === 'generating' && (
                        <div className="flex flex-col items-center justify-center py-10 space-y-4">
                            <ThreeDots color="#4f46e5" height={50} width={50} />
                            <p className="text-gray-600 dark:text-gray-300">Generating your unique code...</p>
                        </div>
                    )}

                    {(status === 'error' && !qrCode) && (
                        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20 my-4">
                            <p className="text-sm font-medium text-red-800 dark:text-red-300">
                                <strong>Error:</strong> {error}
                            </p>
                        </div>
                    )}

                    {(status === 'ready' || status === 'enabling' || (status === 'error' && qrCode)) && (
                        <>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-4">
                                Scan the QR code with your authenticator app (e.g., Google Authenticator).
                            </p>
                            <div className="inline-block rounded-lg border-4 border-white dark:border-gray-700 p-2 shadow-lg
                                            max-w-xs mx-auto mb-2 sm:mb-4">
                                <img src={qrCode} alt="2FA QR Code" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-500  mb-0 sm:mb-2">Can't scan? Enter this code manually:</p>
                                <p className="mt-1 select-all rounded-md bg-gray-200 px-3 py-1.5 font-mono text-center text-sm sm:text-2l font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                    {manualCode}
                                </p>
                            </div>
                        </>
                    )}
                </div>
                
                {/* Form & Footer */}
                <form onSubmit={handleSubmit}>
                    <div className="p-4 sm:p-4 border-t border-gray-300 dark:border-gray-600 space-y-4">
                        <div>
                             <label htmlFor="token-2fa" className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 text-center uppercase tracking-wider">
                                Verification Code
                            </label>
                            <input
                                id="token-2fa"
                                type="text"
                                value={verificationToken}
                                onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, ''))}
                                placeholder="Enter 6-digit code"
                                required
                                maxLength="6"
                                inputMode="numeric"
                                pattern="\d{6}"
                                autoComplete="one-time-code"
                                className={`${commonInputClass} text-center text-base sm:text-2xl tracking-normal sm:tracking-widest`}
                                disabled={status !== 'ready'}
                            />
                        </div>
                         {error && (status === 'ready' || status === 'enabling') && (
                            <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
                                <p className="text-center text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
                            </div>
                        )}
                    </div>
                    <div className="flex-shrink-0 flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-300 dark:border-gray-700">
                        <button type="button" onClick={onClose} className={cancelButtonClass}>
                            Cancel
                        </button>
                        <button type="submit" disabled={status === 'enabling' || verificationToken.length !== 6} className={commonButtonClass}>
                            {status === 'enabling' ? 'Verifying...' : 'Verify & Enable'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SetupTwoFactorModal;