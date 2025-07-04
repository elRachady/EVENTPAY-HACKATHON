<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Backdrop -->
      <div class="fixed inset-0 transition-opacity" @click="closeModal">
        <div class="absolute inset-0 bg-black opacity-50"></div>
      </div>

      <!-- Modal Content -->
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <!-- Step 1: Plan Selection -->
        <div v-if="step === 'select-plan'" class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Choisissez votre formule</h3>
          
          <!-- Plan Cards -->
          <div class="grid gap-4">
            <div 
              v-for="plan in plans" 
              :key="plan.id"
              @click="selectPlan(plan)"
              class="border rounded-lg p-4 cursor-pointer transition-all"
              :class="{
                'border-orange-500 ring-2 ring-orange-300': selectedPlan?.id === plan.id,
                'border-gray-200 hover:border-orange-300': selectedPlan?.id !== plan.id
              }"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h4 class="font-bold text-gray-800">{{ plan.name }}</h4>
                  <p class="text-orange-600 font-bold text-xl mt-1">
                    {{ plan.price_sats.toLocaleString() }} SATS
                  </p>
                </div>
                <div v-if="plan.installment_allowed" class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Paiement échelonné
                </div>
              </div>
              
              <ul class="mt-3 space-y-1">
                <li v-for="feature in plan.features" :key="feature" class="flex items-center text-sm text-gray-600">
                  <svg class="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {{ feature }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-6 flex justify-end space-x-3">
            <button 
              @click="closeModal"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button 
              @click="goToPayment"
              :disabled="!selectedPlan"
              class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuer
            </button>
          </div>
        </div>

        <!-- Step 2: Payment -->
        <div v-if="step === 'payment'" class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="flex justify-between items-start">
            <h3 class="text-lg font-medium text-gray-900">Finalisez votre paiement</h3>
            <button @click="step = 'select-plan'" class="text-orange-600 hover:text-orange-800">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          </div>

          <!-- Selected Plan Info -->
          <div class="mt-4 bg-gray-50 p-4 rounded-lg">
            <div class="flex justify-between">
              <div>
                <h4 class="font-medium text-gray-900">{{ selectedPlan.name }}</h4>
                <p class="text-sm text-gray-500">{{ event.date }} • {{ event.location }}</p>
              </div>
              <p class="text-orange-600 font-bold">{{ selectedPlan.price_sats.toLocaleString() }} SATS</p>
            </div>
          </div>

          <!-- Payment Progress (if installment) -->
          <div v-if="event.status === 'En cours de paiement'" class="mt-4">
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-600">Progression</span>
              <span>{{ paidPercentage }}% complété</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="bg-orange-600 h-2 rounded-full" 
                :style="`width: ${paidPercentage}%`"
              ></div>
            </div>
          </div>

          <!-- Payment Options -->
          <div class="mt-6 space-y-3">
            <h4 class="font-medium text-gray-900">Options de paiement</h4>
            
            <!-- Full Payment -->
            <button 
              @click="handlePayment('full')"
              class="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-orange-300"
            >
              <div class="flex items-center">
                <div class="p-2 bg-blue-100 text-blue-600 rounded-full mr-3">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p class="font-medium">Payer en entier</p>
                  <p class="text-xs text-gray-500">{{ amountToPay.toLocaleString() }} SATS maintenant</p>
                </div>
              </div>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <!-- Installment Payment -->
            <button 
              v-if="selectedPlan.installment_allowed"
              @click="handlePayment('installment')"
              class="w-full flex items-center justify-between p-3 border border-green-200 rounded-lg hover:border-green-300 bg-green-50"
            >
              <div class="flex items-center">
                <div class="p-2 bg-green-100 text-green-600 rounded-full mr-3">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p class="font-medium">Paiement échelonné</p>
                  <p class="text-xs text-gray-500">Choisissez votre montant</p>
                </div>
              </div>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <!-- Installment Input -->
            <div v-if="showInstallmentInput" class="mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Montant à payer (SATS)</label>
              <div class="flex gap-2">
                <input
                  v-model="installmentAmount"
                  type="number"
                  :min="selectedPlan.min_installment_amount || 1000"
                  :max="amountToPay"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Ex: 5000"
                >
                <button
                  @click="submitInstallment"
                  class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Valider
                </button>
              </div>
            </div>

            <!-- Mobile Payment Options -->
            <div class="pt-2">
              <h5 class="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <svg class="w-5 h-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Paiement mobile
              </h5>
              
              <div class="space-y-2">
                <!-- MTN Mobile Money -->
                <button 
                  @click="handlePayment('mtn-momo')"
                  class="w-full flex items-center justify-between p-3 border border-yellow-200 rounded-lg hover:border-yellow-300 bg-yellow-50"
                >
                  <div class="flex items-center">
                    <div class="p-2 bg-yellow-100 text-yellow-600 rounded-full mr-3">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p class="font-medium">MTN Mobile Money</p>
                      <p class="text-xs text-gray-500">Payer avec MTN MoMo</p>
                    </div>
                  </div>
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <!-- Moov Money -->
                <button 
                  @click="handlePayment('moov-money')"
                  class="w-full flex items-center justify-between p-3 border border-purple-200 rounded-lg hover:border-purple-300 bg-purple-50"
                >
                  <div class="flex items-center">
                    <div class="p-2 bg-purple-100 text-purple-600 rounded-full mr-3">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p class="font-medium">Moov Money</p>
                      <p class="text-xs text-gray-500">Payer avec Moov Money</p>
                    </div>
                  </div>
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <div class="text-center text-xs text-gray-500">
            <svg class="inline-block w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Paiement sécurisé via Lightning Network
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  isOpen: Boolean,
  event: {
    type: Object,
    required: true,
    default: () => ({
      id: '',
      title: '',
      date: '',
      location: '',
      image: '',
      price: 0,
      status: '', // 'Nouveau paiement' ou 'En cours de paiement'
      address: ''
    })
  }
})

