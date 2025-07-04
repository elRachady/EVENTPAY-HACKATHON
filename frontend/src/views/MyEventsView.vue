<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const events = ref<Array<{
  id: string
  title: string
  date: string
  location: string
  image: string
  status: string
  ticketsSold: number
}>>([])

const loading = ref(false)
const error = ref('')

// Image par défaut
const defaultImage = 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = defaultImage
}

const fetchEvents = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const userItem = localStorage.getItem('user')
    if (!userItem) {
      throw new Error('Utilisateur non connecté')
    }
    
    const user = JSON.parse(userItem)
    const token = user?.auth_token
    if (!token) {
      throw new Error('Token d\'authentification manquant')
    }

    const response = await fetch('http://localhost:3005/api/events/organizer', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des événements')
    }

    const data = await response.json()
    const now = new Date()
    
    events.value = data.events.map((event: any) => ({
      id: event.id,
      title: event.name,
      date: event.formatted_date || 
            new Date(event.date).toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric' 
            }) + (event.time ? ', ' + event.time : ''),
      location: event.location,
      image: event.image_url || defaultImage,
      status: new Date(event.date) > now ? 'À venir' : 'Terminé',
      ticketsSold: event.tickets_sold || 0
    }))

  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Une erreur inconnue est survenue'
    console.error('Erreur:', err)
    
    // Données de démo avec image par défaut
    events.value = [
      {
        id: '1',
        title: 'Festival Voodoo 2023',
        date: '15 Dec 2023, 20:00',
        location: 'Stade de l\'Amitié',
        image: defaultImage,
        status: 'En cours',
        ticketsSold: 150
      },
      {
        id: '2',
        title: 'Concert Angélique Kidjo',
        date: '20 Dec 2023, 19:30',
        location: 'Palais des Congrès',
        image: defaultImage,
        status: 'À venir',
        ticketsSold: 50
      }
    ]
  } finally {
    loading.value = false
  }
}

onMounted(fetchEvents)

router.afterEach((to) => {
  if (to.path === '/my-events') {
    fetchEvents()
  }
})
</script>

<template>
  <div class="container mx-auto px-4 py-6 max-w-2xl">
    <!-- Navigation Menu -->
    <div class="flex space-x-4 mb-6">
      <router-link 
        to="/my-events"
        class="px-4 py-2 rounded-lg font-medium transition"
        :class="$route.path === '/my-events' ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'"
      >
        Mes évènements
      </router-link>
      <router-link 
        to="/create-event"
        class="px-4 py-2 rounded-lg font-medium transition"
        :class="$route.path === '/create-event' ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'"
      >
        Créer un événement
      </router-link>
    </div>

    <h1 class="text-2xl font-bold text-gray-800 mb-6">Mes Événements</h1>
    
    <!-- Message de chargement -->
    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
      <p class="mt-2 text-gray-600">Chargement des événements...</p>
    </div>
    
    <!-- Message d'erreur -->
    <div v-if="error" class="p-4 mb-4 bg-red-100 text-red-700 rounded-lg">
      {{ error }}
      <button @click="fetchEvents" class="ml-2 text-orange-600 font-medium">Réessayer</button>
    </div>
    
    <!-- Liste des événements -->
    <div v-if="!loading" class="space-y-4">
      <div 
        v-for="event in events"
        :key="event.id"
        class="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="flex justify-between items-start">
          <div class="flex space-x-4">
            <img 
              :src="event.image" 
              :alt="event.title" 
              class="w-24 h-24 rounded-lg object-cover"
              @error="handleImageError"
            >
            <div>
              <h3 class="font-semibold text-gray-800">{{ event.title }}</h3>
              <p class="text-sm text-gray-500 mt-1">
                <i class="fas fa-calendar-alt mr-2"></i>{{ event.date }}
              </p>
              <p class="text-sm text-gray-500 mt-1">
                <i class="fas fa-map-marker-alt mr-2"></i>{{ event.location }}
              </p>
              <div class="mt-2 flex items-center space-x-2">
                <span 
                  class="px-2 py-1 text-xs rounded-full"
                  :class="event.status === 'En cours' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'"
                >
                  {{ event.status }}
                </span>
                <span class="text-sm text-gray-500">{{ event.ticketsSold }} billets vendus</span>
              </div>
            </div>
          </div>
          <button class="text-gray-400 hover:text-gray-600 transition-colors">
            <i class="fas fa-ellipsis-v"></i>
          </button>
        </div>
      </div>
      
      <!-- Message si aucun événement -->
      <div v-if="events.length === 0 && !loading" class="text-center py-8">
        <i class="fas fa-calendar-alt text-4xl text-gray-300 mb-2"></i>
        <p class="text-gray-500">Vous n'avez pas encore créé d'événement</p>
        <router-link 
          to="/create-event"
          class="mt-4 inline-block px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
        >
          Créer un événement
        </router-link>
      </div>
    </div> 
  </div>
</template>