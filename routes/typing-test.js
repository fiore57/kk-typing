'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Record = require('../models/record');
const Ranking = require('../models/ranking');
const fs = require('fs');

router.get('/', authenticationEnsurer, (req, res, next) => {
  res.render('typing-test', { user: req.user });
});

const kenpoText = fs.readFileSync('./dat/kenpo.txt', { encoding: 'utf-8', flag: 'r' });
const kenpoTextList = kenpoText.trim().split('\n');
// テキストを取得する API
router.get('/api/get-text', authenticationEnsurer, (req, res, next) => {
  res.send({
    textList: kenpoTextList
  });
});

router.post('/api/record', authenticationEnsurer, async (req, res, next) => {
  // then を使うと汚くなるのでここだけ async/await を使用
  try {
    console.log(req.body);
    const resultTimeMs = req.body.timeMs;
    const userId = req.user.id;
    await Record.create({
      time: resultTimeMs,
      createdBy: userId,
      updatedAt: new Date()
    });
    const records = await Record.findAll({
      where: {
        createdBy: userId
      },
      order: [['time', 'ASC'], ['updatedAt', 'DESC']]
    });
    const ranking = await Ranking.findByPk(userId);
    const canUpdateRanking = (ranking === null || resultTimeMs < ranking.time);
    res.send({
      records: records,
      canUpdateRanking: canUpdateRanking
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;