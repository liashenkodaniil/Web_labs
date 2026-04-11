const API = 'http://localhost:3000/api';

export class BlogModel {

  constructor(storageKey = 'urbanArchitectPosts') {
    this._storageKey     = storageKey;
    this._versionKey     = storageKey + '__version';
    this._currentVersion = 3;
    this._listeners      = [];

    const storedVersion = parseInt(localStorage.getItem(this._versionKey) || '0', 10);
    if (storedVersion < this._currentVersion || !this._read()) {
      this._write(this._defaultPosts());
      localStorage.setItem(this._versionKey, String(this._currentVersion));
    }

    // Підвантажуємо пости з сервера при старті
    this._syncFromServer();
  }

  // ─── Синхронізація з сервером ─────────────────────────────────────────────

  async _syncFromServer() {
    try {
      const res   = await fetch(`${API}/posts`);
      if (!res.ok) return;
      const posts = await res.json();
      this._write(posts);
      this._notify('synced', posts);
    } catch {
      console.warn('Сервер недоступний, використовуємо localStorage');
    }
  }

  // ─── Публічний API ────────────────────────────────────────────────────────

  getAllPosts() {
    return structuredClone(this._read());
  }

  getPostById(id) {
    const post = this._read().find(p => p.id === id);
    return post ? structuredClone(post) : null;
  }

  addPost({ title, content, tag = '#Інше', date = '', imageUrl = '' }) {
    if (!title?.trim() || !content?.trim()) {
      throw new Error('Назва та текст посту є обов\'язковими полями.');
    }

    const newPost = {
      id       : this._uid(),
      title    : title.trim(),
      content  : content.trim(),
      tag,
      date     : date || this._formatDate(new Date()),
      imageUrl,
      comments : [],
      createdAt: Date.now(),
    };

    const posts = this._read();
    posts.push(newPost);
    this._write(posts);
    this._notify('postAdded', newPost);

    fetch(`${API}/posts`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify(newPost),
    }).catch(() => console.warn('Не вдалось зберегти пост на сервері'));

