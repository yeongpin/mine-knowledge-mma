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

        <!-- Frequently used knowledge base list -->
        <FrequentlyUsedList 
          :favorites="favorites" 
          :handleFavoriteClick="handleFavoriteClick" 
          :removeFavorite="removeFavorite" 
        />

        <!-- Folder list -->
        <FolderList />


        <!-- Create note dialog -->
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
import { useI18n } from 'vue-i18n'
import FrequentlyUsedList from './components/FrequentlyUsedList.vue'
import FolderList from './components/FolderList.vue'
const router = useRouter()
const favoritesStore = useFavoritesStore()
const notificationsStore = useNotificationsStore()
const notesStore = useNotesStore()
const trashStore = useTrashStore()
const { favorites } = storeToRefs(favoritesStore)
const { t } = useI18n()

const { proxy: { $notify } } = getCurrentInstance()

const isDark = ref(document.documentElement.classList.contains('dark'))
const currentMenu = ref('1')
const showCreateDialog = ref(false)

// Listen for theme changes
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
  // TODO: Implement create knowledge base logic
}

const handleImportFolder = () => {
  router.push({
    name: 'home',
    query: { action: 'import-folder' }
  })
}

const handleImportMarkdown = () => {
  // Navigate to homepage and trigger import
  router.push({ 
    name: 'home',
    query: { action: 'import-markdown' }
  })
}

const removeFavorite = (item) => {
  favoritesStore.removeFavorite(item.path)
  // Update notes store status
  notesStore.updateStarStatus(item.path, false)
  $notify.info(
    t('notifications.unfavoriteSuccess'),
    `${t('notifications.unfavoriteSuccess')} ${item.name}`
  )
}

const handleFavoriteClick = (item) => {
  // Save file data to localStorage
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


/* Ensure the styles of the two menus are consistent */
:deep(.el-menu + .el-menu) {
  border-top: none;
  margin-top: -4px;
}

/* Adjust icon size and color */
:deep(.el-menu-item .el-icon) {
  font-size: 18px;
  color: var(--text-200);
}

:deep(.el-menu-item.is-active .el-icon) {
  color: var(--primary-300);
}


</style> 