<template>
    <div class="folder-list">
      <h2 class="section-title">{{ $t('menu.folders') }}</h2>
    
      <div class="empty-folders">
        <el-icon><Folder /></el-icon>
        <span>{{ $t('menu.noFolders') }}</span>
        <Todo />
      </div>
    </div>
  </template>
  
  <script>
  import { ref } from 'vue'
  import { Folder } from '@element-plus/icons-vue'
  import Todo from './Todo.vue'
  
  export default {
    components: {
      Folder,
      Todo
    },
  }
  </script>
  
  <style scoped>
  .folder-list {
    margin-top: 16px;
  }
  
  .section-title {
    padding: 0 12px 8px;
    color: var(--text-200);
    font-size: 19px;
    font-weight: 500;
  }
  
  .empty-folders {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
    color: var(--el-text-color-secondary);
  }
  
  .empty-folders .el-icon {
    font-size: 24px;
    margin-bottom: 8px;
  }
  </style>