<template>
  <div class="title-bar">
    <div class="title-bar-left">
      <span class="title">{{ $t('app.title') }}</span>
    </div>
    <div class="title-bar-right">
      <!-- 功能按鈕組 -->
      <div class="action-bar">
        <el-dropdown trigger="click" :teleported="true" popper-class="toolbar-dropdown">
          <div class="button">
            <el-icon><FolderAdd /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="$emit('import-folder')">
                <div class="dropdown-item-content">
                  <el-icon><Folder /></el-icon>
                  <span>{{ $t('toolbar.importFolder') }}</span>
                </div>
              </el-dropdown-item>
              <el-dropdown-item @click="$emit('import-markdown')">
                <div class="dropdown-item-content">
                  <el-icon><Document /></el-icon>
                  <span>{{ $t('toolbar.importMarkdown') }}</span>
                </div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown trigger="click" :teleported="true" popper-class="toolbar-dropdown">
          <div class="button">
            <el-icon><Timer /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <div class="history-header">
                <span>{{ $t('toolbar.history') }}</span>
              </div>
              <el-scrollbar width="240px" max-height="300">
                <el-dropdown-item v-for="item in historyItems" :key="item.id">
                  <div class="history-item">
                    <el-icon><Document /></el-icon>
                    <div class="history-content">
                      <div class="history-title">{{ $t('toolbar.edited') }} {{ item.title }}</div>
                      <div class="history-time">{{ formatTime(item.timestamp) }}</div>
                    </div>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item v-if="!historyItems.length" disabled>
                  {{ $t('toolbar.noHistory') }}
                </el-dropdown-item>
              </el-scrollbar>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown trigger="click" :teleported="true" popper-class="toolbar-dropdown">
          <div class="button">
            <el-icon><Setting /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="lang in languages"
                :key="lang.value"
                :class="{ 'is-active': currentLang === lang.value }"
                @click="handleLanguageChange(lang.value)"
              >
                {{ lang.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown trigger="click" :teleported="true" popper-class="toolbar-dropdown">
          <div class="button">
            <el-badge :value="notifications.length" :max="99" class="notification-badge">
              <el-icon><Bell /></el-icon>
            </el-badge>
          </div>
          <template #dropdown>
            <el-dropdown-menu v-if="notifications.length">
              <div class="notification-header">
                <span>{{ $t('toolbar.notifications') }}</span>
                <el-button 
                  link
                  size="small"
                  @click="notificationsStore.clearNotifications()"
                >
                  {{ $t('toolbar.clearAll') }}
                </el-button>
              </div>
              <el-scrollbar max-height="300">
                <el-dropdown-item v-for="notice in notifications" :key="notice.id">
                  <div class="notification-item">
                    <el-icon :class="notice.type">
                      <component :is="getNotificationIcon(notice.type)" />
                    </el-icon>
                    <div class="notification-content">
                      <div class="notification-title">{{ notice.title }}</div>
                      <div class="notification-text">{{ notice.content }}</div>
                      <div class="notification-time">
                        {{ formatTime(notice.timestamp) }}
                      </div>
                    </div>
                  </div>
                </el-dropdown-item>
              </el-scrollbar>
            </el-dropdown-menu>
            <el-dropdown-menu v-else>
              <el-dropdown-item disabled>{{ $t('toolbar.noNotifications') }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <!-- 窗口控制按鈕組 -->
      <div class="window-controls">
        <div class="button minimize" @click="minimize">
          <el-icon><MinusIcon /></el-icon>
        </div>
        <div class="button maximize" @click="maximize">
          <el-icon><FullScreenIcon /></el-icon>
        </div>
        <div class="button close" @click="close">
          <el-icon><CloseIcon /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { 
  Minus as MinusIcon, 
  FullScreen as FullScreenIcon, 
  Close as CloseIcon,
  Setting,
  FolderAdd,
  Plus,
  Folder,
  Document,
  Timer,
  Bell,
  SuccessFilled,
  WarningFilled,
  CircleCloseFilled,
  InfoFilled
} from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useNotificationsStore } from '../stores/notifications'
import { useHistoryStore } from '../stores/history'
import { storeToRefs } from 'pinia'
import { formatDistanceToNow } from 'date-fns'
import { zhTW, enUS } from 'date-fns/locale'

const { locale } = useI18n()
const currentLang = ref(localStorage.getItem('language') || 'zh-TW')

const languages = [
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'en', label: 'English' }
]

const historyStore = useHistoryStore()
const historyItems = computed(() => historyStore.history)

const notificationsStore = useNotificationsStore()
const { notifications } = storeToRefs(notificationsStore)

const handleLanguageChange = (value) => {
  currentLang.value = value
  locale.value = value
  localStorage.setItem('language', value)
}

// 窗口控制
const minimize = () => window.electronAPI.minimize()
const maximize = () => window.electronAPI.maximize()
const close = () => window.electronAPI.close()

const getNotificationIcon = (type) => {
  switch (type) {
    case 'success':
      return SuccessFilled
    case 'warning':
      return WarningFilled
    case 'error':
      return CircleCloseFilled
    default:
      return InfoFilled
  }
}

const formatTime = (timestamp) => {
  const locale = currentLang.value === 'zh-TW' ? zhTW : enUS
  return formatDistanceToNow(new Date(timestamp), { 
    addSuffix: true,
    locale 
  })
}

defineEmits(['create-repo', 'import-folder', 'import-markdown'])
</script>

<style scoped>
.title-bar {
  -webkit-app-region: drag;
  height: 32px;
  background: var(--el-bg-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.title-bar-left {
  display: flex;
  align-items: center;
}

.title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-right: 16px;
}

.title-bar-right {
  -webkit-app-region: no-drag;
  display: flex;
  align-items: center;
  gap: 16px; /* 增加間距 */
}

/* 功能按鈕組樣式 */
.action-bar {
  display: flex;
  height: 32px;
  align-items: center;
}

/* 窗口控制按鈕組樣式 */
.window-controls {
  display: flex;
  height: 32px;
  align-items: center;
}

/* 按鈕基礎樣式 */
.button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--el-text-color-regular);
  transition: all 0.2s ease;
}

