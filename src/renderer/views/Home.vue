<template>
  <div class="home">
    <CreateSection 
      :templates="templates"
      @create="createNewNote"
      @create-from-template="createFromTemplate"
    />
    
    <SearchBar @search="handleSearch" />
    
    <div class="note-list-container">
      <NoteList
        :notes="filteredNotes"
        @edit="editNote"
        @delete="deleteNote"
        @toggle-star="toggleStar"
        @restore="handleRestore"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, getCurrentInstance } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Document, 
  Edit, 
  Delete, 
  Plus, 
  Star, 
  StarFilled 
} from '@element-plus/icons-vue'
import { useFavoritesStore } from '../stores/favorites'
import { useHistoryStore } from '../stores/history'
import { useNotificationsStore } from '../stores/notifications'
import { useNotesStore } from '../stores/notes'
import { useTrashStore } from '../stores/trash'
import CreateSection from '../components/CreateSection.vue'
import SearchBar from '../components/SearchBar.vue'
import NoteList from '../components/NoteList.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

// 模擬模板數據
const templates = ref([
  { id: 1, name: '模板 #1' },
  { id: 2, name: '模板 #2' },
  { id: 3, name: '模板 #3' }
])

const { proxy: { $notify } } = getCurrentInstance()

const notesStore = useNotesStore()
const notes = computed(() => notesStore.notes)

const showViewer = ref(false)
const currentFile = ref(null)

// 導入 Markdown 文件
const importMarkdown = async () => {
  try {
    const files = await window.electronAPI.selectFiles({
      filters: [
        { name: 'Markdown', extensions: ['md', 'markdown'] }
      ],
      properties: ['openFile', 'multiSelections']
    })
    
    if (files && files.length > 0) {
      // 將文件添加到筆記列表
      files.forEach(file => {
        // 檢查是否已存在
        const exists = notes.value.some(note => note.path === file.path)
        if (!exists) {
          notesStore.addNote({
            id: Date.now() + Math.random(),
            title: file.name,
            path: file.path,
            content: file.content || '', // 確保 content 存在
            lastModified: file.lastModified,
            starred: false
          })
        }
      })
      
      $notify.success(
        t('notifications.importSuccess'),
        `${t('notifications.importSuccess')} ${files.length} ${t('notifications.files')}`
      )
      
      // 添加歷史記錄
      addHistory({
        type: 'import',
        title: `${t('notifications.import')} ${files.length} ${t('notifications.files')}`
      })
    }
  } catch (error) {
    console.error('導入 Markdown 文件失敗:', error)
    $notify.error(
      t('notifications.importFailed'),
      t('notifications.importFailed')
    )
    // 重置路由查詢參數
    router.replace({ 
      name: route.name,
      query: {} 
    })
  } finally {
    // 無論成功或失敗，都重置路由查詢參數
    router.replace({ 
      name: route.name,
      query: {} 
    })
  }
}

// 導入文件夾
const importFolder = async () => {
  try {
    const result = await window.electronAPI.selectFolder()
    
    if (result) {  // result 是文件夾路徑
      // 讀取文件夾中的所有 Markdown 文件
      const files = await window.electronAPI.readFolder(result)
      
      if (!files || files.length === 0) {
        $notify.warning(
          t('notifications.importTip'),
          t('notifications.noMarkdownFiles')
        )
        return
      }
      
      // 將文件添加到筆記列表
      files.forEach(file => {
        // 檢查是否已存在
        const exists = notes.value.some(note => note.path === file.path)
        if (!exists) {
          notesStore.addNote({
            id: Date.now() + Math.random(),
            title: file.name,
            path: file.path,
            content: file.content || '',
            lastModified: file.lastModified,
            starred: false
          })
        }
      })
      
      $notify.success(
        t('notifications.importSuccess'),
        `${t('notifications.importSuccess')} ${files.length} ${t('notifications.files')}`
      )
      
      // 添加歷史記錄
      historyStore.addHistory({
        type: 'import-folder',
        title: `${t('notifications.importFolder')} ${files.length} ${t('notifications.files')}`
      })
    }
  } catch (error) {
    console.error('導入文件夾失敗:', error)
    $notify.error(
      t('notifications.importFailed'),
      error.message || t('notifications.importFailed')
    )
  } finally {
    router.replace({ 
      name: route.name,
      query: {} 
    })
  }
}

