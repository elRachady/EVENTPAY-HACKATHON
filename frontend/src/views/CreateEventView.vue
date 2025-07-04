<!-- homeView.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SearchBar from '../components/SearchBar.vue'
import CategoryFilter from '../components/CategoryFilter.vue'
import EventCard from '../components/EventCard.vue'
import TicketModal from '../components/TicketModal.vue'

const featuredEvents = ref([])
const upcomingEvents = ref([])
const ticketsEnCours = ref([])

const fetchEvents = async () => {
  try {
    // Récupérer les 2 derniers événements publiés
    const latestResponse = await fetch('/api/events/latest')
    const latestData = await latestResponse.json()
    if (latestData.success) {
      featuredEvents.value = latestData.events.map(event => ({
        ...event,
        title: event.name,
        price: 10000, // Valeur par défaut ou à récupérer depuis ticket_plans
        date: new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        installmentAvailable: true
      }))
    }

    // Récupérer les événements à venir (exemple)
    const upcomingResponse = await fetch('/api/events/upcoming')
    const upcomingData = await upcomingResponse.json()
    if (upcomingData.success) {
      upcomingEvents.value = upcomingData.events.map(event => ({
        ...event,
        title: event.name,
        price: 8000, // Valeur par défaut ou à récupérer depuis ticket_plans
        date: new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      }))
    }

    // Récupérer les tickets en cours de paiement (si utilisateur connecté)
    const token = localStorage.getItem('token')
    if (token) {
      const ticketsResponse = await fetch('/api/user/tickets', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const ticketsData = await ticketsResponse.json()
      if (ticketsData.success) {
        ticketsEnCours.value = ticketsData.tickets
          .filter(t => t.status === 'pending')
          .map(ticket => ({
            id: ticket.id,
            title: ticket.event_name,
            location: ticket.event_location,
            date: new Date(ticket.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
            image: ticket.event_image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
            price: ticket.total_amount,
            category: ticket.plan_type,
            status: 'En cours de paiement',
            progress: ticket.amount_paid,
            amountPaid: ticket.amount_paid
          }))
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des événements:', error)
  }
}

onMounted(() => {
  fetchEvents()
})

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
  const allEvents = [...featuredEvents.value, ...upcomingEvents.value, ...ticketsEnCours.value]
  const ticket = allEvents.find(e => e.id === eventId)
  
  if (ticket && (action === 'pay' || action === 'reserve')) {
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
      <div class="flex justify-between items-center mb-3">
        <h2 class="text-lg font-semibold text-gray-800">Événements récents</h2>
        <router-link to="/events" class="text-sm text-blue-500 font-medium">Voir tout</router-link>
      </div>
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
        <router-link to="/events" class="text-sm text-blue-500 font-medium">Voir tout</router-link>
      </div>
      
      <div class="grid grid-cols-2 gap-3">
        <div 
          v-for="event in upcomingEvents"
          :key="event.id"
          class="event-card bg-white rounded-lg overflow-hidden border border-gray-100 shadow-sm cursor-pointer"
          @click="handleEventClick(event.id)"
        >
          <img :src="event.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80'" 
               :alt="event.title" 
               class="w-full h-24 object-cover">
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