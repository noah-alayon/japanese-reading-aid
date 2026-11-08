/* Shared dark mode toggle for all pages. */
'use strict';

const THEME_KEY = 'jra-theme';
const themeButton = document.getElementById('theme-toggle');

// Set the page colors and update the accessible button label.
function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.body.classList.toggle('dark-mode', isDark);
    // Only the icon changes; the button remains icon-only.
      //Sun for Light Mode
      //Moon for Dark Mode
    themeButton.querySelector('.theme-icon').textContent = isDark ? '☀' : '☾';
    themeButton.setAttribute('aria-pressed', String(isDark));
    themeButton.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
}

// Load the saved preference, or use light mode on the first visit.
let savedTheme = 'light';
try {
    savedTheme = localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
} catch (error) {
}
applyTheme(savedTheme);

// Save the new theme when the visitor clicks the toggle.
themeButton.addEventListener('click', function () {
    const nextTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
    applyTheme(nextTheme);
    try {
        localStorage.setItem(THEME_KEY, nextTheme);
    } catch (error) {
        // Ignore storage restrictions; the current page still changes theme.
    }
});
