/* Interactive example on the home page. */

// Find the Show meaning button and the meaning text in index.html.
const previewButton = document.getElementById('sample-meaning');
const previewDetail = document.getElementById('sample-detail');
// Only set up the button if both elements exist on this page.
if (previewButton && previewDetail) {
  previewButton.addEventListener('click', () => {
    // If the meaning is hidden, show it. Otherwise, hide it.
    const open = previewDetail.hidden;
    previewDetail.hidden = !open;
    // Keep the accessibility label and button text in sync with what is shown.
    previewButton.setAttribute('aria-expanded', String(open));
    previewButton.textContent = open ? 'Hide meaning' : 'Show meaning';
  });
}
