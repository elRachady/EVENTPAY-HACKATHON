<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')

const handleSignup = () => {
  error.value = ''
  if (!email.value || !password.value || !confirmPassword.value) {
    error.value = 'Veuillez remplir tous les champs.'
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'Les mots de passe ne correspondent pas.'
    return
  }
  // Simuler une inscription
  // Remplacer par un appel API réel
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-sm bg-white rounded-xl shadow p-8 flex flex-col items-center">
      <img src="/src/assets/logo.png" alt="Logo" class="w-20 h-20 mb-6" />
      <h1 class="text-2xl font-bold mb-4 text-gray-800">Créer un compte</h1>
      <form @submit.prevent="handleSignup" class="w-full space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input v-model="email" type="email" class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors" required />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
          <input v-model="password" type="password" class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors" required />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
          <input v-model="confirmPassword" type="password" class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors" required />
        </div>
        <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>
        <button type="submit" class="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-bold transition">Créer un compte</button>
      </form>
      <p class="mt-4 text-sm text-gray-500">Déjà un compte ?
        <router-link to="/login" class="text-orange-500 hover:underline">Se connecter</router-link>
      </p>
    </div>
  </div>
</template>
