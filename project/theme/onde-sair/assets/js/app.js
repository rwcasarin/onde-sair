/**
 * Onde Sair · interações leves
 */
(function () {
  // Salvar lugar (toggle local, persiste em localStorage)
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-os-save]');
    if (!btn) return;
    e.preventDefault();
    var id = btn.getAttribute('data-os-save');
    var saved = JSON.parse(localStorage.getItem('os_saved') || '[]');
    var idx = saved.indexOf(id);
    if (idx === -1) {
      saved.push(id);
      btn.classList.add('btn-primary');
      btn.classList.remove('btn-ghost');
      btn.textContent = '★ Salvo';
    } else {
      saved.splice(idx, 1);
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-ghost');
      btn.textContent = '☆ Salvar';
    }
    localStorage.setItem('os_saved', JSON.stringify(saved));
  });

  // Restaurar estado salvo ao carregar
  document.addEventListener('DOMContentLoaded', function () {
    var saved = JSON.parse(localStorage.getItem('os_saved') || '[]');
    saved.forEach(function (id) {
      var btn = document.querySelector('[data-os-save="' + id + '"]');
      if (btn) {
        btn.classList.add('btn-primary');
        btn.classList.remove('btn-ghost');
        btn.textContent = '★ Salvo';
      }
    });
  });
})();
