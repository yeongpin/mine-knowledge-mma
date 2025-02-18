<template>
  <div class="app-container">
    <GlobalNotification />
    <TitleBar 
      @create-repo="handleCreateRepo"
      @import-folder="handleImportFolder"
      @import-markdown="handleImportMarkdown"
    />
    <el-container class="app">
      <el-aside width="240px" class="sidebar">
        <div class="sidebar-header">
          <el-button 
            type="primary" 
            class="new-note-btn" 
            size="large"
            @click="showCreateDialog = true"
          >
            {{ $t('app.newNote') }}
          </el-button>
        </div>
        <el-menu 
          :default-active="currentMenu"
          :background-color="'transparent'"
          :text-color="'var(--text-200)'"
          @select="handleMenuSelect"
        >
          <el-menu-item index="1" class="menu-item">
            <el-icon><Document /></el-icon>
            <span>{{ $t('menu.allNotes') }}</span>
          </el-menu-item>
          <el-menu-item index="2" class="menu-item">
            <el-icon><Star /></el-icon>
            <span>{{ $t('menu.favorites') }}</span>
          </el-menu-item>
          <el-menu-item index="3" class="menu-item">
            <el-icon><Delete /></el-icon>
            <span>{{ $t('menu.trash') }}</span>
          </el-menu-item>
        </el-menu>

        <!-- 常用知識庫列表 -->
        <div class="frequently-used">
          <h2>{{ $t('menu.frequentlyUsed') }}</h2>
          <div v-if="favorites.length" class="favorites-list">
            <div v-for="item in favorites" :key="item.id" 
              @click="handleFavoriteClick(item)"
              class="favorite-item"
            >
              <el-icon><Collection /></el-icon>
              <span class="favorite-name">{{ item.name }}</span>
              <el-button 
                link 
                type="warning" 
                size="small" 
                @click.stop="removeFavorite(item)"
              >
                <el-icon><StarFilled /></el-icon>
              </el-button>
            </div>
          </div>
          <div v-else class="empty-favorites">
            <el-icon><Star /></el-icon>
            <span>{{ $t('menu.noFavorites') }}</span>
          </div>
        </div>

        <!-- 創建筆記對話框 -->
        <el-dialog
          v-model="showCreateDialog"
          :title="$t('notes.create')"
          width="500px"
        >
          <CreateSection @created="handleNoteCreated" />
        </el-dialog>
      </el-aside>
      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, getCurrentInstance } from 'vue'
import { 
  Collection, 
  Star, 
  StarFilled,
  Document,
  Delete
} from '@element-plus/icons-vue'
import TitleBar from './components/TitleBar.vue'
import GlobalNotification from './components/GlobalNotification.vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useFavoritesStore } from './stores/favorites'
import { useNotificationsStore } from './stores/notifications'
import { useNotesStore } from './stores/notes'
import { useTrashStore } from './stores/trash'
import CreateSection from './components/CreateSection.vue'

const router = useRouter()
const favoritesStore = useFavoritesStore()
const notificationsStore = useNotificationsStore()
const notesStore = useNotesStore()
const trashStore = useTrashStore()
const { favorites } = storeToRefs(favoritesStore)

const { proxy: { $notify } } = getCurrentInstance()

const isDark = ref(document.documentElement.classList.contains('dark'))
const currentMenu = ref('1')
const showCreateDialog = ref(false)

// 監聽主題變化
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === 'class') {
      isDark.value = document.documentElement.classList.contains('dark')
    }
  })
})

onMounted(() => {
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })
})

const handleCreateRepo = () => {
  // TODO: 實現創建知識庫邏輯
}

const handleImportFolder = () => {
  router.push({
    name: 'home',
    query: { action: 'import-folder' }
  })
}

const handleImportMarkdown = () => {
  // 導航到首頁並觸發導入
  router.push({ 
    name: 'home',
    query: { action: 'import-markdown' }
  })
}

const removeFavorite = (item) => {
  favoritesStore.removeFavorite(item.path)
  // 更新 notes store 中的狀態
  notesStore.updateStarStatus(item.path, false)
  $notify.info(
    '取消收藏',
    `已取消收藏: ${item.name}`
  )
}

const handleFavoriteClick = (item) => {
  // 先保存文件數據到 localStorage
  localStorage.setItem('currentEditingFile', JSON.stringify({
    id: item.id,
    title: item.name,
    name: item.name,
    path: item.path,
    content: item.content,
    lastModified: item.lastModified,
    starred: true
  }))

  router.push({
    name: 'markdown',
    query: { 
      id: item.id,
      isFolder: false
    }
  })
}

const handleMenuSelect = (index) => {
  switch (index) {
    case '1':
      router.push('/')
      break
    case '2':
      router.push({ name: 'home', query: { view: 'favorites' } })
      break
    case '3':
      router.push({ name: 'home', query: { view: 'trash' } })
      break
  }
}

const handleNoteCreated = () => {
  showCreateDialog.value = false
}
</script>

<style>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
}

.app {
  flex: 1;
  overflow: hidden;
}

.sidebar {
  height: 100%;
  padding: 16px;
  background-color: var(--bg-200);
}

.sidebar-header {
  padding: 0 0 16px 0;
}

.new-note-btn {
  width: 100%;
  height: 44px;
  border-radius: 8px;
  font-size: 15px;
}

.menu-item {
  height: 40px;
  line-height: 40px;
  border-radius: 6px;
  margin: 4px 0;
}

:deep(.el-menu) {
  border: none;
  background-color: transparent;
}

:deep(.el-menu-item) {
  border-radius: 6px;
}

:deep(.el-menu-item.is-active) {
  background-color: var(--primary-200) !important;
  color: var(--primary-300) !important;
}

:deep(.el-menu-item:hover) {
  background-color: var(--primary-100) !important;
}

:deep(.el-menu-item .el-icon) {
  margin-right: 12px;
}

.el-main {
  padding: 24px;
  background-color: var(--el-bg-color);
}

.frequently-used {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--bg-300);
}

.section-title {
  padding: 0 12px 8px;
  color: var(--text-200);
  font-size: 13px;
  font-weight: 500;
}

/* 確保兩個菜單的樣式一致 */
:deep(.el-menu + .el-menu) {
  border-top: none;
  margin-top: -4px;
}

/* 調整圖標大小和顏色 */
:deep(.el-menu-item .el-icon) {
  font-size: 18px;
  color: var(--text-200);
}

:deep(.el-menu-item.is-active .el-icon) {
  color: var(--primary-300);
}

.favorites-list {
  margin-top: 16px;
}

.favorite-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
  cursor: pointer;
}

.favorite-item:hover {
  background-color: var(--el-fill-color-light);
}

.favorite-item .el-icon {
  font-size: 18px;
  color: var(--el-text-color-regular);
}

.favorite-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

/* 調整取消收藏按鈕樣式 */
.favorite-item .el-button {
  padding: 4px;
}

.favorite-item .el-button .el-icon {
  font-size: 16px;
  color: var(--el-color-warning);
}

.favorite-item .el-button:hover {
  background-color: transparent;
  opacity: 0.8;
}

.empty-favorites {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  color: var(--el-text-color-secondary);
}

.empty-favorites .el-icon {
  font-size: 24px;
  margin-bottom: 8px;
}
</style> 