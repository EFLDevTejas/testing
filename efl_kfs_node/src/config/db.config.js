const dotenv = require("dotenv");
dotenv.config();

module.exports = {
    HOST: process.env.SQL_SERVER_NAME,
    PORT: process.env.SQL_SERVER_PORT,
    USER: process.env.SQL_SERVER_USERNAME,
    PASSWORD: process.env.SQL_SERVER_PASSWORD,
    DB: process.env.SQL_SERVER_DATABASE,
    dialect: "mssql",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };

