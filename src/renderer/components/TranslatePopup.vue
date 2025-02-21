<template>
    <div class="translate-popup">
      <el-button link @click="showDialog">
        <i class="fa fa-language" aria-hidden="true"></i>
      </el-button>
  
      <el-dialog
        v-model="visible"
        :title="t('markdown.translate')"
        :show-close="true"
        custom-class="translate-dialog"
        :close-on-click-modal="false"
        width="700px"
        append-to-body
      >
        <div class="translate-container">
          <div class="translate-header">
            <el-select 
              v-model="fromLang" 
              size="small" 
              style="width: 220px"
              @change="handleTranslate"
            >
              <el-option
                v-for="lang in fromLanguages"
                :key="lang.value"
                :label="lang.label"
                :value="lang.value"
              />
            </el-select>
  
            <el-icon class="exchange-icon"><Right /></el-icon>
  
            <el-select 
              v-model="toLang" 
              size="small" 
              style="width: 220px"
              @change="handleTranslate"
            >
              <el-option
                v-for="lang in toLanguages"
                :key="lang.value"
                :label="lang.label"
                :value="lang.value"
              />
            </el-select>
          </div>
  
          <div class="input-area">
            <el-input
              v-model="sourceText"
              type="textarea"
              :rows="4"
              resize="none"
              :placeholder="t('markdown.enterText')"
              @input="handleInput"
            />
          </div>
  
          <div class="translate-actions">
            <el-button type="primary" size="small" @click="handleTranslate">
              {{ t('markdown.translate') }}
            </el-button>
          </div>
  
          <div class="input-area">
            <el-input
              v-model="translatedText"
              type="textarea"
              :rows="4"
              resize="none"
              readonly
            />
          </div>
        </div>
      </el-dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { Right } from '@element-plus/icons-vue'
  import { ElMessage } from 'element-plus'
  
  const { t } = useI18n()
  const visible = ref(false)
  const fromLang = ref('auto')
  const toLang = ref('en')
  const sourceText = ref('')
  const translatedText = ref('')
  let translateTimeout = null
  
  const showDialog = () => {
    visible.value = true
  }
  
  // 定义语言选项
  const fromLanguages = [
    { label: t('translate.auto'), value: 'auto' },
    { label: t('translate.english'), value: 'en' },
    { label: t('translate.chineset'), value: 'zh_TW' },
    { label: t('translate.chineses'), value: 'zh_CN' },
    { label: t('translate.japanese'), value: 'ja' },
    { label: t('translate.korean'), value: 'ko' },
    { label: t('translate.french'), value: 'fr' },
    { label: t('translate.german'), value: 'de' },
    { label: t('translate.spanish'), value: 'es' },
    { label: t('translate.italian'), value: 'it' },
    { label: t('translate.portuguese'), value: 'pt' },
    { label: t('translate.russian'), value: 'ru' },
    { label: t('translate.arabic'), value: 'ar' },
    { label: t('translate.turkish'), value: 'tr' },
    { label: t('translate.dutch'), value: 'nl' },
    { label: t('translate.hindi'), value: 'hi' },
    { label: t('translate.polish'), value: 'pl' },
    { label: t('translate.romanian'), value: 'ro' },
    { label: t('translate.hungarian'), value: 'hu' },
    { label: t('translate.czech'), value: 'cs' },
    { label: t('translate.swedish'), value: 'sv' },
    { label: t('translate.norwegian'), value: 'no' },
    { label: t('translate.danish'), value: 'da' },
    { label: t('translate.finnish'), value: 'fi' },
    { label: t('translate.greek'), value: 'el' },
    { label: t('translate.bulgarian'), value: 'bg' },
    { label: t('translate.croatian'), value: 'hr' },
    { label: t('translate.lithuanian'), value: 'lt' },
    { label: t('translate.latvian'), value: 'lv' },
    { label: t('translate.macedonian'), value: 'mk' },
    { label: t('translate.malay'), value: 'ms' },
    { label: t('translate.maltese'), value: 'mt' }
    
  ]
  
  const toLanguages = [
  { label: t('translate.english'), value: 'en' },
    { label: t('translate.chineset'), value: 'zh_TW' },
    { label: t('translate.chineses'), value: 'zh_CN' },
    { label: t('translate.japanese'), value: 'ja' },
    { label: t('translate.korean'), value: 'ko' },
    { label: t('translate.french'), value: 'fr' },
    { label: t('translate.german'), value: 'de' },
    { label: t('translate.spanish'), value: 'es' },
    { label: t('translate.italian'), value: 'it' },
    { label: t('translate.portuguese'), value: 'pt' },
    { label: t('translate.russian'), value: 'ru' },
    { label: t('translate.arabic'), value: 'ar' },
    { label: t('translate.turkish'), value: 'tr' },
    { label: t('translate.dutch'), value: 'nl' },
    { label: t('translate.hindi'), value: 'hi' },
    { label: t('translate.polish'), value: 'pl' },
    { label: t('translate.romanian'), value: 'ro' },
    { label: t('translate.hungarian'), value: 'hu' },
    { label: t('translate.czech'), value: 'cs' },
    { label: t('translate.swedish'), value: 'sv' },
    { label: t('translate.norwegian'), value: 'no' },
    { label: t('translate.danish'), value: 'da' },
    { label: t('translate.finnish'), value: 'fi' },
    { label: t('translate.greek'), value: 'el' },
    { label: t('translate.bulgarian'), value: 'bg' },
    { label: t('translate.croatian'), value: 'hr' },
    { label: t('translate.lithuanian'), value: 'lt' },
    { label: t('translate.latvian'), value: 'lv' },
    { label: t('translate.macedonian'), value: 'mk' },
    { label: t('translate.malay'), value: 'ms' },
    { label: t('translate.maltese'), value: 'mt' }
  ]
  
  // 处理输入防抖
  const handleInput = () => {
    if (translateTimeout) {
      clearTimeout(translateTimeout)
    }
    translateTimeout = setTimeout(() => {
      if (sourceText.value.trim()) {
        handleTranslate()
      }
    }, 1000)
  }
  
  async function handleTranslate() {
    if (!sourceText.value.trim()) {
      translatedText.value = ''
      return
    }
  
    try {
      // 将文本分成行并单独翻译每一行
      const lines = sourceText.value.split('\n')
      const translatedLines = await Promise.all(
        lines.map(async (line) => {
          // 如果是空行，直接返回空行
          if (!line.trim()) {
            return line
          }
  
          // 保存行首的空格或制表符
          const leadingSpaces = line.match(/^[\s\t]*/)[0]
          
          // 检查是否是 Markdown 标题行
          const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
          if (headingMatch) {
            // 分别翻译标题文本，保持 # 符号和空格
            const [, hashes, titleText] = headingMatch
            const translatedTitle = await window.electronAPI.translateText({
              text: titleText.trim(),
              fromLang: fromLang.value,
              toLang: toLang.value
            })
            return `${leadingSpaces}${hashes} ${translatedTitle}`
          }
  
          // 检查是否是列表项
          const listItemMatch = line.match(/^([*+-]\s+|\d+\.\s+)(.+)$/)
          if (listItemMatch) {
            const [, listMarker, itemText] = listItemMatch
            const translatedItem = await window.electronAPI.translateText({
              text: itemText.trim(),
              fromLang: fromLang.value,
              toLang: toLang.value
            })
            return `${leadingSpaces}${listMarker}${translatedItem}`
          }
  
          // 普通文本行的翻译
          const translatedText = await window.electronAPI.translateText({
            text: line.trim(),
            fromLang: fromLang.value,
            toLang: toLang.value
          })
          return `${leadingSpaces}${translatedText}`
        })
      )
  
      // 重新组合翻译后的行
      translatedText.value = translatedLines.join('\n')
    } catch (error) {
      console.error('Translation error:', error)
      ElMessage.error(t('markdown.translateError'))
    }
  }
  
  // 监听语言变化
  watch([fromLang, toLang], () => {
    if (sourceText.value.trim()) {
      handleTranslate()
    }
  })
  </script>
  
  <style scoped>
  /* 现有样式保持不变，但移除 popover 相关样式 */
  
  /* 添加对话框样式 */
  :deep(.translate-dialog) {
    border-radius: 8px;
  }
  
  :deep(.el-dialog__header) {
    margin: 0;
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-light);
  }
  
  :deep(.el-dialog__body) {
    padding: 20px;
  }
  
  .translate-container {
    padding: 0;
  }
  
  .translate-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    justify-content: space-evenly;
  }
  
  .exchange-icon {
    font-size: 20px;
    color: var(--el-text-color-secondary);
  }
  
  .translate-actions {
    margin: 12px 0;
    display: flex;
    justify-content: center;
  }
  
  .fa-language {
    font-size: 18px;
  }
  
  :deep(.el-button) {
    padding: 8px;
    height: auto;
  }
  
  .input-area {
    margin-bottom: 12px;
  }
  
  .input-area :deep(.el-textarea__inner) {
    height: 200px !important;
    resize: none;
    overflow-y: auto;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    line-height: 1.5;
    padding: 8px 12px;
  }
  
  /* 移除不需要的样式 */
  :deep(.translate-popover),
  :deep(.el-popover.el-popper),
  :deep(.el-select__popper) {
    display: none; /* 移除这些样式 */
  }
  
  /* 添加新的样式 */
  .language-option {
    height: 34px;
    line-height: 34px;
  }
  
  .language-option-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 8px;
  }
  
  :deep(.el-select-dropdown__item) {
    padding: 0;
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
  </style>
  