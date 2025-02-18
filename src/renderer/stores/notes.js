import { defineStore } from 'pinia'

export const useNotesStore = defineStore('notes', {
  state: () => ({
    notes: JSON.parse(localStorage.getItem('notes') || '[]')
  }),

  actions: {
    addNote(note) {
      this.notes.push(note)
      this.saveNotes()
    },

    removeNote(path) {
      this.notes = this.notes.filter(note => note.path !== path)
      this.saveNotes()
    },

    updateStarStatus(path, status) {
      const note = this.notes.find(n => n.path === path)
      if (note) {
        note.starred = status
        this.saveNotes()
      }
    },

    saveNotes() {
      localStorage.setItem('notes', JSON.stringify(this.notes))
    }
  }
}) 