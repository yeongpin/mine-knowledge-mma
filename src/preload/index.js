const { contextBridge, ipcRenderer, shell } = require('electron')

console.log('=== Preload script initializing ===')

// Merge all APIs into a single object
contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  selectFiles: (options) => ipcRenderer.invoke('dialog:selectFiles', options),
  readFile: async (filePath) => {
    console.log('=== Preload readFile start ===')
    console.log('File path received:', filePath)
    
    if (!filePath) {
      throw new Error('File path cannot be empty')
    }
    
    try {
      const result = await ipcRenderer.invoke('file:read', filePath)
      console.log('=== Preload readFile end ===')
      return result
    } catch (error) {
      console.error('Error in preload readFile:', error)
      throw error
    }
  },
  writeFile: (path, content) => ipcRenderer.invoke('file:write', path, content),
  ensureDir: (dirPath) => ipcRenderer.invoke('dir:ensure', dirPath),
  getTempPath: () => ipcRenderer.invoke('path:temp'),
  saveImage: (path, content) => ipcRenderer.invoke('file:saveImage', path, content),
  getBaseUrl: (filePath) => ipcRenderer.invoke('path:getBaseUrl', filePath),
  getServerUrl: () => ipcRenderer.invoke('server:getUrl'),
  getTemplates: () => ipcRenderer.invoke('templates:get'),
  readTemplate: (templatePath) => ipcRenderer.invoke('template:read', templatePath),
  joinPath: (dir, file) => ipcRenderer.invoke('path:join', dir, file),
  readFolder: (folderPath) => ipcRenderer.invoke('folder:read', folderPath),
  openExternal: (url) => ipcRenderer.invoke('open-external-link', url),
  getChangelog: () => ipcRenderer.invoke('get:changelog'),
})

console.log('=== Preload script initialized ===') 