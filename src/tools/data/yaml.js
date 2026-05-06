// YAML ↔ JSON converter — wraps js-yaml, lazy-loaded from CDN on first use.
//
// First call triggers a network fetch (~30 KB). After that the script lives
// in the page and works offline. We bail early when navigator.onLine is false
// so the user sees a clear "you're offline" message instead of a network error.

import { t } from '../../i18n/index.js';
import { showError, hideError } from '../../core/util.js';
import { loadScript } from '../../core/cdn-loader.js';

const YAML_CDN = 'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js';
let yamlScriptLoaded = false;

async function ensureYamlLoaded() {
  if (yamlScriptLoaded || (typeof jsyaml !== 'undefined')) { yamlScriptLoaded = true; return; }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error(t('yaml.error.offline'));
  }
  await loadScript(YAML_CDN, 8000);
  yamlScriptLoaded = true;
}

export async function yamlToJson() {
  hideError('yaml-error');
  const input = document.getElementById('yaml-input').value;
  const outEl = document.getElementById('yaml-json-output');
  if (!input.trim()) { outEl.value = ''; return; }
  try {
    await ensureYamlLoaded();
    const data = jsyaml.load(input);
    outEl.value = JSON.stringify(data, null, 2);
  } catch (e) {
    showError('yaml-error', `${t('yaml.error.parse')}: ${e.message}`);
  }
}

export async function jsonToYaml() {
  hideError('yaml-error');
  const inputEl = document.getElementById('yaml-json-output');
  const yamlEl = document.getElementById('yaml-input');
  const text = inputEl.value.trim();
  if (!text) return;
  try {
    const data = JSON.parse(text);
    await ensureYamlLoaded();
    yamlEl.value = jsyaml.dump(data, { indent: 2, lineWidth: 100 });
  } catch (e) {
    showError('yaml-error', `${t('yaml.error.parse')}: ${e.message}`);
  }
}
