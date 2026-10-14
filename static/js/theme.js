(function () {
  try { var theme = localStorage.getItem('workify-theme'); if (theme === 'dark' || theme === 'light') document.documentElement.dataset.theme = theme; } catch (_) {}
})();
