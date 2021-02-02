'use strict';
const Sequelize = require('sequelize');
const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost/kk_typing',
  {
    // logging: false, // ログを出力しない
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
);

module.exports = {
  database: sequelize,
  Sequelize: Sequelize
};