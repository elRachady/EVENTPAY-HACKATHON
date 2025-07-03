<script setup lang="ts">
import { ref } from 'vue'

const formData = ref({
  name: '',
  category: 'concerts',
  date: '',
  time: '',
  location: '',
  description: '',
  tickets: [
    { type: 'Standard', price: '', quantity: '' }
  ],
  partners: [
    { name: '', logo: '', description: '' }
  ]
})

const categories = [
  { value: 'concerts', label: 'Concerts' },
  { value: 'sports', label: 'Sports' },
  { value: 'conferences', label: 'Conférences' },
  { value: 'festivals', label: 'Festivals' }
]

const addTicketType = () => {
  formData.value.tickets.push({ type: '', price: '', quantity: '' })
}
const removeTicketType = (index: number) => {
  if (formData.value.tickets.length > 1) formData.value.tickets.splice(index, 1)
}

const addPartner = () => {
  formData.value.partners.push({ name: '', logo: '', description: '' })
}
const removePartner = (index: number) => {
  if (formData.value.partners.length > 1) formData.value.partners.splice(index, 1)
}

const submitForm = () => {
  console.log('Creating event:', formData.value)
  // Add form submission logic here
}

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    console.log('File uploaded:', target.files[0])
    // Add file upload logic here
  }
}

const fileInput = ref(null)
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

    <h1 class="text-2xl font-bold text-gray-800 mb-6">Créer un événement</h1>
    
    <form @submit.prevent="submitForm" class="space-y-6">
      <!-- Informations de base -->
      <div class="bg-white rounded-xl p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Informations de base</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nom de l'événement</label>
            <input 
              v-model="formData.name"
              type="text" 
              class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors" 
              placeholder="Ex: Festival Voodoo 2023"
              required
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <select 
              v-model="formData.category"
              class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 custom-select transition-colors"
            >
              <option v-for="category in categories" :key="category.value" :value="category.value">
                {{ category.label }}
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input 
                v-model="formData.date"
                type="date" 
                class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                required
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Heure</label>
              <input 
                v-model="formData.time"
                type="time" 
                class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                required
              >
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
            <input 
              v-model="formData.location"
              type="text" 
              class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors" 
              placeholder="Ex: Stade de l'Amitié"
              required
            >
          </div>
        </div>
      </div>

      <!-- Billetterie -->
      <div class="bg-white rounded-xl p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Billetterie</h2>
        <div class="space-y-4">
          <div v-for="(ticket, idx) in formData.tickets" :key="idx" class="grid grid-cols-3 gap-4 items-end">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <input v-model="ticket.type" type="text" class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors" placeholder="Ex: Standard, VIP" required>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Prix (SATS)</label>
              <input v-model="ticket.price" type="number" class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors" placeholder="Ex: 15000" required>
            </div>
            <div class="flex items-end space-x-2">
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                <input v-model="ticket.quantity" type="number" class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors" placeholder="Ex: 100" required>
              </div>
              <button type="button" @click="removeTicketType(idx)" v-if="formData.tickets.length > 1" class="ml-2 text-red-500 hover:text-red-700 text-lg font-bold">&times;</button>
            </div>
          </div>
          <button type="button" @click="addTicketType" class="mt-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition">+ Ajouter un type de billet</button>
        </div>
      </div>

      <!-- Description -->
      <div class="bg-white rounded-xl p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Description</h2>
        
        <div>
          <textarea 
            v-model="formData.description"
            class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 h-32 transition-colors" 
            placeholder="Décrivez votre événement..."
          ></textarea>
        </div>
      </div>

      <!-- Image -->
      <div class="bg-white rounded-xl p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Image de l'événement</h2>
        
        <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <i class="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
          <p class="text-sm text-gray-500">Glissez une image ici ou</p>
          <button 
            type="button" 
            class="text-blue-500 font-medium text-sm mt-1 hover:text-blue-600"
            @click="fileInput.value && fileInput.value.click()"
          >
            parcourir vos fichiers
          </button>
          <input 
            ref="fileInput"
            type="file" 
            class="hidden" 
            accept="image/*"
            @change="handleFileUpload"
          >
        </div>
      </div>

      <!-- Partenaires -->
      <div class="bg-white rounded-xl p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Partenaires</h2>
        <div class="space-y-4">
          <div v-for="(partner, idx) in formData.partners" :key="idx" class="grid grid-cols-3 gap-4 items-end">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nom du partenaire</label>
              <input v-model="partner.name" type="text" class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-black focus:ring-2 focus:ring-black transition-colors" placeholder="Nom du partenaire" required>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Logo (URL)</label>
              <input v-model="partner.logo" type="text" class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-black focus:ring-2 focus:ring-black transition-colors" placeholder="Lien du logo">
            </div>
            <div class="flex items-end space-x-2">
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input v-model="partner.description" type="text" class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-black focus:ring-2 focus:ring-black transition-colors" placeholder="Description courte">
              </div>
              <button type="button" @click="removePartner(idx)" v-if="formData.partners.length > 1" class="ml-2 text-red-500 hover:text-red-700 text-lg font-bold">&times;</button>
            </div>
          </div>
          <button type="button" @click="addPartner" class="mt-2 px-4 py-2 rounded-lg bg-black text-white font-medium hover:bg-gray-900 transition">+ Ajouter un partenaire</button>
        </div>
      </div>

      <!-- Submit Button -->
      <button 
        type="submit" 
        class="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium transition"
      >
        Créer l'événement
      </button>
    </form>
  </div>
</template>