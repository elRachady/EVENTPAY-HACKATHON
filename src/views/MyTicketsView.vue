<script setup lang="ts">
import { ref } from 'vue'
import SearchBar from '../components/SearchBar.vue'
import CategoryFilter from '../components/CategoryFilter.vue'
import EventCard from '../components/EventCard.vue'
import TicketModal from '../components/TicketModal.vue'

const tickets = ref([
  {
    id: '1',
    title: 'Festival Voodoo 2023',
    location: 'Ouidah',
    date: '24-26 Nov',
    image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    price: 50000,
    category: 'VIP',
    status: 'En cours de paiement'
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
  selectedEvent.value = tickets.value.find(t => t.id === eventId)
  isModalOpen.value = true
}

const handleEventAction = (eventId: string, action: string) => {
  if (action === 'pay' || action === 'reserve') {
    selectedEvent.value = tickets.value.find(t => t.id === eventId)
    isModalOpen.value = true
  } else {
    console.log('Event action:', eventId, action)
  }
}

const closeModal = () => {
  isModalOpen.value = false
  selectedEvent.value = null
}

const handlePayment = (action: string) => {
  console.log('Payment action:', action)
  closeModal()
}
</script>

<template>
  <div class="container mx-auto px-4 py-4">
    <SearchBar @search="handleSearch" />
    
    <!-- Navigation Menu -->
    <div class="flex space-x-4 mb-6">
      <router-link 
        to="/my-tickets"
        class="flex-1 text-center py-2 px-4 rounded-lg font-medium"
        :class="$route.path === '/my-tickets' ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'"
      >
        En cours
      </router-link>
      <router-link 
        to="/completed-tickets"
        class="flex-1 text-center py-2 px-4 rounded-lg font-medium"
        :class="$route.path === '/completed-tickets' ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'"
      >
        Soldé
      </router-link>
    </div>
    
    <CategoryFilter @category-change="handleCategoryChange" />
    
    <div class="grid gap-4">
      <EventCard 
        v-for="ticket in tickets"
        :key="ticket.id"
        :event="ticket"
        :show-progress="true"
        :progress="12500"
        :amount-paid="12500"
        @card-click="handleEventClick"
        @action-click="handleEventAction"
      />
    </div>
    
    <TicketModal 
      :is-open="isModalOpen"
     
    />
  </div>
</template>