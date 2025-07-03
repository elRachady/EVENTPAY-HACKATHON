<script setup lang="ts">
import { defineProps } from 'vue'
import EventPartnersModal from './EventPartnersModal.vue'
import { ref } from 'vue'

interface Event {
  id: string
  title: string
  location: string
  date: string
  image: string
  price: number
  status?: string
  category?: string
  description?: string
  installmentAvailable?: boolean
  partners?: Array<{ name: string; logo?: string; description?: string }>
}

defineProps<{
  event: Event
  showProgress?: boolean
  progress?: number
  amountPaid?: number
  isCompleted?: boolean
}>()

const emit = defineEmits<{
  cardClick: [eventId: string]
  actionClick: [eventId: string, action: string]
}>()

const showPartners = ref(false)
</script>

<template>
  <div 
    class="event-card bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm cursor-pointer"
    @click="emit('cardClick', event.id)"
  >
    <div class="relative">
      <img :src="event.image" :alt="event.title" class="w-full h-40 object-cover">
      <div 
        v-if="event.status" 
        class="absolute top-2 left-2 text-white text-xs px-2 py-1 rounded-full"
        :class="
          event.status === 'En cours de paiement' 
            ? 'bg-orange-400' 
            : isCompleted 
              ? 'bg-green-500' 
              : 'bg-blue-500'"
      >
        {{ event.status }}
      </div>
    </div>
    
    <div class="p-4">
      <div class="flex justify-between items-start">
        <div>
          <h3 class="font-bold text-gray-800">{{ event.title }}</h3>
          <p class="text-sm text-gray-500 mt-1">{{ event.location }} • {{ event.date }}</p>
        </div>
        <div 
          v-if="event.category" 
          class="bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-xs font-medium"
        >
          {{ event.category }}
        </div>
      </div>
      
      <div v-if="event.installmentAvailable" class="mt-3">
        <div class="flex items-center text-sm">
          <span class="text-gray-600 mr-2">
            <i class="fas fa-bolt text-yellow-500 mr-1"></i> 
            Paiement échelonné disponible
          </span>
        </div>
      </div>
      
      <div v-if="showProgress && progress !== undefined" class="mt-4">
        <div class="flex justify-between text-sm mb-1">
          <span class="text-gray-600">
            Payé: {{ amountPaid?.toLocaleString() }} SATS
          </span>
          <span class="font-medium">{{ progress }}/{{ event.price.toLocaleString() }} SATS</span>
        </div>
        <div class="progress-bar">
          <div class="h-full rounded bg-green-500 transition-all" :style="`width: ${(progress / event.price) * 100}%`"></div>
        </div>
        <p class="text-xs text-gray-500 mt-2">
          <i class="fas fa-clock mr-1"></i> 
          Vous avez jusqu'au 20 Nov pour compléter
        </p>
      </div>
      
      <div class="mt-4 flex justify-between items-center">
        <div>
          <p class="text-2xl font-bold">{{ event.price.toLocaleString() }} SATS</p>
          <p class="text-sm text-gray-500">≈ {{ (event.price * 0.39).toLocaleString() }} XOF</p>
        </div>
        <button 
          v-if="!showProgress"
          @click.stop="emit('actionClick', event.id, 'reserve')"
          class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          Réserver
        </button>
        <div v-else class="flex space-x-2">
          <button 
            @click.stop="emit('actionClick', event.id, isCompleted ? 'download' : 'pay')"
            class="text-white py-2 px-4 rounded-lg text-sm font-medium transition"
            :class="isCompleted ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'"
          >
            <i v-if="isCompleted" class="fas fa-download mr-2"></i>
            {{ isCompleted ? 'Télécharger mon ticket' : 'Payer maintenant' }}
          </button>
          <button 
            @click.stop="emit('actionClick', event.id, 'menu')"
            class="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            <i class="fas fa-ellipsis-v text-gray-600"></i>
          </button>
        </div>
      </div>

      <div class="mt-2 flex justify-end">
        <button 
          @click.stop="showPartners = true"
          class="bg-black hover:bg-gray-900 text-white px-6 py-2 rounded text-sm font-semibold transition flex items-center shadow w-full justify-center"
        >
          <i class="fas fa-handshake mr-2"></i> Voir les partenaires
        </button>
      </div>
      <EventPartnersModal 
        :partners="event.partners || []" 
        :isOpen="showPartners" 
        @close="showPartners = false" 
      />
    </div>
  </div>
</template>