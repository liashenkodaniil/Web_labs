

export class BlogModel {

  /**
   * @param {string} storageKey - Ключ для localStorage (дозволяє мати
   *   кілька незалежних екземплярів моделі на різних сторінках)
   */
  constructor(storageKey = 'urbanArchitectPosts') {
    this._storageKey    = storageKey;
    this._versionKey    = storageKey + '__version';
    this._currentVersion = 3; // Збільшуємо при кожному breaking-change у структурі
    this._listeners     = [];

    // Якщо версія застаріла — очищаємо і заповнюємо свіжими демо-даними
    const storedVersion = parseInt(localStorage.getItem(this._versionKey) || '0', 10);
    if (storedVersion < this._currentVersion || !this._read()) {
      this._write(this._defaultPosts());
      localStorage.setItem(this._versionKey, String(this._currentVersion));
    }
  }

  // ─── Публічний API ────────────────────────────────────────────────────────

  /** Повертає масив усіх постів (копію, щоб уникнути мутацій зовні) */
  getAllPosts() {
    return structuredClone(this._read());
  }

  /**
   * Повертає один пост за його id
   * @param {string} id
   * @returns {object|null}
   */
  getPostById(id) {
    const post = this._read().find(p => p.id === id);
    return post ? structuredClone(post) : null;
  }

  /**
   * Додає новий пост
   * @param {object} data - { title, content, tag, date, imageUrl }
   * @returns {object} Створений пост
   */
  addPost({ title, content, tag = '#Інше', date = '', imageUrl = '' }) {
    if (!title?.trim() || !content?.trim()) {
      throw new Error('Назва та текст посту є обов\'язковими полями.');
    }

    const posts   = this._read();
    const newPost = {
      id        : this._uid(),
      title     : title.trim(),
      content   : content.trim(),
      tag,
      date      : date || this._formatDate(new Date()),
      imageUrl,
      comments  : [],
      createdAt : Date.now(),
    };

    posts.push(newPost);
    this._write(posts);
    this._notify('postAdded', newPost);
    return structuredClone(newPost);
  }

  /**
   * Вилучає пост за id
   * @param {string} id
   * @returns {boolean} true — якщо пост знайдено і видалено
   */
  deletePost(id) {
    const posts   = this._read();
    const idx     = posts.findIndex(p => p.id === id);
    if (idx === -1) return false;

    const [removed] = posts.splice(idx, 1);
    this._write(posts);
    this._notify('postDeleted', removed);
    return true;
  }

  /**
   * Додає коментар до посту
   * @param {string} postId
   * @param {object} data - { author, text }
   * @returns {object} Створений коментар
   */
  addComment(postId, { author, text }) {
    if (!text?.trim()) {
      throw new Error('Текст коментаря не може бути порожнім.');
    }

    const posts   = this._read();
    const post    = posts.find(p => p.id === postId);
    if (!post) throw new Error(`Пост з id="${postId}" не знайдено.`);

    const comment = {
      id        : this._uid(),
      author    : author?.trim() || 'Анонім',
      text      : text.trim(),
      createdAt : Date.now(),
    };

    post.comments.push(comment);
    this._write(posts);
    this._notify('commentAdded', { postId, comment });
    return structuredClone(comment);
  }

  /**
   * Вилучає коментар з посту
   * @param {string} postId
   * @param {string} commentId
   * @returns {boolean}
   */
  deleteComment(postId, commentId) {
    const posts  = this._read();
    const post   = posts.find(p => p.id === postId);
    if (!post) return false;

    const idx = post.comments.findIndex(c => c.id === commentId);
    if (idx === -1) return false;

    const [removed] = post.comments.splice(idx, 1);
    this._write(posts);
    this._notify('commentDeleted', { postId, comment: removed });
    return true;
  }

  /**
   * Повертає відфільтровані пости за хештегом
   * @param {string|null} tag - null або '' — повертає всі
   */
  getPostsByTag(tag) {
    const posts = this._read();
    if (!tag) return structuredClone(posts);
    const norm = tag.trim().toLowerCase();
    return structuredClone(posts.filter(p => (p.tag || '').trim().toLowerCase() === norm));
  }

