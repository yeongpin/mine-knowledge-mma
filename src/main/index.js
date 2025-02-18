const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const dotenv = require('dotenv')
const fs = require('fs').promises
const os = require('os')
const express = require('express')
const http = require('http')

// 加載環境變量
dotenv.config()
if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: '.env.development' })
}

// 獲取用戶的 Documents 目錄
const getDocumentsPath = () => {
  return path.join(os.homedir(), 'Documents', 'Mine-Knowledge')
}

// 獲取應用程序的根目錄
const getAppPath = () => {
  return process.env.NODE_ENV === 'development' 
    ? path.join(__dirname, '..', '..') 
    : path.join(process.resourcesPath, 'app')
}

// 創建靜態文件服務器
function createFileServer() {
  const server = express()
  const imagesPath = path.join(os.homedir(), 'Documents', 'Mine-Knowledge', 'uploads', 'images')
  
  // 允許跨域請求
  server.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next()
  })
  
  // 設置靜態文件目錄
  server.use('/images', (req, res, next) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin')
    next()
  })
  server.use('/images', express.static(imagesPath))
  
  // 啟動服務器
  const port = 3500
  http.createServer(server).listen(port)
  
  return `http://localhost:${port}`
}

function createWindow() {
  // 使用 path.resolve 來確保路徑正確
  const preloadPath = path.resolve(__dirname, '..', 'preload', 'index.js')
  console.log('Resolved preload path:', preloadPath)
  
  const mainWindow = new BrowserWindow({
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

  // 設置 CSP 策略
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "img-src 'self' file: data: blob: filesystem: http://localhost:*",
          "media-src 'self' file: data: blob:",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'"
        ].join('; ')
      }
    })
  })

  // 檢查文件是否存在
  const fs = require('fs')
  if (!fs.existsSync(preloadPath)) {
    console.error('Preload script not found at:', preloadPath)
  } else {
    console.log('Preload script found at:', preloadPath)
  }
  
  // 在開發環境中使用 Vite 開發服務器
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
    
    // 添加這行來檢查 preload 是否加載
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
    // 在生產環境中加載打包後的 renderer
    mainWindow.loadFile(path.join(__dirname, '../../../app/dist/renderer/index.html'))
  }

  // 窗口控制
  ipcMain.on('window-minimize', () => {
    mainWindow.minimize()
  })

  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })

  ipcMain.on('window-close', () => {
    mainWindow.close()
  })

  createStaticFileServer(mainWindow)

  // 啟動文件服務器
  const serverUrl = createFileServer()
  
  // 將服務器 URL 保存到全局變量
  global.serverUrl = serverUrl
}

// 修改文件讀取處理器
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
      throw new Error('文件路徑不能為空或必須是字符串')
    }
    
    // 處理路徑中的反斜線
    const normalizedPath = path.normalize(filePath.replace(/\\\\/g, '\\'))
    console.log('Normalized path:', normalizedPath)
    
    try {
      // 檢查文件是否存在
      await fs.access(normalizedPath)
      console.log('File exists')
      
      // 讀取文件
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

// 更新文件選擇處理，返回更多文件信息
ipcMain.handle('dialog:selectFiles', async (event, options) => {
  const result = await dialog.showOpenDialog(options)
  if (result.canceled) return []
  
  // 讀取所有選中文件的內容
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
        console.error(`讀取文件失敗: ${filePath}`, error)
        return null
      }
    })
  )
  
  return files.filter(Boolean)
})

// 文件夾操作
ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  
  if (!result.canceled) {
    return result.filePaths[0]
  }
  return null
})

// 禁用遠程模塊
app.enableSandbox()

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
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

// 寫入文件
ipcMain.handle('file:write', async (event, filePath, content) => {
  try {
    // 確保目錄存在
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

// 文件夾操作
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

// 添加靜態文件服務
function createStaticFileServer(win) {
  // 處理本地文件請求
  win.webContents.session.protocol.registerFileProtocol('local-file', (request, callback) => {
    const filePath = request.url.replace('local-file://', '')
    callback(filePath)
  })
}

// 處理基礎 URL
ipcMain.handle('path:getBaseUrl', (event, filePath) => {
  if (!filePath) return ''
  return 'file://' + path.dirname(filePath).replace(/\\/g, '/')
})

// 修改圖片保存邏輯
ipcMain.handle('file:saveImage', async (event, { fileName, content, currentFilePath }) => {
  try {
    const timestamp = Date.now()
    // 處理文件名中的特殊字符
    const sanitizedFileName = fileName
      .replace(/[^a-zA-Z0-9-_.]/g, '-') // 將特殊字符替換為連字符
      .replace(/\s+/g, '-')             // 將空格替換為連字符
      .replace(/-+/g, '-')              // 將多個連字符合併為一個
      .toLowerCase()                     // 轉換為小寫
    
    const uniqueFileName = `${timestamp}-${sanitizedFileName}`
    const mdName = path.basename(currentFilePath, path.extname(currentFilePath))
    
    // 構建目錄路徑
    const imagesDir = path.join(
      getDocumentsPath(),
      'uploads',
      'images',
      mdName,
      timestamp.toString()
    )
    
    await fs.mkdir(imagesDir, { recursive: true })
    const imagePath = path.join(imagesDir, uniqueFileName)
    
    // 寫入文件
    const buffer = Buffer.from(content)
    await fs.writeFile(imagePath, buffer)
    
    // 返回相對路徑
    const relativePath = path.relative(
      path.join(getDocumentsPath(), 'uploads', 'images'),
      imagePath
    ).replace(/\\/g, '/')
    
    return {
      absolutePath: imagePath,
      relativePath: `/images/${relativePath}`,
      fileName: sanitizedFileName // 返回處理後的文件名
    }
  } catch (error) {
    console.error('Save image error:', error)
    throw error
  }
})

// 添加獲取服務器 URL 的 IPC 處理器
ipcMain.handle('server:getUrl', () => {
  return global.serverUrl
})

// 獲取模板列表
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

// 讀取模板內容
ipcMain.handle('template:read', async (event, templatePath) => {
  try {
    const content = await fs.readFile(templatePath, 'utf-8')
    return content
  } catch (error) {
    console.error('Read template error:', error)
    throw error
  }
})

// 處理路徑拼接
ipcMain.handle('path:join', (event, dir, file) => {
  return path.join(dir, file)
})

// 讀取文件夾
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