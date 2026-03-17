

import { BlogModel } from './Model.js';
import { BlogView  } from './View.js';

const model = new BlogModel();
const view  = new BlogView();

export class IndexController {

  constructor() {
    this._model      = model;
    this._view       = view;
    this._activeTags = new Set();
    this._query      = '';
    this._init();
  }

  _init() {
    this._injectGrid();
    this._model.subscribe(() => this._renderGrid());
    this._bindTagButtons();
    this._view.bindSearch(q => {
      this._query = q;
      this._renderGrid();
    });
    this._renderGrid();
  }

  _injectGrid() {
    const staticGrid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4');
    if (!staticGrid) return;
    const dynGrid     = document.createElement('div');
    dynGrid.id        = 'posts-grid';
    dynGrid.className = staticGrid.className;
    staticGrid.replaceWith(dynGrid);
  }

  _renderGrid() {
    let posts = this._model.getAllPosts();

    if (this._activeTags.size > 0) {
      const activeLower = [...this._activeTags].map(t => t.toLowerCase());
      posts = posts.filter(p =>
        activeLower.includes((p.tag || '').toLowerCase())
      );
    }

    if (this._query.trim()) {
      const q = this._query.toLowerCase();
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q)
      );
    }

    posts.sort((a, b) => b.createdAt - a.createdAt);

    this._view.renderPostGrid(
      posts,
      postId => this._openPost(postId),
      postId => this._deletePost(postId),
    );
  }

  _openPost(postId) {
    const post = this._model.getPostById(postId);
    if (!post) return;

    const handleDeleteComment = (pid, cid) => {
      this._model.deleteComment(pid, cid);
      const updated = this._model.getPostById(pid);
      if (updated) {
        this._view.updateModalComments(updated.comments, pid, handleDeleteComment);
      }
      this._renderGrid();
      this._view.showToast('Коментар вилучено.', 'info');
    };

    const handleAddComment = (pid, author, text) => {
      this._model.addComment(pid, { author, text });
      const updated = this._model.getPostById(pid);
      if (updated) {
        this._view.updateModalComments(updated.comments, pid, handleDeleteComment);
      }
      this._renderGrid();
      this._view.showToast('Коментар додано!');
    };

    this._view.openPostModal(post, handleAddComment, handleDeleteComment);
  }

  _deletePost(postId) {
    const ok = this._model.deletePost(postId);
    if (ok) {
      this._renderGrid();
      this._view.showToast('Пост вилучено.', 'info');
    }
  }

  _bindTagButtons() {
    document.querySelectorAll('.tag-btn').forEach(btn => {
      if (!btn.dataset.tag) {
        btn.dataset.tag = btn.textContent.trim();
      }

      btn.addEventListener('click', () => {
        const tag = btn.dataset.tag;
        if (this._activeTags.has(tag)) {
          this._activeTags.delete(tag);
        } else {
          this._activeTags.add(tag);
        }
        this._renderGrid();
      });
    });
  }
}

export class PostSettingsController {

  constructor() {
    this._model = model;
    this._view  = view;
    this._init();
  }

  _init() {
    this._view.bindPostSettingsForm(data => this._handleSubmit(data));
  }

  _handleSubmit({ title, content, tag, date, imageUrl }) {
    try {
      const post = this._model.addPost({ title, content, tag, date, imageUrl });
      this._view.showToast(`Пост "${post.title}" опубліковано!`);
      setTimeout(() => history.back(), 1200);
    } catch (err) {
      this._view.showToast(err.message, 'error');
    }
  }
}

function bootstrap() {
  const path = window.location.pathname.toLowerCase();

  if (path.endsWith('index.html') || path.endsWith('/') || path === '') {
    new IndexController();
    return;
  }

  if (path.includes('postsettings')) {
    new PostSettingsController();
    return;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
