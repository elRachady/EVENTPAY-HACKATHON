<script setup lang="ts">
import { ref } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import BottomNavigation from './components/BottomNavigation.vue'
import AccountDetailsModal from './components/AccountDetailsModal.vue'

const router = useRouter()
const showAccountModal = ref(false)

function logout() {
  localStorage.removeItem('user')
  router.push('/login')
  showAccountModal.value = false
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader @show-account="showAccountModal = true" />
    <AccountDetailsModal :show="showAccountModal" @close="showAccountModal = false" @logout="logout" />
    <main class="pb-20">
      <RouterView />
    </main>
    <BottomNavigation />
  </div>
</template>