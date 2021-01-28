'use strict';

import $ from 'jquery';
const global = Function('return this;')();
global.jQuery = $;
import bootstrap from 'bootstrap';
import Timer from './timer';
import assert from './lib/assert';

const messageArea = $('#message');
const typingTextArea = $('#typingText');
const typingInputArea = $('#typingInput');
const resultArea = $('#result')
const outputArea = $('#output');
const resultButtonsArea = $('#resultButtons');
const sendRecordToRankingButtonArea = $('#sendRecordToRanking');
const retryButtonArea = $('#retryButton');

// TODO: コメントアウト
/*
let typingTextList;
$.get('/typing-test/api/get-text').then(
  object => {
    typingTextList = object.textList;
  },
  error => {
    console.error('文章の取得に失敗しました');
  }
);
*/
const typingTextList = [
  "これはテストです。",
  "かな漢字変換込みのタイピングを練習できます。"
];

class TypingTest {
  /**
   * タイピングテスト中かどうか
   * @type {boolean}
   */
  #isInTest = false;
  /**
   * タイマー
   * @type {Timer}
   */
  #timer;
  /**
   * 現在入力している typingTextList の index
   * @type {number}
   */
  #curTypingTextIndex = 0;

  constructor() {
    const timerArea = $('#timer');
    this.#timer = new Timer(timerArea);
  }

  start() {
    this.#isInTest = true;
    this.#curTypingTextIndex = 0;
    this.#timer.start();
    messageArea.text('Esc でリセット');
    typingTextArea.text(typingTextList[this.#curTypingTextIndex]);
    typingInputArea.val('');
    typingInputArea.trigger('focus');
    resultArea.text('');
    outputArea.text('');
    sendRecordToRankingButtonArea.hide();
    sendRecordToRankingButtonArea.prop('disabled', false);
    sendRecordToRankingButtonArea.text('ネットランキングに記録を送信');
    resultButtonsArea.hide();
  }

  reset() {
    this.#isInTest = false;
    this.#curTypingTextIndex = 0;
    this.#timer.reset();
    messageArea.text('Enter または Space を押してスタート');
    typingTextArea.text('');
    typingInputArea.val('');
    resultArea.text('');
    outputArea.text('');
    sendRecordToRankingButtonArea.hide();
    sendRecordToRankingButtonArea.prop('disabled', false);
    sendRecordToRankingButtonArea.text('ネットランキングに記録を送信');
    resultButtonsArea.hide();
  }
  /**
   * 入力文字列が確定されたときの処理
   * @param {string} inputText 入力された文字列
   */
  input(inputText) {
    if (inputText === typingTextList[this.#curTypingTextIndex]) {
      typingInputArea.val('');
      ++this.#curTypingTextIndex;
      if (this.#curTypingTextIndex === typingTextList.length) {
        this.finish();
        return;
      }
      typingTextArea.text(typingTextList[this.#curTypingTextIndex]);
    }
  }
  /**
   * 打ち終わったときの処理
   */
  finish() {
    this.#isInTest = false;
    assert.defined(this.#timer);
    this.#timer.stop();

    const resultTimeMs = this.#timer.elapsedTimeMs;

    const resultObject = {
      "timeMs": resultTimeMs
    };
    $.post('/typing-test/api/record', resultObject, 'json').then(
      object => {
        assert.defined(object.status, object.recordRank, object.canUpdateRanking);

        const recordRank = object.recordRank;
        const canUpdateRanking = object.canUpdateRanking;

        const displayTime = (resultTimeMs / 1000).toFixed(3);
        const displayMessage =
          recordRank === 1 ?
            `新記録達成！` :
            `第${recordRank}位`;
        resultArea.text(
          `finished!\nTime: ${displayTime}\n${displayMessage}`
        );

        resultButtonsArea.show();

        if (canUpdateRanking) {
          sendRecordToRankingButtonArea.show();
        }
      },
      error => {
        outputArea.text('記録の保存に失敗しました');
      }
    );
  }
  /**
   * タイピングテスト中か否か
   * @type {boolean}
   */
  get isInTest() {
    return this.#isInTest;
  }
  /**
   * タイム (ms)
   *
   * タイムが取得できない場合、-1
   * @type {number}
   */
  get resultTimeMs() {
    if (this.#isInTest || this.#timer.elapsedTimeMs === 0) return -1;
    return this.#timer.elapsedTimeMs;
  }
}

const typingTest = new TypingTest();

// タイピングテストの開始・リセット用
$(document.body).on('keydown', event => {
  const startKeyList = ['Enter', ' '];
  const resetKeyList = ['Escape'];
  if (!typingTest.isInTest && startKeyList.includes(event.key)) {
    typingTest.start();
  }
  else if (typingTest.isInTest && resetKeyList.includes(event.key)) {
    // Vimmium を使っていると、typingInputArea にフォーカスがあるときに Esc が検出されない
    typingTest.reset();
  }
});

// タイピングテスト中、入力した文字列の確定用
typingInputArea.on('keypress', event => {
  if (typingTest.isInTest && event.key === 'Enter') {
    const inputText = typingInputArea.val();
    typingTest.input(inputText);
  }
});

// 「ネットランキングに記録を送信」ボタン
sendRecordToRankingButtonArea.on('click', () => {
  // ボタンを無効化
  sendRecordToRankingButtonArea.prop('disabled', true);

  const resultTimeMs = typingTest.resultTimeMs;
  console.log(resultTimeMs);
  if (resultTimeMs < 0) {
    return;
  }

  $.post('/typing-test/api/ranking', { 'timeMs' : resultTimeMs }, 'json').then(
    object => {
      assert.defined(object.status, object.rankingRank);
      // TODO: モーダル周りを整備する
      const modalArea = $('#modal');
      modalArea.modal('show');
      const resultModalBodyArea = $('#resultModalBody');
      resultModalBodyArea.text(`あなたの記録は ${object.rankingRank} 位です`);
      sendRecordToRankingButtonArea.text('記録を送信しました');
    },
    error => {
      outputArea.text('記録を送信できませんでした');
    }
  );
});

// 「リトライ」ボタン
retryButtonArea.on('click', () => {
  typingTest.reset();
  console.log('reset');
});