import { defineStore } from 'pinia'

export const useHistoryStore = defineStore('history', {
  state: () => ({
    history: JSON.parse(localStorage.getItem('history') || '[]')
  }),

  actions: {
    addHistory(record) {
      // Check if the same record already exists
      const existingRecord = this.history.find(
        h => h.path === record.path && h.type === record.type
      )
      
      // If the same record exists and the time interval is less than 1 minute, do not add it
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
      
      // Only keep the last 100 records
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