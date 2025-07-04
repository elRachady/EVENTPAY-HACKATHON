<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const isActive = (routeName: string) => {
  return route.name === routeName
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 z-50">
    <div class="flex justify-around">
      <router-link 
        to="/" 
        class="flex flex-col items-center transition-colors"
        :class="isActive('home') ? 'text-orange-500' : 'text-gray-500'"
      >
        <i class="fas fa-home text-xl"></i>
        <span class="text-xs mt-1">Accueil</span>
      </router-link>
      
      <router-link 
        to="/discover" 
        class="flex flex-col items-center transition-colors"
        :class="isActive('discover') ? 'text-orange-500' : 'text-gray-500'"
      >
        <i class="fas fa-compass text-xl"></i>
        <span class="text-xs mt-1">Découvrir</span>
      </router-link>
      
      <router-link 
        to="/my-tickets" 
        class="flex flex-col items-center transition-colors"
        :class="['my-tickets', 'completed-tickets'].includes(route.name as string) ? 'text-orange-500' : 'text-gray-500'"
      >
        <i class="fas fa-ticket-alt text-xl"></i>
        <span class="text-xs mt-1">Mes tickets</span>
      </router-link>
      
      <router-link 
        to="/my-events" 
        class="flex flex-col items-center transition-colors"
        :class="['my-events', 'create-event'].includes(route.name as string) ? 'text-orange-500' : 'text-gray-500'"
      >
        <i class="fas fa-calendar text-xl"></i>
        <span class="text-xs mt-1">Mes évènements</span>
      </router-link>
    </div>
  </nav>
</template>