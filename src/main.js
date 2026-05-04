// BA Toolbox — entry point.
//
// During Sprint 5a (modularization) this file pulls the legacy monolithic app.js
// in as a side-effect import. As each tool/module gets extracted from app.js into
// src/tools/* or src/core/*, the import surface here grows and app.js shrinks.
// Eventually app.js disappears entirely and main.js becomes the sole orchestrator.
//
// Why does app.js itself need to be a module now?
// Because it imports from src/i18n. That makes the entire file a module, which in
// turn means its top-level functions are no longer global. The 60+ inline
// onclick="…" handlers in index.html need those functions on `window`. The bridge
// is currently set up at the bottom of app.js (look for the `window.X = X` block).
// Once a function moves into a module, its window-bridge entry follows it here.

import './core/storage.js'; // run legacy-key migration before anything else reads storage
import '../app.js';         // legacy monolith — currently still owns most behavior
