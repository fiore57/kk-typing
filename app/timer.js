'use strict';
import assert from './lib/assert';

export default class Timer {
  #isRunningTimer = false;
  #startTimeMs;
  #elapsedTimeMs = 0;
  /**
   * @type {jQuery}
   */
  #timerArea;
  /**
   * 時間の計測を開始する
   * @param {jQuery} timerArea
   */
  constructor(timerArea) {
    this.#isRunningTimer = true;
    this.#startTimeMs = Date.now();
    this.#elapsedTimeMs = 0;
    this.#timerArea = timerArea;
    window.requestAnimationFrame(this.calcTime);
  }
  /**
   * タイマーを止める
   */
  stop() {
    this.#isRunningTimer = false;
    this.#elapsedTimeMs = Date.now() - this.#startTimeMs;
  }
  /**
   * requestAnimationFrame のループで呼ばれる関数
   */
  calcTime = () => {
    if (this.#isRunningTimer) {
      this.#elapsedTimeMs = Date.now() - this.#startTimeMs;
      this.drawTime();
      window.requestAnimationFrame(this.calcTime);
    }
  }
  /**
   * 現在の経過時間を描画する
   * 値は小数第1位まで表示する
   */
  drawTime() {
    assert.defined(this.#timerArea);
    this.#timerArea.text(this.getDisplayTime());
  }
  /**
   * 現在の経過時間を返す
   * @return {number} 経過時間(ms)
   */
  getElapsedTimeMs() {
    return this.#elapsedTimeMs;
  }
  /**
   * 表示する時間を小数（文字列）で返す
   * 値は小数第1位まで表示する
   * @return {string} 経過時間(s)
   */
  getDisplayTime() {
    return (this.getElapsedTimeMs() / 1000).toFixed(1);
  }
}