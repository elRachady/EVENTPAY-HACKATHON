<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

interface TicketPlan {
  type: string;
  price: string | number;
  quantity: string | number;
}

interface Partner {
  name: string;
  logo: string;
  description: string;
}

interface EventForm {
  name: string;
  category: string;
  date: string;
  time: string;
  location: string;
  description: string;
  multiPlans: boolean;
  tickets: TicketPlan[];
  partners: Partner[];
  image_url?: string;
}

const formData = ref<EventForm>({
  name: '',
  category: 'concerts',
  date: '',
  time: '',
  location: '',
  description: '',
  multiPlans: true,
  tickets: [
    { type: 'Standard', price: '', quantity: '' }
  ],
  partners: [
    { name: '', logo: '', description: '' }
  ]
});

const categories = [
  { value: 'concerts', label: 'Concerts' },
  { value: 'sports', label: 'Sports' },
  { value: 'conferences', label: 'Conférences' },
  { value: 'festivals', label: 'Festivals' }
];

const addTicketType = () => {
  if (formData.value.multiPlans) {
    formData.value.tickets.push({ type: '', price: '', quantity: '' });
  }
};

const removeTicketType = (index: number) => {
  if (formData.value.tickets.length > 1) {
    formData.value.tickets.splice(index, 1);
  }
};

const addPartner = () => {
  formData.value.partners.push({ name: '', logo: '', description: '' });
};

const removePartner = (index: number) => {
  if (formData.value.partners.length > 1) {
    formData.value.partners.splice(index, 1);
  }
};

const confirmation = ref('');
const error = ref('');
const loading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const validateForm = (): boolean => {
  if (!formData.value.name) {
    error.value = 'Le nom de l\'événement est requis';
    return false;
  }
  
  if (!formData.value.date) {
    error.value = 'La date de l\'événement est requise';
    return false;
  }
  
  if (!formData.value.location) {
    error.value = 'Le lieu de l\'événement est requis';
    return false;
  }
  
  if (formData.value.tickets.some(t => !t.type || !t.price || !t.quantity)) {
    error.value = 'Tous les types de billets doivent avoir un type, un prix et une quantité';
    return false;
  }
  
  return true;
};

const submitForm = async () => {
  confirmation.value = '';
  error.value = '';
  
  if (!validateForm()) {
    return;
  }

  loading.value = true;
  
  try {
    const userItem = localStorage.getItem('user');
    if (!userItem) {
      throw new Error('Utilisateur non connecté');
    }
    
    const user = JSON.parse(userItem);
    const token = user?.auth_token;
    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

    const payload = {
      ...formData.value,
      ticket_plans: formData.value.tickets.map(t => ({
        type: t.type,
        price_sats: Number(t.price),
        quantity: Number(t.quantity)
      })),
      partners: formData.value.partners
    };
    
    // delete payload.tickets;

    const res = await fetch('http://localhost:3005/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || 'Erreur lors de la création de l\'événement');
    }

    confirmation.value = data.message || 'Événement créé avec succès !';
    
    // Redirection après 2 secondes
    setTimeout(() => {
      router.push('/my-events');
    }, 2000);
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Une erreur inconnue est survenue';
    console.error('Erreur:', err);
  } finally {
    loading.value = false;
  }
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  loading.value = true;
  error.value = '';

  try {
    const uploadData = new FormData();
    uploadData.append('file', file);

    const userItem = localStorage.getItem('user');
    if (!userItem) throw new Error('Vous devez être connecté');

    const user = JSON.parse(userItem);
    const token = user?.auth_token;
    if (!token) throw new Error('Session invalide');

    const res = await fetch('http://localhost:3005/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: uploadData
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Échec du téléchargement');
    }

    const data = await res.json();
    if (data.url) {
      formData.value.image_url = data.url;
      confirmation.value = 'Image téléchargée avec succès';
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('Upload error:', err);
  } finally {
    loading.value = false;
    if (fileInput.value) fileInput.value.value = '';
  }
};
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

      <!-- Activer plusieurs plans -->
      <div class="flex items-center mb-4">
        <input
          id="multiPlans"
          type="checkbox"
          v-model="formData.multiPlans"
          class="mr-2"
        >
        <label for="multiPlans" class="text-sm font-medium text-gray-700">
          Activer plusieurs plans (VIP, Premium, Pass, etc.)
        </label>
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
              <input v-model="ticket.price" type="number" min="0" class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors" placeholder="Ex: 15000" required>
            </div>
            <div class="flex items-end space-x-2">
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                <input v-model="ticket.quantity" type="number" min="1" class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors" placeholder="Ex: 100" required>
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
          <p v-if="!formData.image_url" class="text-sm text-gray-500">
            Glissez une image ici ou
            <button 
              type="button" 
              class="text-blue-500 font-medium hover:text-blue-600"
              @click="fileInput?.click()"
            >
              parcourir vos fichiers
            </button>
          </p>
          
          <div v-if="loading" class="mt-2 text-sm text-blue-600">
            Téléchargement en cours...
          </div>
          
          <div v-if="formData.image_url" class="mt-2">
            <p class="text-sm text-green-600 font-medium">
              <i class="fas fa-check-circle mr-1"></i>
              Image téléchargée avec succès
            </p>
            <img 
              :src="formData.image_url" 
              class="mt-2 mx-auto max-h-20 object-contain"
              alt="Aperçu de l'image"
            >
          </div>
          
          <p v-if="error" class="mt-2 text-sm text-red-600">
            {{ error }}
          </p>
          
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
        class="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium transition disabled:opacity-50"
        :disabled="loading"
      >
        {{ loading ? 'Création...' : 'Créer l\'événement' }}
      </button>
      
      <!-- Messages de feedback -->
      <div v-if="confirmation" class="mt-4 p-3 bg-green-100 text-green-700 rounded-lg">
        {{ confirmation }}
      </div>
      <div v-if="error" class="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
        {{ error }}
      </div>
    </form>
  </div>
</template>

<style scoped>
.custom-select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1em;
}
</style>