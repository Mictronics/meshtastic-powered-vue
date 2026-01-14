import { createRouter, createWebHistory } from 'vue-router'
import ConnectionsView from '@/views/ConnectionsView.vue'
import Dashboard from '@/views/Dashboard.vue'
import NodeView from '@/components/Dashboard/Pages/NodeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/dashboard',
      name: 'dashboard',
      component: Dashboard,
      children: [
        { path: '', name: 'dashboard.home', component: NodeView },
      ],
    },
    {
      path: '/',
      name: 'connections',
      component: ConnectionsView,
    },
  ],
})

export default router
