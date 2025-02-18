<template>
  <div class="notes-wrapper">
    <div v-if="notes.length === 0" class="empty-notes">
      <div class="empty-icon">
        <el-icon><DocumentAdd /></el-icon>
      </div>
      <p class="empty-text">{{ $t('notes.empty') }}</p>
    </div>
    <div v-else class="notes-list">
      <div
        v-for="note in notes"
        :key="note.id"
        class="note-item"
        :data-path="note.path"
        @click="currentView === 'trash' ? null : handleNoteClick(note)"
      >
        <div class="note-info">
          <div class="note-main">
            <div class="note-star" @click.stop>
              <el-button
                v-if="currentView !== 'trash'"
                text 
                :type="note.starred ? 'warning' : 'default'"
                @click="$emit('toggle-star', note)"
              >
                <el-icon>
                  <template v-if="note.starred">
                    <StarFilled />
                  </template>
                  <template v-else>
                    <Star />
                  </template>
                </el-icon>
              </el-button>
            </div>
            <el-icon class="note-icon"><Document /></el-icon>
            <div class="note-text">
              <div class="note-title">{{ note.title }}</div>
              <div class="note-path">{{ note.path }}</div>
            </div>
          </div>
        </div>
        <div class="note-actions" @click.stop>
          <template v-if="currentView === 'trash'">
            <el-button text type="primary" @click="$emit('restore', note)">
              <el-icon><RefreshLeft /></el-icon>
            </el-button>
          </template>
          <template v-else>
            <el-button text type="primary" @click="$emit('edit', note)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button text type="danger" @click="$emit('delete', note)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { 
  Document, 
  Edit, 
  Delete, 
  Star, 
  StarFilled,
  DocumentAdd,
  RefreshLeft
} from '@element-plus/icons-vue'
import { useNotificationsStore } from '../stores/notifications'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const notificationsStore = useNotificationsStore()
const route = useRoute()
const currentView = computed(() => route.query.view)
const { t } = useI18n()

defineProps({
  notes: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['edit', 'delete', 'toggle-star', 'restore'])

const handleNoteClick = (note) => {
  if (currentView.value === 'trash') return
    
  // 確保傳遞完整的對象
  const noteData = {
    id: note.id,
    title: note.title,
    path: note.path,
    content: note.content,
    lastModified: note.lastModified,
    starred: note.starred
  }
  
  emit('edit', noteData)
}

const handleDelete = async (item) => {
  try {
    await ElMessageBox.confirm(
      t('notes.confirmDelete'),
      t('notes.warning'),
      {
        confirmButtonText: t('notes.confirm'),
        cancelButtonText: t('notes.cancel'),
        type: 'warning'
      }
    )
    
    // 執行刪除操作
    await deleteRepo(item)
    
    // 發送通知
    notificationsStore.addNotification({
      type: 'success',
      title: t('notes.deleteSuccess'),
      content: `${t('notes.deleteSuccess')} ${item.name}`
    })
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete error:', error)
      notificationsStore.addNotification({
        type: 'error',
        title: t('notes.deleteFailed'),
        content: error.message || t('notes.deleteFailed')
      })
    }
  }
}

const toggleFavorite = (item) => {
  if (item.favorite) {
    favoritesStore.removeFavorite(item.path)
    item.favorite = false
    notificationsStore.addNotification({
      type: 'info',
      title: t('notes.removeFavorite'),
      content: `${t('notes.removeFavorite')} ${item.title}`
    })
  } else {
    favoritesStore.addFavorite({
      path: item.path,
      name: item.title,
      favorite: true,
      content: item.content,
      lastModified: item.lastModified
    })
    item.favorite = true
    notificationsStore.addNotification({
      type: 'success',
      title: t('notes.addFavorite'),
      content: `${t('notes.addFavorite')} ${item.title}`
    })
  }
}
</script>

<style scoped>
.notes-wrapper {
  flex: 1;
  overflow-y: auto;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-notes {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  height: 100%;
  min-height: inherit;
}

.empty-icon {
  font-size: 48px;
  color: var(--text-200);
  margin-bottom: 16px;
}

.empty-text {
  color: var(--text-200);
  font-size: 14px;
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
  cursor: pointer;
}

.note-item:hover {
  border-color: var(--primary-200);
  background-color: var(--primary-100);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.note-star,
.note-actions {
  position: relative;
  z-index: 1;
}

.note-actions .el-button:hover,
.note-star .el-button:hover {
  background-color: var(--bg-200) !important;
}

.note-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.note-main {
  display: flex;
  align-items: center;
}

.note-icon {
  font-size: 24px;
  color: var(--text-200);
  margin-right: 8px;
}

.note-text {
  flex: 1;
}

.note-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-100);
  margin-bottom: 4px;
}

.note-path {
  font-size: 12px;
  color: var(--text-200);
}

.note-star {
  margin-left: 8px;
  padding: 0px 10px 0px 0px;
}

.note-actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}

.note-actions button {
  margin-left: 8px;
}

.note-star .el-button {
  padding: 4px;
}

.note-star .el-icon {
  font-size: 16px;
  width: 16px;
  height: 16px;
}

.note-star .el-button.is-text:not(.el-button--primary):not(.el-button--warning) {
  color: var(--text-200);
}

.note-star .el-button.el-button--warning {
  color: var(--el-color-warning);
}

.note-star .el-button:hover {
  background-color: transparent;
  opacity: 0.8;
}

.note-item[data-in-trash="true"] {
  opacity: 0.8;
  cursor: default;
}

.note-item[data-in-trash="true"]:hover {
  transform: none;
  box-shadow: none;
}
</style> 