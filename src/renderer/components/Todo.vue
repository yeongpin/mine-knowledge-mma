<template>
    <div class="todo">
        <el-icon><Calendar /></el-icon>
        <h2 class="todo-title">{{ $t('todo.nextUpdate') }}: v{{ nextVersion }}</h2>
            </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Calendar } from '@element-plus/icons-vue'

const { t } = useI18n()

const currentVersion = t('app.version'); 

// Calculate the next version
const nextVersion = computed(() => {
    const versionParts = currentVersion.split('.').map(Number);
    versionParts[2] += 1; 
    return versionParts.join('.');
});

</script>

<style scoped>
.todo {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.todo-title {
    margin-left: 8px;
    font-size: 13px;
    font-weight: 600;
}
</style>
