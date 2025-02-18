<template>
  <div class="markdown-page">
    <TitleBar />
    <div class="toolbar">
      <el-button class="back-btn" link @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span class="back-text">{{ t('markdown.back') }}</span>
      </el-button>
      <span class="file-name">{{ currentFile?.name || '' }}</span>
    </div>

    <MdEditor
      v-if="currentFile?.content"
      v-model="currentFile.content"
      :preview-only="!isEditing"
      :language="editorLanguage"
      theme="light"
      :editor-id="editorId"
      :preview-theme="previewTheme"
      code-theme="atom-one-dark"
      :toolbars="toolbars"
      :toolbarsExclude="[]"
      :showCodeRowNumber="true"
      :autoFocus="true"
      @onUploadImg="handleImageUpload"
      @onChange="handleContentChange"
      @onSave="handleEditorSave"
      style="height: calc(100vh - 80px)"
    >
    <template #defToolbars>
      <Emoji>
        <template #trigger> <el-icon><Emoji /></el-icon> </template>
      </Emoji>
    </template>
  </MdEditor>
    <div v-else class="empty-state">
      <el-icon><Document /></el-icon>
      <span>{{ t('markdown.selectFile') }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, getCurrentInstance, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus'
import { Document, ArrowLeft } from '@element-plus/icons-vue'
import { MdEditor, NormalToolbar, config } from 'md-editor-v3'
import TitleBar from '../components/TitleBar.vue'
import 'md-editor-v3/lib/style.css'
import screenfull from 'screenfull'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'
import mermaid from 'mermaid'
import * as prettier from 'prettier'
import parserMarkdown from 'prettier/plugins/markdown'
import highlight from 'highlight.js'

import ZH_TW from '@vavt/cm-extension/dist/locale/zh-TW';

// import existing theme
import '@vavt/cm-extension/dist/previewTheme/arknights.css';

config({
  editorConfig: {
    languageUserDefined: {
      'zh-TW': ZH_TW
    }
  },
  editorExtensions: {
    prettier: {
      prettierInstance: prettier,
      parserMarkdownInstance: parserMarkdown,
    },
    highlight: {
      instance: highlight,
    },
    screenfull: {
      instance: screenfull,
    },
    katex: {
      instance: katex,
    },
    cropper: {
      instance: Cropper,
    },
    mermaid: {
      instance: mermaid,
    },
  },
});

import { useHistoryStore } from '../stores/history'
import { useNotificationsStore } from '../stores/notifications'

import { Emoji } from '@vavt/v3-extension';
// All CSS for this extension library
// import '@vavt/v3-extension/lib/asset/style.css';
// Or individual style for Emoji
import '@vavt/v3-extension/lib/asset/Emoji.css';

const DropdownToolbar = MdEditor.DropdownToolbar;

const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()
const historyStore = useHistoryStore()
const notificationsStore = useNotificationsStore()

const isEditing = ref(false)
const currentFile = ref(null)
const hasUnsavedChanges = ref(false)
const originalContent = ref('')
let isSaving = false
let keyboardListener = null

const { proxy: { $notify } } = getCurrentInstance()

const previewTheme = ref('default')
const serverUrl = ref('')

// Set editor language based on current language
const editorLanguage = computed(() => {
  return locale.value.startsWith('zh') ? 'zh-TW' : 'en-US'
})

onMounted(async () => {
  try {
    // Save current view state
    const currentView = route.query.view
    if (currentView) {
      localStorage.setItem('previousView', currentView)
    }
    
    const storedFile = localStorage.getItem('currentEditingFile')
    if (storedFile) {
      currentFile.value = JSON.parse(storedFile)
      localStorage.removeItem('currentEditingFile')
      isEditing.value = true
      if (currentFile.value.path) {
        const result = await window.electronAPI.readFile(currentFile.value.path)
        currentFile.value.content = result.content
        originalContent.value = result.content
      }
    }
    
    // Set keyboard shortcuts
    setupKeyboardShortcuts()

    // Get server URL
    serverUrl.value = await window.electronAPI.getServerUrl()
  } catch (error) {
    console.error('Error:', error)
    ElMessage.error(t('notifications.loadFileFailed'))
    // Return to the correct view
    const previousView = localStorage.getItem('previousView')
    router.push({
      name: 'home',
      query: previousView ? { view: previousView } : {}
    })
  }
})

// Clean up listener when component unmounts
onBeforeUnmount(() => {
  if (keyboardListener) {
    document.removeEventListener('keydown', keyboardListener)
  }
  localStorage.removeItem('previousView')
})

const handleContentChange = () => {
  hasUnsavedChanges.value = currentFile.value?.content !== originalContent.value
}

const handleSave = async () => {
  if (isSaving) return
  isSaving = true
  
  if (!currentFile.value?.content || !currentFile.value?.path) return

  try {
    const result = await window.electronAPI.writeFile(
      currentFile.value.path,
      currentFile.value.content || ''
    )
    
    if (!result) {
      throw new Error(t('notifications.saveFailed'))
    }
    
    hasUnsavedChanges.value = false
    originalContent.value = currentFile.value.content
    
    $notify.success(
      t('notifications.saveSuccess'),
      `${t('notifications.editSuccess')} ${currentFile.value.name}`
    )
    
    // Add to history
    historyStore.addHistory({
      title: currentFile.value.name,
      path: currentFile.value.path,
      type: 'edit'
    })
    
  } catch (error) {
    console.error('Save file error:', error)
    $notify.error(
      error.message || t('notifications.saveFailed'),
      t('notifications.saveFailed')
    )
  } finally {
    isSaving = false
  }
}

const handleEditorSave = () => {
  handleSave()
}

const goBack = async () => {
  if (currentFile.value?.content !== originalContent.value) {
    try {
      await ElMessageBox.confirm(
        t('markdown.backConfirm'),
        t('markdown.warning'),
        {
          confirmButtonText: t('markdown.confirm'),
          cancelButtonText: t('markdown.cancel'),
          type: 'warning'
        }
      )
    } catch {
      return
    }
  }
  
  // Get previous view state from localStorage
  const previousView = localStorage.getItem('previousView')
  
  // Return to the correct view
  router.push({
    name: 'home',
    query: previousView ? { view: previousView } : {}
  })
}

const text = ref('');

const toolbars = [
  'save',
  'bold',
  'underline',
  'italic',
  'strikeThrough',
  '-',
  'title',
  'quote',
  'sub',
  'sup',
  '-',
  'unorderedList',
  'orderedList',
  'task',
  '-',
  'codeRow',
  'code',
  'link',
  'image',
  'table',
  'mermaid',
  'katex',
  0,
  'revoke',
  'next',
  '-',
  'preview',
  'prettier',
  'htmlPreview',
  'previewOnly',
  'catalog', 
]

const editorId = ref('md-editor-v3')

const handleMark = () => {
  const textarea = document.querySelector(`#${editorId.value}-textarea`)
  if (!textarea) return

  const selection = window.getSelection()?.toString()
  const endPoint = textarea.selectionStart
  const markStr = `@${selection}@`
  
  const prefixStr = textarea.value.substring(0, endPoint)
  const suffixStr = textarea.value.substring(endPoint + (selection?.length || 0))
  
  currentFile.value.content = `${prefixStr}${markStr}${suffixStr}`
  nextTick(() => {
    textarea.setSelectionRange(endPoint, markStr.length + endPoint)
    textarea.focus()
  })
}

const setupKeyboardShortcuts = () => {
  // Remove old listener
  if (keyboardListener) {
    document.removeEventListener('keydown', keyboardListener)
  }
  
  // Create new listener
  keyboardListener = (e) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault()
      handleSave()
    }
  }
  
  // Add new listener
  document.addEventListener('keydown', keyboardListener)
}

