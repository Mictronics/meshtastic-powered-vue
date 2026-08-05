import {
  createRouter,
  createWebHistory,
  type NavigationGuardNext,
  type RouteLocationNormalized,
  type RouteLocationNormalizedLoaded
} from 'vue-router'
import ConnectionsView from '@/views/ConnectionsView.vue'
import Dashboard from '@/views/Dashboard.vue'
import LockdownView from '@/views/LockdownView.vue'
import NodeCards from '@/components/Dashboard/Pages/NodeView/NodeCards.vue'
import MessageView from '@/components/Dashboard/Pages/MessageView/MessageView.vue'
import MapView from '@/components/Dashboard/Pages/MapView/MapView.vue'
import RadioView from '@/components/Dashboard/Pages/Settings/RadioView.vue'
import DeviceView from '@/components/Dashboard/Pages/Settings/DeviceView.vue'
import ModuleView from '@/components/Dashboard/Pages/Settings/ModuleView.vue'
import { useDeviceStore } from '@/composables/stores/device/useDeviceStore'
import { useConnectionStore } from '@/composables/stores/connection/useConnectionStore'
import { ConnectionStatus } from '@/composables/stores/connection/types'
import { Protobuf } from '@meshtastic/core'

const chatProps = (route: RouteLocationNormalizedLoaded) => {
  return { type: String(route.params.type), id: String(route.params.id) }
}

const validateChatRoute = (
  to: RouteLocationNormalizedLoaded,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
): void => {
  const type = String(to.params.type)
  const idRaw = String(to.params.id)
  const idNum = Number(idRaw)
  // broadcast or direct
  if (!['broadcast', 'direct'].includes(type)) return next({ name: 'chat.default' })
  // Channel or node id must be a number
  if (!Number.isInteger(idNum) || idNum < 0) return next({ name: 'chat.default' });
  // Broadcast channel 0 to 7
  if (type === 'broadcast' && idNum > 7) return next({ name: 'chat.default' });
  // Direct node 0 to 0xffffffff - 1
  if (type === 'direct' && idNum > 4294967294) return next({ name: 'chat.default' });

  to.params.id = idRaw
  to.params.type = type
  next()
}

// Meta is used to hide/show submenus in sidebar.
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/nodes',
      name: 'nodes',
      component: Dashboard,
      children: [
        {
          path: '',
          name: 'nodes.view',
          component: NodeCards,
          meta: { viewNodes: true }
        },
      ],
    },
    {
      path: '/chat',
      name: 'chat',
      component: Dashboard,
      meta: { viewChat: true },
      children: [
        {
          path: '',
          name: 'chat.default',
          redirect: { name: 'chat.view', params: { type: 'broadcast', id: '0' } },
        },
        {
          path: ':type(broadcast|direct)/:id(\\d+)',
          name: 'chat.view',
          component: MessageView,
          props: chatProps,
          beforeEnter: validateChatRoute,
        }
      ]
    },
    {
      path: '/',
      name: 'connections',
      component: ConnectionsView,
      meta: { viewConnections: true }
    },
    {
      path: '/lockdown',
      name: 'lockdown',
      component: LockdownView,
    },
    {
      path: '/map',
      name: 'map',
      component: Dashboard,
      children: [
        {
          path: '',
          name: 'map.view',
          component: MapView,
          meta: { viewMap: true }
        },
      ],
    },
    {
      path: '/settings',
      name: 'settings',
      component: Dashboard,
      children: [
        {
          path: '',
          redirect: { name: 'settings.radio' },
        },
        {
          path: 'radio',
          name: 'settings.radio',
          component: RadioView,
          meta: { viewSettings: true }
        },
        {
          path: 'device',
          name: 'settings.device',
          component: DeviceView,
          meta: { viewSettings: true }
        },
        {
          path: 'modules',
          name: 'settings.modules',
          component: ModuleView,
          meta: { viewSettings: true }
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'connections' },
    },
  ],
})

// Gate app routes while the active device reports itself locked, so a
// hardened-firmware device's encrypted config/channels/nodedb are never
// exposed through the normal UI before the operator authenticates.
router.beforeEach((to) => {
  if (to.name === 'lockdown' || to.name === 'connections') return true

  const activeId = useConnectionStore().activeConnectionId.value
  if (!activeId) return true // no active connection: nothing to gate

  const conn = useConnectionStore().connections.value.get(activeId)
  const isConfiguredOrConnected =
    conn?.status === ConnectionStatus.Configured || conn?.status === ConnectionStatus.Connected
  if (!isConfiguredOrConnected) return true // still connecting/configuring: no report could have arrived yet

  const state = useDeviceStore().device.value?.lockdownStatus.state
  const gated =
    state === Protobuf.Mesh.LockdownStatus_State.LOCKED ||
    state === Protobuf.Mesh.LockdownStatus_State.NEEDS_PROVISION
  if (gated) {
    return { name: 'lockdown', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
