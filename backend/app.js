const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors    = require('cors');
const path    = require('path');
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');

const JWT_SECRET = 'urban-architect-secret-key-2026';

const app  = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const db = new sqlite3.Database(path.join(__dirname, 'blog.db'), err => {
  if (err) {
    console.error('❌ Помилка підключення до бази даних:', err.message);
  } else {
    console.log('✅ Підключено до SQLite бази даних');
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id        TEXT PRIMARY KEY,
      title     TEXT NOT NULL,
      content   TEXT NOT NULL,
      tag       TEXT DEFAULT '#Інше',
      date      TEXT,
      imageUrl  TEXT DEFAULT '',
      createdAt INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id        TEXT PRIMARY KEY,
      postId    TEXT NOT NULL,
      author    TEXT DEFAULT 'Анонім',
      text      TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id        TEXT PRIMARY KEY,
      firstName TEXT NOT NULL,
      lastName  TEXT NOT NULL,
      email     TEXT UNIQUE NOT NULL,
      password  TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    )
  `);

  db.get('SELECT COUNT(*) as count FROM posts', (err, row) => {
    if (!row || row.count > 0) return;

    const demoPosts = [
      {
        id: 'demo-1', title: 'Вільна душа',
        content: 'Хмарочос як метафора свободи — коли метал і скло тягнуться вгору, ніби прагнуть вирватись із тісних міських вулиць.',
        tag: '#Модернізм', date: 'Липень 2022',
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=400&auto=format&fit=crop',
        createdAt: 1657000000000
      },
      {
        id: 'demo-2', title: 'Бетонні вежі',
        content: 'Бруталізм у своїй найчистішій формі — грубий бетон без прикрас, що розповідає про епоху, коли архітектура була маніфестом.',
        tag: '#Промисловість', date: 'Червень 2022',
        imageUrl: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=400&auto=format&fit=crop',
        createdAt: 1654000000000
      },
      {
        id: 'demo-3', title: 'Світло крізь скло',
        content: 'Коли захід сонця перетворює фасад будівлі на гігантський вітраж — місто стає собором під відкритим небом.',
        tag: '#Модернізм', date: 'Травень 2022',
        imageUrl: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?q=80&w=400&auto=format&fit=crop',
        createdAt: 1651000000000
      },
      {
        id: 'demo-4', title: 'Нічне світло',
        content: 'Місто після опівночі — зовсім інший організм. Неон, порожні бульвари та довгі тіні від вуличних ліхтарів.',
        tag: '#НічнеМісто', date: 'Квітень 2022',
        imageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=400&auto=format&fit=crop',
        createdAt: 1648000000000
      },
      {
        id: 'demo-5', title: 'Геометрія дахів',
        content: 'Погляд згори відкриває приховану мову міста — трикутники ліхтарів, прямокутники вентиляційних шахт.',
        tag: '#Парки', date: 'Березень 2022',
        imageUrl: 'https://images.unsplash.com/photo-1505533542167-8c89838bb19e?q=80&w=400&auto=format&fit=crop',
        createdAt: 1646000000000
      },
      {
        id: 'demo-6', title: 'Геометрія міста',
        content: 'Будь-яке місто — це великий геометричний пазл. Квартали, вулиці, перехрестя складаються в абстракцію.',
        tag: '#СтрітАрт', date: 'Лютий 2022',
        imageUrl: 'https://images.unsplash.com/photo-1496568816309-51d7c20e3b21?q=80&w=400&auto=format&fit=crop',
        createdAt: 1643000000000
      },
      {
        id: 'demo-7', title: 'Приховані дахи',
        content: 'За кожним горищним вікном — своя історія. Старі київські дахи зберігають пам\'ять поколінь мешканців.',
        tag: '#Парки', date: 'Січень 2022',
        imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=400&auto=format&fit=crop',
        createdAt: 1641000000000
      },
      {
        id: 'demo-8', title: 'Тіні та бетон',
        content: 'Тінь — безкоштовна художня інсталяція, яку природа щодня малює на бетонних стінах міста.',
        tag: '#Промисловість', date: 'Грудень 2021',
        imageUrl: 'https://i0.wp.com/svitfantasy.com.ua/wp-content/uploads/2018/07/98537307.jpg?resize=585%2C325&ssl=1',
        createdAt: 1638000000000
      },
    ];

    const stmt = db.prepare(
      'INSERT OR IGNORE INTO posts (id, title, content, tag, date, imageUrl, createdAt) VALUES (?,?,?,?,?,?,?)'
    );
    demoPosts.forEach(p => stmt.run(p.id, p.title, p.content, p.tag, p.date, p.imageUrl, p.createdAt));
    stmt.finalize();

    const cStmt = db.prepare(
      'INSERT OR IGNORE INTO comments (id, postId, author, text, createdAt) VALUES (?,?,?,?,?)'
    );
    cStmt.run('c-1', 'demo-1', 'Марія', 'Неймовірне фото! Де саме це знято?', 1657000000000);
    cStmt.run('c-2', 'demo-3', 'Олег', 'Золота година робить дива з будь-яким фасадом.', 1651000000000);
    cStmt.run('c-3', 'demo-3', 'Анонім', 'Це в якому місті?', 1651100000000);
    cStmt.finalize();

    console.log('📦 Демо-дані додані до бази даних');
  });
});

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

app.get('/api/posts', (req, res) => {
  db.all('SELECT * FROM posts ORDER BY createdAt DESC', [], (err, posts) => {
    if (err) return res.status(500).json({ error: err.message });

    db.all('SELECT * FROM comments ORDER BY createdAt ASC', [], (err2, comments) => {
      if (err2) return res.status(500).json({ error: err2.message });

      // Прикріплюємо коментарі до своїх постів
      const postsWithComments = posts.map(post => ({
        ...post,
        comments: comments.filter(c => c.postId === post.id),
      }));

      res.json(postsWithComments);
    });
  });
});

app.get('/api/posts/:id', (req, res) => {
  db.get('SELECT * FROM posts WHERE id = ?', [req.params.id], (err, post) => {
    if (err)   return res.status(500).json({ error: err.message });
    if (!post) return res.status(404).json({ error: 'Пост не знайдено' });

    db.all('SELECT * FROM comments WHERE postId = ? ORDER BY createdAt ASC', [post.id], (err2, comments) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ ...post, comments });
    });
  });
});

app.post('/api/posts', (req, res) => {
  const { title, content, tag = '#Інше', date = '', imageUrl = '' } = req.body;

  if (!title?.trim() || !content?.trim()) {
    return res.status(400).json({ error: 'Назва та текст посту є обов\'язковими полями.' });
  }

  const newPost = {
    id       : uid(),
    title    : title.trim(),
    content  : content.trim(),
    tag,
    date     : date || new Date().toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' }),
    imageUrl,
    createdAt: Date.now(),
  };

  db.run(
    'INSERT INTO posts (id, title, content, tag, date, imageUrl, createdAt) VALUES (?,?,?,?,?,?,?)',
    [newPost.id, newPost.title, newPost.content, newPost.tag, newPost.date, newPost.imageUrl, newPost.createdAt],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ ...newPost, comments: [] });
    }
  );
});

app.delete('/api/posts/:id', (req, res) => {
  db.run('DELETE FROM comments WHERE postId = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    
    db.run('DELETE FROM posts WHERE id = ?', [req.params.id], function(err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      if (!this.changes) return res.status(404).json({ error: 'Пост не знайдено' });
      res.json({ success: true });
    });
  });
});

app.post('/api/posts/:id/comments', (req, res) => {
  const { author = 'Анонім', text } = req.body;

  if (!text?.trim()) {
    return res.status(400).json({ error: 'Текст коментаря не може бути порожнім.' });
  }

  db.get('SELECT id FROM posts WHERE id = ?', [req.params.id], (err, post) => {
    if (err)   return res.status(500).json({ error: err.message });
    if (!post) return res.status(404).json({ error: 'Пост не знайдено' });

    const newComment = {
      id       : uid(),
      postId   : req.params.id,
      author   : author.trim() || 'Анонім',
      text     : text.trim(),
      createdAt: Date.now(),
    };

    db.run(
      'INSERT INTO comments (id, postId, author, text, createdAt) VALUES (?,?,?,?,?)',
      [newComment.id, newComment.postId, newComment.author, newComment.text, newComment.createdAt],
      function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        res.status(201).json(newComment);
      }
    );
  });
});

app.delete('/api/posts/:postId/comments/:commentId', (req, res) => {
  db.run(
    'DELETE FROM comments WHERE id = ? AND postId = ?',
    [req.params.commentId, req.params.postId],
    function (err) {
      if (err)           return res.status(500).json({ error: err.message });
      if (!this.changes) return res.status(404).json({ error: 'Коментар не знайдено' });
      res.json({ success: true });
    }
  );
});

app.post('/api/auth/register', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName?.trim() || !email?.trim() || !password?.trim()) {
    return res.status(400).json({ error: 'Всі поля є обов\'язковими.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id       : uid(),
      firstName: firstName.trim(),
      lastName : lastName?.trim() || '',
      email    : email.trim().toLowerCase(),
      password : hashedPassword,
      createdAt: Date.now(),
    };

    db.run(
      'INSERT INTO users (id, firstName, lastName, email, password, createdAt) VALUES (?,?,?,?,?,?)',
      [newUser.id, newUser.firstName, newUser.lastName, newUser.email, newUser.password, newUser.createdAt],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Користувач з таким email вже існує.' });
          }
          return res.status(500).json({ error: err.message });
        }

        const token = jwt.sign(
          { id: newUser.id, email: newUser.email },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        res.status(201).json({
          token,
          user: {
            id       : newUser.id,
            firstName: newUser.firstName,
            lastName : newUser.lastName,
            email    : newUser.email,
          }
        });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password?.trim()) {
    return res.status(400).json({ error: 'Email та пароль є обов\'язковими.' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()], async (err, user) => {
    if (err)   return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Невірний email або пароль.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Невірний email або пароль.' });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id       : user.id,
        firstName: user.firstName,
        lastName : user.lastName,
        email    : user.email,
      }
    });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущено: http://localhost:${PORT}`);
  console.log(`📡 API доступне за адресою: http://localhost:${PORT}/api/posts`);
});
