const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const dotenv = require('dotenv')
const fs = require('fs').promises
const os = require('os')
const express = require('express')
const http = require('http')
const https = require('https')
const fetch = require('node-fetch')

// Load environment variables
dotenv.config()
if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: '.env.development' })
}

// Get user's Documents directory
const getDocumentsPath = () => {
  return path.join(os.homedir(), 'Documents', 'Mine-Knowledge')
}

// Get application root directory
const getAppPath = () => {
  return process.env.NODE_ENV === 'development' 
    ? path.join(__dirname, '..', '..') 
    : path.join(process.resourcesPath, 'app')
}

// Create static file server
function createFileServer() {
  const server = express()
  const imagesPath = path.join(os.homedir(), 'Documents', 'Mine-Knowledge', 'uploads', 'images')
  
  // Allow cross-origin requests
  server.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next()
  })
  
  // Set static file directory
  server.use('/images', (req, res, next) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin')
    next()
  })
  server.use('/images', express.static(imagesPath))
  
  // Start server
  const port = 3500
  const httpServer = http.createServer(server)
  httpServer.listen(port)
  
  // Store server reference in global scope
  global.fileServer = httpServer
  
  return `http://localhost:${port}`
}

let mainWindow = null
let isQuitting = false

function createWindow() {
  // Use path.resolve to ensure the path is correct
  const preloadPath = path.resolve(__dirname, '..', 'preload', 'index.js')
  console.log('Resolved preload path:', preloadPath)
  
  mainWindow = new BrowserWindow({
    width: Number(process.env.VITE_WINDOW_WIDTH) || 1200,
    height: Number(process.env.VITE_WINDOW_HEIGHT) || 800,
    title: process.env.VITE_APP_TITLE || 'Knowledge Base',
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      webSecurity: true,
      sandbox: true
    }
  })

  // Set CSP policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "img-src 'self' file: data: blob: filesystem: http://localhost:* https://raw.githubusercontent.com",
          "media-src 'self' file: data: blob:",
          "connect-src 'self' http://localhost:* https://raw.githubusercontent.com https://translate.googleapis.com",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com"
        ].join('; ')
      }
    })
  })

  // Check if the file exists
  const fs = require('fs')
  if (!fs.existsSync(preloadPath)) {
    console.error('Preload script not found at:', preloadPath)
  } else {
    console.log('Preload script found at:', preloadPath)
  }
  
  // Use Vite development server in development environment
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:2511')
    mainWindow.webContents.openDevTools()
    
    // Add this line to check if the preload is loaded
    mainWindow.webContents.on('did-finish-load', () => {
      console.log('Window loaded, checking preload...')
      mainWindow.webContents.executeJavaScript(`
        console.log('Window API check:', {
          electronAPI: !!window.electronAPI,
          readFile: !!window.electronAPI?.readFile
        })
      `)
    })
  } else {
    // Load the packaged renderer in production environment
    mainWindow.loadFile(path.join(__dirname, '../../../app/dist/renderer/index.html'))
  }

  mainWindow.on('close', (e) => {
    if (!isQuitting && global.fileServer) {
      global.fileServer.close()
      global.fileServer = null
    }
    // Remove all IPC listeners
    ipcMain.removeAllListeners('window-minimize')
    ipcMain.removeAllListeners('window-maximize')
    ipcMain.removeAllListeners('window-close')
  })

  ipcMain.on('window-minimize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.minimize()
    }
  })

  ipcMain.on('window-maximize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize()
      } else {
        mainWindow.maximize()
      }
    }
  })

  ipcMain.on('window-close', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      isQuitting = true
      // Remove all IPC listeners
      ipcMain.removeAllListeners('window-minimize')
      ipcMain.removeAllListeners('window-maximize')
      ipcMain.removeAllListeners('window-close')
      mainWindow.close()
    }
  })

  createStaticFileServer(mainWindow)

  // Start file server
  const serverUrl = createFileServer()
  
  // Save server URL to global variable
  global.serverUrl = serverUrl
}

