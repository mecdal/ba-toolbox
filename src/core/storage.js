// Namespaced localStorage helpers.
//
// All keys live under "ba-toolbox:*" to avoid collisions with anything else served
// from the same Vercel project (e.g. preview branches sharing localStorage).
// migrateLegacyStorage() moves any pre-namespace keys (theme/lang/recents) into the
// new namespace once and then deletes the legacy entries. It runs at module load
// so every consumer of storageGet/storageSet sees a clean state.

const STORAGE_NS = 'ba-toolbox:';

const LEGACY_KEY_MAP = {
  'ba-theme': 'theme',
  'ba-lang': 'lang',
  'ba-recents': 'recents',
};

function storageKey(name) {
  return `${STORAGE_NS}${name}`;
}

export function storageGet(name) {
  return localStorage.getItem(storageKey(name));
}

export function storageSet(name, value) {
  localStorage.setItem(storageKey(name), value);
}

export function storageRemove(name) {
  localStorage.removeItem(storageKey(name));
}

export function migrateLegacyStorage() {
  Object.entries(LEGACY_KEY_MAP).forEach(([oldKey, newName]) => {
    const legacy = localStorage.getItem(oldKey);
    if (legacy === null) return;
    if (storageGet(newName) === null) storageSet(newName, legacy);
    localStorage.removeItem(oldKey);
  });
}

// Run migration once on module load. Idempotent.
migrateLegacyStorage();
