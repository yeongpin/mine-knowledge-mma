<template>
  <!-- The notification container will be automatically inserted by Element Plus -->
</template>

<script>
import { ElNotification } from 'element-plus'
import { useNotificationsStore } from '../stores/notifications'

// Create global notification method
export const useNotification = () => {
  const notificationsStore = useNotificationsStore()

  const notify = (options) => {
    const {
      title = '',
      message = '',
      type = 'info',
      duration = 3000,
      position = 'top-right',
      offset = 50,
      showClose = true,
    } = options

    ElNotification({
      title,
      message,
      type,
      duration,
      position,
      offset,
      showClose,
    })

    notificationsStore.addNotification({
      type,
      title,
      content: message
    })
  }

  return {
    notify,
    success: (message, title = 'Success') => notify({ type: 'success', message, title }),
    error: (message, title = 'Error') => notify({ type: 'error', message, title }),
    warning: (message, title = 'Warning') => notify({ type: 'warning', message, title }),
    info: (message, title = 'Info') => notify({ type: 'info', message, title }),
  }
}
</script> 