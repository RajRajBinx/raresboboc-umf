// Logica pentru selectia modului de studiu
document.addEventListener('DOMContentLoaded', () => {
  setupTheme();
  setupSelectionHandlers();
});

// Configurare tema la incarcare si ascultator click
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

// Configurare actiuni click pe carduri pentru trimitere spre pagina de quiz cu parametrul de mod
function setupSelectionHandlers() {
  const cardExerseaza = document.getElementById('mode-exerseaza');
  const cardSimulare = document.getElementById('mode-simulare');

  if (cardExerseaza) {
    cardExerseaza.addEventListener('click', () => {
      window.location.href = 'anatomie-1-2.html?mode=exerseaza';
    });
  }

  if (cardSimulare) {
    cardSimulare.addEventListener('click', () => {
      window.location.href = 'anatomie-1-2.html?mode=simulare';
    });
  }
}
