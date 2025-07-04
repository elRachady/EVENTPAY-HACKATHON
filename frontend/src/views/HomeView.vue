<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import SearchBar from '../components/SearchBar.vue'
import CategoryFilter from '../components/CategoryFilter.vue'
import EventCard from '../components/EventCard.vue'
import TicketModal from '../components/TicketModal.vue'

const router = useRouter()

/* ========== DONNÉES STATIQUES (Votre design original) ========== */
const staticFeaturedEvents = [
  {
    id: 'static-1',
    title: 'Concert Yemi Alade',
    location: 'Canal Olympia, Cotonou',
    date: '12 Juil',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80',
    price: 25000,
    category: 'Concerts',
    installmentAvailable: true
  },
  {
    id: 'static-2',
    title: 'Championnat National de Football',
    location: 'Stade de l\'Amitié',
    date: '20 Juil',
    image: 'https://images.unsplash.com/photo-1505843273132-bc5c6e6e6c8e?auto=format&fit=crop&w=500&q=80',
    price: 5000,
    category: 'Sports',
    installmentAvailable: false
  }
]

const staticUpcomingEvents = [
  {
    id: 'static-3',
    title: 'Conférence Tech Africa',
    location: 'Novotel, Cotonou',
    date: '5 Août',
    image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=500&q=80',
    price: 10000,
    category: 'Conférences',
  },
  {
    id: 'static-4',
    title: 'Festival Wémèxwé',
    location: 'Sè',
    date: '18-20 Août',
    image: 'https://images.unsplash.com/photo-1509395176047-4a66953fd231?auto=format&fit=crop&w=500&q=80',
    price: 8000,
    category: 'Festivals',
  },
  {
    id: 'static-5',
    title: 'Fête du Vodoun',
    location: 'Ouidah',
    date: '10 Janv',
    image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=500&q=80',
    price: 0,
    category: 'Festivals',
  },
  {
    id: 'static-6',
    title: 'Salon International du Tourisme',
    location: 'Cotonou',
    date: '2-5 Déc',
    image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=500&q=80',
    price: 10000,
    category: 'Conférences',
  }
]

const staticTickets = [
  {
    id: 'static-ticket-1',
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
]

/* ========== DONNÉES DYNAMIQUES ========== */
const dynamicEvents = ref<any[]>([])
const loading = ref(false)
const error = ref('')
const isModalOpen = ref(false)
const selectedEvent = ref<any>(null)
const defaultImage = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=500&q=80'

// Récupère les événements réels depuis l'API
const fetchDynamicEvents = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await fetch('http://localhost:3005/api/events/latest')
    
    if (!response.ok) throw new Error('Erreur réseau')
    
    const data = await response.json()
    
    if (!data.success) throw new Error('API error')
    if (!data.events) throw new Error('Aucun événement trouvé')
    
    dynamicEvents.value = data.events.map((e: any) => ({
      id: `real-${e.id}`,
      title: e.name,
      location: e.location,
      date: new Date(e.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      image: e.image_url || defaultImage,
      price: e.min_price || 10000,
      category: e.category || 'Événement',
      status: 'Nouveau',
      isRealEvent: true
    }))
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error("Erreur:", err)
  } finally {
    loading.value = false
  }
}

/* ========== FUSION DES DONNÉES ========== */
const featuredEvents = ref([...staticFeaturedEvents])
const upcomingEvents = ref([...staticUpcomingEvents])
const ticketsEnCours = ref([...staticTickets])

// Combine les données après chargement
onMounted(() => {
  fetchDynamicEvents().then(() => {
    if (dynamicEvents.value.length > 0) {
      // Ajoute 2 événements réels en vedette
      featuredEvents.value = [
        dynamicEvents.value[0],
        dynamicEvents.value[1],
        ...staticFeaturedEvents
      ].slice(0, 4) // Limite à 4 éléments max
      
      // Ajoute le reste aux événements à venir
      upcomingEvents.value = [
        ...dynamicEvents.value.slice(2),
        ...staticUpcomingEvents
      ].slice(0, 4) // Limite à 4 éléments max
    }
  })
})

/* ========== GESTION DES INTERACTIONS ========== */
const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  if (target) target.src = defaultImage
}

const handleSearch = (query: string) => {
  console.log('Recherche:', query)
}

const handleCategoryChange = (category: string) => {
  console.log('Catégorie:', category)
}

const handleEventClick = (eventId: string) => {
  console.log('Événement cliqué:', eventId)
}

