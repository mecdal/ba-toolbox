// Sidebar search: filters .tool-nav-item entries by their visible text.
// Group labels stay visible — empty groups are visually obvious without
// extra markup hiding work.

export function initSearch() {
  const input = document.getElementById('search-box');
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    document.querySelectorAll('.tool-nav-item').forEach((el) => {
      const match = el.textContent.toLowerCase().includes(q);
      el.style.display = match ? '' : 'none';
    });
    document.querySelectorAll('.tool-group-label').forEach((label) => {
      label.style.display = '';
    });
  });
}
