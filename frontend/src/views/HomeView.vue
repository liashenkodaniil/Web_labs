<template>
  <main>
    <section class="relative h-screen flex items-center">
      <div class="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1920"
          alt="Urban architecture"
          class="w-full h-full object-cover"
        >
        <div class="absolute inset-0 bg-black/40"></div>
      </div>

      <div class="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <div class="max-w-2xl">
          <h1 class="text-6xl font-bold leading-tight mb-4 uppercase tracking-tighter">
            Відкрийте душу <br> мегаполіса
          </h1>
          <p class="text-xl text-gray-300 italic mb-8">
            Від прихованих дахів до бруталістських шедеврів
          </p>
        </div>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-6 py-12">

      <div class="flex gap-4 mb-10 overflow-x-auto pb-2">
        <button
          v-for="tag in tags"
          :key="tag"
          @click="toggleTag(tag)"
          :class="activeTags.includes(tag)
            ? 'bg-cyan-200 text-black font-bold shadow-[0_0_15px_rgba(165,243,252,0.4)]'
            : 'bg-gray-800 text-white'"
          class="px-4 py-1 rounded-md text-sm hover:bg-gray-700 transition-all whitespace-nowrap"
        >
          {{ tag }}
        </button>
      </div>

      <div class="flex justify-start mb-8">
        <router-link to="/postsettings">
          <button class="p-3 border border-white/20 rounded-lg hover:border-cyan-400 hover:text-cyan-400 transition-all duration-300 group bg-transparent">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 group-hover:rotate-90 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </router-link>
      </div>

      <div v-if="loading" class="text-center text-gray-400 py-20">
        Завантаження постів...
      </div>

      <div v-else-if="error" class="text-center text-red-400 py-20">
        {{ error }}
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="post in filteredPosts"
          :key="post.id"
          @click="openPost(post)"
          class="bg-[#2a2d30] rounded-xl overflow-hidden hover:scale-105 transition duration-300 cursor-pointer"
        >
          <div class="h-40 bg-gray-600">
            <img
              v-if="post.imageUrl"
              :src="post.imageUrl"
              :alt="post.title"
              class="w-full h-full object-cover"
            >
          </div>
          <div class="p-4">
            <span class="text-xs text-cyan-400 font-bold">{{ post.tag }}</span>
            <h3 class="font-bold text-lg mb-1 mt-1">{{ post.title }}</h3>
            <p class="text-xs text-gray-400">{{ post.date }}</p>
          </div>
        </div>
      </div>

    </section>
  </main>

  <div
    v-if="selectedPost"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
    @click.self="closePost"
  >
    <div class="bg-[#1e2124] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 relative">
      <button @click="closePost" class="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">&times;</button>

      <img
        v-if="selectedPost.imageUrl"
        :src="selectedPost.imageUrl"
        class="w-full h-56 object-cover rounded-xl mb-6"
      >
      <span class="text-xs text-cyan-400 font-bold">{{ selectedPost.tag }}</span>
      <h2 class="text-2xl font-bold mt-1 mb-2">{{ selectedPost.title }}</h2>
      <p class="text-gray-400 text-sm mb-1">{{ selectedPost.date }}</p>
      <p class="text-gray-300 mt-4 mb-6">{{ selectedPost.content }}</p>

      <button
        @click="deletePost(selectedPost.id)"
        class="mb-6 text-xs text-red-400 hover:text-red-300 border border-red-400/30 px-4 py-2 rounded-lg transition"
      >
        Видалити пост
      </button>

      <div class="border-t border-white/10 pt-6">
        <h3 class="text-sm font-bold uppercase tracking-widest mb-4">Коментарі ({{ selectedPost.comments?.length || 0 }})</h3>

        <div v-if="selectedPost.comments?.length" class="space-y-3 mb-6">
          <div
            v-for="comment in selectedPost.comments"
            :key="comment.id"
            class="bg-white/5 rounded-lg p-3 flex justify-between items-start"
          >
            <div>
              <p class="text-xs font-bold text-cyan-400">{{ comment.author }}</p>
              <p class="text-sm text-gray-300 mt-1">{{ comment.text }}</p>
            </div>
            <button
              @click="deleteComment(selectedPost.id, comment.id)"
              class="text-gray-600 hover:text-red-400 text-xs ml-4 transition"
            >
              ✕
            </button>
          </div>
        </div>

        <div v-else class="text-gray-500 text-sm mb-6">Коментарів ще немає.</div>

        <div class="space-y-3">
          <input
            v-model="newComment.author"
            type="text"
            placeholder="Ваше ім'я (необов'язково)"
            class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 transition"
          >
          <textarea
            v-model="newComment.text"
            placeholder="Ваш коментар..."
            rows="3"
            class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 transition resize-none"
          ></textarea>
          <button
            @click="addComment"
            class="bg-cyan-400 text-black font-bold px-6 py-2 rounded-lg text-xs uppercase tracking-widest hover:bg-cyan-300 transition"
          >
            Додати коментар
          </button>
        </div>
      </div>
    </div>
  </div>

  <div
    v-if="toast.show"
    :class="toast.type === 'error' ? 'bg-red-500' : 'bg-cyan-400'"
    class="fixed bottom-6 right-6 z-[9999] px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest shadow-2xl text-black transition-all"
  >
    {{ toast.message }}
  </div>

  <footer class="py-10 text-center text-gray-500 border-t border-gray-800">
    <p>&copy; 2026 Urban Architect. Всі права захищені.</p>
  </footer>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const API = 'http://localhost:3000/api'

