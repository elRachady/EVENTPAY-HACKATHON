<script setup lang="ts">
import { ref } from 'vue'
import SearchBar from '../components/SearchBar.vue'
import CategoryFilter from '../components/CategoryFilter.vue'
import EventCard from '../components/EventCard.vue'
import TicketModal from '../components/TicketModal.vue'

const events = ref([
  {
    id: '1',
    title: 'Festival Voodoo 2023',
    location: 'Ouidah',
    date: '24-26 Nov',
    image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    price: 50000,
    category: 'VIP',
    installmentAvailable: true
  },
  {
    id: '2',
    title: 'MJS vs ASPAC',
    location: 'Stade de l\'Amitié',
    date: '18 Nov',
    image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    price: 15000,
    category: 'Gradué',
    installmentAvailable: true
  },
  {
    id: '3',
    title: 'AfroNight Live',
    location: 'Cotonou',
    date: '10 Déc',
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    price: 8000,
    category: 'Standard'
  }
])

const mastermindPasses = ref([
  {
    id: '5-student',
    title: 'Bitcoin Mastermind 2025 - Student Pass',
    location: 'AZALAÏ HOTEL COTONOU - Bénin',
    date: '4 Juillet',
    image: '/src/assets/bitcoinmastermind.jpg',
    price: 18000,
    category: 'Conference',
    passType: 'Student Pass',
    installmentAvailable: false,
    partners: [
      { name: 'Izichange', logo: '/src/assets/Izichange.png' },
      { name: 'Flash', logo: '/src/assets/Flash.png' }
    ]
  },
  {
    id: '5-semi',
    title: 'Bitcoin Mastermind 2025 - Semi Pass',
    location: 'AZALAÏ HOTEL COTONOU - Bénin',
    date: '4 Juillet',
    image: '/src/assets/bitcoinmastermind.jpg',
    price: 58000,
    category: 'Conference',
    passType: 'Semi Pass',
    installmentAvailable: false,
    partners: [
      { name: 'Izichange', logo: '/src/assets/Izichange.png' },
      { name: 'Flash', logo: '/src/assets/Flash.png' }
    ]
  },
  {
    id: '5-full',
    title: 'Bitcoin Mastermind 2025 - Full Pass',
    location: 'AZALAÏ HOTEL COTONOU - Bénin',
    date: '4 Juillet',
    image: '/src/assets/bitcoinmastermind.jpg',
    price: 98000,
    category: 'Conference',
    passType: 'Full Pass',
    installmentAvailable: false,
    partners: [
      { name: 'Izichange', logo: '/src/assets/Izichange.png' },
      { name: 'Flash', logo: '/src/assets/Flash.png' }
    ]
  }
])

const isModalOpen = ref(false)
const selectedEvent = ref<any>(null)

const handleSearch = (query: string) => {
  console.log('Searching for:', query)
}

const handleCategoryChange = (category: string) => {
  console.log('Category selected:', category)
}

const handleEventClick = (eventId: string) => {
  console.log('Event clicked:', eventId)
}

const handleEventAction = (eventId: string, action: string) => {
  if (action === 'pay' || action === 'reserve') {
    selectedEvent.value = events.value.find(e => e.id === eventId)
    isModalOpen.value = true
  } else {
    console.log('Event action:', eventId, action)
  }
}

const closeModal = () => {
  isModalOpen.value = false
  selectedEvent.value = null
}
</script>

<template>
  <div class="container mx-auto px-4 py-4">
    <SearchBar @search="handleSearch" />
    <CategoryFilter @category-change="handleCategoryChange" />

    <!-- Bitcoin Mastermind 2025 Passes Horizontal Scroll -->
    <div v-if="mastermindPasses.length" class="mb-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-2">Bitcoin Mastermind 2025 - Pass</h2>
      <div class="flex space-x-4 overflow-x-auto pb-2">
        <EventCard
          v-for="pass in mastermindPasses"
          :key="pass.id"
          :event="pass"
          class="min-w-[260px] max-w-xs flex-shrink-0"
          @card-click="handleEventClick"
          @action-click="handleEventAction"
        />
      </div>
    </div>

    <div class="grid gap-4">
      <EventCard 
        v-for="event in events"
        :key="event.id"
        :event="event"
        @card-click="handleEventClick"
        @action-click="handleEventAction"
      />
    </div>

    <TicketModal 
      :is-open="isModalOpen"
      :event="selectedEvent"
      @close="closeModal"
      @payment="() => {}"
    />
  </div>
</template>