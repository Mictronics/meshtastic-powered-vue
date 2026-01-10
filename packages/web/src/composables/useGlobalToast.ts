import { createGlobalState } from '@vueuse/core'
import { shallowRef } from 'vue'

export type ToastSeverity = 'success' | 'info' | 'warn' | 'error'

export interface ToastAddOptions {
  severity?: ToastSeverity
  summary?: string
  detail?: string
  life?: number
  sticky?: boolean
  group?: string
  closable?: boolean
}

export const useGlobalToast = createGlobalState(() => {
  const service = shallowRef<any | null>(null)

  function setToastService(svc: any) {
    service.value = svc
  }

  function add(opts: ToastAddOptions) {
    if (!service.value) throw new Error('ToastService not set. Call setToastService from app initialization.')
    service.value.add(opts)
  }

  function success(summary?: string, detail?: string, life = 3000) {
    add({ severity: 'success', summary, detail, life })
  }

  function info(summary?: string, detail?: string, life = 3000) {
    add({ severity: 'info', summary, detail, life })
  }

  function warn(summary?: string, detail?: string, life = 4000) {
    add({ severity: 'warn', summary, detail, life })
  }

  function error(summary?: string, detail?: string, life = 6000) {
    add({ severity: 'error', summary, detail, life })
  }

  function clear(group?: string) {
    service.value?.clear?.(group)
  }

  function remove(key: any) {
    service.value?.remove?.(key)
  }

  return {
    service,
    setToastService,
    add,
    success,
    info,
    warn,
    error,
    clear,
    remove,
  }
})