    return structuredClone(newPost);
  }

  deletePost(id) {
    const posts = this._read();
    const idx   = posts.findIndex(p => p.id === id);
    if (idx === -1) return false;

    const [removed] = posts.splice(idx, 1);
    this._write(posts);
    this._notify('postDeleted', removed);

    fetch(`${API}/posts/${id}`, { method: 'DELETE' })
      .catch(() => console.warn('Не вдалось видалити пост на сервері'));

    return true;
  }

  addComment(postId, { author, text }) {
    if (!text?.trim()) {
      throw new Error('Текст коментаря не може бути порожнім.');
    }

    const posts = this._read();
    const post  = posts.find(p => p.id === postId);
    if (!post) throw new Error(`Пост з id="${postId}" не знайдено.`);

    const comment = {
      id       : this._uid(),
      author   : author?.trim() || 'Анонім',
      text     : text.trim(),
      createdAt: Date.now(),
    };

    post.comments.push(comment);
    this._write(posts);
    this._notify('commentAdded', { postId, comment });

    fetch(`${API}/posts/${postId}/comments`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify(comment),
    }).catch(() => console.warn('Не вдалось зберегти коментар на сервері'));

    return structuredClone(comment);
  }

  deleteComment(postId, commentId) {
    const posts = this._read();
    const post  = posts.find(p => p.id === postId);
    if (!post) return false;

    const idx = post.comments.findIndex(c => c.id === commentId);
    if (idx === -1) return false;

    const [removed] = post.comments.splice(idx, 1);
    this._write(posts);
    this._notify('commentDeleted', { postId, comment: removed });

    fetch(`${API}/posts/${postId}/comments/${commentId}`, { method: 'DELETE' })
      .catch(() => console.warn('Не вдалось видалити коментар на сервері'));

    return true;
  }

  // ─── Система подій ────────────────────────────────────────────────────────

  subscribe(fn) {
    this._listeners.push(fn);
  }

  unsubscribe(fn) {
    this._listeners = this._listeners.filter(l => l !== fn);
  }

  // ─── Приватні утиліти ─────────────────────────────────────────────────────

  _read() {
    try {
      return JSON.parse(localStorage.getItem(this._storageKey)) || [];
    } catch {
      return [];
    }
  }

  _write(data) {
    localStorage.setItem(this._storageKey, JSON.stringify(data));
  }

  _notify(event, payload) {
    this._listeners.forEach(fn => fn(event, payload));
  }

  _uid() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  _formatDate(d) {
    const months = [
      'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
      'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень',
    ];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  _defaultPosts() {
    return [
      {
        id: 'demo-1', title: 'Вільна душа',
        content : 'Хмарочос як метафора свободи — коли метал і скло тягнуться вгору, ніби прагнуть вирватись із тісних міських вулиць.',
        tag: '#Модернізм', date: 'Липень 2022',
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=400&auto=format&fit=crop',
        comments: [{ id: 'c-1', author: 'Марія', text: 'Неймовірне фото! Де саме це знято?', createdAt: 1657000000000 }],
        createdAt: 1657000000000,
      },
      {
        id: 'demo-2', title: 'Бетонні вежі',
        content : 'Бруталізм у своїй найчистішій формі — грубий бетон без прикрас.',
        tag: '#Промисловість', date: 'Червень 2022',
        imageUrl: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=400&auto=format&fit=crop',
        comments: [], createdAt: 1654000000000,
      },
      {
        id: 'demo-3', title: 'Світло крізь скло',
        content : 'Коли захід сонця перетворює фасад будівлі на гігантський вітраж.',
        tag: '#Модернізм', date: 'Травень 2022',
        imageUrl: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?q=80&w=400&auto=format&fit=crop',
        comments: [
          { id: 'c-2', author: 'Олег', text: 'Золота година робить дива з будь-яким фасадом.', createdAt: 1651000000000 },
          { id: 'c-3', author: 'Аноним', text: 'Це в якому місті?', createdAt: 1651100000000 },
        ],
        createdAt: 1651000000000,
      },
      {
        id: 'demo-4', title: 'Нічне світло',
        content : 'Місто після опівночі — зовсім інший організм.',
        tag: '#НічнеМісто', date: 'Квітень 2022',
        imageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=400&auto=format&fit=crop',
        comments: [], createdAt: 1648000000000,
      },
      {
        id: 'demo-5', title: 'Геометрія дахів',
        content : 'Погляд згори відкриває приховану мову міста.',
        tag: '#Парки', date: 'Березень 2022',
        imageUrl: 'https://images.unsplash.com/photo-1505533542167-8c89838bb19e?q=80&w=400&auto=format&fit=crop',
        comments: [], createdAt: 1646000000000,
      },
      {
        id: 'demo-6', title: 'Геометрія міста',
        content : 'Будь-яке місто — це великий геометричний пазл.',
        tag: '#СтрітАрт', date: 'Лютий 2022',
        imageUrl: 'https://images.unsplash.com/photo-1496568816309-51d7c20e3b21?q=80&w=400&auto=format&fit=crop',
        comments: [], createdAt: 1643000000000,
      },
      {
        id: 'demo-7', title: 'Приховані дахи',
        content : 'За кожним горищним вікном — своя історія.',
        tag: '#Парки', date: 'Січень 2022',
        imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=400&auto=format&fit=crop',
        comments: [], createdAt: 1641000000000,
      },
      {
        id: 'demo-8', title: 'Тіні та бетон',
        content : 'Тінь — безкоштовна художня інсталяція, яку природа малює на бетонних стінах.',
        tag: '#Промисловість', date: 'Грудень 2021',
        imageUrl: 'https://i0.wp.com/svitfantasy.com.ua/wp-content/uploads/2018/07/98537307.jpg?resize=585%2C325&ssl=1',
        comments: [], createdAt: 1638000000000,
      },
    ];
  }
}
