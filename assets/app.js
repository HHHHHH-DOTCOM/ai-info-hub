/* ==================== AI 情报站 · 前端交互 ==================== */
(function () {
  'use strict';

  // ---------- 主题 ----------
  var root = document.documentElement;
  var saved = localStorage.getItem('aih-theme');
  if (saved) root.setAttribute('data-theme', saved);
  else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    root.setAttribute('data-theme', 'light');
  }
  var tbtn = document.getElementById('themebtn');
  if (tbtn) {
    var sync = function () {
      tbtn.textContent = root.getAttribute('data-theme') === 'light' ? '☾' : '☀';
      tbtn.title = root.getAttribute('data-theme') === 'light' ? '切换深色' : '切换浅色';
    };
    sync();
    tbtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      localStorage.setItem('aih-theme', next);
      sync();
    });
  }

  // ---------- 相对时间 ----------
  function rel(iso) {
    if (!iso) return '';
    var t = new Date(iso).getTime();
    if (isNaN(t)) return '';
    var d = (Date.now() - t) / 1000;
    if (d < 0) return '即将';
    if (d < 3600) return Math.max(1, Math.floor(d / 60)) + ' 分钟前';
    if (d < 86400) return Math.floor(d / 3600) + ' 小时前';
    if (d < 86400 * 30) return Math.floor(d / 86400) + ' 天前';
    return new Date(t).toLocaleDateString('zh-CN');
  }
  document.querySelectorAll('[data-rel]').forEach(function (el) {
    el.textContent = rel(el.getAttribute('data-rel'));
  });

  // ---------- 倒计时 ----------
  function countdown(iso) {
    var t = new Date(iso).getTime();
    if (isNaN(t)) return '';
    var d = t - Date.now();
    if (d < 0) return '已截止';
    var days = Math.floor(d / 86400000);
    var hrs = Math.floor((d % 86400000) / 3600000);
    if (days > 0) return '还剩 ' + days + ' 天';
    if (hrs > 0) return '还剩 ' + hrs + ' 小时';
    return '即将截止';
  }
  document.querySelectorAll('[data-dl]').forEach(function (el) {
    el.textContent = countdown(el.getAttribute('data-dl'));
  });

  // ---------- 日期分组 ----------
  document.querySelectorAll('[data-day]').forEach(function (el) {
    var iso = el.getAttribute('data-day');
    if (!iso) return;
    var d = new Date(iso);
    var today = new Date();
    var yest = new Date(Date.now() - 86400000);
    var same = function (a, b) { return a.toDateString() === b.toDateString(); };
    el.textContent = same(d, today) ? '今天' : same(d, yest) ? '昨天' : d.getMonth() + 1 + ' 月 ' + d.getDate() + ' 日';
  });

  // ---------- 分类 tab 过滤（频道页） ----------
  document.querySelectorAll('.tabs').forEach(function (bar) {
    bar.addEventListener('click', function (e) {
      var tab = e.target.closest('.tab');
      if (!tab) return;
      bar.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('on'); });
      tab.classList.add('on');
      var key = tab.getAttribute('data-filter');
      document.querySelectorAll('[data-tags]').forEach(function (el) {
        var tags = (el.getAttribute('data-tags') || '').split(',');
        el.style.display = key === 'all' || tags.indexOf(key) >= 0 ? '' : 'none';
      });
    });
  });

  // ---------- 全站搜索 ----------
  var input = document.getElementById('q');
  var results = document.getElementById('qresults');
  var feed = document.getElementById('qfeed');
  var loadmore = document.getElementById('loadmore');
  var counter = document.getElementById('qcount');
  var INDEX = window.__INDEX__ || [];
  var shown = 0;
  var PAGE = 40;
  var current = [];

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function hl(text, q) {
    var t = esc(text);
    if (!q) return t;
    try {
      return t.replace(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<mark>$1</mark>');
    } catch (e) { return t; }
  }

  function score(item, terms) {
    var title = (item.t || '').toLowerCase();
    var summary = (item.s || '').toLowerCase();
    var s = 0;
    for (var i = 0; i < terms.length; i++) {
      var q = terms[i];
      if (title.indexOf(q) >= 0) s += 10;
      if (summary.indexOf(q) >= 0) s += 3;
      if ((item.c || '').toLowerCase().indexOf(q) >= 0) s += 2;
      if ((item.g || '').toLowerCase().indexOf(q) >= 0) s += 1;
    }
    return s;
  }

  function render(reset) {
    if (!feed) return;
    if (reset) { feed.innerHTML = ''; shown = 0; }
    var slice = current.slice(shown, shown + PAGE);
    var q = (input && input.value || '').trim();
    var html = slice.map(function (it) {
      return (
        '<a class="item" href="' + esc(it.u || '#') + '" target="_blank" rel="noopener" style="--c:' + esc(it.k || '#6ea8fe') + '">' +
        '<div class="tit"><i class="pdot"></i><span>' + hl(it.t, q) + '</span></div>' +
        (it.s ? '<div class="sm">' + hl(it.s, q) + '</div>' : '') +
        '<div class="mt">' +
        (it.k ? '<span class="cbadge" style="--c:' + esc(it.k) + '">' + esc(it.n || '') + '</span>' : '') +
        (it.o ? '<span class="src">' + esc(it.o) + '</span>' : '') +
        (it.p ? '<span>' + esc(it.p) + '</span>' : '') +
        '</div></a>'
      );
    }).join('');
    feed.insertAdjacentHTML('beforeend', html);
    shown += slice.length;
    if (loadmore) loadmore.style.display = shown >= current.length ? 'none' : 'block';
    if (counter) counter.textContent = current.length + ' 条结果';
  }

  function run() {
    if (!feed) return;
    var q = (input.value || '').trim().toLowerCase();
    if (!q) {
      current = INDEX.slice(0, 80);
      render(true);
      if (counter) counter.textContent = '输入关键词，检索全部 ' + INDEX.length + ' 条情报';
      return;
    }
    var terms = q.split(/\s+/).filter(Boolean);
    var scored = [];
    for (var i = 0; i < INDEX.length; i++) {
      var sc = score(INDEX[i], terms);
      if (sc > 0) scored.push([sc, INDEX[i]]);
    }
    scored.sort(function (a, b) { return b[0] - a[0]; });
    current = scored.map(function (x) { return x[1]; });
    render(true);
  }

  if (input) {
    var timer;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(run, 130);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { input.value = ''; run(); input.blur(); }
    });
    document.addEventListener('keydown', function (e) {
      if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && document.activeElement !== input) {
        e.preventDefault();
        input.focus();
        input.select();
      }
    });
    run();
  }
  if (loadmore) loadmore.addEventListener('click', function () { render(false); });

  // ---------- 频道导航高亮 ----------
  var path = location.pathname.replace(/index\.html$/, '');
  document.querySelectorAll('.topnav a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (!href) return;
    var h = href.replace(/index\.html$/, '');
    if (h === './' || h === '/') {
      if (path === '/' || path.endsWith('/ai-info-hub/') || path.endsWith('/index.html')) a.classList.add('act');
    } else if (path.indexOf(h.replace(/^\.\//, '')) >= 0) {
      a.classList.add('act');
    }
  });
})();
