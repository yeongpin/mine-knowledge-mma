import { defineStore } from 'pinia'

export const useCustomTemplateStore = defineStore('customTemplate', {
  state: () => ({
    customTemplates: JSON.parse(localStorage.getItem('customTemplates') || '[]'),
    starredTemplate: JSON.parse(localStorage.getItem('starredTemplate') || 'null')
  }),

  actions: {
    toggleStar(template) {
      if (this.starredTemplate?.path === template.path) {
        this.starredTemplate = null
      } else {
        this.starredTemplate = template
      }
      this.saveStarredTemplate()
    },

    saveStarredTemplate() {
      localStorage.setItem('starredTemplate', JSON.stringify(this.starredTemplate))
    },

    addTemplate(template) {
      // Check if template already exists
      const exists = this.customTemplates.some(t => t.path === template.path)
      if (!exists) {
        this.customTemplates.push({
          id: Date.now(),
          name: template.name,
          path: template.path,
          content: template.content,
          timestamp: new Date().toISOString()
        })
        this.saveTemplates()
      }
    },

    removeTemplate(path) {
      this.customTemplates = this.customTemplates.filter(t => t.path !== path)
      this.saveTemplates()
    },

    saveTemplates() {
      localStorage.setItem('customTemplates', JSON.stringify(this.customTemplates))
    }
  }
}) 