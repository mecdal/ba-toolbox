// Shared CDN script/CSS loader with timeout.
//
// Used by BPMN (bpmn-js) and YAML (js-yaml). The timeout is enforced via
// setTimeout because <script> doesn't fire onload/onerror if the network
// stalls indefinitely. Returns a Promise so callers can await + try/catch.

export function loadScript(src, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    const timer = setTimeout(() => {
      s.onload = s.onerror = null;
      reject(new Error('Script load timeout: ' + src));
    }, timeoutMs);
    s.onload = () => { clearTimeout(timer); resolve(); };
    s.onerror = () => { clearTimeout(timer); reject(new Error('Script load failed: ' + src)); };
    document.head.appendChild(s);
  });
}

export function loadCSS(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = href;
  document.head.appendChild(l);
}