const emit = defineEmits(['close', 'payment'])

const router = useRouter()
const step = ref('select-plan')
const selectedPlan = ref(null)
const plans = ref([])
const showInstallmentInput = ref(false)
const installmentAmount = ref('')
const loading = ref(false)

// Computed properties
const amountToPay = computed(() => {
  if (!selectedPlan.value) return 0
  return props.event.status === 'En cours de paiement' 
    ? selectedPlan.value.price_sats - 12500 
    : selectedPlan.value.price_sats
})

const paidPercentage = computed(() => {
  if (props.event.status !== 'En cours de paiement') return 0
  return Math.round((12500 / selectedPlan.value.price_sats) * 100)
})

// Methods
const closeModal = () => {
  emit('close')
  step.value = 'select-plan'
  showInstallmentInput.value = false
}

const fetchPlans = async () => {
  try {
    loading.value = true
    const response = await fetch(`/api/events/${props.event.id}/plans`)
    const data = await response.json()
    if (data.success) {
      plans.value = data.plans
    }
  } catch (error) {
    console.error('Failed to fetch plans:', error)
  } finally {
    loading.value = false
  }
}

const selectPlan = (plan) => {
  selectedPlan.value = plan
}

const goToPayment = () => {
  if (selectedPlan.value) {
    step.value = 'payment'
  }
}

const handlePayment = (action: string) => {
  if (action === 'installment') {
    showInstallmentInput.value = true
    return
  }
  
  if (action === 'full') {
    router.push({
      name: 'ticket-invoice',
      query: {
        eventId: props.event.id,
        planId: selectedPlan.value.id,
        eventTitle: props.event.title,
        eventDate: props.event.date,
        eventLocation: props.event.location,
        satsAmount: amountToPay.value,
        paymentType: 'full',
        address: props.event.address || 'bc1qexampleaddress'
      }
    })
    return
  }

  emit('payment', action)
}

const submitInstallment = () => {
  if (!installmentAmount.value) return
  
  const amount = parseInt(installmentAmount.value)
  const minAmount = selectedPlan.value.min_installment_amount || 1000
  
  if (amount < minAmount || amount > amountToPay.value) {
    alert(`Le montant doit être entre ${minAmount.toLocaleString()} et ${amountToPay.value.toLocaleString()} SATS`)
    return
  }

  router.push({
    name: 'ticket-invoice',
    query: {
      eventId: props.event.id,
      planId: selectedPlan.value.id,
      eventTitle: props.event.title,
      eventDate: props.event.date,
      eventLocation: props.event.location,
      satsAmount: amount,
      paymentType: 'installment',
      installmentAmount: amount,
      address: props.event.address || 'bc1qexampleaddress'
    }
  })
}

// Lifecycle
onMounted(() => {
  fetchPlans()
})
</script>