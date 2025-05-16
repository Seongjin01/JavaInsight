import React from 'react';
import ReactDOM from 'react-dom/client';
import AppWrapper from './App'; // AppWrapper for Router
import './App.css'; // Global styles

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);