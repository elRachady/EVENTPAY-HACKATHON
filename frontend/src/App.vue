<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import BottomNavigation from './components/BottomNavigation.vue'
import { useSession } from './composables/session'

const { user } = useSession()
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader :user="user" />
    <main class="pb-20">
      <RouterView />
    </main>
    <BottomNavigation />
  </div>
</template>