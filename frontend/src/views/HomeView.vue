<!-- homeView.vue -->

<script setup lang="ts">
import { ref } from 'vue'
import SearchBar from '../components/SearchBar.vue'
import CategoryFilter from '../components/CategoryFilter.vue'
import EventCard from '../components/EventCard.vue'
import TicketModal from '../components/TicketModal.vue'

const featuredEvents = ref([
  {
    id: '1',
    title: 'Concert Yemi Alade',
    location: 'Canal Olympia, Cotonou',
    date: '12 Juil',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80',
    price: 25000,
    category: 'Concerts',
    installmentAvailable: true
  },
  {
    id: '2',
    title: 'Championnat National de Football',
    location: 'Stade de l’Amitié',
    date: '20 Juil',
    image: 'https://images.unsplash.com/photo-1505843273132-bc5c6e6e6c8e?auto=format&fit=crop&w=500&q=80',
    price: 5000,
    category: 'Sports',
    installmentAvailable: false
  }
])

const upcomingEvents = ref([
  {
    id: '3',
    title: 'Conférence Tech Africa',
    location: 'Novotel, Cotonou',
    date: '5 Août',
    image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=500&q=80',
    price: 10000,
    category: 'Conférences',
  },
  {
    id: '4',
    title: 'Festival Wémèxwé',
    location: 'Sè',
    date: '18-20 Août',
    image: 'https://images.unsplash.com/photo-1509395176047-4a66953fd231?auto=format&fit=crop&w=500&q=80',
    price: 8000,
    category: 'Festivals',
  },
  {
    id: '5',
    title: 'Fête du Vodoun',
    location: 'Ouidah',
    date: '10 Janv',
    image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=500&q=80',
    price: 0,
    category: 'Festivals',
  },
  {
    id: '6',
    title: 'Salon International du Tourisme',
    location: 'Cotonou',
    date: '2-5 Déc',
    image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=500&q=80',
    price: 10000,
    category: 'Conférences',
  }
])

const ticketsEnCours = ref([
  {
    id: '1',
    title: 'Festival Voodoo 2023',
    location: 'Ouidah',
    date: '24-26 Nov',
    image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    price: 50000,
    category: 'VIP',
    status: 'En cours de paiement',
    progress: 12500,
    amountPaid: 12500
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
    let ticket = ticketsEnCours.value.find(t => t.id === eventId) || featuredEvents.value.find(e => e.id === eventId) || upcomingEvents.value.find(e => e.id === eventId)
    selectedEvent.value = ticket
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
    
    <!-- Tickets en cours de paiement -->
    <div v-if="ticketsEnCours.length" class="mb-6">
      <div class="flex justify-between items-center mb-3">
        <h2 class="text-lg font-semibold text-gray-800">Tickets en cours de paiement</h2>
        <router-link to="/my-tickets" class="text-sm text-blue-500 font-medium">Voir tout</router-link>
      </div>
      <div class="grid gap-4">
        <EventCard 
          v-for="ticket in ticketsEnCours"
          :key="ticket.id"
          :event="ticket"
          :show-progress="true"
          :progress="ticket.progress"
          :amount-paid="ticket.amountPaid"
          @card-click="handleEventClick"
          @action-click="handleEventAction"
        />
      </div>
    </div>
    
    <!-- Featured Events -->
    <div class="mb-6">
      <div class="grid gap-4">
        <EventCard 
          v-for="event in featuredEvents"
          :key="event.id"
          :event="event"
          @card-click="handleEventClick"
          @action-click="handleEventAction"
        />
      </div>
    </div>
    
    <!-- Upcoming Events -->
    <div class="mb-6">
      <div class="flex justify-between items-center mb-3">
        <h2 class="text-lg font-semibold text-gray-800">Prochains événements</h2>
        <a href="#" class="text-sm text-blue-500 font-medium">Voir tout</a>
      </div>
      
      <div class="grid grid-cols-2 gap-3">
        <div 
          v-for="event in upcomingEvents"
          :key="event.id"
          class="event-card bg-white rounded-lg overflow-hidden border border-gray-100 shadow-sm cursor-pointer"
          @click="handleEventClick(event.id)"
        >
          <img :src="event.image" :alt="event.title" class="w-full h-24 object-cover">
          <div class="p-3">
            <h3 class="font-medium text-sm text-gray-800 truncate">{{ event.title }}</h3>
            <p class="text-xs text-gray-500 mt-1">{{ event.date }} • {{ event.location }}</p>
            <div class="flex justify-between items-center mt-2">
              <p class="text-xs font-medium text-blue-500">
                {{ event.price === 0 ? 'Gratuit' : `À partir de ${event.price.toLocaleString()} SATS` }}
              </p>
              <button class="text-blue-500 hover:text-blue-600 transition-colors">
                <i class="fas fa-plus-circle"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Ticket Modal (for pay and reserve) -->
    <TicketModal 
      :is-open="isModalOpen"
      :event="selectedEvent"
      @close="closeModal"
      @payment="() => {}"
    />
  </div>
</template>