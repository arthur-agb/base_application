/**
 * Generates a data URL for an avatar with initials
 * @param {string} name - The user's name
 * @param {number} size - The size of the avatar in pixels
 * @returns {string} - A data URL for the SVG avatar
 */
export const generateInitialsAvatar = (name, size = 128) => {
    if (!name) {
        name = 'User';
    }

    // Get initials (first letter of first two words)
    const initials = name
        .split(' ')
        .slice(0, 2)
        .map(word => word.charAt(0).toUpperCase())
        .join('');

    // Generate a consistent color based on the name
    const colors = [
        { bg: '#3b82f6', text: '#ffffff' }, // blue
        { bg: '#8b5cf6', text: '#ffffff' }, // purple
        { bg: '#ec4899', text: '#ffffff' }, // pink
        { bg: '#f59e0b', text: '#ffffff' }, // amber
        { bg: '#10b981', text: '#ffffff' }, // emerald
        { bg: '#06b6d4', text: '#ffffff' }, // cyan
        { bg: '#6366f1', text: '#ffffff' }, // indigo
        { bg: '#84cc16', text: '#ffffff' }, // lime
    ];

    // Simple hash function to get consistent color for same name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    const color = colors[colorIndex];

    // Create SVG
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="${color.bg}"/>
      <text
        x="50%"
        y="50%"
        dominant-baseline="central"
        text-anchor="middle"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="${size * 0.4}"
        font-weight="600"
        fill="${color.text}"
      >${initials}</text>
    </svg>
  `.trim();

    // Convert to data URL
    return `data:image/svg+xml;base64,${btoa(svg)}`;
};
