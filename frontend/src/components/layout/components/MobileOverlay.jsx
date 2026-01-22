// src/components/Layout/MobileOverlay.jsx
import React from 'react';

const MobileOverlay = ({ isOpen, onClick }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div
            onClick={onClick}
            className="fixed inset-0 bg-black/50 z-50 lg:hidden" // lg:hidden can be used if it should only appear on smaller screens
            aria-hidden="true"
        ></div>
    );
};

export default MobileOverlay;