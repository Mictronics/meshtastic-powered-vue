import { createRouter, createWebHistory } from 'vue-router'
import ConnectionsView from '../views/ConnectionsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: ConnectionsView,
    },
    {
      path: '/',
      name: 'connections',
      component: ConnectionsView,
    },
  ],
})

export default router
