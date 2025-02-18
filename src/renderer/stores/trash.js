import { defineStore } from 'pinia'

export const useTrashStore = defineStore('trash', {
  state: () => ({
    trashedNotes: JSON.parse(localStorage.getItem('trashedNotes') || '[]')
  }),

  actions: {
    addToTrash(note) {
      this.trashedNotes.push({
        ...note,
        deletedAt: new Date()
      })
      this.saveToStorage()
    },

    restoreFromTrash(noteId) {
      const index = this.trashedNotes.findIndex(note => note.id === noteId)
      if (index !== -1) {
        const note = this.trashedNotes[index]
        this.trashedNotes.splice(index, 1)
        this.saveToStorage()
        return note
      }
      return null
    },

    deleteFromTrash(noteId) {
      const index = this.trashedNotes.findIndex(note => note.id === noteId)
      if (index !== -1) {
        this.trashedNotes.splice(index, 1)
        this.saveToStorage()
      }
    },

    clearTrash() {
      this.trashedNotes = []
      this.saveToStorage()
    },

    saveToStorage() {
      localStorage.setItem('trashedNotes', JSON.stringify(this.trashedNotes))
    }
  }
}) 