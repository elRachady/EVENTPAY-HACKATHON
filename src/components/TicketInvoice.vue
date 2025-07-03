<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

interface InvoiceData {
  eventTitle: string
  eventDate: string
  eventLocation: string
  satsAmount: number
  xofAmount: number
  paymentType: 'full' | 'installment'
  installmentAmount?: number
}

defineProps<{
  invoice: InvoiceData
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()
</script>

<template>
  <teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="emit('close')">
      <div class="bg-white rounded-xl w-full max-w-md mx-4 p-6 relative animate-slide-up" @click.stop>
        <button @click="emit('close')" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <i class="fas fa-times"></i>
        </button>
        <div class="mb-6 text-center">
          <h2 class="text-2xl font-bold mb-2">Facture de paiement</h2>
          <p class="text-gray-600">Merci de vérifier les détails avant de confirmer votre paiement.</p>
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
        <button @click="emit('confirm')" class="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-bold transition mt-4">
          Confirmer et payer
        </button>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.animate-slide-up {
  animation: slide-up 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes slide-up {
  from { transform: translateY(40px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
