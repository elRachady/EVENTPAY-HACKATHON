<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

function getStringParam(param: any): string {
  if (Array.isArray(param)) return param[0] || ''
  return param || ''
}
function getNumberParam(param: any): number {
  if (Array.isArray(param)) return Number(param[0]) || 0
  return Number(param) || 0
}

const invoice = ref({
  eventTitle: getStringParam(route.query.eventTitle),
  eventDate: getStringParam(route.query.eventDate),
  eventLocation: getStringParam(route.query.eventLocation),
  satsAmount: getNumberParam(route.query.satsAmount),
  xofAmount: getNumberParam(route.query.xofAmount),
  paymentType: getStringParam(route.query.paymentType),
  installmentAmount: route.query.installmentAmount ? getNumberParam(route.query.installmentAmount) : undefined,
  paymentRequest: getStringParam(route.query.paymentRequest),
  paymentHash: getStringParam(route.query.paymentHash),
})

function copyInvoice() {
  if (invoice.value.paymentRequest) {
    navigator.clipboard.writeText(invoice.value.paymentRequest as string)
  }
}
function shareInvoice() {
  if (navigator.share && invoice.value.paymentRequest) {
    navigator.share({
      title: 'Facture Lightning',
      text: invoice.value.paymentRequest as string
    })
  } else {
    copyInvoice()
    alert('Facture copiée !')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4 pt-24 overflow-auto">
    <div class=" w-full max-w-md p-6">
      <div class="flex flex-col items-center mb-6">
        <!-- QR code for Lightning invoice -->
        <div class="bg-gray-100 rounded-lg p-4 mb-2">
          <img v-if="invoice.paymentRequest" :src="`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=lightning:${invoice.paymentRequest}`" alt="QR Code" class="w-36 h-36" />
        </div>
        <div v-if="invoice.paymentRequest" class="text-xs text-gray-500 break-all text-center mb-2">{{ invoice.paymentRequest }}</div>
        <div class="flex gap-2 mb-4">
          <button v-if="invoice.paymentRequest" @click="copyInvoice" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs font-medium">Copier la facture</button>
          <button v-if="invoice.paymentRequest" @click="shareInvoice" class="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-xs font-medium">Partager</button>
        </div>
        <div v-if="invoice.paymentHash" class="text-xs text-gray-400 break-all text-center mb-2">Hash: {{ invoice.paymentHash }}</div>
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
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
