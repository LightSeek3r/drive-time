import '@fontsource-variable/schibsted-grotesk/wght.css';
import '@fontsource/instrument-serif/latin-400.css';
import './styles/global.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import Root from './Root';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