const handleEventAction = (eventId: string, action: string) => {
  if (action === 'pay' || action === 'reserve') {
    const allEvents = [
      ...featuredEvents.value,
      ...upcomingEvents.value,
      ...ticketsEnCours.value
    ]
    const event = allEvents.find(e => e.id === eventId)
    
    if (event) {
      selectedEvent.value = {
        ...event,
        status: event.status || 'Nouveau', // Valeur par défaut
        address: '', // Ajoutez si nécessaire
        partners: [], // Ajoutez si nécessaire
        paidAmount: event.amountPaid || 0 // Pour les paiements échelonnés
      }
    }
    
    isModalOpen.value = true
  }
}

const closeModal = () => {
  isModalOpen.value = false
  selectedEvent.value = null
}

const handlePayment = (paymentData: any) => {
  console.log('Paiement initié:', paymentData)
  // Redirige vers la page de paiement
  router.push({
    name: 'ticket-invoice',
    query: {
      eventTitle: selectedEvent.value?.title,
      amount: paymentData.amount,
      paymentType: paymentData.type
    }
  })
}
</script>

<template>
  <div class="container mx-auto px-4 py-4">
    <!-- BARRE DE RECHERCHE -->
    <SearchBar @search="handleSearch" />
    <CategoryFilter @category-change="handleCategoryChange" />
    
    <!-- SECTION TICKETS EN COURS -->
    <div v-if="ticketsEnCours.length" class="mb-8">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-800">Mes tickets</h2>
        <router-link 
          to="/my-tickets" 
          class="text-orange-500 font-medium flex items-center"
        >
          Voir tout <i class="fas fa-arrow-right ml-2"></i>
        </router-link>
      </div>
      
      <div class="grid gap-4">
        <EventCard 
          v-for="ticket in ticketsEnCours"
          :key="ticket.id"
          :event="ticket"
          :show-progress="true"
          :progress="ticket.progress"
          :amount-paid="ticket.amountPaid"
          @action-click="handleEventAction"
        />
      </div>
    </div>

    <!-- SECTION ÉVÉNEMENTS VEDETTES -->
    <div class="mb-8">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-800">Événements populaires</h2>
        <router-link 
          to="/events" 
          class="text-orange-500 font-medium flex items-center"
        >
          Voir tout <i class="fas fa-arrow-right ml-2"></i>
        </router-link>
      </div>
      
      <div v-if="loading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
      </div>
      
      <div v-if="error" class="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
        {{ error }} <button @click="fetchDynamicEvents" class="font-semibold ml-2">Réessayer</button>
      </div>
      
      <div class="grid md:grid-cols-2 gap-6">
        <EventCard 
          v-for="event in featuredEvents"
          :key="event.id"
          :event="event"
          @action-click="handleEventAction"
        />
      </div>
    </div>

    <!-- SECTION PROCHAINS ÉVÉNEMENTS -->
    <div class="mb-8">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-800">À ne pas manquer</h2>
        <router-link 
          to="/events" 
          class="text-orange-500 font-medium flex items-center"
        >
          Voir tout <i class="fas fa-arrow-right ml-2"></i>
        </router-link>
      </div>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="event in upcomingEvents"
          :key="event.id"
          class="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          @click="handleEventClick(event.id)"
        >
          <div class="relative pb-[60%]">
            <img
              :src="event.image"
              :alt="event.title"
              class="absolute h-full w-full object-cover"
              @error="handleImageError"
            >
          </div>
          <div class="p-4">
            <h3 class="font-bold text-gray-800 line-clamp-2">{{ event.title }}</h3>
            <p class="text-sm text-gray-500 mt-1 flex items-center">
              <i class="fas fa-map-marker-alt mr-2"></i>
              <span class="line-clamp-1">{{ event.location }}</span>
            </p>
            <p class="text-sm text-gray-500 mt-1">
              <i class="fas fa-calendar-day mr-2"></i>
              {{ event.date }}
            </p>
            <div class="flex justify-between items-center mt-3">
              <span class="font-bold text-orange-500">
                {{ event.price === 0 ? 'Gratuit' : `${event.price.toLocaleString()} SATS` }}
              </span>
              <button
                class="w-8 h-8 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center hover:bg-orange-200 transition"
                @click.stop="handleEventAction(event.id, 'pay')"
              >
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL DE PAIEMENT -->
    <TicketModal  
      v-if="selectedEvent"
      :is-open="isModalOpen"
      :event="selectedEvent"
      @close="closeModal"
      @payment="handlePayment"
    />
  </div>
</template>

<style scoped>
/* Animations fluides */
.event-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.event-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

/* Style personnalisé pour les liens */
.router-link-active {
  @apply text-orange-600;
}
</style>