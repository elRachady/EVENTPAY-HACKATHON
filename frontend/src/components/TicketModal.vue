<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import EventPartnersModal from './EventPartnersModal.vue'

interface EventDetail {
  id: string
  title: string
  date: string
  location: string
  category: string
  image: string
  price: number
  status?: string
  address?: string
  partners?: any[]
  paidAmount?: number
  installmentAvailable?: boolean
}

const props = defineProps<{
  isOpen: boolean
  event: EventDetail | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'payment', action: string): void
}>()

const router = useRouter()
const loading = ref(false)
const error = ref('')
const showInstallmentInput = ref(false)
const installmentAmount = ref('')
const showPartners = ref(false)

watch(() => props.isOpen, (open) => {
  if (open) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = 'auto'
    resetState()
  }
})

function resetState() {
  showInstallmentInput.value = false
  installmentAmount.value = ''
  showPartners.value = false
  error.value = ''
}

function closeModal() {
  emit('close')
}

function handlePayment(action: string) {
  if (!props.event) return

  // Calcul du montant restant
  const paid = props.event.paidAmount || 0
  const remainingAmount = props.event.price - paid
  
  if (action === 'installment') {
    showInstallmentInput.value = true
    return
  }

  if (action === 'full') {
    router.push({
      name: 'ticket-invoice',
      query: {
        eventTitle: props.event.title,
        eventDate: props.event.date,
        eventLocation: props.event.location,
        satsAmount: remainingAmount,
        xofAmount: Math.round(remainingAmount * 0.39),
        paymentType: 'full',
        address: props.event.address || '',
        qr: props.event.address || '',
      }
    })
    return
  }

  if (action.startsWith('installment-')) {
    const amount = parseInt(action.split('-')[1])
    const validAmount = Math.min(
      Math.max(amount, 1000), // Minimum 1000 sats
      remainingAmount
    )

    router.push({
      name: 'ticket-invoice',
      query: {
        eventTitle: props.event.title,
        eventDate: props.event.date,
        eventLocation: props.event.location,
        satsAmount: validAmount,
        xofAmount: Math.round(validAmount * 0.39),
        paymentType: 'installment',
        installmentAmount: validAmount,
        address: props.event.address || '',
        qr: props.event.address || '',
      }
    })
    showInstallmentInput.value = false
    installmentAmount.value = ''
    return
  }

  emit('payment', action)
}
</script>

