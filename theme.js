const themeSwitch = document.getElementById('themeSwitch');
const themeIcon = document.getElementById('themeIcon');

themeSwitch.addEventListener('change', function () {
  document.body.classList.toggle('dark-mode');
  document.body.classList.toggle('bg-light');
  document.body.classList.toggle('text-dark');

  if (document.body.classList.contains('dark-mode')) {
    themeIcon.classList.replace('bi-sun-fill', 'bi-moon-stars-fill');
  } else {
    themeIcon.classList.replace('bi-moon-stars-fill', 'bi-sun-fill');
  }
});