// 監聽路由變化
watch(
  () => route.query,
  async (query) => {
    if (query.action === 'import-markdown') {
      await importMarkdown()
    } else if (query.action === 'import-folder') {
      await importFolder()
    }
  },
  { immediate: true }
)

// 其他方法
const createNewNote = () => {
  // TODO: 實現創建空白筆記的邏輯
}

const createFromTemplate = (template) => {
  // TODO: 實現從模板創建筆記的邏輯
}

const editNote = async (note) => {
  try {
    console.log('=== Edit note start ===')
    console.log('Note:', note)
    
    if (!note?.path) {
      throw new Error('文件路徑不存在')
    }
    
    const filePath = String(note.path).trim()
    console.log('File path:', {
      original: note.path,
      processed: filePath,
      type: typeof filePath
    })
    
    try {
      const fileData = await window.electronAPI.readFile(filePath)
      console.log('File data:', fileData)
      
      if (!fileData?.content) {
        throw new Error('無法讀取文件內容')
      }
      
      const fileObject = {
        id: note.id,
        title: note.title,
        path: filePath,
        content: fileData.content,
        name: fileData.name || note.title,
        lastModified: fileData.lastModified || note.lastModified,
        starred: note.starred
      }
      
      localStorage.setItem('currentEditingFile', JSON.stringify(fileObject))
      // 保存當前視圖狀態
      localStorage.setItem('previousView', route.query.view || '')
      
      console.log('=== Edit note end ===')
      
      router.push({
        name: 'markdown',
        query: { 
          id: note.id,
          isFolder: false,
          view: route.query.view  // 傳遞當前視圖狀態
        }
      })
    } catch (error) {
      console.error('File read error:', error)
      throw error
    }
  } catch (error) {
    console.error('Edit note error:', error)
    ElMessage.error(error.message || '讀取文件失敗')
  }
}

const deleteNote = async (note) => {
  try {
    await ElMessageBox.confirm(
      '確定要刪除此筆記嗎？此操作可以從回收站恢復',
      '警告',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 移到回收站
    trashStore.addToTrash(note)
    notesStore.removeNote(note.path)
    
    // 如果是收藏的筆記，同時從收藏中移除
    if (note.starred) {
      favoritesStore.removeFavorite(note.path)
    }
    
    $notify.success(
      '移到回收站',
      `已移到回收站: ${note.title}`
    )
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete error:', error)
      $notify.error(
        '刪除失敗',
        error.message || '刪除筆記時發生錯誤'
      )
    }
  }
}

// 初始化 store
const favoritesStore = useFavoritesStore()
const historyStore = useHistoryStore()
const notificationsStore = useNotificationsStore()
const trashStore = useTrashStore()

const toggleStar = (note) => {
  const index = notes.value.findIndex(n => n.id === note.id)
  if (index !== -1) {
    const newStatus = !notes.value[index].starred
    notesStore.updateStarStatus(note.path, newStatus)
    
    if (newStatus) {
      favoritesStore.addFavorite({
        id: note.id,
        title: note.title,
        path: note.path,
        name: note.title,
        content: note.content,
        lastModified: note.lastModified,
        starred: true
      })
      $notify.success(
        t('notes.addFavorite'),
        `${t('notes.addFavorite')} ${note.title}`
      )
    } else {
      favoritesStore.removeFavorite(note.path)
      $notify.info(
        t('notes.removeFavorite'),
        `${t('notes.removeFavorite')} ${note.title}`
      )
    }
    
    historyStore.addHistory({
      type: newStatus ? 'star' : 'unstar',
      title: `${newStatus ? t('notes.star') : t('notes.unstar')}: ${note.title}`
    })
  }
}

// 搜索功能
const searchQuery = ref('')
const filteredNotes = computed(() => {
  const view = route.query.view
  let filteredList = []

  // 先根據視圖過濾
  switch (view) {
    case 'favorites':
      filteredList = notes.value.filter(note => note.starred)
      break
    case 'trash':
      filteredList = trashStore.trashedNotes
      break
    default:
      filteredList = notes.value
  }

  // 再根據搜索關鍵字過濾
  if (!searchQuery.value) {
    return filteredList
  }

  const query = searchQuery.value.toLowerCase()
  return filteredList.filter(note => 
    note.title.toLowerCase().includes(query) ||
    note.path.toLowerCase().includes(query)
  )
})

const handleSearch = (query) => {
  searchQuery.value = query
}

