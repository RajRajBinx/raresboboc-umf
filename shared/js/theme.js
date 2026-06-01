// Function to apply theme
function applyTheme() {
  const savedTheme = localStorage.getItem('umf-theme');
  let theme = savedTheme;
  if (!theme) {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', theme);
}

// Apply theme immediately to prevent flashing
applyTheme();

// Handle back/forward cache (bfcache)
window.addEventListener('pageshow', (event) => {
  applyTheme();
});

document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('umf-theme', newTheme);
    });
  }
});
