import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import HomeView from './views/HomeView.vue'
import DiscoverView from './views/DiscoverView.vue'
import MyTicketsView from './views/MyTicketsView.vue'
import CompletedTicketsView from './views/CompletedTicketsView.vue'
import MyEventsView from './views/MyEventsView.vue'
import CreateEventView from './views/CreateEventView.vue'
import TicketInvoiceView from './views/TicketInvoiceView.vue'
import AccountDetailsView from './views/AccountDetailsView.vue'
import LoginView from './views/LoginView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/discover', name: 'discover', component: DiscoverView },
  { path: '/my-tickets', name: 'my-tickets', component: MyTicketsView },
  { path: '/completed-tickets', name: 'completed-tickets', component: CompletedTicketsView },
  { path: '/my-events', name: 'my-events', component: MyEventsView },
  { path: '/create-event', name: 'create-event', component: CreateEventView },
  { path: '/ticket-invoice', name: 'ticket-invoice', component: TicketInvoiceView },
  { path: '/account', name: 'account', component: AccountDetailsView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const publicPages = ['/login', '/signup'];
  const authRequired = !publicPages.includes(to.path);
  const user = localStorage.getItem('user');
  if (authRequired && !user) {
    return next('/login');
  }
  next();
});

const app = createApp(App)
app.use(router)
app.mount('#app')