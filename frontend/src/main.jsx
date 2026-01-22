// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { Provider } from 'react-redux';
import { store } from './store';
import { BrowserRouter } from 'react-router-dom';
import { socketService } from './services';

socketService.configureSocketService(store.dispatch);

// ReactDOM.createRoot(document.getElementById('root')).render(
//  <React.StrictMode>
//    <Provider store={store}>
//      <BrowserRouter>
//        <App /> {/* Ensure QueryClientProvider is in App.jsx or wrapping it */}
//      </BrowserRouter>
//    </Provider>
//  </React.StrictMode>
// );

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <BrowserRouter>
      <App /> {/* Ensure QueryClientProvider is in App.jsx or wrapping it */}
    </BrowserRouter>
  </Provider>
);