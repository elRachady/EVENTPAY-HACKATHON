<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm border border-gray-200">
      <div class="text-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800">Connexion</h2>
        <p class="text-gray-500 mt-1">Accédez à votre compte Tickets Sats</p>
      </div>
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input v-model="email" type="email" placeholder="votre@email.com" required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
          <input v-model="password" type="password" placeholder="••••••••" required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
        </div>
        <button type="submit"
          class="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-300 flex justify-center items-center"
          :disabled="loading">
          <span v-if="!loading">Se connecter</span>
          <svg v-else class="w-5 h-5 ml-2 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </button>
      </form>
      <div v-if="error" class="mt-4 bg-red-100 text-red-700 px-4 py-2 rounded notification-slide-in">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const router = useRouter()

const handleLogin = async () => {
  error.value = ''
  loading.value = true
  try {
    const res = await fetch('http://localhost:3005/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value })
    })
    const data = await res.json()
    if (res.ok && data.user) {
      // Stocke l'utilisateur dans localStorage (ou juste son id/email/role)
      localStorage.setItem('user', JSON.stringify(data.user))
      router.push('/home')
    } else {
      error.value = data.error || 'Email ou mot de passe incorrect'
    }
  } catch (e) {
    error.value = "Erreur réseau ou serveur"
  }
  loading.value = false
}
</script>

<style scoped>
.notification-slide-in {
  animation: slideIn 0.3s forwards;
}
@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
</style>