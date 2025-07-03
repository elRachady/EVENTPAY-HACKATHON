<script setup lang="ts">
import { ref } from 'vue'
import SearchBar from '../components/SearchBar.vue'
import EventCard from '../components/EventCard.vue'

const completedTickets = ref([
  {
    id: '1',
    title: 'Festival Voodoo 2023',
    location: 'Ouidah',
    date: '24-26 Nov',
    image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    price: 50000,
    category: 'VIP',
    status: 'Payé'
  }
])

const handleSearch = (query: string) => {
  console.log('Searching for:', query)
}

const handleEventClick = (eventId: string) => {
  console.log('Event clicked:', eventId)
}

const handleEventAction = (eventId: string, action: string) => {
  if (action === 'download') {
    console.log('Downloading ticket for:', eventId)
    // Add download logic here
  }
}
</script>

<template>
  <div class="container mx-auto px-4 py-4">
    <SearchBar @search="handleSearch" />
    
    <!-- Navigation Menu -->
    <div class="flex space-x-4 mb-6">
      <router-link 
        to="/my-tickets"
        class="flex-1 text-center py-2 px-4 bg-white border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50"
      >
        En cours
      </router-link>
      <router-link 
        to="/completed-tickets"
        class="flex-1 text-center py-2 px-4 bg-orange-500 text-white rounded-lg font-medium"
      >
        Soldé
      </router-link>
    </div>
    
    <div class="grid gap-4">
      <EventCard 
        v-for="ticket in completedTickets"
        :key="ticket.id"
        :event="ticket"
        :show-progress="true"
        :progress="ticket.price"
        :amount-paid="ticket.price"
        :is-completed="true"
        @card-click="handleEventClick"
        @action-click="handleEventAction"
      />
    </div>
  </div>
</template>