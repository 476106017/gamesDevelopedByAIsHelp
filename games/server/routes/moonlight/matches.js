const express = require('express');
const router = express.Router();
const { createMatch, joinMatch } = require('../../controllers/moonlight/matchesController');

router.post('/create', createMatch);  // 新しいマッチ作成
router.post('/join', joinMatch);      // マッチに参加する（対戦相手接続）

module.exports = {
    basePath: '/moonlight/matches',
    router
};
