import { defineStore } from 'pinia'

export const useHistoryStore = defineStore('history', {
  state: () => ({
    history: JSON.parse(localStorage.getItem('history') || '[]')
  }),

  actions: {
    addHistory(record) {
      // 檢查是否已經存在相同的記錄
      const existingRecord = this.history.find(
        h => h.path === record.path && h.type === record.type
      )
      
      // 如果存在相同記錄且時間間隔小於 1 分鐘，則不添加
      if (existingRecord) {
        const lastTime = new Date(existingRecord.timestamp).getTime()
        const currentTime = new Date().getTime()
        if (currentTime - lastTime < 60000) {
          return
        }
      }
      
      this.history.unshift({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...record
      })
      
      // 只保留最近 100 條記錄
      if (this.history.length > 100) {
        this.history.pop()
      }
      
      this.saveHistory()
    },

    clearHistory() {
      this.history = []
      this.saveHistory()
    },

    saveHistory() {
      localStorage.setItem('history', JSON.stringify(this.history))
    }
  }
}) 