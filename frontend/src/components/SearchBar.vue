<script setup lang="ts">
import { ref } from 'vue'

const searchQuery = ref('')

const emit = defineEmits<{
  search: [query: string]
}>()

const handleSearch = () => {
  emit('search', searchQuery.value)
}
</script>

<template>
  <div class="relative mb-6">
    <input 
      v-model="searchQuery"
      @input="handleSearch"
      type="text" 
      placeholder="Rechercher des événements..." 
      class="w-full py-3 px-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 pl-10 transition-colors"
    >
    <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
  </div>
</template>