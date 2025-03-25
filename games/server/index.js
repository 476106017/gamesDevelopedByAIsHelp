const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

// 创建 Express 应用
const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: '*', // 开发时允许所有前端连接
        methods: ['GET', 'POST']
    }
})

// 中间件
app.use(cors())
app.use(express.json())

// 加载路由
const apiRoutes = require('./routes')
app.use(express.json())
app.use('/api', apiRoutes)

// 加载 socket 事件（可按游戏模块拆分）
require('./socket')(io)

// 启动服务器
const PORT = 3001
server.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`)
})
