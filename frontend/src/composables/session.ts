import { ref } from 'vue'

export function useSession() {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  function setUser(u: any) {
    user.value = u
    localStorage.setItem('user', JSON.stringify(u))
  }

  function logout() {
    user.value = null
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  return { user, setUser, logout }
}
