// BPMN Modeler — wraps bpmn-js (loaded from CDN on first activation).
//
// initBpmn is idempotent and lazy: tabs.js calls it via window.initBpmn when
// the BPMN tab opens for the first time. Subsequent opens are no-ops.
// 12-second timeout + offline pre-check so a blocked CDN doesn't hang the UI.

import { t } from '../../i18n/index.js';
import { showError, hideError } from '../../core/util.js';
import { loadScript, loadCSS } from '../../core/cdn-loader.js';

const BPMN_CDN = 'https://unpkg.com/bpmn-js@17/dist/';
let bpmnInstance = null;
let bpmnInitStarted = false;

export async function initBpmn() {
  if (bpmnInstance) return;
  if (bpmnInitStarted) return;
  bpmnInitStarted = true;

  loadCSS(BPMN_CDN + 'assets/diagram-js.css');
  loadCSS(BPMN_CDN + 'assets/bpmn-js.css');
  loadCSS(BPMN_CDN + 'assets/bpmn-font/css/bpmn-embedded.css');

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    bpmnInitStarted = false;
    document.getElementById('bpmn-loading').style.display = 'none';
    showError('bpmn-error', t('bpmn.error.offline'));
    return;
  }

  try {
    await loadScript(BPMN_CDN + 'bpmn-modeler.production.min.js', 12000);

    bpmnInstance = new BpmnJS({
      container: '#bpmn-canvas',
      keyboard: { bindTo: window },
    });

    await bpmnInstance.createDiagram();
    document.getElementById('bpmn-loading').style.display = 'none';
  } catch (e) {
    bpmnInitStarted = false;
    document.getElementById('bpmn-loading').style.display = 'none';
    const msg = /timeout/i.test((e && e.message) || '') ? t('bpmn.error.timeout') : t('bpmn.error.load');
    showError('bpmn-error', msg);
  }
}

export async function bpmnNew() {
  if (!bpmnInstance) return;
  hideError('bpmn-error');
  await bpmnInstance.createDiagram();
}

export async function bpmnExportXml() {
  if (!bpmnInstance) return;
  try {
    const { xml } = await bpmnInstance.saveXML({ format: true });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([xml], { type: 'application/xml' })),
      download: 'diagram.bpmn',
    });
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (e) {
    showError('bpmn-error', 'Export failed: ' + e.message);
  }
}

export async function bpmnExportSvg() {
  if (!bpmnInstance) return;
  try {
    const { svg } = await bpmnInstance.saveSVG();
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })),
      download: 'diagram.svg',
    });
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (e) {
    showError('bpmn-error', 'Export failed: ' + e.message);
  }
}

export function bpmnImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.bpmn,.xml';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      await bpmnInstance.importXML(text);
      hideError('bpmn-error');
    } catch {
      showError('bpmn-error', t('bpmn.error.import'));
    }
  };
  input.click();
}
