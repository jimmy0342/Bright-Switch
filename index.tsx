console.log("[BOOT] index.tsx loading...");
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

console.log("[BOOT] dependencies loaded, targeting root...");
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Critical Failure: Could not find root element '#root' in the DOM.");
} else {
  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("React Mounting Error:", error);
    rootElement.innerHTML = `
      <div style="padding: 40px; text-align: center; font-family: 'Inter', sans-serif;">
        <h1 style="color: #ef4444; font-weight: 900;">Application Boot Failure</h1>
        <p style="color: #64748b; margin-bottom: 24px;">An internal error occurred during the React initialization sequence.</p>
        <pre style="background: #f1f5f9; padding: 16px; border-radius: 8px; font-size: 12px; display: inline-block; text-align: left; max-width: 100%; overflow: auto;">${error instanceof Error ? error.message : String(error)}</pre>
        <div style="margin-top: 24px;">
          <button onclick="window.location.reload()" style="padding: 12px 24px; background: #2563eb; color: white; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2);">
            Retry Boot Sequence
          </button>
        </div>
      </div>
    `;
  }
}