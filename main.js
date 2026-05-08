// BoatOS v5.0 - Core System with VFS
(function() {
  'use strict';

  const S = {
    wins: [],
    z: 100,
    active: null,
    container: document.getElementById('window-container'),
    taskbar: document.getElementById('taskbar-apps'),
    menu: document.getElementById('start-menu'),
    startBtn: document.getElementById('start-btn'),
    glass: document.getElementById('glass-overlay'),
    cwd: '/home/user' // Current Working Directory for Terminal
  };

  // --- UI Initialization ---
  function init() {
    S.startBtn.addEventListener('click', e => {
      e.stopPropagation();
      S.menu.classList.toggle('show');
    });

    document.addEventListener('click', e => {
      if (!S.menu.contains(e.target) && e.target !== S.startBtn) {
        S.menu.classList.remove('show');
      }
    });

    document.querySelectorAll('.menu-item[data-app]').forEach(el => {
      el.addEventListener('click', () => {
        openApp(el.dataset.app);
        S.menu.classList.remove('show');
      });
    });

    document.getElementById('menu-restart').addEventListener('click', () => {
      if (confirm('Restart BoatOS?')) location.reload();
    });

    document.querySelectorAll('.icon').forEach(el => {
      el.addEventListener('click', () => openApp(el.dataset.app));
    });

    updateClock();
    setInterval(updateClock, 1000);
    setTimeout(() => openApp('about'), 300);
    console.log('✅ BoatOS v5.0 Initialized with VFS');
  }

  function updateClock() {
    document.getElementById('clock').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // --- Window Manager ---
  function openApp(name) {
    const existing = S.wins.find(w => w.dataset.app === name);
    if (existing) {
      if (existing.style.display === 'none') existing.style.display = 'flex';
      focusWin(existing);
      return;
    }

    const apps = {
      browser: { title: '🌐 Browser', html: getBrowserHTML(), w: '820px', h: '520px' },
      terminal: { title: '💻 Terminal', html: getTerminalHTML(), w: '600px', h: '380px' },
      files: { title: '📁 Files', html: getFilesHTML(), w: '500px', h: '400px' },
      calc: { title: '🧮 Calculator', html: getCalcHTML(), w: '260px', h: '360px' },
      about: { title: '⚓ About', html: getAboutHTML(), w: '340px', h: '260px' }
    };

    const app = apps[name];
    if (!app) return;

    const win = document.createElement('div');
    win.className = 'window';
    win.dataset.app = name;
    win.style.left = `${90 + (S.wins.length * 20)}px`;
    win.style.top = `${60 + (S.wins.length * 20)}px`;
    win.style.width = app.w;
    win.style.height = app.h;
    win.style.zIndex = ++S.z;

    win.innerHTML = `
      <div class="win-header">
        <span class="win-title">${app.title}</span>
        <div class="win-ctrls">
          <button class="win-btn min" title="Minimize">−</button>
          <button class="win-btn max" title="Maximize">□</button>
          <button class="win-btn close" title="Close">×</button>
        </div>
      </div>
      <div class="win-content">${app.html}</div>
      <div class="resize-handle"></div>
    `;

    S.container.appendChild(win);
    S.wins.push(win);

    // Controls
    win.querySelector('.close').addEventListener('click', e => { e.stopPropagation(); closeWin(win); });
    win.querySelector('.min').addEventListener('click', e => { e.stopPropagation(); win.style.display = 'none'; updateTaskbar(win, false); });
    win.querySelector('.max').addEventListener('click', e => { e.stopPropagation(); toggleMax(win); });
    win.addEventListener('mousedown', () => focusWin(win));
    win.querySelector('.win-header').addEventListener('mousedown', e => {
      if (e.target.closest('.win-btn')) return;
      startDrag(win, e);
    });
    win.querySelector('.resize-handle').addEventListener('mousedown', e => {
      e.stopPropagation();
      startResize(win, e);
    });

    addTaskbarItem(win, app.title);
    focusWin(win);

    // App Init
    if (name === 'browser') initBrowser(win);
    if (name === 'terminal') initTerminal(win);
    if (name === 'files') initFiles(win);
    if (name === 'calc') initCalc(win);
  }

  function focusWin(win) {
    S.z++;
    win.style.zIndex = S.z;
    S.active = win;
    document.querySelectorAll('.tb-item').forEach(t => t.classList.remove('active'));
    const tb = document.querySelector(`.tb-item[data-id="${win.dataset.id}"]`);
    if (tb) tb.classList.add('active');
  }

  function closeWin(win) {
    win.remove();
    S.wins = S.wins.filter(w => w !== win);
    document.querySelector(`.tb-item[data-id="${win.dataset.id}"]`)?.remove();
  }

  function toggleMax(win) {
    if (win.dataset.max === 'true') {
      win.style.width = win.dataset.ow;
      win.style.height = win.dataset.oh;
      win.style.left = win.dataset.ol;
      win.style.top = win.dataset.ot;
      win.style.borderRadius = '8px';
      win.dataset.max = 'false';
    } else {
      win.dataset.ow = win.style.width;
      win.dataset.oh = win.style.height;
      win.dataset.ol = win.style.left;
      win.dataset.ot = win.style.top;
      win.style.width = 'calc(100% - 24px)';
      win.style.height = 'calc(100% - 70px)';
      win.style.left = '12px';
      win.style.top = '12px';
      win.style.borderRadius = '6px';
      win.dataset.max = 'true';
    }
  }

  function addTaskbarItem(win, title) {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    win.dataset.id = id;
    const item = document.createElement('div');
    item.className = 'tb-item active';
    item.dataset.id = id;
    item.textContent = title;
    item.addEventListener('click', () => {
      if (win.style.display === 'none') { win.style.display = 'flex'; focusWin(win); }
      else if (S.active === win) { win.style.display = 'none'; updateTaskbar(win, false); }
      else focusWin(win);
    });
    S.taskbar.appendChild(item);
  }

  function updateTaskbar(win, active) {
    const item = document.querySelector(`.tb-item[data-id="${win.dataset.id}"]`);
    if (item) item.classList.toggle('active', active);
  }

  // --- Drag & Resize ---
  function startDrag(win, e) {
    e.preventDefault();
    S.glass.style.display = 'block';
    const rect = win.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const move = ev => {
      win.style.left = `${ev.clientX - offsetX}px`;
      win.style.top = `${ev.clientY - offsetY}px`;
    };
    const up = () => {
      S.glass.style.display = 'none';
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }

  function startResize(win, e) {
    e.preventDefault();
    S.glass.style.display = 'block';
    const sx = e.clientX, sy = e.clientY;
    const sw = win.offsetWidth, sh = win.offsetHeight;

    const move = ev => {
      win.style.width = `${Math.max(260, sw + ev.clientX - sx)}px`;
      win.style.height = `${Math.max(180, sh + ev.clientY - sy)}px`;
    };
    const up = () => {
      S.glass.style.display = 'none';
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }

  // --- App HTML Generators ---
  function getBrowserHTML() {
    return `
      <div class="browser-toolbar">
        <button class="b-btn" id="b-back" disabled>←</button>
        <button class="b-btn" id="b-fwd" disabled>→</button>
        <button class="b-btn" id="b-reload">⟳</button>
        <input type="text" class="url-bar" id="b-url" placeholder="Search Bing or enter URL..." tabindex="0">
        <button class="b-btn" id="b-go">➜</button>
      </div>
      <div id="b-content" style="flex:1;display:flex;flex-direction:column">
        <div class="b-placeholder">
          <h3>🚢 BoatOS Browser</h3>
          <p>Bing-powered • Extension-resistant sandbox</p>
          <div class="quick-links">
            <div class="q-link" data-url="https://example.com">example.com</div>
            <div class="q-link" data-url="https://wikipedia.org">Wikipedia</div>
            <div class="q-link" data-url="https://bing.com">Bing</div>
          </div>
        </div>
      </div>
      <div class="status"><span id="b-stat">Ready</span><span id="b-sec">🔒 Sandbox Active</span></div>
    `;
  }

  function getTerminalHTML() {
    return `
      <div class="terminal">
        <div class="t-out" id="t-out">🚢 BoatOS Terminal v5.0\nType <span class="t-cmd">help</span>\n\n<span class="t-prompt">captain@boatos:${S.cwd}</span>$ </div>
        <div class="t-in-line"><span class="t-prompt">captain@boatos:${S.cwd}</span>$ <input type="text" class="t-input" id="t-in" tabindex="0"></div>
      </div>
    `;
  }

  function getFilesHTML() {
    return `
      <div class="file-manager">
        <div class="file-toolbar">
          <button class="b-btn" id="f-up">↑</button>
          <div class="file-path" id="f-path">/home/user</div>
          <button class="b-btn" id="f-refresh">⟳</button>
        </div>
        <div class="file-grid" id="f-grid"></div>
      </div>
    `;
  }

  function getCalcHTML() {
    return `
      <div class="calc-grid">
        <div class="calc-disp" id="c-disp">0</div>
        <button class="calc-btn" data-v="C">C</button><button class="calc-btn op" data-v="/">÷</button><button class="calc-btn op" data-v="*">×</button><button class="calc-btn op" data-v="-">−</button>
        <button class="calc-btn" data-v="7">7</button><button class="calc-btn" data-v="8">8</button><button class="calc-btn" data-v="9">9</button><button class="calc-btn op" data-v="+">+</button>
        <button class="calc-btn" data-v="4">4</button><button class="calc-btn" data-v="5">5</button><button class="calc-btn" data-v="6">6</button><button class="calc-btn eq" data-v="=">=</button>
        <button class="calc-btn" data-v="1">1</button><button class="calc-btn" data-v="2">2</button><button class="calc-btn" data-v="3">3</button><button class="calc-btn" data-v="0" style="grid-column:span 2">0</button>
      </div>
    `;
  }

  function getAboutHTML() {
    return `
      <div class="about-box">
        <h2>🚢 BoatOS v5.0</h2>
        <p>Inspired by AnuraOS Architecture</p>
        <p>✅ Persistent Virtual Filesystem</p>
        <p>✅ File Manager App</p>
        <p>✅ Bing Search Integration</p>
        <p>✅ Nautical Wallpaper & Glass UI</p>
        <div class="tag">Data saves to LocalStorage</div>
      </div>
    `;
  }

  // --- App Initializers ---
  function initBrowser(win) {
    const urlInput = win.querySelector('#b-url');
    const goBtn = win.querySelector('#b-go');
    const backBtn = win.querySelector('#b-back');
    const fwdBtn = win.querySelector('#b-fwd');
    const reloadBtn = win.querySelector('#b-reload');
    const content = win.querySelector('#b-content');
    const stat = win.querySelector('#b-stat');
    const sec = win.querySelector('#b-sec');

    let iframe = null;
    let history = [];
    let hIdx = -1;

    const navigate = (query) => {
      if (!query.trim()) return;
      let url = query.trim();
      if (!url.match(/^https?:\/\//i)) {
        if (url.includes('.') && !url.includes(' ')) {
          url = 'https://' + url;
        } else {
          url = `https://www.bing.com/search?q=${encodeURIComponent(url)}`;
        }
      }
      urlInput.value = url;
      stat.textContent = 'Loading...';
      sec.textContent = '🔐 Connecting';

      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.className = 'browser-frame';
        iframe.sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups';
        iframe.referrerPolicy = 'no-referrer-when-downgrade';
        content.innerHTML = '';
        content.appendChild(iframe);
      }

      if (hIdx < history.length - 1) history = history.slice(0, hIdx + 1);
      history.push(url);
      hIdx = history.length - 1;
      backBtn.disabled = hIdx <= 0;
      fwdBtn.disabled = hIdx >= history.length - 1;

      iframe.src = url;
    };

    goBtn.addEventListener('click', () => navigate(urlInput.value));
    urlInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') navigate(urlInput.value);
    });

    urlInput.addEventListener('mousedown', e => e.stopPropagation());
    urlInput.addEventListener('focus', () => urlInput.select());

    reloadBtn.addEventListener('click', () => { if (iframe) iframe.src = iframe.src; });
    backBtn.addEventListener('click', () => { if (hIdx > 0) navigate(history[--hIdx]); });
    fwdBtn.addEventListener('click', () => { if (hIdx < history.length - 1) navigate(history[++hIdx]); });

    win.querySelectorAll('.q-link').forEach(l => {
      l.addEventListener('click', () => navigate(l.dataset.url));
    });

    if (iframe) {
      iframe.addEventListener('load', () => {
        stat.textContent = 'Loaded';
        sec.textContent = '🌍 Active';
        try {
          const title = iframe.contentDocument?.title || 'Web Page';
          win.querySelector('.win-title').textContent = `🌐 ${title}`;
        } catch {
          sec.textContent = '🔒 Cross-Origin';
        }
      });
    }
  }

  function initTerminal(win) {
    const out = win.querySelector('#t-out');
    const inp = win.querySelector('#t-in');
    let hist = [], idx = -1;

    const updatePrompt = () => {
      const promptText = `captain@boatos:${S.cwd}$ `;
      win.querySelector('.t-prompt').textContent = promptText;
      // Update last line prompt if exists
      const lines = out.querySelectorAll('div');
      if(lines.length > 0) {
         const lastLine = lines[lines.length-1];
         if(lastLine.innerHTML.includes('captain@boatos')) {
             lastLine.innerHTML = `<span class="t-prompt">${promptText}</span>`;
         }
      }
    };

    const run = cmd => {
      if (!cmd.trim()) return;
      hist.push(cmd); idx = hist.length;
      out.innerHTML += `<div><span class="t-prompt">captain@boatos:${S.cwd}</span>$ <span class="t-cmd">${cmd}</span></div>`;
      
      const args = cmd.trim().split(' ');
      const c = args[0];
      const rest = args.slice(1).join(' ');

      if (c === 'help') {
        out.innerHTML += `<div>Available commands:\n  ls [path]     - List directory\n  cd [path]     - Change directory\n  cat [file]    - Read file\n  echo [txt] > [file] - Write to file\n  mkdir [dir]   - Create directory\n  clear         - Clear screen\n  whoami        - Show user\n  reboot        - Restart OS</div>`;
      } 
      else if (c === 'clear') {
        out.innerHTML = '';
      } 
      else if (c === 'ls') {
        const targetPath = args[1] ? (args[1].startsWith('/') ? args[1] : S.cwd + '/' + args[1]) : S.cwd;
        const items = VFS.ls(targetPath);
        if (items) {
          out.innerHTML += `<div>${items.map(i => i.type === 'dir' ? `📁 ${i.name}/` : `📄 ${i.name}`).join('\n')}</div>`;
        } else {
          out.innerHTML += `<div class="t-err">ls: cannot access '${targetPath}': No such file or directory</div>`;
        }
      }
      else if (c === 'cd') {
        if (!args[1]) { S.cwd = '/home/user'; }
        else if (args[1] === '..') {
          const parts = S.cwd.split('/').filter(p => p);
          parts.pop();
          S.cwd = '/' + parts.join('/') || '/';
        } else {
          const targetPath = args[1].startsWith('/') ? args[1] : S.cwd + '/' + args[1];
          const node = VFS.getNode(targetPath);
          if (node && node.type === 'dir') {
            S.cwd = targetPath;
          } else {
            out.innerHTML += `<div class="t-err">cd: ${args[1]}: No such directory</div>`;
          }
        }
        updatePrompt();
      }
      else if (c === 'cat') {
        if (!args[1]) { out.innerHTML += `<div class="t-err">cat: missing operand</div>`; }
        else {
          const targetPath = args[1].startsWith('/') ? args[1] : S.cwd + '/' + args[1];
          const content = VFS.cat(targetPath);
          if (content !== null) {
            out.innerHTML += `<div>${content}</div>`;
          } else {
            out.innerHTML += `<div class="t-err">cat: ${args[1]}: No such file</div>`;
          }
        }
      }
      else if (c === 'echo') {
        // Simple echo > file support
        if (rest.includes('>')) {
          const parts = rest.split('>');
          const text = parts[0].trim().replace(/^["']|["']$/g, ''); // Remove quotes
          const filePath = parts[1].trim();
          const fullPath = filePath.startsWith('/') ? filePath : S.cwd + '/' + filePath;
          if (VFS.write(fullPath, text)) {
            out.innerHTML += `<div>File written successfully</div>`;
          } else {
            out.innerHTML += `<div class="t-err">Error writing file</div>`;
          }
        } else {
          out.innerHTML += `<div>${rest}</div>`;
        }
      }
      else if (c === 'mkdir') {
        if (!args[1]) { out.innerHTML += `<div class="t-err">mkdir: missing operand</div>`; }
        else {
          const targetPath = args[1].startsWith('/') ? args[1] : S.cwd + '/' + args[1];
          if (VFS.mkdir(targetPath)) {
            out.innerHTML += `<div>Directory created</div>`;
          } else {
            out.innerHTML += `<div class="t-err">mkdir: cannot create directory '${args[1]}': File exists or invalid path</div>`;
          }
        }
      }
      else if (c === 'whoami') {
        out.innerHTML += `<div>captain</div>`;
      }
      else if (c === 'reboot') {
        setTimeout(() => location.reload(), 400);
      }
      else {
        out.innerHTML += `<div class="t-err">boatsh: ${c}: command not found</div>`;
      }
      
      out.innerHTML += `<div><span class="t-prompt">captain@boatos:${S.cwd}</span>$ </div>`;
      out.scrollTop = out.scrollHeight;
    };

    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') { run(inp.value); inp.value = ''; }
      else if (e.key === 'ArrowUp' && idx > 0) { idx--; inp.value = hist[idx] || ''; e.preventDefault(); }
      else if (e.key === 'ArrowDown' && idx < hist.length) { idx++; inp.value = hist[idx] || ''; e.preventDefault(); }
    });

    inp.addEventListener('mousedown', e => e.stopPropagation());
    win.addEventListener('click', () => inp.focus());
    inp.addEventListener('blur', () => setTimeout(() => inp.focus(), 50));
    inp.focus();
  }

  function initFiles(win) {
    const grid = win.querySelector('#f-grid');
    const pathDisplay = win.querySelector('#f-path');
    const upBtn = win.querySelector('#f-up');
    const refreshBtn = win.querySelector('#f-refresh');
    let currentPath = '/home/user';

    const render = (path) => {
      currentPath = path;
      pathDisplay.textContent = path;
      grid.innerHTML = '';
      
      const items = VFS.ls(path);
      if (!items) {
        grid.innerHTML = '<div style="padding:10px;color:var(--text-muted)">Empty or invalid directory</div>';
        return;
      }

      // Add Parent Dir link if not root
      if (path !== '/') {
        const parentEl = document.createElement('div');
        parentEl.className = 'f-item folder';
        parentEl.innerHTML = `<div class="f-icon">📁</div><div class="f-name">..</div>`;
        parentEl.onclick = () => {
          const parts = path.split('/').filter(p => p);
          parts.pop();
          render('/' + parts.join('/') || '/');
        };
        grid.appendChild(parentEl);
      }

      items.forEach(item => {
        const el = document.createElement('div');
        el.className = `f-item ${item.type}`;
        el.innerHTML = `<div class="f-icon">${item.type === 'dir' ? '📁' : '📄'}</div><div class="f-name">${item.name}</div>`;
        
        if (item.type === 'dir') {
          el.onclick = () => {
            const newPath = path === '/' ? `/${item.name}` : `${path}/${item.name}`;
            render(newPath);
          };
        } else {
          el.ondblclick = () => {
            const content = VFS.cat(path === '/' ? `/${item.name}` : `${path}/${item.name}`);
            alert(`📄 ${item.name}\n\n${content}`);
          };
        }
        grid.appendChild(el);
      });
    };

    upBtn.onclick = () => {
      if (currentPath !== '/') {
        const parts = currentPath.split('/').filter(p => p);
        parts.pop();
        render('/' + parts.join('/') || '/');
      }
    };
    
    refreshBtn.onclick = () => render(currentPath);

    render(currentPath);
  }

  function initCalc(win) {
    const disp = win.querySelector('#c-disp');
    let expr = '';
    const update = () => disp.textContent = expr || '0';

    win.querySelectorAll('.calc-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = btn.dataset.v;
        if (v === 'C') expr = '';
        else if (v === '=') {
          try { expr = String(Function('"use strict";return (' + expr.replace(/[^0-9+\-*/.()]/g, '') + ')')()); }
          catch { expr = 'Error'; setTimeout(update, 1200); }
        } else {
          if (['+', '-', '*', '/', '.'].includes(v) && (!expr || ['+', '-', '*', '/', '.'].includes(expr.slice(-1)))) {
            if (v !== '.') expr += v;
            return;
          }
          expr += v;
        }
        update();
      });
    });
  }

  // Boot
  document.addEventListener('DOMContentLoaded', init);
})();