'use strict';
const Sequelize = require('sequelize');
let sequelize;
if (process.env.NODE_ENV === 'production' || (!process.env.POSTGRES_HOST || !process.env.POSTGRES_PORT)) {
  sequelize = new Sequelize(
    process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost/kk_typing',
    {
      logging: false, // ログを出力しない
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    }
  );
}
else {
  // CI 用
  sequelize = new Sequelize('kk_typing', 'postgres', 'postgres', {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    dialect: 'postgres',
    logging: false, // ログを出力しない
  });
}

module.exports = {
  database: sequelize,
  Sequelize: Sequelize
};