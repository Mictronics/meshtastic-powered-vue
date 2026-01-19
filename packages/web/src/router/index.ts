import { createRouter, createWebHistory } from 'vue-router'
import ConnectionsView from '@/views/ConnectionsView.vue'
import Dashboard from '@/views/Dashboard.vue'
import NodeCards from '@/components/Dashboard/Pages/NodeView/NodeCards.vue'
import MessageView from '@/components/Dashboard/Pages/MessageView/MessageView.vue'

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
        {
          path: '/messages',
          name: 'dashboard.messages',
          component: MessageView,
        },
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
