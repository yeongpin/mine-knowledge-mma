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

// Mock template data
const templates = ref([
  { id: 1, name: 'Template #1' },
  { id: 2, name: 'Template #2' },
  { id: 3, name: 'Template #3' }
])    

const { proxy: { $notify } } = getCurrentInstance()

const notesStore = useNotesStore()
const notes = computed(() => notesStore.notes)

const showViewer = ref(false)
const currentFile = ref(null)

// Import Markdown file
const importMarkdown = async () => {
  try {
    const files = await window.electronAPI.selectFiles({
      filters: [
        { name: 'Markdown', extensions: ['md', 'markdown'] }
      ],
      properties: ['openFile', 'multiSelections']
    })
    
    if (files && files.length > 0) {
      // Add files to note list
      files.forEach(file => {
        // Check if it already exists
        const exists = notes.value.some(note => note.path === file.path)
        if (!exists) {
          notesStore.addNote({
            id: Date.now() + Math.random(),
            title: file.name,
            path: file.path,
            content: file.content || '', // Ensure content exists
            lastModified: file.lastModified,
            starred: false
          })
        }
      })
      
      $notify.success(
        t('notifications.importSuccess'),
        `${t('notifications.importSuccess')} ${files.length} ${t('notifications.files')}`
      )
      
      // Add history
      addHistory({
        type: 'import',
        title: `${t('notifications.import')} ${files.length} ${t('notifications.files')}`
      })
    }
  } catch (error) {
    console.error('Import Markdown file failed:', error)
    $notify.error(
      t('notifications.importFailed'),
      t('notifications.importFailed')
    )
    // Reset route query parameters
    router.replace({ 
      name: route.name,
      query: {} 
    })
  } finally {
    // Reset route query parameters
    router.replace({ 
      name: route.name,
      query: {} 
    })
  }
}

// Import folder
const importFolder = async () => {
  try {
    const result = await window.electronAPI.selectFolder()
    
    if (result) {  // result is folder path
      // Read all Markdown files in the folder
      const files = await window.electronAPI.readFolder(result)
      
      if (!files || files.length === 0) {
        $notify.warning(
          t('notifications.importTip'),
          t('notifications.noMarkdownFiles')
        )
        return
      }
      
      // Add files to note list
      files.forEach(file => {
        // Check if it already exists
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
      
      // Add history
      historyStore.addHistory({
        type: 'import-folder',
        title: `${t('notifications.importFolder')} ${files.length} ${t('notifications.files')}`
      })
    }
  } catch (error) {
    console.error('Import folder failed:', error)
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

// Listen for route changes
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

// Other methods
const createNewNote = () => {
  // TODO: Implement logic to create a blank note
}

const createFromTemplate = (template) => {
  // TODO: Implement logic to create a note from a template
}

const editNote = async (note) => {
  try {
    console.log('=== Edit note start ===')
    console.log('Note:', note)
    
    if (!note?.path) {
      throw new Error('File path does not exist')
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
      // Save current view state
      localStorage.setItem('previousView', route.query.view || '')
      
      console.log('=== Edit note end ===')
      
      router.push({
        name: 'markdown',
        query: { 
          id: note.id,
          isFolder: false,
          view: route.query.view  // Pass current view state
        }
      })
    } catch (error) {
      console.error('File read error:', error)
      throw error
    }
  } catch (error) {
    console.error('Edit note error:', error)
    ElMessage.error(error.message || 'Failed to read file')
  }
}

const deleteNote = async (note) => {
  try {
    await ElMessageBox.confirm(
      t('notifications.didYouWantToDeleteNote'),
      t('notifications.warning'),
      {
        confirmButtonText: t('notifications.confirm'),
        cancelButtonText: t('notifications.cancel'),
        type: 'warning'
      }
    )
    
    // Move to trash
    trashStore.addToTrash(note)
    notesStore.removeNote(note.path)
    
    // If it's a starred note, remove it from favorites
    if (note.starred) {
      favoritesStore.removeFavorite(note.path)
    }
    
    $notify.success(
      t('notifications.movedToTrash'),
      `${t('notifications.alreadyMovedToTrash')}: ${note.title}`
    )
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete error:', error)
      $notify.error(
        t('notifications.deleteFailed'),
        error.message || t('notifications.deleteFailed')
      )
    }
  }
}

// Initialize stores
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

// Search function
const searchQuery = ref('')
const filteredNotes = computed(() => {
  const view = route.query.view
  let filteredList = []

  // Filter first based on view
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

  // Filter based on search query
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

// Add history
const addHistory = (record) => {
  // TODO: Implement history
  console.log('New history record:', record)
}

// Handle note deletion
const handleDelete = async (note) => {
  if (route.query.view === 'trash') {
    // Delete from trash permanently
    trashStore.deleteFromTrash(note.id)
  } else {
    // Move to trash
    trashStore.addToTrash(note)
    notesStore.deleteNote(note.id)
  }
}

// Handle note restoration in trash
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
  
  // Test API
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