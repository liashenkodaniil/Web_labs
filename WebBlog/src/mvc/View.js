
export class BlogView {

  // ─── Рендер списку постів (index.html — картки у сітці) ──────────────────

  /**
   * Перемальовує сітку карток постів.
   * Очікує, що у DOM вже є елемент з id="posts-grid" (інжектується
   * контролером або доданий до існуючого section в index.html).
   *
   * @param {object[]} posts
   * @param {function(postId: string): void} onOpenPost
   * @param {function(postId: string): void} onDeletePost
   */
  renderPostGrid(posts, onOpenPost, onDeletePost) {
    const grid = document.getElementById('posts-grid');
    if (!grid) return;

    if (posts.length === 0) {
      grid.innerHTML = this._emptyState('Постів не знайдено. Додайте першу локацію!');
      return;
    }

    grid.innerHTML = posts.map(post => this._postCard(post)).join('');

    // Прив'язуємо події після рендеру
    grid.querySelectorAll('[data-action="open-post"]').forEach(btn => {
      btn.addEventListener('click', () => onOpenPost(btn.dataset.id));
    });

    grid.querySelectorAll('[data-action="delete-post"]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (confirm(`Вилучити пост "${btn.dataset.title}"?`)) {
          onDeletePost(btn.dataset.id);
        }
      });
    });
  }

  // ─── Модальне вікно детального перегляду посту + коментарі ───────────────

  /**
   * Відкриває модальний оверлей з детальним переглядом посту.
   *
   * @param {object}   post
   * @param {function(postId, author, text): void} onAddComment
   * @param {function(postId, commentId): void}    onDeleteComment
   */
  openPostModal(post, onAddComment, onDeleteComment) {
    document.getElementById('ua-modal')?.remove();
    document.body.classList.remove('ua-modal-open');

    const modal = document.createElement('div');
    modal.id    = 'ua-modal';
    modal.innerHTML = this._modalTemplate(post);
    document.body.appendChild(modal);
    document.body.classList.add('ua-modal-open');

    const closeModal = () => {
      modal.remove();
      document.body.classList.remove('ua-modal-open');
    };

    // Закриття кнопкою
    modal.querySelector('#modal-close').addEventListener('click', closeModal);

    // Закриття кліком на backdrop (але НЕ на scroll-контейнер)
    modal.querySelector('#ua-modal-backdrop').addEventListener('click', closeModal);
    modal.querySelector('#ua-modal-scroll').addEventListener('click', e => {
      if (e.target === modal.querySelector('#ua-modal-scroll')) closeModal();
    });

    // Форма коментаря
    const form = modal.querySelector('#comment-form');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const author = form.querySelector('#comment-author').value;
      const text   = form.querySelector('#comment-text').value;
      try {
        onAddComment(post.id, author, text);
        form.reset();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    });

    this._bindCommentDelete(modal, post.id, onDeleteComment);

    // Анімація появи
    requestAnimationFrame(() => {
      const panel = modal.querySelector('#ua-modal-panel');
      if (panel) panel.classList.add('ua-modal-in');
    });
  }

  /**
   * Оновлює список коментарів та лічильник у вже відкритому модалі
   * БЕЗ закриття і повторного відкриття вікна.
   * @param {object[]} comments — актуальний масив коментарів з моделі
   * @param {string}   postId
   * @param {function} onDeleteComment
   */
  updateModalComments(comments, postId, onDeleteComment) {
    const modal = document.getElementById('ua-modal');
    if (!modal) return;

    // Оновлюємо лічильник
    const counter = modal.querySelector('#comments-counter');
    if (counter) counter.textContent = `Коментарі · ${comments.length}`;

    // Перемальовуємо список
    const list = modal.querySelector('#comments-list');
    if (!list) return;

    list.innerHTML = comments.length
      ? comments.map(c => this._commentItem(c)).join('')
      : `<p style="font-size:.75rem;color:#4b5563;font-style:italic;">Коментарів ще немає. Будьте першим!</p>`;

    this._bindCommentDelete(modal, postId, onDeleteComment);
  }

  _bindCommentDelete(modal, postId, onDeleteComment) {
    modal.querySelectorAll('[data-action="delete-comment"]').forEach(btn => {
      btn.onclick = () => {
        if (confirm('Вилучити цей коментар?')) {
          onDeleteComment(postId, btn.dataset.id);
        }
      };
    });
  }

  // ─── Панель форми нового посту (postsettings.html) ────────────────────────

  /**
   * Прив'язує обробник до існуючої форми на postsettings.html.
   * Форма вже є в HTML — ми лише перехоплюємо submit.
   *
   * @param {function(data: object): void} onSubmit
   */
  bindPostSettingsForm(onSubmit) {
    const form = document.querySelector('form[action]');
    if (!form) return;

    form.removeAttribute('action');

    // Зберігаємо base64 обраного зображення тут
    let _imageBase64 = '';

    // ── Конвертація File → base64 ──────────────────────────────────────────
    const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result); // data:image/...;base64,...
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // ── Drag & Drop зона ───────────────────────────────────────────────────
    const dropZone  = form.querySelector('.border-dashed');
    const fileInput = document.createElement('input');
    fileInput.type      = 'file';
    fileInput.accept    = 'image/*';
    fileInput.className = 'hidden';
    form.appendChild(fileInput);

    const applyFile = async (file) => {
      if (!file) return;
      try {
        _imageBase64 = await readFileAsBase64(file);
        // Показуємо прев'ю у зоні drop
        if (dropZone) {
          dropZone.innerHTML = `
            <img src="${_imageBase64}" alt="preview"
                 class="max-h-40 rounded-lg mx-auto object-contain mb-2">
            <p class="text-xs text-cyan-400 text-center">✓ ${file.name}</p>`;
        }
      } catch {
        this.showToast('Не вдалося прочитати файл.', 'error');
      }
    };

    dropZone?.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => applyFile(fileInput.files[0]));

    dropZone?.addEventListener('dragover', e => {
      e.preventDefault();
      dropZone.classList.add('!border-cyan-400');
    });
    dropZone?.addEventListener('dragleave', () => {
      dropZone.classList.remove('!border-cyan-400');
    });
    dropZone?.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.classList.remove('!border-cyan-400');
      applyFile(e.dataTransfer.files[0]);
    });

    // ── Submit ─────────────────────────────────────────────────────────────
    form.addEventListener('submit', e => {
      e.preventDefault();

      const title   = form.querySelector('input[placeholder*="Бетонне"]')?.value || '';
      const tag     = form.querySelector('select')?.value                         || '#Інше';
      const date    = form.querySelector('input[placeholder*="2026"]')?.value     || '';
      const content = form.querySelector('textarea')?.value                       || '';

      try {
        onSubmit({ title, content, tag, date, imageUrl: _imageBase64 });
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    });
  }

  // ─── Пошук (header input у index.html) ───────────────────────────────────

  /**
   * @param {function(query: string): void} onSearch
   */
  bindSearch(onSearch) {
    const input = document.querySelector('input[placeholder="Пошук..."]');
    if (!input) return;
    let timer;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => onSearch(input.value), 300);
    });
  }

  // ─── Тост-повідомлення ────────────────────────────────────────────────────

  /**
   * @param {string} message
   * @param {'success'|'error'|'info'} type
   */
  showToast(message, type = 'success') {
    const colors = {
      success : 'bg-cyan-400 text-black',
      error   : 'bg-red-500 text-white',
      info    : 'bg-gray-700 text-white',
    };

    const toast = document.createElement('div');
    toast.className = [
      'fixed bottom-6 right-6 z-[9999] px-6 py-3 rounded-xl',
      'text-sm font-bold uppercase tracking-widest shadow-2xl',
      'translate-y-4 opacity-0 transition-all duration-300',
      colors[type] || colors.info,
    ].join(' ');
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('translate-y-4', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ─── Приватні шаблони HTML ────────────────────────────────────────────────

  _postCard(post) {
    const img = post.imageUrl
      ? `<img src="${this._esc(post.imageUrl)}" alt="${this._esc(post.title)}" class="w-full h-full object-cover">`
      : `<div class="w-full h-full bg-gray-700 flex items-center justify-center text-gray-500 text-xs uppercase tracking-widest">Без фото</div>`;

    const commentCount = post.comments?.length ?? 0;

    return `
      <div class="bg-[#2a2d30] rounded-xl overflow-hidden hover:scale-105 transition duration-300 group relative"
           data-post-id="${this._esc(post.id)}">
        <div class="h-40 bg-gray-600">${img}</div>
        <div class="p-4">
          <div class="flex items-center justify-between mb-1">
            <span class="text-[9px] uppercase tracking-widest text-cyan-400 font-bold">${this._esc(post.tag)}</span>
            <span class="text-[9px] text-gray-500">${commentCount} коментар${this._commentSuffix(commentCount)}</span>
          </div>
          <h3 class="font-bold text-lg mb-1 leading-tight">${this._esc(post.title)}</h3>
          <p class="text-xs text-gray-400 mb-3">${this._esc(post.date)}</p>
          <p class="text-xs text-gray-500 line-clamp-2">${this._esc(post.content)}</p>
        </div>
        <!-- Кнопки дій — з'являються при наведенні -->
        <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            data-action="open-post"
            data-id="${this._esc(post.id)}"
            title="Відкрити пост"
            class="bg-black/70 hover:bg-cyan-400 hover:text-black text-white p-1.5 rounded-lg transition text-xs font-bold">
            ↗
          </button>
          <button
            data-action="delete-post"
            data-id="${this._esc(post.id)}"
            data-title="${this._esc(post.title)}"
            title="Вилучити пост"
            class="bg-black/70 hover:bg-red-500 text-white p-1.5 rounded-lg transition text-xs">
            ✕
          </button>
        </div>
      </div>`;
  }

  _modalTemplate(post) {
    const commentsHTML = post.comments.length
      ? post.comments.map(c => this._commentItem(c)).join('')
      : `<p style="font-size:.75rem;color:#4b5563;font-style:italic;">Коментарів ще немає. Будьте першим!</p>`;

    const img = post.imageUrl
      ? `<img src="${this._esc(post.imageUrl)}" alt="${this._esc(post.title)}"
              style="width:100%;height:16rem;object-fit:cover;border-radius:.75rem;display:block;margin-bottom:1.5rem;">`
      : '';

    return `
      <style>
        body.ua-modal-open { overflow: hidden; }
        #ua-modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(4px);
          z-index: 1000;
        }
        #ua-modal-scroll {
          position: fixed; inset: 0;
          z-index: 1001;
          overflow-y: auto;
          padding: 2rem 1rem 3rem;
          box-sizing: border-box;
        }
        #ua-modal-panel {
          background: #1a1c1e;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 1rem;
          width: 100%;
          max-width: 42rem;
          margin: 0 auto;
          overflow: hidden;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity .3s ease, transform .3s ease;
        }
        #ua-modal-panel.ua-modal-in {
          opacity: 1;
          transform: translateY(0);
        }
      </style>

      <!-- Backdrop -->
      <div id="ua-modal-backdrop"></div>

      <!-- Scroll-контейнер -->
      <div id="ua-modal-scroll">
        <div id="ua-modal-panel">

          <!-- Header: тег + закрити (НЕ sticky, просто зверху) -->
          <div style="background:#1a1c1e;border-bottom:1px solid rgba(255,255,255,0.05);
                      padding:1rem 1.5rem;display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:9px;text-transform:uppercase;letter-spacing:.4em;
                         color:#22d3ee;font-weight:700;">
              ${this._esc(post.tag)}
            </span>
            <button id="modal-close"
                    style="color:#6b7280;font-size:1.1rem;line-height:1;background:none;
                           border:none;cursor:pointer;padding:.25rem .5rem;border-radius:.5rem;"
                    onmouseover="this.style.color='#fff'"
                    onmouseout="this.style.color='#6b7280'">✕</button>
          </div>

          <!-- Зображення (якщо є) — одразу після хедера, без відступів збоку -->
          ${post.imageUrl ? `<div style="width:100%;overflow:hidden;">${img}</div>` : ''}

          <!-- Текстовий вміст -->
          <div style="padding:1.5rem 2rem 2rem;">
            ${post.imageUrl ? '' : ''}
            <h2 style="font-size:1.875rem;font-weight:900;text-transform:uppercase;
                       letter-spacing:-.05em;margin-bottom:.5rem;color:#fff;margin-top:0;">
              ${this._esc(post.title)}
            </h2>
            <p style="font-size:.75rem;color:#6b7280;margin-bottom:1.5rem;font-family:monospace;">
              ${this._esc(post.date)}
            </p>
            <p style="color:#d1d5db;line-height:1.75;font-size:.875rem;
                      margin-bottom:2rem;white-space:pre-line;">
              ${this._esc(post.content)}
            </p>

            <!-- Коментарі -->
            <div style="border-top:1px solid rgba(255,255,255,0.05);padding-top:1.5rem;">
              <h3 id="comments-counter"
                  style="font-size:10px;text-transform:uppercase;letter-spacing:.4em;
                         color:#6b7280;margin-bottom:1rem;margin-top:0;">
                Коментарі · ${post.comments.length}
              </h3>
              <div id="comments-list"
                   style="display:flex;flex-direction:column;gap:.75rem;margin-bottom:1.5rem;">
                ${commentsHTML}
              </div>

              <!-- Форма коментаря -->
              <form id="comment-form"
                    style="background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);
                           border-radius:.75rem;padding:1.25rem;display:flex;
                           flex-direction:column;gap:.75rem;">
                <h4 style="font-size:9px;text-transform:uppercase;letter-spacing:.1em;
                           color:#22d3ee;font-weight:700;margin:0;">
                  Залишити коментар
                </h4>
                <input id="comment-author" type="text"
                       placeholder="Ваше ім'я (необов'язково)"
                       style="width:100%;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.1);
                              border-radius:.5rem;padding:.625rem 1rem;font-size:.875rem;color:#fff;
                              outline:none;box-sizing:border-box;font-family:inherit;"
                       onfocus="this.style.borderColor='#22d3ee'"
                       onblur="this.style.borderColor='rgba(255,255,255,.1)'">
                <textarea id="comment-text" rows="3" placeholder="Ваш коментар..." required
                          style="width:100%;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.1);
                                 border-radius:.5rem;padding:.625rem 1rem;font-size:.875rem;color:#fff;
                                 outline:none;resize:none;box-sizing:border-box;font-family:inherit;"
                          onfocus="this.style.borderColor='#22d3ee'"
                          onblur="this.style.borderColor='rgba(255,255,255,.1)'"></textarea>
                <button type="submit"
                        style="width:100%;background:#22d3ee;color:#000;font-weight:900;padding:.75rem;
                               border-radius:.5rem;text-transform:uppercase;letter-spacing:.2em;
                               font-size:.75rem;border:none;cursor:pointer;"
                        onmouseover="this.style.background='#67e8f9'"
                        onmouseout="this.style.background='#22d3ee'">
                  Додати коментар
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>`;
  }

  _commentItem(c) {
    const date = new Date(c.createdAt).toLocaleDateString('uk-UA', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
    return `
      <div class="bg-white/[.03] border border-white/5 rounded-xl px-4 py-3 flex items-start gap-3 group">
        <div class="w-8 h-8 rounded-full bg-cyan-400/20 text-cyan-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
          ${this._esc(c.author.charAt(0).toUpperCase())}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-bold text-gray-300">${this._esc(c.author)}</span>
            <span class="text-[9px] text-gray-600 font-mono">${date}</span>
          </div>
          <p class="text-xs text-gray-400 leading-relaxed">${this._esc(c.text)}</p>
        </div>
        <button data-action="delete-comment"
                data-id="${this._esc(c.id)}"
                title="Вилучити коментар"
                class="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition text-xs flex-shrink-0">
          ✕
        </button>
      </div>`;
  }

  _emptyState(msg) {
    return `
      <div class="col-span-full text-center py-20">
        <p class="text-gray-600 text-sm uppercase tracking-widest">${msg}</p>
      </div>`;
  }

  _commentSuffix(n) {
    if (n % 10 === 1 && n % 100 !== 11) return '';
    if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'і';
    return 'ів';
  }

  /** Екранує HTML-символи для безпечного виводу */
  _esc(str = '') {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
