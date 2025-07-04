<script setup lang="ts">
import { useRouter } from 'vue-router'
import logo from '../assets/logo.png'

const router = useRouter()
</script>

<template>
  <header class="bg-white text-black sticky top-0 z-40 shadow">
    <div class="container mx-auto px-4 py-4">
      <div class="flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <img :src="logo" alt="Logo TicketSats" class="h-8 w-auto" />
        </div>
        <div class="flex items-center space-x-4">
          <button class="bg-black bg-opacity-5 p-2 rounded-full hover:bg-opacity-10 transition-colors">
            <i class="fas fa-bell text-black"></i>
          </button>
          <div class="w-8 h-8 rounded-full bg-black bg-opacity-5 flex items-center justify-center hover:bg-opacity-10 transition-colors cursor-pointer"
            @click="router.push('/account')">
            <i class="fas fa-user text-black"></i>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>