// Handle image upload
const handleImageUpload = async (files, callback) => {
  try {
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const reader = new FileReader()
        const fileContent = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result)
          reader.readAsArrayBuffer(file)
        })
        
        const result = await window.electronAPI.saveImage({
          fileName: file.name,
          content: fileContent,
          currentFilePath: currentFile.value?.path
        })
        
        // Return image URL
        return {
          url: `${serverUrl.value}${result.relativePath}`,
          alt: result.fileName
        }
      })
    )
    
    // Pass image information directly to the editor
    callback(uploadedFiles)
    
    $notify.success(
      t('notifications.uploadSuccess'),
      `${t('notifications.uploadSuccess')} ${files.length} ${t('notifications.pictures')}`
    )
  } catch (error) {
    console.error('Upload images error:', error)
    $notify.error(
      t('notifications.uploadFailed'),
      error.message || t('notifications.uploadFailed')
    )
  }
}
</script>

<style>
.markdown-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #fff;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.toolbar {
  height: 40px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color);
}

.back-btn {
  display: inline-flex;
  align-items: center;
  padding: 0;
  height: 32px;
  color: var(--el-text-color-regular);
}

.back-btn:hover {
  color: var(--el-color-primary);
}

.back-btn .el-icon {
  font-size: 16px;
  margin-right: 4px;
}

.back-text {
  font-size: 14px;
}

.file-name {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
}

.empty-state .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

/* Custom editor styles */
:deep(.md-editor-toolbar) {
  padding: 6px 12px !important;
  background-color: #f5f7fa !important;
  border-bottom: 1px solid #e4e7ed !important;
}

:deep(.md-editor-toolbar .md-editor-toolbar-item) {
  padding: 6px !important;
  margin: 0 2px !important;
  border-radius: 4px !important;
}

:deep(.md-editor-toolbar .md-editor-toolbar-item:hover) {
  background-color: #e4e7ed !important;
}

:deep(.md-editor-toolbar .md-editor-toolbar-item svg) {
  width: 20px !important;
  height: 20px !important;
}

:deep(.md-editor-content) {
  background-color: #fff !important;
}

:deep(.md-editor-input) {
  padding: 20px !important;
}

:deep(.md-editor-preview) {
  padding: 20px !important;
  background-color: #fff !important;
}

svg.md-editor-icon {
  width: 26px !important;
  height: 26px !important;
}

/* Adjust emoji selector styles */
:deep(.md-editor-toolbar-wrapper) {
  position: relative;
}

.emoji-container {
  width: 100%;
  padding: 10px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.emojis {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.emojis li {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.emojis li:hover {
  background-color: #f5f7fa;
}

.md-icon {
  width: 20px;
  height: 20px;
}
</style> 