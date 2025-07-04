import { ref } from 'vue'

const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

export function useSession() {
  // Récupérer l'utilisateur courant
  const getUser = () => user.value

  // Savoir si connecté
  const isLoggedIn = () => !!user.value

  // Connexion (à appeler après login)
  const login = (userData: any) => {
    user.value = userData
    localStorage.setItem('user', JSON.stringify(userData))
  }

  // Déconnexion
  const logout = () => {
    user.value = null
    localStorage.removeItem('user')
  }

  return { user, getUser, isLoggedIn, login, logout }
}
