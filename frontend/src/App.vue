<template>
  <header class="fixed w-full z-50 bg-black/20 backdrop-blur-sm">
    <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <router-link to="/" class="text-cyan-400 font-bold tracking-widest text-xl uppercase italic">
        Urban Architect
      </router-link>

      <nav class="hidden lg:flex items-center gap-8 text-sm font-medium tracking-wide">
        <router-link to="/postsettings" class="hover:text-cyan-400 transition">НОВИЙ ПОСТ</router-link>
        <router-link to="/about" class="hover:text-cyan-400 transition">ПРО НАС</router-link>

        <template v-if="isLoggedIn">
          <router-link to="/profile" class="hover:text-cyan-400 transition">
            {{ user.firstName }} {{ user.lastName }}
          </router-link>
          <button
            @click="handleLogout"
            class="text-gray-400 hover:text-red-400 transition text-sm font-medium tracking-wide"
          >
            ВИЙТИ
          </button>
        </template>

        <template v-else>
          <router-link to="/profile" class="hover:text-cyan-400 transition">МІЙ ПРОФІЛЬ</router-link>
          <router-link to="/register" class="hover:text-cyan-400 transition">РЕЄСТРАЦІЯ / ВХІД</router-link>
        </template>
      </nav>
    </div>
  </header>

  <router-view />
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from './stores/auth.js'

const router = useRouter()
const { user, isLoggedIn, logout } = useAuth()

function handleLogout() {
  logout()
  router.push('/')
}
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background-color: #1a1c1e; color: white; font-family: sans-serif; }
</style>