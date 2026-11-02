// Caixeiro — site institucional (v3, 02/11/2026)
// Palco que troca de cena, venda de exemplo que monta o cupom, passos da venda,
// entradas das seções (GSAP + ScrollTrigger, servidos pelo próprio site) e o formulário de contato.
// Sem JS a página continua completa: nada nasce escondido no HTML.
(function () {
  'use strict';

  var reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var temGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  if (temGsap) gsap.registerPlugin(ScrollTrigger);

  // ---------- Palco fixo: cena do bloco que está no meio da tela ----------
  var legendas = {
    balcao: 'Caixeiro Balcão · tela Vender',
    app: 'Caixeiro PDV · Vender e Finalizar',
    teclas: 'Caixeiro Balcão · uma tecla por tela',
    fechamento: 'Caixeiro Balcão · fechamento cego'
  };
  var cenas = document.querySelectorAll('[data-cena-palco]');
  var legenda = document.querySelector('.palco-legenda');
  function mostrarCena(nome) {
    cenas.forEach(function (c) { c.classList.toggle('ativa', c.getAttribute('data-cena-palco') === nome); });
    if (legenda && legendas[nome]) legenda.textContent = legendas[nome];
  }
  var blocosCena = document.querySelectorAll('[data-cena]');
  if ('IntersectionObserver' in window && cenas.length) {
    var obsCena = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) { if (en.isIntersecting) mostrarCena(en.target.getAttribute('data-cena')); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    blocosCena.forEach(function (b) { obsCena.observe(b); });
  }

  // ---------- Passos da venda: o estado do palco segue a frase do meio ----------
  var tela = document.querySelector('.fluxo-tela');
  var passos = document.querySelectorAll('.fluxo-passo');
  var checkFluxo = tela && tela.querySelector('.t-success-check');
  function mostrarEstado(n) {
    if (!tela || tela.getAttribute('data-estado-atual') === n) return;
    tela.setAttribute('data-estado-atual', n);
    passos.forEach(function (p) { p.classList.toggle('ativo', p.getAttribute('data-estado') === n); });
    if (checkFluxo) {
      checkFluxo.setAttribute('data-state', 'out');
      if (n === '3') { void checkFluxo.offsetWidth; checkFluxo.setAttribute('data-state', 'in'); }
    }
  }
  // No celular o palco some: cada passo leva a própria tela (cópia decorativa, escondida do leitor de tela)
  if (tela) {
    passos.forEach(function (p) {
      var n = p.getAttribute('data-estado');
      var est = tela.querySelector('.estado[data-estado="' + n + '"]');
      if (!est) return;
      var mini = document.createElement('div');
      mini.className = 'fluxo-tela fluxo-mini';
      mini.setAttribute('aria-hidden', 'true');
      mini.setAttribute('data-ui', '');
      mini.appendChild(est.cloneNode(true));
      p.appendChild(mini);
    });
  }
  if ('IntersectionObserver' in window && tela) {
    var obsPasso = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) { if (en.isIntersecting) mostrarEstado(en.target.getAttribute('data-estado')); });
    }, { rootMargin: '-50% 0px -40% 0px' });
    passos.forEach(function (p) { obsPasso.observe(p); });
  }

  // ---------- Venda de exemplo: cada linha vira item do cupom ----------
  var catalogo = [
    { chave: 'abacate', nome: 'ABACATE COMUM KG', preco: 2.75, kg: true },
    { chave: 'banana', nome: 'BANANA PRATA KG', preco: 4.99, kg: true },
    { chave: 'tomate', nome: 'TOMATE KG', preco: 6.90, kg: true },
    { chave: 'alface', nome: 'ALFACE CRESPA UN', preco: 2.50 },
    { chave: 'cafe', nome: 'CAFE TORRADO 500G', preco: 18.90 },
    { chave: 'leite', nome: 'LEITE INTEGRAL 1L', preco: 4.79 },
    { chave: 'arroz', nome: 'ARROZ TIPO 1 5KG', preco: 27.90 },
    { chave: 'pao', nome: 'PAO FRANCES KG', preco: 15.90, kg: true, outras: ['paes'] }
  ];
  var entrada = document.getElementById('venda-texto');
  var corpoCupom = document.getElementById('cupom-linhas');
  var totalEl = document.getElementById('cupom-total');
  var pagoEl = document.getElementById('cupom-pago');
  var dinheiro = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var qtdFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });
  var semAcento = function (s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
  var linhasAntes = [];
  var totalAntes = '';

  function lerLinha(texto) {
    var t = semAcento(texto.trim());
    if (!t) return null;
    var m = t.match(/^(\d+(?:[.,]\d+)?)\s*[*x]?\s*(.*)$/);
    var qtd = 1;
    var resto = t;
    if (m && m[2]) { qtd = parseFloat(m[1].replace(',', '.')); resto = m[2]; }
    var produto = null;
    for (var i = 0; i < catalogo.length; i++) {
      var chaves = [catalogo[i].chave].concat(catalogo[i].outras || []);
      if (chaves.some(function (c) { return resto.indexOf(c) !== -1; })) { produto = catalogo[i]; break; }
    }
    if (!produto) return { erro: texto.trim().slice(0, 18) };
    if (!produto.kg) qtd = Math.max(1, Math.round(qtd));
    qtd = Math.min(qtd, 999);
    return { nome: produto.nome, qtd: qtd, total: Math.round(qtd * produto.preco * 100) / 100 };
  }

  function digitos(el, texto) {
    // transitions.dev number pop-in: cada caractere entra; os dois últimos com atraso
    el.classList.remove('is-animating');
    el.textContent = '';
    for (var i = 0; i < texto.length; i++) {
      var s = document.createElement('span');
      s.className = 't-digit';
      s.textContent = texto[i];
      if (i === texto.length - 2) s.setAttribute('data-stagger', '1');
      if (i === texto.length - 1) s.setAttribute('data-stagger', '2');
      el.appendChild(s);
    }
    void el.offsetWidth;
    el.classList.add('is-animating');
  }

  function montarCupom() {
    if (!entrada || !corpoCupom) return;
    var linhas = entrada.value.split('\n').slice(0, 12).map(lerLinha).filter(Boolean);
    var total = 0;
    corpoCupom.textContent = '';
    linhas.forEach(function (l, i) {
      var tr = document.createElement('tr');
      var chave = l.erro ? 'x' + l.erro : l.nome + l.qtd;
      if (linhasAntes[i] !== chave) tr.className = 'entrou';
      if (l.erro) {
        tr.className += ' nao-achou';
        var td = document.createElement('td');
        td.colSpan = 3;
        td.textContent = l.erro.toUpperCase() + ': fora do exemplo';
        tr.appendChild(td);
      } else {
        total += l.total;
        [l.nome, qtdFmt.format(l.qtd), dinheiro.format(l.total)].forEach(function (v) {
          var td = document.createElement('td');
          td.textContent = v;
          tr.appendChild(td);
        });
      }
      corpoCupom.appendChild(tr);
    });
    linhasAntes = linhas.map(function (l) { return l.erro ? 'x' + l.erro : l.nome + l.qtd; });
    var txt = dinheiro.format(total);
    if (txt !== totalAntes) {
      if (reduzir || !totalAntes) totalEl.textContent = txt; else digitos(totalEl, txt);
      totalAntes = txt;
    }
    pagoEl.textContent = txt;
    totalEl.setAttribute('aria-label', 'R$ ' + txt);
    // Leitor de tela: um resumo curto, depois que a digitação para
    clearTimeout(montarCupom.aviso);
    montarCupom.aviso = setTimeout(function () {
      var itens = linhas.filter(function (l) { return !l.erro; }).length;
      if (resumo) resumo.textContent = itens + (itens === 1 ? ' item' : ' itens') + ', total R$ ' + txt;
    }, 700);
  }
  var resumo = document.getElementById('cupom-resumo');
  if (entrada) {
    entrada.addEventListener('input', montarCupom);
    montarCupom();
  }

  // ---------- Formulário de contato ----------
  var ENDERECO = 'https://contato.caixeiro.tec.br/';
  var form = document.getElementById('formulario');
  // Tempo decorrido na página (não depende do relógio do PC estar certo)
  var aberto = (window.performance && performance.now) ? function () { return performance.now(); } : (function (t0) { return function () { return Date.now() - t0; }; })(Date.now());
  if (form) {
    var status = document.getElementById('formulario-status');
    var botao = form.querySelector('button[type="submit"]');
    var textoBotao = botao.querySelector('.botao-texto');
    var ok = document.getElementById('formulario-ok');
    var falha = function (msg, campo) {
      status.textContent = msg;
      status.classList.add('erro');
      if (campo) { campo.setAttribute('aria-invalid', 'true'); campo.focus(); }
    };
    form.addEventListener('input', function (e) {
      if (e.target.hasAttribute('aria-invalid')) e.target.removeAttribute('aria-invalid');
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.classList.remove('erro');
      status.textContent = '';
      var d = {
        nome: form.nome.value.trim(),
        empresa: form.empresa.value.trim(),
        contato: form.contato.value.trim(),
        mensagem: form.mensagem.value.trim(),
        site: form.site.value,
        t: Math.round(aberto())
      };
      if (!d.nome) return falha('Informe o seu nome.', form.nome);
      if (!d.contato) return falha('Informe um e-mail ou WhatsApp para a resposta.', form.contato);
      var ehEmail = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(d.contato); // mesma regra do Worker
      if (!ehEmail && d.contato.replace(/\D/g, '').length < 10) return falha('Informe um e-mail válido ou um WhatsApp com DDD.', form.contato);
      if (!d.mensagem) return falha('Escreva a sua mensagem.', form.mensagem);

      botao.disabled = true;
      textoBotao.textContent = 'Enviando...';
      fetch(ENDERECO, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (res) {
          if (!res.ok) { var e = new Error(res.erro || 'Não conseguimos enviar agora.'); e.doServidor = true; throw e; }
          form.classList.add('enviado');
          ok.hidden = false;
          ok.focus();
          var chk = ok.querySelector('.t-success-check');
          if (chk) chk.setAttribute('data-state', 'in');
        })
        .catch(function (err) {
          // Falha de rede vem com texto do navegador (em inglês, varia por navegador): mensagem fixa
          var msg = err && err.doServidor ? err.message : 'Não conseguimos enviar agora.';
          if (msg.indexOf('contato@') === -1) msg += ' Se preferir, escreva para contato@caixeiro.tec.br.';
          falha(msg);
        })
        .then(function () {
          botao.disabled = false;
          textoBotao.textContent = 'Enviar mensagem';
        });
    });
  }

  // ---------- Movimento (GSAP): entrada das partes de cada seção ----------
  if (!temGsap || reduzir) return;
  document.documentElement.classList.add('anima');
  var mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', function () {
    // Abertura: o título já está pintado no primeiro quadro; o resto chega em menos de 1 s
    gsap.from('.abertura h1', { y: 24, duration: .8, ease: 'expo.out' });
    gsap.from('.abertura-lide, .acoes', { y: 20, opacity: 0, duration: .7, ease: 'expo.out', stagger: .09, delay: .1 });
    gsap.from('.palco', { clipPath: 'inset(6% 0 6% 0 round 14px)', duration: 1, ease: 'expo.out' });

    // Cada seção: título, depois texto, depois o resto, 70 ms entre eles
    var grupos = [
      '.bloco', '.vitrine-entrada', '.vitrine-saida', '.recursos', '.seguranca', '.parceiros'
    ];
    // No celular as faixas longas do fim entram já visíveis
    if (window.matchMedia('(max-width: 899px)').matches) grupos = grupos.slice(0, 4);
    // Só esconde o que está abaixo da tela ao carregar; revela ao entrar e, se a rolagem pular
    // a seção (âncora, rolagem rápida), revela na hora: conteúdo nunca fica preso invisível.
    var pendentes = [];
    grupos.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (sec) {
        var partes = sec.querySelectorAll(':scope > h2, :scope > p, :scope > dl, :scope > ul, :scope > ol, :scope > form, :scope > div, :scope > article, :scope > label, :scope > textarea, .lista-leitura > div, .seguranca-lista > div, .parceiros li, .perguntas-texto p');
        if (!partes.length || sec.getBoundingClientRect().top < window.innerHeight) return;
        gsap.set(partes, { y: 24, opacity: 0 });
        pendentes.push({ sec: sec, partes: partes });
      });
    });
    function revelar() {
      var limite = window.innerHeight * 0.88;
      pendentes = pendentes.filter(function (p) {
        if (p.sec.getBoundingClientRect().top > limite) return true;
        gsap.to(p.partes, { y: 0, opacity: 1, duration: .8, ease: 'expo.out', stagger: .07, overwrite: true });
        return false;
      });
      if (!pendentes.length) window.removeEventListener('scroll', aoRolar);
    }
    var agendado = false;
    function aoRolar() {
      if (agendado) return;
      agendado = true;
      requestAnimationFrame(function () { agendado = false; revelar(); });
    }
    window.addEventListener('scroll', aoRolar, { passive: true });
    window.addEventListener('resize', aoRolar, { passive: true });
    revelar();
    // Imprimir/salvar em PDF e qualquer caso não previsto: tudo aparece
    function revelarTudo() {
      pendentes.forEach(function (p) { gsap.set(p.partes, { y: 0, opacity: 1 }); });
      pendentes = [];
    }
    window.addEventListener('beforeprint', revelarTudo);
    setTimeout(revelarTudo, 8000);

    // Cupom da vitrine sobe e endireita ao entrar
    gsap.from('.cupom', {
      y: 60, rotate: 3, duration: 1.1, ease: 'expo.out',
      scrollTrigger: { trigger: '.vitrine', start: 'top 70%', once: true }
    });

    // Palco do fluxo: leve aproximação enquanto a seção passa
    gsap.fromTo('.fluxo-tela', { scale: .96 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.fluxo', start: 'top bottom', end: 'top top', scrub: 1 }
    });

    // Palco fixo do topo: a cena ativa deriva devagar com a rolagem
    gsap.to('.palco-cenas', {
      yPercent: -4, ease: 'none',
      scrollTrigger: { trigger: '.palco-dividido', start: 'top top', end: 'bottom bottom', scrub: 1 }
    });
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
