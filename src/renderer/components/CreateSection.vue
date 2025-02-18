<template>
  <div class="create-section">
    <div class="section-header">
      <h3>{{ $t('createSection.createNote') }}</h3>
    </div>
    <div class="create-grid">
      <!-- Blank note card -->
      <div class="create-card" @click="createBlankNote">
        <div class="card-icon">
          <el-icon><Plus /></el-icon>
        </div>
        <div class="card-title">{{ $t('createSection.blankNote') }}</div>
      </div>
      
      <!-- Template card -->
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
      
      <!-- More templates card -->
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

    <!-- Template selection dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="$t('createSection.selectTemplate')"
      width="500px"
    >
      <el-form :model="form" label-width="120px">
        <el-form-item :label="$t('createSection.selectFolder')" required>
          <el-input
            v-model="form.folder"
            :placeholder="$t('createSection.selectFolder')"
            readonly
            @click="selectFolder"
          >
            <template #append>
              <el-button @click="selectFolder">
                <el-icon><FolderOpened /></el-icon>
              </el-button>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item :label="$t('createSection.enterFileName')" required>
          <el-input v-model="form.name" :placeholder="$t('createSection.enterFileName')" />
        </el-form-item>

        <el-form-item v-if="isTemplate" :label="$t('createSection.selectTemplate')">
          <el-select v-model="form.template" :placeholder="$t('createSection.selectTemplate')">
            <el-option-group :label="$t('createSection.builtInTemplates')">
              <el-option
                v-for="template in templates"
                :key="template.name"
                :label="template.name"
                :value="template.path"
              />
            </el-option-group>
            <el-option-group 
              v-if="customTemplates.length"
              :label="$t('createSection.customTemplates')"
            >
              <el-option
                v-for="template in customTemplates"
                :key="template.id"
                :label="template.name"
                :value="template.path"
                class="custom-template-option"
              >
                <template #default>
                  <div class="template-option-content">
                    <span>{{ template.name }}</span>
                    <div class="template-actions">
                      <el-button
                        class="star-button"
                        :class="{ 'is-starred': isTemplateStarred(template) }"
                        link
                        size="small"
                        @click.stop="toggleStar(template)"
                      >
                        <el-icon>
                          <Star v-if="!isTemplateStarred(template)" />
                          <StarFilled v-else />
                        </el-icon>
                      </el-button>
                      <el-button
                        type="danger"
                        link
                        size="small"
                        @click.stop="confirmDeleteTemplate(template)"
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </template>
              </el-option>
            </el-option-group>
            <el-divider />
            <el-option
              :label="$t('createSection.importTemplate')"
              value="import"
            >
              <el-icon><Upload /></el-icon>
              {{ $t('createSection.importTemplate') }}
            </el-option>
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
import { ref, computed, onMounted, getCurrentInstance, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Document, Plus, More, FolderOpened, Upload, Delete, Star, StarFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useNotesStore } from '../stores/notes'
import { useCustomTemplateStore } from '../stores/customTemplate'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const notesStore = useNotesStore()
const customTemplateStore = useCustomTemplateStore()
const { t } = useI18n()
const dialogVisible = ref(false)
const isTemplate = ref(false)
const templates = ref([])
const selectedTemplate = ref(null)
const customTemplates = computed(() => customTemplateStore.customTemplates)

const { proxy: { $notify } } = getCurrentInstance()

const form = ref({
  folder: '',
  name: '',
  template: ''
})

// Only display the first 2 templates
const displayTemplates = computed(() => {
  const baseTemplates = templates.value.slice(0, 2)
  if (customTemplateStore.starredTemplate) {
    return [...baseTemplates, customTemplateStore.starredTemplate]
  }
  return baseTemplates
})

// Whether there are more templates
const hasMoreTemplates = computed(() => {
  return templates.value.length > 2
})

// Load template list
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

// Create blank note
const createBlankNote = () => {
  isTemplate.value = false
  selectedTemplate.value = null
  dialogVisible.value = true
}

// Create from template
const createFromTemplate = (template) => {
  isTemplate.value = true
  selectedTemplate.value = template
  form.value.template = template.path
  dialogVisible.value = true
}

// Show template selection dialog
const showTemplateDialog = () => {
  isTemplate.value = true
  selectedTemplate.value = null
  dialogVisible.value = true
}

