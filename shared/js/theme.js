// Logica pentru pagina principala (Dashboard)
document.addEventListener('DOMContentLoaded', () => {
  setupTheme();
});

// Setup theme onload and configure toggle listener
function setupTheme() {
  const savedTheme = localStorage.getItem('umf-theme');
  let theme = savedTheme;
  
  if (!theme) {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  setTheme(theme);

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
    });
  }
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('umf-theme', theme);
}
