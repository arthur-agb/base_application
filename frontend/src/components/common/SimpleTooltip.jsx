import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';

const SimpleTooltip = ({ content, children, enabled = true }) => {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const targetRef = useRef(null);

    const handleMouseEnter = () => {
        if (!enabled) return;
        if (targetRef.current) {
            const rect = targetRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top + rect.height / 2,
                left: rect.right + 8 // 8px spacing
            });
            setVisible(true);
        }
    };

    const handleMouseLeave = () => {
        setVisible(false);
    };

    return (
        <div
            ref={targetRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="w-full" // Ensure it takes full width in sidebar
        >
            {children}
            {visible && enabled && ReactDOM.createPortal(
                <div
                    className="fixed z-[9999] px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-sm pointer-events-none transform -translate-y-1/2 whitespace-nowrap dark:bg-gray-700 fade-in"
                    style={{ top: coords.top, left: coords.left }}
                >
                    {content}
                </div>,
                document.body
            )}
        </div>
    );
};

export default SimpleTooltip;
