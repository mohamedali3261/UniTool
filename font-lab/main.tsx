import React from 'react';
import { createRoot } from 'react-dom/client';
import FontLabApp from './App';
import '../src/styles/tools-appearance.css';
import '../src/styles/site-appearance.css';
import './styles/lab.css';
import { installBundledFontUrls } from './browser/fontUrls';

installBundledFontUrls();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FontLabApp />
  </React.StrictMode>,
);