// Modify file reading processor
ipcMain.handle('file:read', async (event, filePath) => {
  console.log('=== Main process file:read start ===')
  try {
    console.log('Received path:', {
      filePath,
      type: typeof filePath,
      length: filePath?.length
    })
    
    if (!filePath || typeof filePath !== 'string') {
      console.error('Invalid file path:', filePath)
      throw new Error('File path cannot be empty or must be a string')
    }
    
    // Process backslashes in the path
    const normalizedPath = path.normalize(filePath.replace(/\\\\/g, '\\'))
    console.log('Normalized path:', normalizedPath)
    
    try {
      // Check if the file exists
      await fs.access(normalizedPath)
      console.log('File exists')
      
      // Read file
      const content = await fs.readFile(normalizedPath, 'utf-8')
      const stats = await fs.stat(normalizedPath)
      const name = path.basename(normalizedPath)
      
      const result = {
        content,
        path: normalizedPath,
        name,
        lastModified: stats.mtime
      }
      
      console.log('=== Main process file:read end ===')
      return result
    } catch (error) {
      console.error('File operation error:', error)
      throw error
    }
  } catch (error) {
    console.error('Main process error:', error)
    throw error
  }
})

// Update file selection processor, return more file information
ipcMain.handle('dialog:selectFiles', async (event, options) => {
  const result = await dialog.showOpenDialog(options)
  if (result.canceled) return []
  
  // Read the content of all selected files
  const files = await Promise.all(
    result.filePaths.map(async (filePath) => {
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        const stats = await fs.stat(filePath)
        return {
          content,
          path: filePath,
          name: path.basename(filePath),
          lastModified: stats.mtime
        }
      } catch (error) {
        console.error(`Failed to read file: ${filePath}`, error)
        return null
      }
    })
  )
  
  return files.filter(Boolean)
})

// Folder operation
ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  
  if (!result.canceled) {
    return result.filePaths[0]
  }
  return null
})

// Disable remote module
app.enableSandbox()

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (global.fileServer) {
    global.fileServer.close()
    global.fileServer = null
  }
  mainWindow = null
  isQuitting = false
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

ipcMain.handle('readFile', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    return content
  } catch (error) {
    console.error('Error reading file:', error)
    throw error
  }
})

// Write file
ipcMain.handle('file:write', async (event, filePath, content) => {
  try {
    // Ensure the directory exists
    const dirPath = path.dirname(filePath)
    await fs.mkdir(dirPath, { recursive: true })
    
    console.log('Writing content to:', filePath)
    await fs.writeFile(filePath, content, 'utf8')
    console.log('=== Main process file:write end ===')
    return true
  } catch (error) {
    console.error('Error writing file:', error)
    throw error
  }
})

// Folder operation
ipcMain.handle('dir:ensure', async (event, dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true })
    return true
  } catch (error) {
    console.error('Ensure directory error:', error)
    throw error
  }
})

ipcMain.handle('path:temp', async () => {
  return path.join(os.tmpdir(), 'markdown-editor-images')
})

// Add static file server
function createStaticFileServer(win) {
  // Process local file requests
  win.webContents.session.protocol.registerFileProtocol('local-file', (request, callback) => {
    const filePath = request.url.replace('local-file://', '')
    callback(filePath)
  })
}

// Process base URL
ipcMain.handle('path:getBaseUrl', (event, filePath) => {
  if (!filePath) return ''
  return 'file://' + path.dirname(filePath).replace(/\\/g, '/')
})

