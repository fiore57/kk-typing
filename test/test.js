'use strict';
const request = require('supertest');
const app = require('../app');
const passportStub = require('passport-stub');

describe('/ 非ログイン時', () => {
  test('ログインボタンが表示される', () => {
    return request(app)
      .get('/')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(/<a class="btn btn-info" href="\/login"/)
      .expect(200);
  });
});

describe('/ ログイン時', () => {
  beforeAll(() => {
    passportStub.install(app);
    passportStub.login({ username: 'testuser' });
  });
  afterAll(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  });
  test('「タイピングテストをプレイ」ボタンが表示される', () => {
    return request(app)
      .get('/')
      .expect(/<a class="btn btn-primary mx-2 my-1" href="\/typing-test"/)
      .expect(200);
  });
  test('「自分の記録を見る」ボタンが表示される', () => {
    return request(app)
      .get('/')
      .expect(/<a class="btn btn-info mx-2 my-1" href="\/record"/)
      .expect(200);
  });
  test('「ネットランキングを見る」ボタンが表示される', () => {
    return request(app)
      .get('/')
      .expect(/<a class="btn btn-info mx-2 my-1" href="\/ranking"/)
      .expect(200);
  });
  test('ユーザー名が表示される', () => {
    return request(app)
      .get('/')
      .expect(/testuser/)
      .expect(200);
  });
});

describe('/login', () => {
  test('ログインのためのリンクが含まれる', () => {
    return request(app)
      .get('/login')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(/<a class="btn btn-info my-3" href="\/auth\/github"/)
      .expect(200);
  });
});

describe('/logout', () => {
  test('ログアウト時、ルートにリダイレクトされる', () => {
    return request(app)
      .get('/logout')
      .expect('Location', '/')
      .expect(302);
  });
});
