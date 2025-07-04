<script setup lang="ts">
import { ref } from 'vue'

const events = ref([
  {
    id: '1',
    title: 'Festival Voodoo 2023',
    date: '15 Dec 2023, 20:00',
    location: 'Stade de l\'Amitié',
    image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    status: 'En cours',
    ticketsSold: 150
  },
  {
    id: '2',
    title: 'Concert Angélique Kidjo',
    date: '20 Dec 2023, 19:30',
    location: 'Palais des Congrès',
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    status: 'À venir',
    ticketsSold: 50
  }
])
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
        Créer un évènement
      </router-link>
    </div>

    <h1 class="text-2xl font-bold text-gray-800 mb-6">Mes Événements</h1>
    
    <!-- Liste des événements -->
    <div class="space-y-4">
      <div 
        v-for="event in events"
        :key="event.id"
        class="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="flex justify-between items-start">
          <div class="flex space-x-4">
            <img :src="event.image" :alt="event.title" class="w-24 h-24 rounded-lg object-cover">
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
    </div>
  </div>
</template>