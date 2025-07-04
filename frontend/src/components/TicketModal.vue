<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import EventPartnersModal from './EventPartnersModal.vue'

// Configuration des constantes
const MIN_SATS_AMOUNT = 50 // Minimum absolu pour les paiements Lightning
const INVOICE_EXPIRY = 3600 // 1 heure en secondes
const SATS_TO_XOF_RATE = 0.39 // Taux de conversion

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
const paymentError = ref('')
const showInstallmentInput = ref(false)
const installmentAmount = ref('')
const showPartners = ref(false)
const showPaymentPopup = ref(false)
const paymentData = ref<any>(null)
const isProcessingPayment = ref(false)

watch(() => props.isOpen, (open) => {
  if (open) {
    document.body.style.overflow = 'hidden'
  } else {
    resetState()
    document.body.style.overflow = 'auto'
  }
})

function resetState() {
  showInstallmentInput.value = false
  installmentAmount.value = ''
  showPartners.value = false
  error.value = ''
  paymentError.value = ''
  paymentData.value = null
  isProcessingPayment.value = false
  showPaymentPopup.value = false
}

function closeModal() {
  emit('close')
}

async function createLightningInvoice(amount: number, memo: string) {
  // Validation du montant
  if (amount < MIN_SATS_AMOUNT) {
    paymentError.value = `Le montant minimum est de ${MIN_SATS_AMOUNT} SATS`
    return null
  }

  isProcessingPayment.value = true
  paymentError.value = ''

  try {
    const response = await fetch('http://localhost:3005/api/lightning/invoice/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        memo,
        expiry: INVOICE_EXPIRY
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Erreur serveur')
    }
    
    const { data } = await response.json()
    
    if (!data?.payment_request) {
      throw new Error('Réponse invalide du serveur')
    }

    return {
      ...data,
      created_at: Math.floor(Date.now() / 1000) // Timestamp courant
    }
  } catch (err) {
    console.error('Erreur création invoice:', err)
    paymentError.value = err.message || 'Échec de création de la facture'
    return null
  } finally {
    isProcessingPayment.value = false
  }
}

async function handlePayment(action: string) {
  if (!props.event) return

  const paid = props.event.paidAmount || 0
  const remainingAmount = props.event.price - paid
  
  // Mode échelonné - affichage du formulaire
  if (action === 'installment') {
    showInstallmentInput.value = true
    return
  }

  // Détermination du montant
  let amount = remainingAmount
  let paymentType = 'full'
  
  if (action.startsWith('installment-')) {
    const inputAmount = parseInt(action.split('-')[1])
    amount = Math.max(MIN_SATS_AMOUNT, Math.min(inputAmount, remainingAmount))
    paymentType = 'installment'
  }

  // Création de la facture
  const invoice = await createLightningInvoice(
    amount,
    `${paymentType === 'installment' ? 'Acompte' : 'Paiement'} pour ${props.event.title}`
  )

  if (!invoice) return

  // Préparation des données de paiement
  paymentData.value = {
    ...invoice,
    eventTitle: props.event.title,
    eventDate: props.event.date,
    eventLocation: props.event.location,
    paymentType,
    originalAmount: amount,
    xofAmount: Math.round(amount * SATS_TO_XOF_RATE),
    expires_at: invoice.created_at + INVOICE_EXPIRY
  }

  showPaymentPopup.value = true
  showInstallmentInput.value = false
  installmentAmount.value = ''
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
    .then(() => alert('Copié dans le presse-papier!'))
    .catch(err => console.error('Erreur copie:', err))
}

function checkInvoiceExpiry(expiresAt: number) {
  const now = Math.floor(Date.now() / 1000)
  return now < expiresAt
}
</script>

