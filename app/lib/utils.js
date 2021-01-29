'use strict';

import assert from "./assert";
import $ from 'jquery';

/**
 * エスケープ処理を行う
 * @param {string} value エスケープする文字列
 * @return {string} エスケープされた文字列
 */
export function escapeText(value) {
  assert.defined(value);
  return $('<div />').text(value).html();
}
