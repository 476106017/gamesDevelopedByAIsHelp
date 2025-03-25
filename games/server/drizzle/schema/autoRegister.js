// server/drizzle/schema/autoRegister.js
const fs = require('fs')
const path = require('path')

const tables = {}

function loadModulesRecursively(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            loadModulesRecursively(fullPath) // 再帰
        } else if (
            entry.isFile() &&
            entry.name.endsWith('.js') &&
            entry.name !== 'autoRegister.js'
        ) {
            const mod = require(fullPath)
            Object.assign(tables, mod)
        }
    }
}

loadModulesRecursively(__dirname)

module.exports = tables
