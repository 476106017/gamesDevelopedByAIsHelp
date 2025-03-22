
import common from './common.js'
import minesweeper from './minesweeper.js'
import warehouse from './warehouse.js'


function mergeModules(...modules) {
    const merged = { ja: {}, en: {}, zh: {} }

    for (const mod of modules) {
        for (const lang of ['ja', 'en', 'zh']) {
            Object.assign(merged[lang], mod[lang] || {})
        }
    }

    return merged
}

const messages = mergeModules(common, minesweeper, warehouse)

export default messages