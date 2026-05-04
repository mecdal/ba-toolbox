// Floating feedback widget at the bottom-right of the viewport.
//
// toggleFeedbackMenu is called from index.html's inline onclick. The document-level
// click handler (registered at module load) closes the menu on outside-click —
// it's idempotent because we just toggle a class, so multiple module loads are safe.

export function toggleFeedbackMenu() {
  const widget = document.getElementById('feedback-widget');
  if (widget) widget.classList.toggle('open');
}

document.addEventListener('click', (e) => {
  const widget = document.getElementById('feedback-widget');
  if (widget && !widget.contains(e.target)) {
    widget.classList.remove('open');
  }
});
