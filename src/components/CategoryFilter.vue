<script setup lang="ts">
import { ref } from 'vue'

const categories = [
  { id: 'concerts', name: 'Concerts', icon: 'fas fa-music', color: 'text-purple-500' },
  { id: 'sports', name: 'Sports', icon: 'fas fa-futbol', color: 'text-green-500' },
  { id: 'conferences', name: 'Conférences', icon: 'fas fa-chalkboard-teacher', color: 'text-blue-500' },
  { id: 'festivals', name: 'Festivals', icon: 'fas fa-wine-glass-alt', color: 'text-red-500' },
]

const selectedCategory = ref('')

const emit = defineEmits<{
  categoryChange: [category: string]
}>()

const selectCategory = (categoryId: string) => {
  selectedCategory.value = categoryId
  emit('categoryChange', categoryId)
}
</script>

<template>
  <div class="mb-6">
    <h2 class="text-lg font-semibold mb-3 text-gray-800">Catégories</h2>
    <div class="flex space-x-3 overflow-x-auto pb-2">
      <button 
        v-for="category in categories"
        :key="category.id"
        @click="selectCategory(category.id)"
        class="px-4 py-2 bg-white rounded-lg border border-gray-200 whitespace-nowrap text-sm font-medium flex items-center transition-colors hover:border-blue-300"
        :class="selectedCategory === category.id ? 'border-blue-500 bg-blue-50' : ''"
      >
        <i :class="[category.icon, category.color, 'mr-2']"></i> 
        {{ category.name }}
      </button>
    </div>
  </div>
</template>