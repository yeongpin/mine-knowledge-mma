<template>
  <div class="create-section">
    <div class="section-header">
      <h3>{{ $t('createSection.createNote') }}</h3>
    </div>
    <div class="create-grid">
      <!-- 空白筆記卡片 -->
      <div class="create-card" @click="createBlankNote">
        <div class="card-icon">
          <el-icon><Plus /></el-icon>
        </div>
        <div class="card-title">{{ $t('createSection.blankNote') }}</div>
      </div>
      
      <!-- 模板卡片 -->
      <div 
        v-for="template in displayTemplates" 
        :key="template.name"
        class="create-card template-card"
        @click="createFromTemplate(template)"
      >
        <div class="card-icon">
          <el-icon><Document /></el-icon>
        </div>
        <div class="card-title">{{ template.name }}</div>
      </div>
      
      <!-- 更多模板卡片 -->
      <div 
        v-if="hasMoreTemplates"
        class="create-card more-card"
        @click="showTemplateDialog"
      >
        <div class="card-icon">
          <el-icon><More /></el-icon>
        </div>
        <div class="card-title">{{ $t('createSection.moreTemplates') }}</div>
      </div>
    </div>

    <!-- 模板選擇對話框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isTemplate ? $t('createSection.createFromTemplate') : $t('createSection.createBlankNote')"
      width="500px"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item :label="$t('createSection.selectFolder')">
          <el-button @click="selectFolder">
            {{ form.folder || $t('createSection.selectFolder') }}
          </el-button>
        </el-form-item>
        
        <el-form-item :label="$t('createSection.enterFileName')">
          <el-input v-model="form.name" :placeholder="$t('createSection.enterFileName')" />
        </el-form-item>
        
        <el-form-item v-if="isTemplate" :label="$t('createSection.selectTemplate')">
          <el-select v-model="form.template" :placeholder="$t('createSection.selectTemplate')">
            <el-option
              v-for="template in templates"
              :key="template.name"
              :label="template.name"
              :value="template.path"
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('createSection.cancel') }}</el-button>
        <el-button type="primary" @click="handleCreate">{{ $t('createSection.create') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import { Document, Plus, More } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useNotesStore } from '../stores/notes'

const router = useRouter()
const notesStore = useNotesStore()
const dialogVisible = ref(false)
const isTemplate = ref(false)
const templates = ref([])
const selectedTemplate = ref(null)

const { proxy: { $notify } } = getCurrentInstance()

const form = ref({
  folder: '',
  name: '',
  template: ''
})

// 只顯示前2個模板
const displayTemplates = computed(() => {
  return templates.value.slice(0, 2)
})

// 是否有更多模板
const hasMoreTemplates = computed(() => {
  return templates.value.length > 2
})

// 加載模板列表
const loadTemplates = async () => {
  try {
    const templateFiles = await window.electronAPI.getTemplates()
    templates.value = templateFiles
  } catch (error) {
    console.error('Load templates error:', error)
    ElMessage.error(t('notifications.loadTemplatesFailed'))
  }
}

onMounted(() => {
  loadTemplates()
})

// 創建空白筆記
const createBlankNote = () => {
  isTemplate.value = false
  selectedTemplate.value = null
  dialogVisible.value = true
}

// 從模板創建
const createFromTemplate = (template) => {
  isTemplate.value = true
  selectedTemplate.value = template
  form.value.template = template.path
  dialogVisible.value = true
}

// 顯示模板選擇對話框
const showTemplateDialog = () => {
  isTemplate.value = true
  selectedTemplate.value = null
  dialogVisible.value = true
}

// 選擇保存目錄
const selectFolder = async () => {
  try {
    const result = await window.electronAPI.selectFolder()
    if (result && typeof result === 'string') {
      form.value.folder = result
    }
  } catch (error) {
    console.error('Select folder error:', error)
    ElMessage.error(t('notifications.selectFolderFailed'))
  }
}

// 處理創建
const handleCreate = async () => {
  if (!form.value.folder || !form.value.name) {
    ElMessage.warning(t('notifications.fillInCompleteInfo'))
    return
  }
  
  try {
    const filePath = await window.electronAPI.joinPath(form.value.folder, `${form.value.name}.md`)
    
    let content = ''
    if (isTemplate.value && form.value.template) {
      // 從模板讀取內容
      const templateContent = await window.electronAPI.readTemplate(form.value.template)
      content = templateContent
    } else {
      // 空白筆記的默認內容
      content = `# ${form.value.name}\n\n`
    }
    
    // 創建文件
    await window.electronAPI.writeFile(filePath, content)
    
    dialogVisible.value = false
    
    // 創建文件對象
    const fileObject = {
      id: Date.now(),
      title: `${form.value.name}.md`,
      name: `${form.value.name}.md`,
      path: filePath,
      content: content,
      lastModified: new Date(),
      starred: false
    }
    
    // 保存到 localStorage
    localStorage.setItem('currentEditingFile', JSON.stringify(fileObject))
    
    // 添加到 notes store
    notesStore.addNote(fileObject)
    
    // 跳轉到編輯頁面
    router.push({
      name: 'markdown',
      query: {
        id: fileObject.id,
        isNew: true
      }
    })

    $notify.success(
      t('notifications.createSuccess'),
      `${t('notifications.createSuccess')} ${fileObject.name}`
    )
    
    ElMessage.success(t('notifications.createSuccess'))
  } catch (error) {
    console.error('Create note error:', error)
    ElMessage.error(t('notifications.createFailed'))
  }
}
</script>

<style scoped>
.create-section {
  margin-bottom: 24px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  overflow: hidden;
}

.section-header {
  padding: 12px 16px;
  background-color: var(--el-bg-color-page);
  border-bottom: 1px solid var(--el-border-color-light);
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.create-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  padding: 16px;
  background-color: var(--el-bg-color);
}

.create-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 120px;
  padding: 16px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.create-card:hover {
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
}

.card-icon {
  font-size: 32px;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
}

.card-title {
  font-size: 14px;
  color: var(--el-text-color-primary);
  text-align: center;
}

.template-card .card-icon {
  color: var(--el-color-success);
}

.more-card .card-icon {
  color: var(--el-color-info);
}
</style> 