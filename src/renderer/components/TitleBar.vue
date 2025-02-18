<template>
  <div class="title-bar">
    <div class="title-bar-left">
      <img src="https://raw.githubusercontent.com/yeongpin/mine-knowledge-mma/refs/heads/main/src/assets/icon.png" alt="logo" class="logo" style="width: 24px; height: 24px;">
      <span class="title">{{ $t('app.title') }} v{{ $t('app.version') }}</span>
    </div>
    <div class="title-bar-right">
      <!-- Action button group -->
      <div class="action-bar">
        <div class="button" @click="openGithub">
          <el-icon><svg width="800" height="800" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.976 0A7.977 7.977 0 0 0 0 7.976c0 3.522 2.3 6.507 5.431 7.584.392.049.538-.196.538-.392v-1.37c-2.201.49-2.69-1.076-2.69-1.076-.343-.93-.881-1.175-.881-1.175-.734-.489.048-.489.048-.489.783.049 1.224.832 1.224.832.734 1.223 1.859.88 2.3.685.048-.538.293-.88.489-1.076-1.762-.196-3.621-.881-3.621-3.964 0-.88.293-1.566.832-2.153-.05-.147-.343-.978.098-2.055 0 0 .685-.196 2.201.832.636-.196 1.322-.245 2.007-.245s1.37.098 2.006.245c1.517-1.027 2.202-.832 2.202-.832.44 1.077.146 1.908.097 2.104a3.16 3.16 0 0 1 .832 2.153c0 3.083-1.86 3.719-3.62 3.915.293.244.538.733.538 1.467v2.202c0 .196.146.44.538.392A7.98 7.98 0 0 0 16 7.976C15.951 3.572 12.38 0 7.976 0"/></svg></el-icon>
        </div>
        <el-dropdown trigger="click" :teleported="true" popper-class="toolbar-dropdown">
          <div class="button">
            <el-icon><Histogram /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <div class="changelog-header">
                <span>Changelog</span>
              </div>
              <el-scrollbar max-height="400px">
                <div class="changelog-content" v-html="changelogContent"></div>
              </el-scrollbar>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
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
import { ref, computed, onMounted } from 'vue'
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
  InfoFilled,
  Link,
  Histogram
} from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useNotificationsStore } from '../stores/notifications'
import { useHistoryStore } from '../stores/history'
import { storeToRefs } from 'pinia'
import { formatDistanceToNow } from 'date-fns'
import { zhTW, enUS } from 'date-fns/locale'
import { ElMessageBox, ElMessage } from 'element-plus'

const { locale } = useI18n()
const currentLang = ref(localStorage.getItem('language') || 'zh-TW')
const changelogContent = ref('')
const electronAPI = ref(null)

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

const openGithub = () => {
  window.electronAPI?.openExternal('https://github.com/yeongpin/mine-knowledge-mma')
}

onMounted(async () => {
  // Ensure electronAPI is ready
  electronAPI.value = window.electronAPI

  try {
    const content = await electronAPI.value.getChangelog()
    let isFirstVersion = true
    let inHeader = true  // Used to skip the title part
    // Convert Markdown to HTML
    changelogContent.value = content
      .split('\n')
      .map(line => {
        // Skip the title part
        if (inHeader) {
          if (line.startsWith('## ')) {
            inHeader = false
          } else {
            return ''
          }
        }

        if (line.startsWith('## ')) {
          const match = line.match(/\[(.*?)\]\s*-\s*(.*)/)
          const versionHtml = match
            ? `Version ${match[1]} <span class="changelog-date">${match[2]}</span>`
            : line.slice(3)
          
          if (isFirstVersion) {
            isFirstVersion = false
            return `<div class="changelog-item-container"><h2 class="changelog-version">${versionHtml}</h2>`
          }
          return `</div><div class="changelog-item-container"><h2 class="changelog-version changelog-version-divider">${versionHtml}</h2>`
        }
        if (line.startsWith('### ')) return `<h3 class="changelog-section">${line.slice(4)}</h3>`
        if (line.startsWith('- ')) return `<div class="changelog-item">• ${line.slice(2)}</div>`
        if (line.trim() === '') return ''  // Remove empty line spacer
        return `<p class="changelog-text">${line}</p>`
      })
      .filter(line => line)  // Remove empty strings
      .join('') + '</div>'
  } catch (error) {
    console.error('Failed to load changelog:', error)
  }
})

defineEmits(['create-repo', 'import-folder', 'import-markdown'])
</script>

<style scoped>
.logo {
  width: 24px;
  height: 24px;
  margin-right: 8px;
}

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

.changelog-header {
  padding: 8px 16px;
  font-weight: bold;
  border-bottom: 1px solid var(--el-border-color-light);
}

.changelog-content {
  padding: 16px;
  font-size: 14px;
  line-height: 1.6;
}

.changelog-content h1 {
  font-size: 18px;
  margin-bottom: 16px;
  color: var(--el-text-color-primary);
}

.changelog-content h2 {
  font-size: 16px;
  margin: 16px 0 8px;
  color: var(--el-text-color-primary);
}

.changelog-content h3 {
  font-size: 14px;
  margin: 12px 0 8px;
  color: var(--el-text-color-regular);
}

.changelog-content li {
  margin: 4px 0;
  padding-left: 8px;
  list-style: none;
  position: relative;
}

.changelog-content li::before {
  content: "•";
  position: absolute;
  left: -8px;
  color: var(--el-text-color-secondary);
}

.changelog-content p {
  margin: 8px 0;
  color: var(--el-text-color-regular);
}

.changelog-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 24px;
  color: var(--el-text-color-primary);
  border-bottom: 2px solid var(--el-border-color);
  padding-bottom: 8px;
}

:deep(.changelog-item-container) {
  padding: 16px;
  margin: 0 -16px;
  transition: background-color 0.2s ease;
}

:deep(.changelog-item-container:hover) {
  background-color: var(--el-fill-color-light);
}

:deep(.changelog-version) {
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 16px;
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.changelog-version-divider) {
  position: relative;
}

:deep(.changelog-version-divider::before) {
  content: '';
  position: absolute;
  top: 0;
  left: -16px;
  right: -16px;
  height: 1px;
  background-color: var(--el-border-color-light);
}

:deep(.changelog-date) {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  font-weight: normal;
}

:deep(.changelog-section) {
  font-size: 16px;
  font-weight: 600;
  margin: 16px 0 8px;
  color: var(--el-text-color-regular);
}

:deep(.changelog-item) {
  margin: 8px 0;
  padding-left: 16px;
  position: relative;
  color: var(--el-text-color-regular);
}

:deep(.changelog-text) {
  margin: 8px 0;
  color: var(--el-text-color-secondary);
}

.changelog-spacer {
  height: 8px;
}
</style> 