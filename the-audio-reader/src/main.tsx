import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Polyfill ReadableStream async iterator and values() for Safari & web runtimes
if (typeof ReadableStream !== 'undefined') {
  if (!ReadableStream.prototype[Symbol.asyncIterator]) {
    ReadableStream.prototype[Symbol.asyncIterator] = async function* () {
      const reader = this.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) return;
          yield value;
        }
      } finally {
        reader.releaseLock();
      }
    };
  }
  if (typeof (ReadableStream.prototype as any).values !== 'function') {
    (ReadableStream.prototype as any).values = ReadableStream.prototype[Symbol.asyncIterator];
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

