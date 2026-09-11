/* 肥鱼插件铺 · 前端逻辑:读 data/plugins.json 渲染卡片,带上搜索、分类筛选、一键复制安装命令 */
(async function () {
  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ── 主题切换 / 移动导航 ── */
  document.querySelectorAll('.js-theme').forEach((btn) => {
    const sync = () => { btn.textContent = document.documentElement.dataset.theme === 'light' ? '☀️' : '🌙'; };
    sync();
    btn.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem('wm-theme', next); } catch (e) {}
      const m = document.querySelector('meta[name="theme-color"]');
      if (m) m.setAttribute('content', next === 'light' ? '#eef4fa' : '#081120');
      sync();
    });
  });
  const burger = $('#navBurger'), mobile = $('#navMobile');
  if (burger && mobile) burger.addEventListener('click', () => mobile.classList.toggle('open'));
  if (mobile) mobile.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => mobile.classList.remove('open')));

  const year = $('#year'); if (year) year.textContent = new Date().getFullYear();

  /* ── 数据 ── */
  let data = { site: {}, plugins: [] };
  try {
    const r = await fetch('data/plugins.json', { cache: 'no-cache' });
    data = await r.json();
  } catch (e) {
    $('#list').innerHTML = '<p class="loading">插件数据加载失败，刷新页面再试一次。</p>';
    return;
  }
  const plugins = (data.plugins || []).slice().sort((a, b) => String(b.updated).localeCompare(String(a.updated)));
  const n = plugins.length;
  const totalFeatures = plugins.reduce((s, p) => s + (p.features ? p.features.length : 0), 0);
  const heroMeta = $('#heroMeta');
  if (heroMeta) heroMeta.textContent = `${n} 个插件 · ${totalFeatures} 项功能 · 全部 MIT 开源`;
  const footCount = $('#footCount');
  if (footCount) footCount.textContent = `${n} 个插件`;

  /* ── 分类筛选 ── */
  const cats = ['全部', ...new Set(plugins.map((p) => p.category).filter(Boolean))];
  let activeCat = '全部';
  let keyword = '';
  const catsEl = $('#cats');
  const renderCats = () => {
    catsEl.innerHTML = cats.map((c) => `<button class="chip${c === activeCat ? ' chip-on' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
    catsEl.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => { activeCat = b.dataset.cat; renderCats(); render(); }));
  };

  /* ── 卡片渲染 ── */
  const card = (p) => {
    const idx = plugins.indexOf(p);
    const featured = idx === 0;
    return `
    <article class="card plugin-card${featured ? ' plugin-card-featured' : ''}" data-i="${idx}">
      <div class="plugin-head">
        <h3 class="plugin-title">${esc(p.title)} <span class="plugin-name">${esc(p.name)}</span></h3>
        <div class="plugin-badges">
          <span class="badge badge-v">v${esc(p.version)}</span>
          ${p.status === 'listed' ? `<span class="badge badge-ok">${esc(p.statusText || '已收录')}</span>` : `<span class="badge">${esc(p.statusText || '开发中')}</span>`}
          <span class="badge" data-dl="${esc(p.id)}">下载 …</span>
        </div>
      </div>
      <p class="plugin-tagline">${esc(p.tagline)}</p>
      <p class="plugin-summary">${esc(p.summary)}</p>
      <div class="plugin-tags">${(p.tags || []).map((t) => `<span class="chip chip-sm">${esc(t)}</span>`).join('')}</div>
      <div class="cmd-row">
        <code class="cmd" title="${esc(p.install[0])}">${esc(p.install[0])}</code>
        <button class="btn btn-ghost btn-sm js-copy" data-copy="${esc(p.install[0])}">复制</button>
      </div>
      <details class="plugin-more">
        <summary>功能细节 / 安装说明</summary>
        <ul class="plugin-features">${(p.features || []).map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
        ${p.note ? `<p class="plugin-note">💡 ${esc(p.note)}</p>` : ''}
        ${p.requires ? `<p class="plugin-note">运行要求：${esc(p.requires)}</p>` : ''}
      </details>
      <div class="plugin-links">
        ${p.website ? `<a class="btn btn-primary btn-sm" href="${esc(p.website)}" target="_blank" rel="noopener">官网 · 插件介绍页</a>` : ''}
        <a class="btn btn-primary btn-sm" href="${esc(p.release)}" target="_blank" rel="noopener"><img class="btn-ico" src="assets/img/icon_github.svg" alt=""> Release 下载</a>
        <a class="btn btn-ghost btn-sm" href="${esc(p.repo)}" target="_blank" rel="noopener">源码仓库</a>
        <a class="btn btn-ghost btn-sm" href="${esc(p.tarball)}" target="_blank" rel="noopener">预构建包 .tgz</a>
      </div>
    </article>`;
  };

  const render = () => {
    const kw = keyword.trim().toLowerCase();
    const hit = plugins.filter((p) => {
      if (activeCat !== '全部' && p.category !== activeCat) return false;
      if (!kw) return true;
      const hay = [p.name, p.title, p.tagline, p.summary, p.category, (p.tags || []).join(' '), (p.features || []).join(' ')].join(' ').toLowerCase();
      return hay.includes(kw);
    });
    $('#list').innerHTML = hit.length ? hit.map(card).join('') : '<p class="loading">没有匹配的插件，换个关键词试试。</p>';
    bindCopy();
    loadDownloads();
  };

  const bindCopy = () => {
    document.querySelectorAll('.js-copy').forEach((b) => b.addEventListener('click', async () => {
      const text = b.dataset.copy;
      const done = (ok) => { b.textContent = ok ? '已复制 ✓' : '复制失败'; setTimeout(() => { b.textContent = '复制'; }, 1600); };
      try {
        if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); done(true); }
        else {
          const ta = document.createElement('textarea');
          ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          done(document.execCommand('copy')); ta.remove();
        }
      } catch (e) { done(false); }
    }));
  };

  /* ── 下载量(GitHub Release,拉不到就安静地隐藏) ── */
  const loadDownloads = async () => {
    const stars = document.querySelectorAll('[data-dl]');
    for (const el of stars) {
      const p = plugins.find((x) => x.id === el.dataset.dl);
      if (!p || el.dataset.done) continue;
      el.dataset.done = '1';
      try {
        const m = /github\.com\/([^/]+)\/([^/]+)/.exec(p.repo);
        const r = await fetch(`https://api.github.com/repos/${m[1]}/${m[2]}/releases`, { headers: { accept: 'application/vnd.github+json' } });
        if (!r.ok) throw new Error(String(r.status));
        const rels = await r.json();
        const count = rels.reduce((s, x) => s + (x.assets || []).reduce((a, y) => a + (y.download_count || 0), 0), 0);
        el.textContent = `下载 ${count}`;
      } catch (e) { el.remove(); }
    }
  };

  $('#q')?.addEventListener('input', (e) => { keyword = e.target.value; render(); });
  renderCats();
  render();
})();
