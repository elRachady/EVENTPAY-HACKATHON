<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div class="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm relative">
      <button @click="$emit('close')" class="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
        <i class="fas fa-times"></i>
      </button>
      <div class="flex flex-col items-center">
        <img src="/src/assets/logo.png" alt="Logo" class="h-12 mb-4" />
        <h2 class="text-lg font-bold mb-2">Mon Compte</h2>
        <div class="w-full text-center mb-4">
          <p class="text-gray-700 font-medium">Nom : <span class="font-normal">John Doe</span></p>
          <p class="text-gray-700 font-medium mt-1">Email : <span class="font-normal">john.doe@email.com</span></p>
          <!-- Ajoutez d'autres infos ici -->
        </div>
        <button @click="$emit('logout')" class="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg transition mt-2">
          Se déconnecter
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ show: boolean }>()
defineEmits(['close', 'logout'])
</script>
