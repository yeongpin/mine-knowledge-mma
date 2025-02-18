<template>
  <div class="search-bar">
    <el-input
      v-model="searchQuery"
      :placeholder="$t('notes.searchPlaceholder')"
      clearable
      @input="handleSearch"
    >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Search } from '@element-plus/icons-vue'

const searchQuery = ref('')
const emit = defineEmits(['search'])

const handleSearch = (value) => {
  emit('search', value)
}
</script>

<style scoped>
.search-bar {
  padding: 16px;
  background-color: var(--bg-100);
  border-radius: 8px;
  border: 1px solid var(--bg-300);
}

:deep(.el-input__wrapper) {
  background-color: var(--bg-200);
}
</style> 