  /**
   * Текстовий пошук по заголовку та тексту постів
   * @param {string} query
   */
  searchPosts(query) {
    const q     = query.toLowerCase().trim();
    const posts = this._read();
    if (!q) return structuredClone(posts);
    return structuredClone(
      posts.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q)
      )
    );
  }

  // ─── Система подій ────────────────────────────────────────────────────────

  /**
   * Підписатись на зміни моделі
   * @param {function(eventName: string, payload: any): void} fn
   */
  subscribe(fn) {
    this._listeners.push(fn);
  }

  /** Відписатись */
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

  /** Демонстраційні дані, що відповідають картками з index.html */
  _defaultPosts() {
    return [
      {
        id      : 'demo-1',
        title   : 'Вільна душа',
        content : 'Хмарочос як метафора свободи — коли метал і скло тягнуться вгору, ніби прагнуть вирватись із тісних міських вулиць. Це дослідження вертикальної архітектури сучасного мегаполісу.',
        tag     : '#Модернізм',
        date    : 'Липень 2022',
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=400&auto=format&fit=crop',
        comments: [
          { id: 'c-1', author: 'Марія', text: 'Неймовірне фото! Де саме це знято?', createdAt: 1657000000000 },
        ],
        createdAt: 1657000000000,
      },
      {
        id      : 'demo-2',
        title   : 'Бетонні вежі',
        content : 'Бруталізм у своїй найчистішій формі — грубий бетон без прикрас, що розповідає про епоху, коли архітектура була маніфестом. Ці вежі пам\'ятають інший час.',
        tag     : '#Промисловість',
        date    : 'Червень 2022',
        imageUrl: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=400&auto=format&fit=crop',
        comments: [],
        createdAt: 1654000000000,
      },
      {
        id      : 'demo-3',
        title   : 'Світло крізь скло',
        content : 'Коли захід сонця перетворює фасад будівлі на гігантський вітраж — місто стає собором під відкритим небом. Спостереження за тим, як архітектура взаємодіє зі світлом протягом дня.',
        tag     : '#Модернізм',
        date    : 'Травень 2022',
        imageUrl: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?q=80&w=400&auto=format&fit=crop',
        comments: [
          { id: 'c-2', author: 'Олег', text: 'Золота година робить дива з будь-яким фасадом.', createdAt: 1651000000000 },
          { id: 'c-3', author: 'Аноним', text: 'Це в якому місті?', createdAt: 1651100000000 },
        ],
        createdAt: 1651000000000,
      },
      {
        id      : 'demo-4',
        title   : 'Нічне світло',
        content : 'Місто після опівночі — зовсім інший організм. Неон, порожні бульвари та довгі тіні від вуличних ліхтарів перетворюють знайомі місця на сцени нуарного кіно.',
        tag     : '#НічнеМісто',
        date    : 'Квітень 2022',
        imageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=400&auto=format&fit=crop',
        comments: [],
        createdAt: 1648000000000,
      },
      {
        id      : 'demo-5',
        title   : 'Геометрія дахів',
        content : 'Погляд згори відкриває приховану мову міста — трикутники ліхтарів, прямокутники вентиляційних шахт, кола водонапірних башт. Дах — це ще одна міська площа, про яку мало хто знає.',
        tag     : '#Парки',
        date    : 'Березень 2022',
        imageUrl: 'https://images.unsplash.com/photo-1505533542167-8c89838bb19e?q=80&w=400&auto=format&fit=crop',
        comments: [],
        createdAt: 1646000000000,
      },
      {
        id      : 'demo-6',
        title   : 'Геометрія міста',
        content : 'Будь-яке місто — це великий геометричний пазл. Квартали, вулиці, перехрестя складаються в абстракцію, яку найкраще видно з висоти пташиного польоту.',
        tag     : '#СтрітАрт',
        date    : 'Лютий 2022',
        imageUrl: 'https://images.unsplash.com/photo-1496568816309-51d7c20e3b21?q=80&w=400&auto=format&fit=crop',
        comments: [],
        createdAt: 1643000000000,
      },
      {
        id      : 'demo-7',
        title   : 'Приховані дахи',
        content : 'За кожним горищним вікном — своя історія. Старі київські дахи зберігають пам\'ять про поколінь мешканців і є живою архівом міської культури.',
        tag     : '#Парки',
        date    : 'Січень 2022',
        imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=400&auto=format&fit=crop',
        comments: [],
        createdAt: 1641000000000,
      },
      {
        id      : 'demo-8',
        title   : 'Тіні та бетон',
        content : 'Тінь — безкоштовна художня інсталяція, яку природа щодня малює на бетонних стінах міста. Дослідження того, як сонячне світло і архітектурні форми створюють тимчасові скульптури.',
        tag     : '#Промисловість',
        date    : 'Грудень 2021',
        imageUrl: 'https://i0.wp.com/svitfantasy.com.ua/wp-content/uploads/2018/07/98537307.jpg?resize=585%2C325&ssl=1',
        comments: [],
        createdAt: 1638000000000,
      },
    ];
  }
}
