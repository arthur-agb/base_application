import { useEffect } from 'react';
import confetti from 'canvas-confetti';

/**
 * A component that fires a confetti animation from a target element
 * as soon as it is mounted. It renders nothing to the DOM.
 * @param {{targetRef: React.RefObject<HTMLElement>}} props
 */
const ConfettiLauncher = ({ targetRef }) => {
  useEffect(() => {
    // Ensure the ref to the target button is valid
    if (targetRef.current) {
      const buttonRect = targetRef.current.getBoundingClientRect();
      const origin = {
        x: (buttonRect.left + buttonRect.width / 2) / window.innerWidth - 0.02,
        y: (buttonRect.top + buttonRect.height / 2) / window.innerHeight - 0.01,
      };

      // Fire the confetti
      confetti({
        particleCount: 80, spread: 80, origin: origin, startVelocity: 15, angle: 120, gravity: 1.2,
        colors: ['#6ee7b7', '#34d399', '#10b981', '#ffffff']
      });

      setTimeout(() => { 
        confetti({
          particleCount: 80, spread: 80, origin: origin, startVelocity: 22, angle: 120, gravity: 1.4,
          colors: ['#FFD700', '#FF0000']
        });
      }, 150);
    }
  }, [targetRef]); // This effect runs once when the component mounts

  return null; // This component does not render any visible elements
};

export default ConfettiLauncher;