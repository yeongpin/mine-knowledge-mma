import { defineStore } from 'pinia'

export const useFavoritesStore = defineStore('favorites', {
  state: () => ({
    favorites: JSON.parse(localStorage.getItem('favorites') || '[]')
  }),

  actions: {
    addFavorite(item) {
      // Check if it already exists 
      const exists = this.favorites.some(f => f.path === item.path)
      if (!exists) {
        this.favorites.push({
          id: Date.now(),
          timestamp: new Date().toISOString(),
          name: item.name || item.title,
          path: item.path,
          favorite: true,
          content: item.content,
          lastModified: item.lastModified
        })
        this.saveFavorites()
      }
    },

    removeFavorite(path) {
      this.favorites = this.favorites.filter(f => f.path !== path)
      this.saveFavorites()
    },

    saveFavorites() {
      localStorage.setItem('favorites', JSON.stringify(this.favorites))
    }
  }
}) 