// Modify image saving logic
ipcMain.handle('file:saveImage', async (event, { fileName, content, currentFilePath }) => {
  try {
    const timestamp = Date.now()
    // Process special characters in file name
    const sanitizedFileName = fileName
      .replace(/[^a-zA-Z0-9-_.]/g, '-') // Replace special characters with hyphens
      .replace(/\s+/g, '-')             // Replace spaces with hyphens
      .replace(/-+/g, '-')              // Replace multiple hyphens with one
      .toLowerCase()                     // Convert to lowercase
    
    const uniqueFileName = `${timestamp}-${sanitizedFileName}`
    const mdName = path.basename(currentFilePath, path.extname(currentFilePath))
    
    // Build directory path
    const imagesDir = path.join(
      getDocumentsPath(),
      'uploads',
      'images',
      mdName,
      timestamp.toString()
    )
    
    await fs.mkdir(imagesDir, { recursive: true })
    const imagePath = path.join(imagesDir, uniqueFileName)
    
    // Write file
    const buffer = Buffer.from(content)
    await fs.writeFile(imagePath, buffer)
    
    // Return relative path
    const relativePath = path.relative(
      path.join(getDocumentsPath(), 'uploads', 'images'),
      imagePath
    ).replace(/\\/g, '/')
    
    return {
      absolutePath: imagePath,
      relativePath: `/images/${relativePath}`,
      fileName: sanitizedFileName // Return processed file name
    }
  } catch (error) {
    console.error('Save image error:', error)
    throw error
  }
})

// Add IPC processor to get server URL
ipcMain.handle('server:getUrl', () => {
  return global.serverUrl
})

// Get template list
ipcMain.handle('templates:get', async () => {
  try {
    const templatesDir = path.join(getAppPath(), 'src', 'templates', 'markdown')
    const files = await fs.readdir(templatesDir)
    const templates = files
      .filter(file => file.endsWith('.md'))
      .map(file => ({
        name: path.basename(file, '.md'),
        path: path.join(templatesDir, file)
      }))
    return templates
  } catch (error) {
    console.error('Get templates error:', error)
    throw error
  }
})

// Read template content
ipcMain.handle('template:read', async (event, templatePath) => {
  try {
    const content = await fs.readFile(templatePath, 'utf-8')
    return content
  } catch (error) {
    console.error('Read template error:', error)
    throw error
  }
})

// Process path concatenation
ipcMain.handle('path:join', (event, dir, file) => {
  return path.join(dir, file)
})

// Read folder
ipcMain.handle('folder:read', async (event, folderPath) => {
  try {
    const entries = await fs.readdir(folderPath, { withFileTypes: true })
    const files = []
    
    for (const entry of entries) {
      const fullPath = path.join(folderPath, entry.name)
      
      if (entry.isFile() && /\.(md|markdown)$/i.test(entry.name)) {
        const content = await fs.readFile(fullPath, 'utf-8')
        const stats = await fs.stat(fullPath)
        
        files.push({
          name: entry.name,
          path: fullPath,
          content,
          lastModified: stats.mtime
        })
      }
    }
    
    return files
  } catch (error) {
    console.error('Read folder error:', error)
    throw error
  }
})

// Get changelog
ipcMain.handle('get:changelog', async () => {
  return new Promise((resolve, reject) => {
    const url = 'https://raw.githubusercontent.com/yeongpin/mine-knowledge-mma/main/CHANGELOG.md'
    https.get(url, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        resolve(data)
      })
    }).on('error', (err) => {
      reject(err)
    })
  })
}) 

ipcMain.handle('open-external-link', async (event, url) => {
  await shell.openExternal(url)
})

// Add this function to handle translation
async function handleTranslate(text, fromLang, toLang) {
  try {
    const url = new URL('https://translate.googleapis.com/translate_a/single')
    url.searchParams.append('client', 'gtx')
    url.searchParams.append('sl', fromLang)
    url.searchParams.append('tl', toLang)
    url.searchParams.append('dt', 't')
    url.searchParams.append('q', text)

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    // 确保数据格式正确
    if (!data || !Array.isArray(data[0])) {
      throw new Error('Invalid response format')
    }

    // 提取翻译结果
    const translatedText = data[0]
      .filter(item => item && item[0])
      .map(item => item[0])
      .join('')

    return translatedText
  } catch (error) {
    console.error('Translation error:', error)
    throw error
  }
}

// Add this in your createWindow function or where you set up IPC handlers
ipcMain.handle('translate-text', async (event, { text, fromLang, toLang }) => {
  return await handleTranslate(text, fromLang, toLang)
})