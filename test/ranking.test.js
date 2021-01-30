'use strict';
const request = require('supertest');
const app = require('../app');
const passportStub = require('passport-stub');

describe('/ranking 非ログイン時', () => {
  test('/login にリダイレクトされる', () => {
    return request(app)
      .get('/typing-test')
      .expect('Location', '/login')
      .expect(302);
  });
});