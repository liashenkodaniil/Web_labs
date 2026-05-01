<template>
  <main class="relative z-10 max-w-4xl mx-auto px-6 py-16 pt-32">

    <div v-if="!isLoggedIn" class="text-center py-20">
      <h2 class="text-2xl font-bold mb-4">Ви не авторизовані</h2>
      <p class="text-gray-400 mb-8">Увійдіть або зареєструйтесь щоб переглянути профіль</p>
      <router-link
        to="/register"
        class="bg-cyan-400 text-black font-bold px-8 py-3 rounded-xl uppercase tracking-widest text-xs hover:bg-cyan-300 transition"
      >
        Увійти / Зареєструватись
      </router-link>
    </div>

    <div v-else>
      <div class="mb-12">
        <h1 class="text-4xl font-bold uppercase tracking-tighter mb-2">Особистий кабінет</h1>
        <p class="text-gray-400 italic">Керування вашими даними та налаштуваннями архітектора</p>
      </div>

      <div class="glass-panel rounded-2xl overflow-hidden shadow-2xl">
        <div class="p-8 border-b border-white/5 flex items-center gap-8 bg-white/5">
          <div class="relative">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=200&fit=crop"
              alt="Avatar"
              class="w-24 h-24 rounded-full object-cover border-2 border-cyan-400 p-1"
            >
          </div>
          <div>
            <h2 class="text-2xl font-bold">{{ user.firstName }} {{ user.lastName }}</h2>
            <p class="text-cyan-400 text-sm tracking-widest uppercase">Urban Explorer</p>
          </div>
        </div>

        <table class="w-full text-left border-collapse">
          <tbody>
            <tr class="border-b border-white/5 hover:bg-white/5 transition">
              <td class="p-6 text-xs uppercase tracking-[0.2em] text-gray-500 w-1/3">ID Користувача</td>
              <td class="p-6 font-mono text-cyan-400/80">#{{ user.id }}</td>
            </tr>
            <tr class="border-b border-white/5 hover:bg-white/5 transition">
              <td class="p-6 text-xs uppercase tracking-[0.2em] text-gray-500">Повне ім'я</td>
              <td class="p-6 text-gray-200">{{ user.firstName }} {{ user.lastName }}</td>
            </tr>
            <tr class="border-b border-white/5 hover:bg-white/5 transition">
              <td class="p-6 text-xs uppercase tracking-[0.2em] text-gray-500">Email адреса</td>
              <td class="p-6 text-gray-200">{{ user.email }}</td>
            </tr>
          </tbody>
        </table>

        <div class="p-8 flex justify-end gap-4 bg-black/20">
          <button
            @click="handleLogout"
            class="px-8 py-2 border border-red-400/50 text-red-400 text-xs font-bold uppercase tracking-widest hover:bg-red-400 hover:text-black transition"
          >
            Вийти з акаунту
          </button>
        </div>
      </div>
    </div>

  </main>

  <footer class="py-12 text-center opacity-30">
    <p class="text-[10px] uppercase tracking-[0.4em]">&copy; 2026 Urban Architect / Профіль резидента</p>
  </footer>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '../stores/auth.js'

const router = useRouter()
const { user, isLoggedIn, logout } = useAuth()

function handleLogout() {
  logout()
  router.push('/')
}
</script>

<style scoped>
.glass-panel {
  background: rgba(26, 28, 30, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
</style>