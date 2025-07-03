<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

const props = defineProps<{
  partners: Array<{ name: string; logo?: string; description?: string }>
  isOpen: boolean
}>()

const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="emit('close')">
      <div class="bg-white rounded-xl w-full max-w-md mx-4 p-6 relative" @click.stop>
        <button class="absolute top-4 right-4 text-gray-400 hover:text-gray-600" @click="emit('close')">
          <i class="fas fa-times"></i>
        </button>
        <h2 class="text-xl font-bold mb-4">Partenaires de l'événement</h2>
        <div v-if="partners.length > 0" class="space-y-4">
          <div v-for="(partner, idx) in partners" :key="idx" class="flex items-center space-x-4 p-3 border rounded-lg">
            <img v-if="partner.logo" :src="partner.logo" :alt="partner.name" class="w-12 h-12 object-contain rounded-full bg-gray-100" />
            <div>
              <p class="font-semibold">{{ partner.name }}</p>
              <p v-if="partner.description" class="text-xs text-gray-500 mt-1">{{ partner.description }}</p>
            </div>
          </div>
        </div>
        <div v-else class="text-gray-500 text-center py-8">Aucun partenaire pour cet événement.</div>
      </div>
    </div>
  </teleport>
</template>