.button:hover {
  background-color: var(--el-fill-color-light);
}

.button.close:hover {
  background-color: #f56c6c;
  color: white;
}

/* 下拉菜單容器樣式 */
:deep(.el-dropdown) {
  height: 32px;
  display: flex;
  align-items: center;
}

/* 統一下拉菜單樣式 */
:deep(.toolbar-dropdown) {
  background-color: var(--el-bg-color) !important;
  border: 1px solid var(--el-border-color-light) !important;
  border-radius: 4px;
  width: 320px !important;
  margin-top: 4px !important;
  transform: translateX(-50%) !important;
}

/* 只添加滾動相關樣式 */
:deep(.el-scrollbar__wrap) {
  max-height: 300px !important;
}

:deep(.el-dropdown-menu__item i) {
  align-items: center;
  justify-content: center;
}

/* 下拉菜單滾動樣式 */
:deep(.el-dropdown-menu) {
  max-height: 300px !important;
  overflow-y: auto !important;
}

:deep(.el-dropdown-menu::-webkit-scrollbar) {
  width: 6px;
}

:deep(.el-dropdown-menu::-webkit-scrollbar-thumb) {
  background: var(--el-text-color-secondary);
  opacity: 0.3;
  border-radius: 3px;
}

:deep(.el-dropdown-menu::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(.el-dropdown-menu__item) {
  color: var(--el-text-color-regular) !important;
  line-height: 32px !important;
  padding: 0 16px !important;
  font-size: 13px;
}

:deep(.el-dropdown-menu__item:hover),
:deep(.el-dropdown-menu__item:focus) {
  background-color: var(--el-fill-color-light) !important;
}

.notification-badge :deep(.el-badge__content) {
  background-color: var(--accent-100);
  border: none;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: normal;
  line-height: 16px;
  top: 4px;
  right: 4px;
}

/* 確保所有圖標大小一致 */
.button .el-icon {
  font-size: 16px;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 下拉菜單項樣式 */
.dropdown-item-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.el-dropdown__item) {
  padding: 8px 16px !important;
}

:deep(.el-dropdown__item .el-icon) {
  font-size: 16px;
  width: 16px;
  height: 16px;
  margin-right: 0;
}

.notifications {
  margin-right: auto;
  -webkit-app-region: no-drag;
}

.notification-btn {
  padding: 4px 8px;
  height: 24px;
}

.notification-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  max-width: 100%;
}

.notification-item .el-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  width: 24px;
  height: 24px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: bold;
  margin-bottom: 4px;
  line-height: 1.4;
}

.notification-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.success {
  color: var(--el-color-success);
}

.warning {
  color: var(--el-color-warning);
}

.error {
  color: var(--el-color-danger);
}

.info {
  color: var(--el-color-info);
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.notification-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  font-weight: bold;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.history-item .el-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  width: 24px;
  height: 24px;
}

.history-content {
  flex: 1;
  min-width: 0;
  padding: 8px 0;
}

.history-title {
  font-size: 13px;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.history-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 防止重複的歷史記錄項目 */
.history-item:not(:last-child) {
  border-bottom: 1px solid var(--el-border-color-lighter);
}
</style> 