<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
// import QRCode lib if needed
// import QRCodeVue from 'qrcode.vue'

const route = useRoute()
const router = useRouter()

// Props or route params for invoice data
const invoice = ref({
  eventTitle: route.query.eventTitle || 'Titre événement',
  eventDate: route.query.eventDate || 'Date',
  eventLocation: route.query.eventLocation || 'Lieu',
  satsAmount: Number(route.query.satsAmount) || 0,
  xofAmount: Number(route.query.xofAmount) || 0,
  paymentType: route.query.paymentType || 'full',
  installmentAmount: route.query.installmentAmount ? Number(route.query.installmentAmount) : undefined,
  address: route.query.address || 'bc1qexampleaddresssatoshipayment',
  qr: route.query.qr || 'bc1qexampleaddresssatoshipayment',
  expiresAt: route.query.expiresAt || '', // format: '2025-07-03T18:00:00Z'
})

const now = ref(new Date())
let interval: number | undefined

if (invoice.value.expiresAt) {
  interval = setInterval(() => {
    now.value = new Date()
  }, 1000)
}

function getExpirationCountdown() {
  if (!invoice.value.expiresAt) return ''
  const expireDate = new Date(invoice.value.expiresAt)
  const diff = expireDate.getTime() - now.value.getTime()
  if (diff <= 0) return 'Expiré'
  const min = Math.floor(diff / 60000)
  const sec = Math.floor((diff % 60000) / 1000)
  return `${min}m ${sec < 10 ? '0' : ''}${sec}s`
}

function copyAddress() {
  navigator.clipboard.writeText(invoice.value.address)
}
function shareAddress() {
  if (navigator.share) {
    navigator.share({
      title: 'Adresse de paiement',
      text: invoice.value.address
    })
  } else {
    copyAddress()
    alert('Adresse copiée !')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4 pt-24 overflow-auto">
    <div class=" w-full max-w-md p-6">
      <div class="flex flex-col items-center mb-6">
        <!-- QR code (replace with QRCodeVue if available) -->
        <div class="bg-gray-100 rounded-lg p-4 mb-2">
          <img :src="`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${invoice.qr}`" alt="QR Code" class="w-36 h-36" />
        </div>
        <div class="text-xs text-gray-500 break-all text-center mb-2">{{ invoice.address }}</div>
        <div class="flex gap-2 mb-4">
          <button @click="copyAddress" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs font-medium">Copier</button>
          <button @click="shareAddress" class="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-xs font-medium">Partager</button>
        </div>
      </div>
      <div class="mb-6 text-center">
        <h2 class="text-2xl font-bold mb-2">Facture de paiement</h2>
        <p class="text-gray-600">Merci de vérifier les détails avant de payer.</p>
      </div>
      <div class="mb-4">
        <div class="flex justify-between mb-2">
          <span class="font-medium text-gray-700">Évènement :</span>
          <span>{{ invoice.eventTitle }}</span>
        </div>
        <div class="flex justify-between mb-2">
          <span class="font-medium text-gray-700">Date :</span>
          <span>{{ invoice.eventDate }}</span>
        </div>
        <div class="flex justify-between mb-2">
          <span class="font-medium text-gray-700">Lieu :</span>
          <span>{{ invoice.eventLocation }}</span>
        </div>
        <div class="flex justify-between mb-2">
          <span class="font-medium text-gray-700">Type de paiement :</span>
          <span>{{ invoice.paymentType === 'full' ? 'Paiement en entier' : 'Paiement échelonné' }}</span>
        </div>
        <div v-if="invoice.paymentType === 'installment'" class="flex justify-between mb-2">
          <span class="font-medium text-gray-700">Montant échelonné :</span>
          <span>{{ invoice.installmentAmount?.toLocaleString() }} SATS</span>
        </div>
        <div class="flex justify-between mb-2">
          <span class="font-medium text-gray-700">Montant à payer :</span>
          <span class="text-orange-600 font-bold">{{ invoice.satsAmount.toLocaleString() }} SATS</span>
        </div>
        <div class="flex justify-between mb-2">
          <span class="font-medium text-gray-700">Équivalent XOF :</span>
          <span class="text-gray-700">≈ {{ invoice.xofAmount.toLocaleString() }} XOF</span>
        </div>
        <div v-if="invoice.expiresAt" class="flex justify-between mb-2">
          <span class="font-medium text-gray-700">Expiration :</span>
          <span class="text-red-600 font-bold">{{ getExpirationCountdown() }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