// 添加歷史記錄
const addHistory = (record) => {
  // TODO: 實現歷史記錄
  console.log('New history record:', record)
}

// 處理筆記刪除
const handleDelete = async (note) => {
  if (route.query.view === 'trash') {
    // 從回收站永久刪除
    trashStore.deleteFromTrash(note.id)
  } else {
    // 移到回收站
    trashStore.addToTrash(note)
    notesStore.deleteNote(note.id)
  }
}

// 處理回收站中的筆記恢復
const handleRestore = async (note) => {
  const restoredNote = trashStore.restoreFromTrash(note.id)
  if (restoredNote) {
    notesStore.addNote(restoredNote)
  }
}

onMounted(() => {
  console.log('Home mounted, checking APIs:', {
    electronAPI: !!window.electronAPI,
    readFile: !!window.electronAPI?.readFile,
    testAPI: !!window.testAPI
  })
  
  // 測試 API
  if (window.testAPI) {
    window.testAPI.test()
  }
})
</script>

<style scoped>
.home {
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 32px;
}

.empty-image {
  width: 200px;
  margin-bottom: 24px;
}

.empty-text {
  color: var(--text-200);
  font-size: 14px;
  margin-bottom: 24px;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 100%;
}

.create-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(160px, 1fr));
  gap: 16px;
  padding: 16px;
  background-color: var(--bg-200);
  border-radius: 8px;
  width: 100%;
  min-width: 700px;
}

.empty-state .create-grid {
  width: auto;
  min-width: 700px;
  margin: 0 auto;
}

.create-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 160px;
  background-color: var(--bg-100);
  border: 1px solid var(--bg-300);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 16px;
}

.create-card:hover {
  border-color: var(--primary-300);
  background-color: var(--primary-100);
  transform: translateY(-2px);
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background-color: var(--bg-200);
  margin-bottom: 16px;
}

.create-card:hover .card-icon {
  background-color: var(--primary-200);
  color: var(--primary-300);
}

.card-icon .el-icon {
  font-size: 24px;
  color: var(--text-200);
}

.create-card:hover .card-icon .el-icon {
  color: var(--primary-300);
}

.card-title {
  font-size: 14px;
  color: var(--text-100);
  text-align: center;
  line-height: 1.4;
}

.template-card .card-icon {
  background-color: var(--bg-300);
}

.notes-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.note-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 6px;
  background-color: var(--bg-100);
  border: 1px solid var(--bg-300);
  transition: all 0.2s;
}

.note-item:hover {
  border-color: var(--primary-200);
  background-color: var(--primary-100);
}

.note-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.note-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.note-icon {
  font-size: 20px;
  color: var(--text-200);
  width: 20px;
  height: 20px;
}

.note-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.note-title {
  font-size: 14px;
  color: var(--text-100);
  font-weight: 500;
}

.note-path {
  font-size: 12px;
  color: var(--text-200);
}

.note-star {
  display: flex;
  align-items: center;
}

.note-star .el-button {
  padding: 4px;
}

.note-star .el-icon {
  font-size: 16px;
  width: 16px;
  height: 16px;
}

/* 調整收藏按鈕顏色 */
.note-star .el-button.is-text:not(.el-button--primary):not(.el-button--warning) {
  color: var(--text-200);
}

.note-star .el-button.el-button--warning {
  color: #e6a23c;
}

/* 調整按鈕懸停效果 */
.note-star .el-button:hover {
  background-color: transparent;
  opacity: 0.8;
}

.note-actions {
  display: flex;
  gap: 8px;
}

:deep(.markdown-dialog .el-dialog__body) {
  padding: 0;
  height: 70vh;
}

.note-list-container {
  flex: 1;
  overflow-y: auto;
  height: calc(100vh - 280px);
  margin-right: -16px;
  padding-right: 16px;
  overflow-y: overlay;
}

/* 自定義滾動條樣式 */
.note-list-container::-webkit-scrollbar {
  width: 6px;
  opacity: 0;
  transition: opacity 0.3s;
}

/* 當容器被懸停或滾動時顯示滾動條 */
.note-list-container:hover::-webkit-scrollbar,
.note-list-container:active::-webkit-scrollbar {
  opacity: 1;
}

.note-list-container::-webkit-scrollbar-thumb {
  background-color: var(--el-border-color);
  border-radius: 3px;
}

.note-list-container::-webkit-scrollbar-track {
  background-color: transparent;
}
</style> 