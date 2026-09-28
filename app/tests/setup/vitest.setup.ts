import '@testing-library/jest-dom';

// Node 25 ships an experimental global `localStorage` that shadows jsdom's and has
// no working methods unless --localstorage-file is set. Swap in an in-memory one.
if (typeof globalThis.localStorage?.setItem !== 'function') {
  const data = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => {
      data.delete(key);
    },
    setItem: (key, value) => {
      data.set(key, String(value));
    },
  };
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
}

// jsdom lacks Blob.prototype.text (used by preview components).
if (typeof Blob !== 'undefined' && !Blob.prototype.text) {
  Blob.prototype.text = function text(this: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(this);
    });
  };
}
