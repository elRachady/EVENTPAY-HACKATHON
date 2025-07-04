<template>
  <div class="container mx-auto px-4 py-10 max-w-md">
    <div class="flex flex-col items-center bg-white rounded-xl shadow-lg p-8">
      <img src="/src/assets/logo.png" alt="Logo" class="h-14 mb-6" />
      <h2 class="text-2xl font-bold mb-4">Mon Compte</h2>
      <form class="w-full space-y-4" @submit.prevent="saveAccount">
        <div>
          <label class="block text-left text-gray-700 font-medium mb-1">Nom</label>
          <input v-model="lastName" type="text" class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
        <div>
          <label class="block text-left text-gray-700 font-medium mb-1">Prénom</label>
          <input v-model="firstName" type="text" class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
        <div>
          <label class="block text-left text-gray-700 font-medium mb-1">Email</label>
          <input v-model="email" type="email" class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
        <div>
          <label class="block text-left text-gray-700 font-medium mb-1">Mot de passe</label>
          <div class="relative">
            <input :type="showPassword ? 'text' : 'password'" v-model="password" class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 pr-10" />
            <button type="button" @click="showPassword = !showPassword" class="absolute right-2 top-2 text-gray-400 hover:text-gray-600">
              <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
        </div>
        <button type="submit" class="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg transition">Enregistrer</button>
        <p v-if="success" class="text-green-600 text-center mt-2">Modifications enregistrées !</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const lastName = ref('Doe')
const firstName = ref('John')
const email = ref('john.doe@email.com')
const password = ref('password123')
const showPassword = ref(false)
const success = ref(false)

function saveAccount() {
  // Ici, tu pourrais envoyer les données à un backend
  success.value = true
  setTimeout(() => (success.value = false), 2000)
}
</script>