// Caixeiro — site institucional: menu no celular, sombra do topo, entrada suave das seções
// e destaque da seção atual no menu. Sem bibliotecas.
(function () {
  'use strict';

  var topo = document.getElementById('topo');
  var botao = document.querySelector('.menu-botao');
  var nav = document.querySelector('.navegacao');

  // Menu no celular
  function fecharMenu() {
    if (!botao) return;
    botao.setAttribute('aria-expanded', 'false');
    nav.classList.remove('aberta');
  }
  if (botao && nav) {
    botao.addEventListener('click', function () {
      var aberto = botao.getAttribute('aria-expanded') === 'true';
      botao.setAttribute('aria-expanded', String(!aberto));
      nav.classList.toggle('aberta', !aberto);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) fecharMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && botao.getAttribute('aria-expanded') === 'true') {
        fecharMenu();
        botao.focus();
      }
    });
  }

  // Linha do topo aparece depois de rolar
  function marcarRolagem() {
    if (topo) topo.classList.toggle('rolou', window.scrollY > 8);
  }
  marcarRolagem();
  window.addEventListener('scroll', marcarRolagem, { passive: true });

  // Escalonamento dos itens de cada grupo
  document.querySelectorAll('[data-revelar-grupo]').forEach(function (grupo) {
    Array.prototype.forEach.call(grupo.children, function (filho, i) {
      filho.style.setProperty('--atraso', Math.min(i * 70, 420) + 'ms');
    });
  });

  var alvos = document.querySelectorAll('[data-revelar], [data-revelar-grupo]');
  function revelar(el) {
    el.classList.add('visivel');
    if (el.hasAttribute('data-revelar-grupo')) {
      setTimeout(function () { el.classList.add('pronto'); }, 1200);
    }
  }

  if (!('IntersectionObserver' in window)) {
    alvos.forEach(revelar);
  } else {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) {
          revelar(en.target);
          obs.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    alvos.forEach(function (el) { obs.observe(el); });
  }

  // Seção atual no menu
  var links = document.querySelectorAll('.menu a[href^="#"]');
  if ('IntersectionObserver' in window && links.length) {
    var porId = {};
    links.forEach(function (a) { porId[a.getAttribute('href').slice(1)] = a; });
    var obsSecao = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        var a = porId[en.target.id];
        if (!a) return;
        if (en.isIntersecting) {
          links.forEach(function (l) { l.removeAttribute('aria-current'); });
          a.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(porId).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) obsSecao.observe(s);
    });
  }
})();