<template>
  <teleport to="body">
    <!-- Modal principale -->
    <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl w-full max-w-sm mx-4 max-h-[90vh] overflow-y-auto animate-slide-up" @click.stop>
        <!-- En-tête -->
        <div class="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h3 class="font-bold text-lg">Détails du billet</h3>
          <button @click="closeModal" class="text-gray-500 hover:text-gray-700 transition-colors">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Contenu -->
        <div class="p-4">
          <!-- États de chargement/erreur -->
          <template v-if="loading">
            <div class="text-center py-10">
              <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p class="text-gray-500">Chargement...</p>
            </div>
          </template>

          <template v-else-if="error">
            <div class="text-center py-10 text-red-600">
              <i class="fas fa-exclamation-triangle text-2xl mb-3"></i>
              <p class="mb-4">{{ error }}</p>
              <button @click="error = ''" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Réessayer
              </button>
            </div>
          </template>

          <!-- Affichage de l'événement -->
          <template v-else-if="event">
            <!-- Image et détails de l'événement -->
            <div class="rounded-xl overflow-hidden mb-4">
              <img :src="event.image" :alt="event.title" class="w-full h-48 object-cover"
                @error="event.image = '/placeholder-event.jpg'">
            </div>

            <!-- Options de paiement -->
            <div class="mb-6">
              <h3 class="font-semibold mb-3 text-lg">
                <i class="fas fa-credit-card mr-2"></i> Options de paiement
              </h3>
              
              <!-- Paiement Lightning -->
              <div class="mb-4">
                <h4 class="font-medium text-gray-700 mb-2 flex items-center">
                  <i class="fas fa-bolt text-yellow-500 mr-2"></i> Paiement Lightning
                </h4>
                
                <div class="space-y-3">
                  <!-- Paiement complet -->
                  <button @click="handlePayment('full')" :disabled="isProcessingPayment"
                    class="w-full payment-option border border-gray-200 rounded-lg p-3 flex items-center justify-between hover:border-blue-300 hover:shadow-sm transition-all">
                    <div class="flex items-center">
                      <div class="bg-blue-100 text-blue-600 p-2 rounded-full mr-3">
                        <i class="fas fa-bolt"></i>
                      </div>
                      <div>
                        <p class="font-medium">Paiement complet</p>
                        <p class="text-xs text-gray-500">
                          {{ (event.price - (event.paidAmount || 0)).toLocaleString() }} SATS
                        </p>
                      </div>
                    </div>
                    <i class="fas fa-chevron-right text-gray-400"></i>
                  </button>
                  
                  <!-- Paiement échelonné -->
                  <button @click="handlePayment('installment')" :disabled="isProcessingPayment"
                    class="w-full payment-option border border-green-200 rounded-lg p-3 flex items-center justify-between hover:border-green-300 bg-green-50 hover:shadow-sm transition-all">
                    <div class="flex items-center">
                      <div class="bg-green-100 text-green-600 p-2 rounded-full mr-3">
                        <i class="fas fa-calendar-plus"></i>
                      </div>
                      <div>
                        <p class="font-medium">Paiement échelonné</p>
                        <p class="text-xs text-gray-500">À partir de {{ MIN_SATS_AMOUNT }} SATS</p>
                      </div>
                    </div>
                    <i class="fas fa-chevron-right text-gray-400"></i>
                  </button>
                  
                  <!-- Formulaire échelonné -->
                  <div v-if="showInstallmentInput" class="mt-4 p-3 bg-gray-50 rounded-lg">
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Montant (min {{ MIN_SATS_AMOUNT }} SATS)
                    </label>
                    <input v-model.number="installmentAmount" type="number" :min="MIN_SATS_AMOUNT"
                      :max="event.price - (event.paidAmount || 0)"
                      class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-colors">
                    <button @click="handlePayment(`installment-${installmentAmount}`)"
                      :disabled="!installmentAmount || installmentAmount < MIN_SATS_AMOUNT || isProcessingPayment"
                      class="mt-3 w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium transition">
                      <i class="fas fa-check-circle mr-2"></i> Confirmer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Popup de paiement -->
    <div v-if="showPaymentPopup" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl w-full max-w-sm mx-4 p-6 animate-slide-up" @click.stop>
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-bold text-lg">Paiement Lightning</h3>
          <button @click="showPaymentPopup = false" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="text-center">
          <!-- Erreur de paiement -->
          <div v-if="paymentError" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {{ paymentError }}
          </div>

          <!-- Détails de la facture -->
          <p class="font-medium mb-2">{{ paymentData.eventTitle }}</p>
          <p class="text-gray-600 mb-4">
            {{ paymentData.eventDate }} • {{ paymentData.eventLocation }}
          </p>
          
          <!-- QR Code -->
          <div class="bg-white p-4 rounded-lg border border-gray-200 inline-block mb-4">
            <img :src="paymentData.qr_code" alt="QR Code" class="w-64 h-64 object-contain mx-auto">
          </div>
          
          <!-- Montant -->
          <p class="font-bold text-xl mb-2">
            {{ paymentData.originalAmount.toLocaleString() }} SATS
            <span class="text-gray-500 text-sm">(~{{ paymentData.xofAmount }} XOF)</span>
          </p>
          
          <!-- Invoice -->
          <div class="bg-gray-100 rounded-lg p-3 mb-4 text-left">
            <div class="flex justify-between items-center mb-1">
              <span class="text-sm font-medium text-gray-700">Invoice</span>
              <button @click="copyToClipboard(paymentData.payment_request)" class="text-blue-500 hover:text-blue-700">
                <i class="fas fa-copy"></i>
              </button>
            </div>
            <p class="text-xs text-gray-600 break-all">{{ paymentData.payment_request }}</p>
          </div>
          
          <!-- Instructions -->
          <p class="text-sm text-gray-500 mb-4">
            Scannez le QR code ou copiez l'invoice dans votre portefeuille Lightning.
          </p>
          
          <!-- Bouton de confirmation -->
          <button @click="showPaymentPopup = false"
            class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition">
            J'ai effectué le paiement
          </button>
        </div>
      </div>
    </div>

    <!-- Modal des partenaires -->
    <EventPartnersModal v-if="event?.partners?.length" :partners="event.partners" 
      :isOpen="showPartners" @close="showPartners = false" />
  </teleport>
</template>

<style scoped>
.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
@keyframes slide-up {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.payment-option {
  transition: all 0.2s ease;
}
.payment-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.payment-option[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>