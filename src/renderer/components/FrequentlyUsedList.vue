<template>
  <div class="frequently-used-list">
    <h2 class="section-title">{{ $t('menu.frequentlyUsed') }}</h2>
    <div class="favorites-list" v-if="favorites.length">
      <div v-for="item in favorites" :key="item.id" 
        @click="handleFavoriteClick(item)"
        class="favorite-item"
      >
        <el-icon><Collection /></el-icon>
        <span class="favorite-name">{{ item.name }}</span>
        <el-button 
          link 
          type="warning" 
          size="small" 
          @click.stop="removeFavorite(item)"
        >
          <el-icon><StarFilled /></el-icon>
        </el-button>
      </div>
    </div>
    <div v-else class="empty-favorites">
      <el-icon><Star /></el-icon>
      <span>{{ $t('menu.noFavorites') }}</span>
    </div>
  </div>
</template>

<script>
import { Collection, StarFilled, Star } from '@element-plus/icons-vue'

export default {
  props: {
    favorites: {
      type: Array,
      required: true
    },
    handleFavoriteClick: {
      type: Function,
      required: true
    },
    removeFavorite: {
      type: Function,
      required: true
    }
  },
  components: {
    Collection,
    StarFilled,
    Star
  }
}
</script>

<style scoped>
.frequently-used-list {
  margin-top: 16px; /* 與其他內容的間距 */
}

.section-title {
  padding: 0 12px 8px;
  color: var(--text-200);
  font-size: 19px;
  font-weight: 500;
}

.favorites-list {
  max-height: 200px; /* 限制高度 */
  overflow-y: auto; /* 添加滾動條 */
  margin-top: 8px; /* 與標題的間距 */
}

/* 隱藏滾動條，當不懸停時 */
.favorites-list::-webkit-scrollbar {
  width: 8px; /* 滾動條寬度 */
  opacity: 0; /* 默認隱藏 */
  transition: opacity 0.2s; /* 添加過渡效果 */
}

.favorites-list:hover::-webkit-scrollbar {
  opacity: 1; /* 懸停時顯示 */
}

.favorites-list::-webkit-scrollbar-thumb {
  background-color: var(--el-fill-color-light); /* 滾動條顏色 */
  border-radius: 4px; /* 滾動條圓角 */
}

.favorites-list::-webkit-scrollbar-thumb:hover {
  background-color: var(--el-fill-color-dark); /* 懸停時的顏色 */
}

.favorite-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
  cursor: pointer;
}

.favorite-item:hover {
  background-color: var(--el-fill-color-light);
}

.favorite-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.empty-favorites {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  color: var(--el-text-color-secondary);
}

.empty-favorites .el-icon {
  font-size: 24px;
  margin-bottom: 8px;
}
</style> 