// Select save directory
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

// Handle creation
const handleCreate = async () => {
  if (!form.value.folder || !form.value.name) {
    ElMessage.warning(t('notifications.fillInCompleteInfo'))
    return
  }
  
  try {
    const filePath = await window.electronAPI.joinPath(form.value.folder, `${form.value.name}.md`)
    
    let content = ''
    if (isTemplate.value && form.value.template) {
      // Read content from template
      const templateContent = await window.electronAPI.readTemplate(form.value.template)
      content = templateContent
    } else {
      // Default content for blank note
      content = `# ${form.value.name}\n\n`
    }
    
    // Create file
    await window.electronAPI.writeFile(filePath, content)
    
    dialogVisible.value = false
    
    // Create file object
    const fileObject = {
      id: Date.now(),
      title: `${form.value.name}.md`,
      name: `${form.value.name}.md`,
      path: filePath,
      content: content,
      lastModified: new Date(),
      starred: false
    }
    
    // Save to localStorage
    localStorage.setItem('currentEditingFile', JSON.stringify(fileObject))
    
    // Add to notes store
    notesStore.addNote(fileObject)
    
    // Redirect to edit page
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

watch(() => form.value.template, async (newValue) => {
  if (newValue === 'import') {
    // Reset selection first
    form.value.template = ''
    
    try {
      const files = await window.electronAPI.selectFiles({
        filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
        properties: ['openFile']
      })
      
      if (files && files.length > 0) {
        const file = files[0]
        customTemplateStore.addTemplate({
          name: file.name,
          path: file.path,
          content: file.content
        })
        
        // Select the newly imported template
        form.value.template = file.path

        $notify.success(
          t('notifications.importSuccess'),
          `${t('notifications.importSuccess')} ${file.name}`
        )
      }
    } catch (error) {
      console.error('Import template failed:', error)
      ElMessage.error(t('notifications.importFailed'))
    }
  }
})

// Add new function to confirm delete template
const confirmDeleteTemplate = async (template) => {
  try {
    await ElMessageBox.confirm(
      t('createSection.deleteTemplateConfirm', { name: template.name }),
      t('createSection.warning'),
      {
        confirmButtonText: t('createSection.confirm'),
        cancelButtonText: t('createSection.cancel'),
        type: 'warning'
      }
    )
    
    customTemplateStore.removeTemplate(template.path)
    ElMessage.success(t('createSection.deleteTemplateSuccess'))
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete template error:', error)
      ElMessage.error(t('createSection.deleteTemplateFailed'))
    }
  }
}

// Add new function to toggle template star
const toggleStar = (template) => {
  customTemplateStore.toggleStar(template)
  if (isTemplateStarred(template)) {
    $notify.success(
      t('notifications.starSuccess'),
      `${t('notifications.starSuccess')} ${template.name}`
    )
  } else {
    $notify.success(
      t('notifications.unstarSuccess'),
      `${t('notifications.unstarSuccess')} ${template.name}`
    )
  }
}

// Add new function to check if template is starred
const isTemplateStarred = (template) => {
  return customTemplateStore.starredTemplate?.path === template.path
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

.template-option-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.template-actions {
  display: flex;
  gap: 4px;
}

.template-actions .el-button {
  visibility: hidden;
}

.star-button {
  color: var(--el-text-color-secondary);
  height: 24px;
  width: 24px;
  padding: 0;
}

.star-button.is-starred {
  color: #f7ba2a;
  visibility: visible !important;
}

.star-button:hover {
  color: #f7ba2a;
}

.custom-template-option:hover .template-actions .el-button {
  visibility: visible;
}

.template-actions .el-icon {
  font-size: 16px;
}

:deep(.el-select-dropdown__item) {
  padding: 0 25px;
}

:deep(.el-select-dropdown__item .template-option-content) {
  height: 34px;
  line-height: 34px;
}

:deep(.el-select-dropdown__item.selected) {
  font-weight: bold;
  color: var(--el-color-primary);
}

:deep(.el-select-dropdown__item:hover) {
  background-color: var(--el-fill-color-light);
}

:deep(.el-select-group__title) {
  padding-left: 12px;
}

:deep(.el-divider--horizontal) {
  margin: 12px 0;
}
</style> 