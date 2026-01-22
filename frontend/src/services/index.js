// src/services/index.js

// Re-exporting the default export from api.js as a named export 'api'
export { default as api } from './api';

// Re-exporting the default export from socketService.js as a named export 'socketService'
export { default as socketService } from './socketService';

// If you were to add more global services to this directory in the future,
// you would add their exports here as well.
// For example:
// export { default as analyticsService } from './analyticsService';