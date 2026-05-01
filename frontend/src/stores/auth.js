import { ref, computed } from 'vue'
import axios from 'axios'

const API = 'http://localhost:3000/api'

const user  = ref(null)
const token = ref(localStorage.getItem('token') || null)

if (token.value) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  const savedUser = localStorage.getItem('user')
  if (savedUser) user.value = JSON.parse(savedUser)
}

export function useAuth() {

  const isLoggedIn = computed(() => !!token.value)

  async function register({ firstName, lastName, email, password }) {
    const res = await axios.post(`${API}/auth/register`, {
      firstName, lastName, email, password
    })
    _saveSession(res.data)
    return res.data
  }

  async function login({ email, password }) {
    const res = await axios.post(`${API}/auth/login`, {
      email, password
    })
    _saveSession(res.data)
    return res.data
  }

  function logout() {
    token.value = null
    user.value  = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
  }

  function _saveSession(data) {
    token.value = data.token
    user.value  = data.user
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
  }

  return { user, token, isLoggedIn, register, login, logout }
}