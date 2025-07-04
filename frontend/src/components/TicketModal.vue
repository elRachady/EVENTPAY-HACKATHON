<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import EventPartnersModal from './EventPartnersModal.vue'
import api from '../api'

interface Props {
  isOpen: boolean
  event: any
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  payment: [action: string]
}>()

const router = useRouter()

const modalRef = ref<HTMLElement>()
const showInstallmentInput = ref(false)
const installmentAmount = ref('')
const showPartners = ref(false)
const isLoading = ref(false)
const errorMsg = ref('')

const closeModal = () => {
  emit('close')
}

const handlePayment = async (action: string) => {
  errorMsg.value = ''
  if (action === 'installment') {
    showInstallmentInput.value = true
  } else if (action === 'full' || action.startsWith('installment-')) {
    isLoading.value = true
    let satsAmount = 0
    if (action === 'full') {
      satsAmount = props.event.status === 'En cours de paiement' ? props.event.price - 12500 : props.event.price
    } else if (action.startsWith('installment-')) {
      const amount = parseInt(action.split('-')[1])
      let maxAmount = props.event.status === 'En cours de paiement' ? props.event.price - 12500 : props.event.price
      satsAmount = (!isNaN(amount) && amount > 0 && amount <= maxAmount) ? amount : maxAmount
    }
    try {
      const res = await api.post('/lightning/invoice/create', {
        amount: satsAmount,
        eventId: props.event.id,
        eventTitle: props.event.title
      })
      // FIX: Use res.data.data instead of res.data
      const { payment_request, payment_hash } = res.data.data
      router.push({
        name: 'ticket-invoice',
        query: {
          eventTitle: props.event.title,
          eventDate: props.event.date,
          eventLocation: props.event.location,
          satsAmount: satsAmount,
          xofAmount: Math.round(satsAmount * 0.39),
          paymentType: action === 'full' ? 'full' : 'installment',
          installmentAmount: action === 'full' ? undefined : satsAmount,
          paymentRequest: payment_request,
          paymentHash: payment_hash
        }
      })
    } catch (err: any) {
      errorMsg.value = err?.response?.data?.message || 'Erreur lors de la création de la facture.'
    } finally {
      isLoading.value = false
      showInstallmentInput.value = false
      installmentAmount.value = ''
    }
  } else {
    emit('payment', action)
    showInstallmentInput.value = false
    installmentAmount.value = ''
  }
}

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = 'auto'
  }
})
</script>

