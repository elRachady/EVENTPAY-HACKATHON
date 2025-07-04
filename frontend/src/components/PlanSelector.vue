<template>
  <div class="plan-selector">
    <h3 class="title">Choisissez votre formule</h3>
    <p class="subtitle">{{ event.title }} - {{ event.date }}</p>

    <div class="plans-container">
      <div 
        v-for="plan in ticketPlans" 
        :key="plan.id"
        class="plan-card"
        :class="{ 'selected': selectedPlan?.id === plan.id }"
        @click="selectPlan(plan)"
      >
        <div class="plan-header">
          <h4>{{ plan.name }}</h4>
          <div class="price">
            {{ plan.price_sats.toLocaleString() }} SATS
            <span v-if="plan.installment_allowed" class="installment-badge">
              <i class="fas fa-calendar-alt"></i> Paiement échelonné disponible
            </span>
          </div>
        </div>

        <div class="plan-features">
          <div v-for="feature in plan.features" :key="feature" class="feature">
            <i class="fas fa-check"></i> {{ feature }}
          </div>
        </div>

        <div class="plan-footer">
          <button 
            class="select-btn"
            @click.stop="proceedToPayment(plan)"
          >
            Choisir cette formule
          </button>
        </div>
      </div>
    </div>

    <div class="actions">
      <button class="back-btn" @click="$emit('cancel')">Retour</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps({
  event: {
    type: Object,
    required: true,
    default: () => ({
      id: '',
      title: '',
      date: '',
      ticket_plans: []
    })
  }
})

const emit = defineEmits(['select', 'cancel'])

const ticketPlans = ref([
  {
    id: 'standard',
    name: 'Standard',
    price_sats: 15000,
    features: [
      'Accès à l\'événement',
      'Place standard',
      'Goodies offerts'
    ],
    installment_allowed: true
  },
  {
    id: 'vip',
    name: 'VIP',
    price_sats: 30000,
    features: [
      'Accès VIP',
      'Place privilégiée',
      'Rencontre avec les artistes',
      'Goodies premium'
    ],
    installment_allowed: false
  },
  ...props.event.ticket_plans // Plans venant de l'API
])

const selectedPlan = ref(null)

const selectPlan = (plan) => {
  selectedPlan.value = plan
}

const proceedToPayment = (plan) => {
  emit('select', plan)
}
</script>

<style scoped>
.plan-selector {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
}

.title {
  text-align: center;
  margin-bottom: 0.5rem;
  color: #333;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 2rem;
}

.plans-container {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.plan-card {
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.plan-card:hover {
  border-color: #007bff;
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.plan-card.selected {
  border-color: #28a745;
  background-color: #f8f9fa;
}

.plan-header {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.plan-header h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  color: #333;
}

.price {
  font-size: 1.5rem;
  font-weight: bold;
  color: #007bff;
}

.installment-badge {
  display: inline-block;
  font-size: 0.7rem;
  background: #28a745;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  margin-left: 0.5rem;
}

.plan-features {
  flex: 1;
  margin-bottom: 1.5rem;
}

.feature {
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  color: #555;
}

.feature i {
  color: #28a745;
  margin-right: 0.5rem;
}

.plan-footer {
  text-align: center;
}

.select-btn {
  width: 100%;
  padding: 0.75rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.select-btn:hover {
  background: #0056b3;
}

.actions {
  margin-top: 2rem;
  text-align: center;
}

.back-btn {
  padding: 0.75rem 1.5rem;
  background: white;
  border: 1px solid #dc3545;
  color: #dc3545;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #f8d7da;
}
</style>