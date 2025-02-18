<template>
  <!-- 通知容器會由 Element Plus 自動插入 -->
</template>

<script>
import { ElNotification } from 'element-plus'
import { useNotificationsStore } from '../stores/notifications'

// 創建全局通知方法
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
    success: (message, title = '成功') => notify({ type: 'success', message, title }),
    error: (message, title = '錯誤') => notify({ type: 'error', message, title }),
    warning: (message, title = '警告') => notify({ type: 'warning', message, title }),
    info: (message, title = '提示') => notify({ type: 'info', message, title }),
  }
}
</script> 