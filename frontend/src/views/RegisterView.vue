<template>
  <main class="relative z-10 max-w-6xl mx-auto px-6 py-12 lg:py-24 pt-32">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

      <section class="glass p-10 rounded-2xl shadow-2xl">
        <div class="mb-8">
          <h2 class="text-3xl font-bold uppercase tracking-tighter mb-2">Вхід</h2>
          <p class="text-gray-400 text-sm italic">З поверненням до мегаполіса</p>
        </div>

        <div class="space-y-5">
          <div>
            <label class="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2">Логін або Email</label>
            <input
              v-model="loginForm.email"
              type="text"
              class="w-full bg-black/30 border border-white/10 rounded-md px-4 py-3 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 transition-all text-sm text-white"
            >
          </div>
          <div>
            <label class="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2">Пароль</label>
            <input
              v-model="loginForm.password"
              type="password"
              class="w-full bg-black/30 border border-white/10 rounded-md px-4 py-3 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 transition-all text-sm text-white"
            >
          </div>
          <div class="flex items-center justify-between pt-2">
            <label class="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
              <input type="checkbox" class="accent-cyan-400"> Запам'ятати мене
            </label>
            <a href="#" class="text-xs text-cyan-400/70 hover:text-cyan-400 transition">Забули пароль?</a>
          </div>
          <button
            @click="handleLogin"
            class="w-full bg-white text-black font-bold py-4 rounded-md uppercase tracking-[0.2em] text-xs hover:bg-cyan-400 transition-all duration-300 mt-4"
          >
            Увійти
          </button>
        </div>
      </section>

      <section class="glass p-10 rounded-2xl shadow-2xl border-t-4 border-t-cyan-400">
        <div class="mb-8">
          <h2 class="text-3xl font-bold uppercase tracking-tighter mb-2 text-cyan-400">Реєстрація</h2>
          <p class="text-gray-400 text-sm italic">Станьте частиною архітектурної спільноти</p>
        </div>

        <div class="space-y-5">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2">Ім'я</label>
              <input
                v-model="registerForm.firstName"
                type="text"
                class="w-full bg-black/30 border border-white/10 rounded-md px-4 py-3 focus:outline-none focus:border-cyan-400/50 transition-all text-sm text-white"
              >
            </div>
            <div>
              <label class="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2">Прізвище</label>
              <input
                v-model="registerForm.lastName"
                type="text"
                class="w-full bg-black/30 border border-white/10 rounded-md px-4 py-3 focus:outline-none focus:border-cyan-400/50 transition-all text-sm text-white"
              >
            </div>
          </div>
          <div>
            <label class="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2">Email</label>
            <input
              v-model="registerForm.email"
              type="email"
              class="w-full bg-black/30 border border-white/10 rounded-md px-4 py-3 focus:outline-none focus:border-cyan-400/50 transition-all text-sm text-white"
            >
          </div>
          <div>
            <label class="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2">Придумайте пароль</label>
            <input
              v-model="registerForm.password"
              type="password"
              class="w-full bg-black/30 border border-white/10 rounded-md px-4 py-3 focus:outline-none focus:border-cyan-400/50 transition-all text-sm text-white"
            >
          </div>
          <div class="text-[10px] text-gray-500 leading-relaxed italic">
            Натискаючи кнопку, ви погоджуєтесь з правилами спільноти та політикою конфіденційності.
          </div>
          <button
            @click="handleRegister"
            class="w-full border-2 border-cyan-400 text-cyan-400 font-bold py-4 rounded-md uppercase tracking-[0.2em] text-xs hover:bg-cyan-400 hover:text-black transition-all duration-300 mt-4"
          >
            Створити профіль
          </button>
        </div>
      </section>

    </div>
  </main>

  <div
    v-if="toast.show"
    :class="toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-cyan-400 text-black'"
    class="fixed bottom-6 right-6 z-[9999] px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest shadow-2xl"
  >
    {{ toast.message }}
  </div>

  <footer class="relative z-10 text-center py-10 opacity-40">
    <p class="text-[9px] uppercase tracking-[0.5em]">&copy; 2026 Urban Architect / Developed for the Future</p>
  </footer>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../stores/auth.js'

const router = useRouter()
const { register, login } = useAuth()
const toast  = ref({ show: false, message: '', type: 'success' })

const loginForm = ref({
  email   : '',
  password: '',
})

const registerForm = ref({
  firstName: '',
  lastName : '',
  email    : '',
  password : '',
})

function showToast(message, type = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 3000)
}

async function handleLogin() {
  if (!loginForm.value.email || !loginForm.value.password) {
    showToast('Заповніть всі поля!', 'error')
    return
  }
  try {
    await login({
      email   : loginForm.value.email,
      password: loginForm.value.password,
    })
    showToast('Вхід виконано успішно!')
    setTimeout(() => { router.push('/') }, 1200)
  } catch (err) {
    showToast(err.response?.data?.error || 'Помилка входу', 'error')
  }
}

async function handleRegister() {
  if (!registerForm.value.firstName || !registerForm.value.email || !registerForm.value.password) {
    showToast('Заповніть всі обов\'язкові поля!', 'error')
    return
  }
  try {
    await register({
      firstName: registerForm.value.firstName,
      lastName : registerForm.value.lastName,
      email    : registerForm.value.email,
      password : registerForm.value.password,
    })
    showToast('Профіль створено успішно!')
    setTimeout(() => { router.push('/') }, 1200)
  } catch (err) {
    showToast(err.response?.data?.error || 'Помилка реєстрації', 'error')
  }
}
</script>

<style scoped>
.glass {
  background: rgba(26, 28, 30, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
</style>