const posts       = ref([])
const loading     = ref(true)
const error       = ref(null)
const selectedPost = ref(null)
const newComment  = ref({ author: '', text: '' })
const activeTags  = ref([])
const toast       = ref({ show: false, message: '', type: 'success' })

const tags = ['#Модернізм', '#СтрітАрт', '#Парки', '#НічнеМісто', '#Промисловість']

onMounted(async () => {
  await fetchPosts()
})

async function fetchPosts() {
  try {
    loading.value = true
    const res = await axios.get(`${API}/posts`)
    posts.value = res.data
  } catch {
    error.value = 'Не вдалось завантажити пости. Переконайтесь що сервер запущено.'
  } finally {
    loading.value = false
  }
}

const filteredPosts = computed(() => {
  if (activeTags.value.length === 0) return posts.value
  return posts.value.filter(p => activeTags.value.includes(p.tag))
})

function toggleTag(tag) {
  const idx = activeTags.value.indexOf(tag)
  if (idx === -1) activeTags.value.push(tag)
  else activeTags.value.splice(idx, 1)
}

function openPost(post) {
  selectedPost.value = { ...post }
  newComment.value = { author: '', text: '' }
}

function closePost() {
  selectedPost.value = null
}

async function deletePost(id) {
  try {
    await axios.delete(`${API}/posts/${id}`)
    posts.value = posts.value.filter(p => p.id !== id)
    closePost()
    showToast('Пост вилучено.', 'info')
  } catch {
    showToast('Помилка при видаленні посту.', 'error')
  }
}

async function addComment() {
  if (!newComment.value.text.trim()) {
    showToast('Введіть текст коментаря.', 'error')
    return
  }

  try {
    const res = await axios.post(`${API}/posts/${selectedPost.value.id}/comments`, {
      author: newComment.value.author || 'Анонім',
      text  : newComment.value.text,
    })

    const post = posts.value.find(p => p.id === selectedPost.value.id)
    if (post) {
      post.comments.push(res.data)
      selectedPost.value = { ...post }
    }

    newComment.value = { author: '', text: '' }
    showToast('Коментар додано!')
  } catch {
    showToast('Помилка при додаванні коментаря.', 'error')
  }
}

async function deleteComment(postId, commentId) {
  try {
    await axios.delete(`${API}/posts/${postId}/comments/${commentId}`)
    
    const post = posts.value.find(p => p.id === postId)
    if (post) {
      post.comments = post.comments.filter(c => c.id !== commentId)
      selectedPost.value = { ...post }
    }
    
    showToast('Коментар вилучено.', 'info')
  } catch {
    showToast('Помилка при видаленні коментаря.', 'error')
  }
}

function showToast(message, type = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 3000)
}
</script>