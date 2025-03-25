const fs = require('fs')
const path = require('path')
const { drizzle } = require('drizzle-orm/better-sqlite3')
const Database = require('better-sqlite3')

// 确保数据库目录存在
const dbPath = path.join(__dirname, 'db.sqlite')
const dir = path.dirname(dbPath)

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
}

// 连接数据库
const sqlite = new Database(dbPath)
const db = drizzle(sqlite)

module.exports = db
