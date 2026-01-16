import { createRouter, createWebHistory } from 'vue-router'
import ConnectionsView from '@/views/ConnectionsView.vue'
import Dashboard from '@/views/Dashboard.vue'
import NodeView from '@/components/Dashboard/Pages/NodeView.vue'
import NodeCards from '@/components/Dashboard/Pages/NodeCards.vue'

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
          component: NodeCards,
        },
      ],
    },
    {
      path: '/test',
      name: 'test',
      component: NodeView,
    },
    {
      path: '/',
      name: 'connections',
      component: ConnectionsView,
    },
  ],
})

export default router
