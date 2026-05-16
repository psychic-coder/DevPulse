import '@testing-library/jest-dom';

// polyfill for fetch if needed
if (!globalThis.fetch) {
  // @ts-ignore
  globalThis.fetch = (url: string) => Promise.resolve({ ok: true, json: async () => ({}) });
}