<template>
  <teleport to="body">
    <div 
      v-if="isOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="closeModal"
    >
      <div 
        ref="modalRef"
        class="bg-white rounded-xl w-full max-w-sm mx-4 max-h-[90vh] overflow-y-auto animate-slide-up"
        @click.stop
      >
        <div class="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h3 class="font-bold text-lg">Détails du billet</h3>
          <button @click="closeModal" class="text-gray-500 hover:text-gray-700 transition-colors">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="p-4">
          <div class="rounded-xl overflow-hidden mb-4">
            <img :src="event?.id && event.id.startsWith('5-') ? '/src/assets/bitcoinmastermind.jpg' : event?.image" :alt="event?.title" class="w-full h-48 object-cover">
          </div>
          
          <div class="mb-6">
            <h2 class="text-xl font-bold mb-1 flex items-center">
              {{ event?.title }}
              <button 
                @click.stop="showPartners = true"
                class="ml-3 bg-yellow-300 hover:bg-yellow-400 text-yellow-900 px-3 py-1 rounded text-xs font-semibold transition flex items-center shadow"
              >
                <i class="fas fa-handshake mr-2"></i> Voir les partenaires
              </button>
            </h2>
            <p class="text-gray-600 mb-3">{{ event?.location }} • {{ event?.date }}</p>
            
            <div class="flex items-center space-x-2 mb-3">
              <span class="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm">{{ event?.category }}</span>
              <span class="text-sm text-gray-500">Billet numérique</span>
            </div>
            
            <div v-if="event?.status === 'En cours de paiement'" class="bg-gray-50 rounded-lg p-3 mb-4">
              <div class="flex justify-between mb-2">
                <span class="text-gray-600">Statut:</span>
                <span class="font-medium text-blue-600">En cours de paiement</span>
              </div>
              <div class="flex justify-between mb-1">
                <span class="text-gray-600">Total:</span>
                <span class="font-medium">{{ event?.price.toLocaleString() }} SATS</span>
              </div>
              <div class="flex justify-between mb-1">
                <span class="text-gray-600">Payé:</span>
                <span class="font-medium">12,500 SATS</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Reste:</span>
                <span class="font-medium">{{ (event?.price - 12500).toLocaleString() }} SATS</span>
              </div>
            </div>
            <div v-else class="bg-gray-50 rounded-lg p-3 mb-4">
              <div class="flex justify-between mb-2">
                <span class="text-gray-600">Statut:</span>
                <span class="font-medium text-gray-500">Nouveau paiement</span>
              </div>
              <div class="flex justify-between mb-1">
                <span class="text-gray-600">Total:</span>
                <span class="font-medium">{{ event?.price?.toLocaleString() }} SATS</span>
              </div>
            </div>
            
            <div v-if="event?.status === 'En cours de paiement'">
              <div class="mb-4">
                <div class="flex justify-between text-sm mb-1">
                  <span>Progression:</span>
                  <span>25% complété</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: 25%"></div>
                </div>
              </div>
            </div>
            
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm mb-4">
              <p class="font-medium text-yellow-800 flex items-start">
                <i class="fas fa-exclamation-circle mt-1 mr-2"></i>
                Veuillez compléter votre paiement avant le 20 novembre pour obtenir votre billet.
              </p>
            </div>
          </div>
          
          <div class="mb-6">
            <h3 class="font-semibold mb-3">Options de paiement</h3>
            <!-- Paiement en SATS -->
            <div class="mb-4">
              <h4 class="font-medium text-gray-700 mb-2 flex items-center">
                <i class="fas fa-coins text-yellow-500 mr-2"></i>Paiement en SATS
              </h4>
              <div class="space-y-3">
                <!-- Paiement en entier -->
                <div 
                  class="payment-option border border-gray-200 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-blue-300"
                  @click="handlePayment('full')"
                >
                  <div class="flex items-center">
                    <div class="bg-blue-100 text-blue-600 p-2 rounded-full mr-3">
                      <i class="fas fa-bolt"></i>
                    </div>
                    <div>
                      <p class="font-medium">Payer en entier</p>
                      <p class="text-xs text-gray-500">{{ event?.status === 'En cours de paiement' ? (event?.price - 12500).toLocaleString() : event?.price?.toLocaleString() }} SATS maintenant</p>
                    </div>
                  </div>
                  <i class="fas fa-chevron-right text-gray-400"></i>
                </div>
                <!-- Paiement échelonné -->
                <div 
                  class="payment-option border border-green-200 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-green-300 bg-green-50"
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
                <!-- Saisie montant échelonné -->
                <div v-if="showInstallmentInput" class="mt-4">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Montant à payer (SATS)</label>
                  <input 
                    v-model="installmentAmount"
                    type="number"
                    min="1"
                    :max="event?.status === 'En cours de paiement' ? event?.price - 12500 : event?.price"
                    class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-colors"
                    placeholder="Ex: 5000"
                  >
                  <button 
                    class="mt-3 w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium transition"
                    @click="handlePayment('installment-' + installmentAmount)"
                  >
                    Valider le paiement échelonné
                  </button>
                </div>
              </div>
            </div>
            <!-- Paiement mobile -->
            <div>
              <h4 class="font-medium text-gray-700 mb-2 flex items-center">
                <i class="fas fa-mobile-alt text-orange-500 mr-2"></i>Paiement mobile
              </h4>
              <div class="space-y-3">
                <!-- MTN Mobile Money -->
                <div 
                  class="payment-option border border-yellow-200 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-yellow-300 bg-yellow-50"
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
                <!-- Bouton Paiement échelonné pour MTN Mobile Money -->
                <button 
                  class="w-full bg-yellow-400 hover:bg-yellow-500 text-white py-2 rounded-lg font-medium transition mb-2"
                  @click="emit('payment', 'installment-mtn-momo')"
                >
                  Paiement échelonné (MTN MoMo)
                </button>
                <!-- Moov Money -->
                <div 
                  class="payment-option border border-purple-200 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-purple-300 bg-purple-50"
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
                <!-- Bouton Paiement échelonné pour Moov Money -->
                <button 
                  class="w-full bg-purple-400 hover:bg-purple-500 text-white py-2 rounded-lg font-medium transition mb-2"
                  @click="emit('payment', 'installment-moov-money')"
                >
                  Paiement échelonné (Moov Money)
                </button>
                <!-- Celtiis -->
                <div 
                  class="payment-option border border-green-200 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-green-300 bg-green-50"
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
                <!-- Bouton Paiement échelonné pour Celtiis -->
                <button 
                  class="w-full bg-green-400 hover:bg-green-500 text-white py-2 rounded-lg font-medium transition mb-2"
                  @click="emit('payment', 'installment-celtiis')"
                >
                  Paiement échelonné (Celtiis Cash)
                </button>
              </div>
            </div>
          </div>
          
          <div class="border-t pt-4">
          </div>
        </div>
      </div>
    </div>
  </teleport>
  <EventPartnersModal 
    :partners="event?.partners || []" 
    :isOpen="showPartners" 
    @close="showPartners = false" 
  />
  <div v-if="errorMsg" class="bg-red-100 text-red-700 rounded p-2 mb-2 text-sm">{{ errorMsg }}</div>
  <div v-if="isLoading" class="flex items-center justify-center py-4"><i class="fas fa-spinner fa-spin mr-2"></i> Génération de la facture...</div>
</template>