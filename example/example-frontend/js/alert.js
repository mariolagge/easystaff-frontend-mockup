// The page-level error banner. One at a time: a second call replaces the first, because
// two stacked "could not load" messages say nothing the one does not.

function showAlert(message) {
  const placeholder = document.getElementById('alert-placeholder');
  placeholder.innerHTML = `
    <div class="alert alert-danger" role="alert">
      <span>${escapeHtml(message)}</span>
      <button type="button" class="btn-close" aria-label="Close">${tablerIcon('x', { size: 14 })}</button>
    </div>`;
  placeholder.querySelector('.btn-close').addEventListener('click', clearAlerts);
}

function clearAlerts() {
  document.getElementById('alert-placeholder').innerHTML = '';
}
