import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import DiscoverView from '../views/DiscoverView.vue'
import MyTicketsView from '../views/MyTicketsView.vue'
import CompletedTicketsView from '../views/CompletedTicketsView.vue'
import MyEventsView from '../views/MyEventsView.vue'
import CreateEventView from '../views/CreateEventView.vue'
import TicketInvoiceView from '../views/TicketInvoiceView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'

const routes = [
  { path: '/login', name: 'login', component: LoginView },
  { path: '/register', name: 'register', component: RegisterView },
  { path: '/', name: 'home', component: HomeView },
  { path: '/discover', name: 'discover', component: DiscoverView },
  { path: '/my-tickets', name: 'my-tickets', component: MyTicketsView },
  { path: '/completed-tickets', name: 'completed-tickets', component: CompletedTicketsView },
  { path: '/my-events', name: 'my-events', component: MyEventsView },
  { path: '/create-event', name: 'create-event', component: CreateEventView },
  { path: '/ticket-invoice', name: 'ticket-invoice', component: TicketInvoiceView },

]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Guard: redirige vers /login si pas connecté
router.beforeEach((to, from, next) => {
  const user = localStorage.getItem('user')
  if (to.path !== '/login' && to.path !== '/register' && !user) {
    next('/login')
  } else {
    next()
  }
})

export default router