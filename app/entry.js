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


let typingTextList;
$.get('/typing-test/api/get-text').then(
  object => {
    typingTextList = object.textList;
  },
  error => {
    console.error('文章の取得に失敗しました');
  }
);
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
          recordsObject => {
            const records = recordsObject.records;
            const canUpdateRanking = recordsObject.canUpdateRanking;

            const rank = records.findIndex((e) => e.time === resultTimeMs) + 1;
            const displayTime = (resultTimeMs / 1000).toFixed(3);
            const displayMessage =
              rank === 1 ?
                `新記録達成！` :
                `第${rank}位`;
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