<template>
  <teleport to="body">
    <div 
      v-if="isOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="closeModal"
    >
      <div 
        class="bg-white rounded-xl w-full max-w-sm mx-4 max-h-[90vh] overflow-y-auto animate-slide-up"
        @click.stop
      >
        <div class="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h3 class="font-bold text-lg">Détails du billet</h3>
          <button 
            @click="closeModal" 
            class="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Fermer la modal"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="p-4">
          <!-- État de chargement -->
          <template v-if="loading">
            <div class="text-center py-10">
              <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p class="text-gray-500">Chargement des détails...</p>
            </div>
          </template>

          <!-- Erreur -->
          <template v-else-if="error">
            <div class="text-center py-10 text-red-600">
              <i class="fas fa-exclamation-triangle text-2xl mb-3"></i>
              <p class="mb-4">{{ error }}</p>
              <button 
                @click="fetchEventDetails"
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Réessayer
              </button>
            </div>
          </template>

          <!-- Affichage des détails de l'événement -->
          <template v-else-if="event">
            <div class="rounded-xl overflow-hidden mb-4">
              <img 
                :src="event.image" 
                :alt="event.title" 
                class="w-full h-48 object-cover"
                @error="event.image = '/placeholder-event.jpg'"
              />
            </div>

            <div class="mb-6">
              <h2 class="text-xl font-bold mb-1 flex items-center">
                {{ event.title }}
                <button 
                  v-if="event.partners?.length"
                  @click.stop="showPartners = true"
                  class="ml-3 bg-yellow-300 hover:bg-yellow-400 text-yellow-900 px-3 py-1 rounded text-xs font-semibold transition flex items-center shadow"
                >
                  <i class="fas fa-handshake mr-2"></i> Partenaires
                </button>
              </h2>
              
              <p class="text-gray-600 mb-3">
                <i class="fas fa-map-marker-alt mr-1"></i> {{ event.location }} 
                • <i class="fas fa-calendar-alt ml-2 mr-1"></i> {{ event.date }}
              </p>
              
              <div class="flex items-center space-x-2 mb-3">
                <span class="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm">
                  {{ event.category }}
                </span>
                <span class="text-sm text-gray-500">
                  <i class="fas fa-ticket-alt mr-1"></i> Billet numérique
                </span>
              </div>
              
              <!-- Bloc statut de paiement -->
              <div class="bg-gray-50 rounded-lg p-3 mb-4">
                <div class="flex justify-between mb-2">
                  <span class="text-gray-600">Statut:</span>
                  <span 
                    :class="{
                      'text-blue-600': event.status === 'En cours de paiement',
                      'text-gray-500': event.status !== 'En cours de paiement'
                    }"
                    class="font-medium"
                  >
                    {{ event.status === 'En cours de paiement' ? 'Paiement en cours' : 'Nouveau paiement' }}
                  </span>
                </div>
                
                <div class="flex justify-between mb-1">
                  <span class="text-gray-600">Total:</span>
                  <span class="font-medium">{{ event.price.toLocaleString() }} SATS</span>
                </div>
                
                <template v-if="event.status === 'En cours de paiement' && event.paidAmount">
                  <div class="flex justify-between mb-1">
                    <span class="text-gray-600">Payé:</span>
                    <span class="font-medium">{{ event.paidAmount.toLocaleString() }} SATS</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Reste:</span>
                    <span class="font-medium">
                      {{ (event.price - event.paidAmount).toLocaleString() }} SATS
                    </span>
                  </div>
                </template>
              </div>
              
              <!-- Barre de progression -->
              <div 
                v-if="event.status === 'En cours de paiement' && event.paidAmount"
                class="mb-4"
              >
                <div class="flex justify-between text-sm mb-1">
                  <span>Progression:</span>
                  <span>
                    {{ Math.round((event.paidAmount / event.price) * 100) }}% complété
                  </span>
                </div>
                <div class="progress-bar bg-gray-200 rounded h-2 overflow-hidden">
                  <div
                    class="progress-fill bg-blue-600 h-2"
                    :style="{ width: `${(event.paidAmount / event.price) * 100}%` }"
                  ></div>
                </div>
              </div>
              
              <!-- Avertissement -->
              <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm mb-4">
                <p class="font-medium text-yellow-800 flex items-start">
                  <i class="fas fa-exclamation-circle mt-1 mr-2"></i>
                  Veuillez compléter votre paiement avant la date de l'événement pour obtenir votre billet.
                </p>
              </div>
            </div>
            
            <!-- Options de paiement -->
            <div class="mb-6">
              <h3 class="font-semibold mb-3 text-lg">
                <i class="fas fa-credit-card mr-2"></i> Options de paiement
              </h3>
              
              <!-- Paiement en SATS -->
              <div class="mb-4">
                <h4 class="font-medium text-gray-700 mb-2 flex items-center">
                  <i class="fas fa-coins text-yellow-500 mr-2"></i> Paiement en SATS
                </h4>
                
                <div class="space-y-3">
                  <!-- Paiement complet -->
                  <div 
                    class="payment-option border border-gray-200 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
                    @click="handlePayment('full')"
                  >
                    <div class="flex items-center">
                      <div class="bg-blue-100 text-blue-600 p-2 rounded-full mr-3">
                        <i class="fas fa-bolt"></i>
                      </div>
                      <div>
                        <p class="font-medium">Paiement complet</p>
                        <p class="text-xs text-gray-500">
                          {{
                            event.status === 'En cours de paiement' 
                              ? (event.price - (event.paidAmount || 0)).toLocaleString() 
                              : event.price.toLocaleString()
                          }} SATS
                        </p>
                      </div>
                    </div>
                    <i class="fas fa-chevron-right text-gray-400"></i>
                  </div>
                  
                  <!-- Paiement échelonné -->
                  <div 
                    class="payment-option border border-green-200 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-green-300 bg-green-50 hover:shadow-sm transition-all"
                    @click="handlePayment('installment')"
                  >
                    <div class="flex items-center">
                      <div class="bg-green-100 text-green-600 p-2 rounded-full mr-3">
                        <i class="fas fa-calendar-plus"></i>
                      </div>
                      <div>
                        <p class="font-medium">Paiement échelonné</p>
                        <p class="text-xs text-gray-500">Choisissez votre montant</p>
                      </div>
                    </div>
                    <i class="fas fa-chevron-right text-gray-400"></i>
                  </div>
                  
                  <!-- Saisie du montant échelonné -->
                  <div 
                    v-if="showInstallmentInput" 
                    class="mt-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Montant à payer (SATS)
                    </label>
                    <input 
                      v-model.number="installmentAmount"
                      type="number"
                      :min="1000"
                      :max="event.price - (event.paidAmount || 0)"
                      class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-colors"
                      placeholder="Ex: 5000"
                    >
                    <button 
                      class="mt-3 w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium transition flex items-center justify-center"
                      @click="handlePayment(`installment-${installmentAmount}`)"
                      :disabled="!installmentAmount || installmentAmount < 1000"
                    >
                      <i class="fas fa-check-circle mr-2"></i>
                      Valider le paiement
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Paiement mobile -->
              <div>
                <h4 class="font-medium text-gray-700 mb-2 flex items-center">
                  <i class="fas fa-mobile-alt text-orange-500 mr-2"></i> Paiement mobile
                </h4>
                
                <div class="space-y-3">
                  <!-- MTN Mobile Money -->
                  <div 
                    class="payment-option border border-yellow-200 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-yellow-300 bg-yellow-50 hover:shadow-sm transition-all"
                    @click="emit('payment', 'mtn-momo')"
                  >
                    <div class="flex items-center">
                      <div class="bg-yellow-100 text-yellow-700 p-2 rounded-full mr-3">
                        <i class="fas fa-mobile-alt"></i>
                      </div>
                      <div>
                        <p class="font-medium">MTN Mobile Money</p>
                        <p class="text-xs text-gray-500">Payer avec MTN MoMo</p>
                      </div>
                    </div>
                    <i class="fas fa-chevron-right text-gray-400"></i>
                  </div>
                  
                  <!-- Moov Money -->
                  <div 
                    class="payment-option border border-purple-200 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-purple-300 bg-purple-50 hover:shadow-sm transition-all"
                    @click="emit('payment', 'moov-money')"
                  >
                    <div class="flex items-center">
                      <div class="bg-purple-100 text-purple-700 p-2 rounded-full mr-3">
                        <i class="fas fa-mobile-alt"></i>
                      </div>
                      <div>
                        <p class="font-medium">Moov Money</p>
                        <p class="text-xs text-gray-500">Payer avec Moov Money</p>
                      </div>
                    </div>
                    <i class="fas fa-chevron-right text-gray-400"></i>
                  </div>
                  
                  <!-- Celtiis -->
                  <div 
                    class="payment-option border border-green-200 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-green-300 bg-green-50 hover:shadow-sm transition-all"
                    @click="emit('payment', 'celtiis')"
                  >
                    <div class="flex items-center">
                      <div class="bg-green-100 text-green-700 p-2 rounded-full mr-3">
                        <i class="fas fa-mobile-alt"></i>
                      </div>
                      <div>
                        <p class="font-medium">Celtiis</p>
                        <p class="text-xs text-gray-500">Payer avec Celtiis Cash</p>
                      </div>
                    </div>
                    <i class="fas fa-chevron-right text-gray-400"></i>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </teleport>

  <EventPartnersModal 
    v-if="event?.partners?.length"
    :partners="event.partners" 
    :isOpen="showPartners" 
    @close="showPartners = false" 
  />
</template>

<style scoped>
.animate-slide-up {
  animation: slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slide-up {
  from { 
    transform: translateY(20px); 
    opacity: 0; 
  }
  to { 
    transform: translateY(0); 
    opacity: 1; 
  }
}

.progress-bar {
  height: 8px;
  background-color: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 8px;
  background-color:   #2563eb;
  transition: width 0.5s ease;
}

.payment-option {
  transition: all 0.2s ease;
}

.payment-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>