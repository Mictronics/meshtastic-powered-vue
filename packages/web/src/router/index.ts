import { createRouter, createWebHistory } from 'vue-router'
import ConnectionsView from '@/views/ConnectionsView.vue'
import Dashboard from '@/views/Dashboard.vue'
import NodeView from '@/components/Dashboard/Pages/NodeView.vue'
import NodeCards from '@/components/Dashboard/Pages/NodeCards.vue'
import { registerGuards } from './guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/dashboard',
      name: 'dashboard',
      component: Dashboard,
      meta: { requiresConnection: true },
      children: [
        {
          path: '',
          name: 'dashboard.home',
          component: NodeView,
        },
      ],
    },
    {
      path: '/test',
      name: 'test',
      component: NodeCards,
    },
    {
      path: '/',
      name: 'connections',
      component: ConnectionsView,
    },
  ],
})

registerGuards(router)

export default router
