<template>
  <main class="relative pt-32 pb-20 px-6">
    <div class="max-w-4xl mx-auto">

      <div class="mb-12 border-l-4 border-cyan-400 pl-6">
        <h1 class="text-4xl font-black uppercase tracking-tighter">Редактор локації</h1>
        <p class="text-gray-500 italic mt-2 text-sm">Створення нової архітектурної історії для мегаполіса</p>
      </div>

      <div
        v-if="toast.show"
        :class="toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-cyan-400 text-black'"
        class="fixed bottom-6 right-6 z-[9999] px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest shadow-2xl"
      >
        {{ toast.message }}
      </div>

      <div class="space-y-10">

        <div class="bg-white/[0.02] border border-white/10 rounded-2xl p-8">
          <h3 class="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400 mb-6">01. Візуальна поведінка</h3>

          <div v-if="form.imageUrl" class="mb-4 flex flex-col items-center">
            <img :src="form.imageUrl" alt="preview" class="max-h-40 rounded-lg object-contain mb-2">
            <p class="text-xs text-cyan-400">✓ Зображення обрано</p>
          </div>

          <div
            @click="triggerFileInput"
            @dragover.prevent="dragOver = true"
            @dragleave="dragOver = false"
            @drop.prevent="onDrop"
            :class="dragOver ? 'border-cyan-400' : 'border-white/10'"
            class="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 hover:border-cyan-400/40 transition group cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-600 group-hover:text-cyan-400 transition mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p class="text-sm text-gray-400">Перетягніть зображення або <span class="text-cyan-400">оберіть файл</span></p>
            <p class="text-[10px] text-gray-600 uppercase mt-2">Рекомендовано: 1600x900px, JPG/PNG</p>
          </div>
          <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange">
        </div>

        <div class="bg-white/[0.02] border border-white/10 rounded-2xl p-8 space-y-6">
          <h3 class="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400 mb-2">02. Текстовий вміст</h3>

          <div>
            <label class="block text-[10px] uppercase tracking-widest text-gray-500 mb-3">Назва локації</label>
            <input
              v-model="form.title"
              type="text"
              placeholder="Наприклад: Бетонне ехо метрополітену"
              class="w-full bg-black/40 border border-white/10 rounded-lg px-5 py-4 text-white focus:outline-none focus:border-cyan-400 transition italic"
            >
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-[10px] uppercase tracking-widest text-gray-500 mb-3">Категорія (Хештег)</label>
              <select
                v-model="form.tag"
                class="w-full bg-black/40 border border-white/10 rounded-lg px-5 py-4 text-white focus:outline-none focus:border-cyan-400 transition appearance-none"
              >
                <option>#Модернізм</option>
                <option>#СтрітАрт</option>
                <option>#Парки</option>
                <option>#НічнеМісто</option>
                <option>#Промисловість</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] uppercase tracking-widest text-gray-500 mb-3">Дата (Місяць/Рік)</label>
              <input
                v-model="form.date"
                type="text"
                placeholder="Травень 2026"
                class="w-full bg-black/40 border border-white/10 rounded-lg px-5 py-4 text-white focus:outline-none focus:border-cyan-400 transition font-mono"
              >
            </div>
          </div>

          <div>
            <label class="block text-[10px] uppercase tracking-widest text-gray-500 mb-3">Опис місця</label>
            <textarea
              v-model="form.content"
              rows="6"
              placeholder="Опишіть атмосферу, архітектурні деталі та ваші емоції..."
              class="w-full bg-black/40 border border-white/10 rounded-lg px-5 py-4 text-white focus:outline-none focus:border-cyan-400 transition resize-none"
            ></textarea>
          </div>
        </div>

        <div class="flex flex-col md:flex-row gap-4 pt-6">
          <button
            @click="submitPost"
            :disabled="loading"
            class="flex-1 bg-cyan-400 hover:bg-cyan-300 text-black font-black py-5 rounded-xl uppercase tracking-[0.2em] text-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Публікуємо...' : 'Опублікувати історію' }}
          </button>
        </div>

      </div>
    </div>
  </main>

  <footer class="py-12 border-t border-white/5 text-center">
    <p class="text-[9px] uppercase tracking-[0.5em] text-gray-700">&copy; 2026 Urban Architect Editor</p>
  </footer>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const API    = 'http://localhost:3000/api'
const router = useRouter()

const fileInput = ref(null)
const dragOver  = ref(false)
const loading   = ref(false)
const toast     = ref({ show: false, message: '', type: 'success' })

const form = ref({
  title   : '',
  content : '',
  tag     : '#Модернізм',
  date    : '',
  imageUrl: '',
})

function showToast(message, type = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 3000)
}

function triggerFileInput() {
  fileInput.value.click()
}

function onFileChange(e) {
  const file = e.target.files[0]
  if (file) readFile(file)
}

function onDrop(e) {
  dragOver.value = false
  const file = e.dataTransfer.files[0]
  if (file) readFile(file)
}

function readFile(file) {
  const reader = new FileReader()
  reader.onload = (e) => { form.value.imageUrl = e.target.result }
  reader.readAsDataURL(file)
}

async function submitPost() {
  if (!form.value.title.trim() || !form.value.content.trim()) {
    showToast('Назва та текст є обов\'язковими!', 'error')
    return
  }

  loading.value = true

  try {
    const res = await axios.post(`${API}/posts`, form.value)
    showToast(`Пост "${res.data.title}" опубліковано!`)
    setTimeout(() => { router.push('/') }, 1200)
  } catch (err) {
    showToast(err.response?.data?.error || 'Помилка сервера', 'error')
  } finally {
    loading.value = false
  }
}
</script>