// Sub-tab helper used inside tool panels (e.g. Base64's Text / File→Base64 / Base64→File).
// Distinct from the top-level tab-bar (src/core/tabs.js) which switches between tools.
//
// Pattern: a container with .tab-btn buttons whose data-tab points at a sibling
// .tab-content element id. Wires click → toggle "active" class on both.

export function initTabs(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const scope = container.parentElement;
  container.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      scope.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });
}
