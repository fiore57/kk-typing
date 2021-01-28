'use strict';

import $ from 'jquery';
const global = Function('return this;')();
global.jQuery = $;
import bootstrap from 'bootstrap';
import Timer from './timer';
import assert from './lib/assert';

const startKeyList = ['Enter', ' '];
const resetKeyList = ['Escape'];

let isInGame = false;
let curTypingTextIndex = 0;
let timer = undefined;
const timerArea = $('#timer');

document.body.addEventListener('keydown',
  event => {
    console.log(event.key);
    if (!isInGame && startKeyList.includes(event.key)) {
      startTypingTest();
      return;
    }
    if (isInGame && resetKeyList.includes(event.key)) {
      resetTypingTest();
      return;
    }
  });


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
const typingTextArea = $('#typingText');
const typingInputArea = $('#typingInput');
const output = $('#output');

const sendRecordToRankingButtonArea = $('#sendRecordToRanking');

function startTypingTest() {
  isInGame = true;
  curTypingTextIndex = 0;
  updateTypingText();
  typingInputArea.val('');
  output.text('');
  sendRecordToRankingButtonArea.hide();
  timer = new Timer(timerArea);
}

function resetTypingTest() {
  isInGame = false;
  curTypingTextIndex = 0;
  typingTextArea.text('');
  typingInputArea.val('');
  output.text('');
  sendRecordToRankingButtonArea.hide();
  timer.stop();
  timer = undefined;
}

function updateTypingText() {
  typingTextArea.text(typingTextList[curTypingTextIndex]);
}


typingInputArea.on('keypress', event => {
  console.log(event);
  if (isInGame && event.key === 'Enter') {
    const inputText = typingInputArea.val();
    if (inputText === typingTextList[curTypingTextIndex]) {
      typingInputArea.val('');
      ++curTypingTextIndex;
      if (curTypingTextIndex === typingTextList.length) {
        isInGame = false;
        assert.defined(timer);
        timer.stop();

        const resultTimeMs = timer.getElapsedTimeMs();

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
            output.text(
              `finished!\nTime: ${displayTime}\n${displayMessage}`
            );

            if (canUpdateRanking) {
              sendRecordToRankingButtonArea.show();
            }
          },
          error => {
            output.text('記録の保存に失敗しました');
          }
        );
        return;
      }
      updateTypingText();
    }
  }
});

sendRecordToRankingButtonArea.on('click', () => {
  sendRecordToRankingButtonArea.prop('disabled', true);
  if (timer === undefined) {
    return;
  }
  const resultTimeMs = timer.getElapsedTimeMs();
  const rankingObject = {
    'timeMs': resultTimeMs
  };
  $.post('/ranking/api/ranking', rankingObject, 'json');
});
