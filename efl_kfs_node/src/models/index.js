const dbConfig = require("../config/db.config.js");
const Sequelize = require("sequelize");
const dbPoolConfig = {
  user: 'SSIS_USER',
  password: 'Efl!2023@',
  server: '192.168.1.53',
  database: 'CustomerApp',
  options: {
    encrypt: false,
    cryptoCredentialsDetails: {
      minVersion: 'TLSv1.2', // Use a compatible version like TLSv1.2
    },
  },
};
// const dbPoolConfig = {
//   user: 'sa',
//   password: 'Efl#$@7890',
//   server: 'api.electronicafinance.com',
//   database: 'CustomerApp',
//   options: {
//     encrypt: false,
//     cryptoCredentialsDetails: {
//       minVersion: 'TLSv1.2', // Use a compatible version like TLSv1.2
//     },
//   },
// };

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  port: dbConfig.PORT,
  dialect: dbConfig.dialect,
  options: {
    encrypt: false,
    cryptoCredentialsDetails: {
      minVersion: 'TLSv1.2'
    },
    trustServerCertificate: true,
    enableArithAbort: false
  },
  // The below options are important to supress ssl issue on
  // AWS EC2 ubuntu when db server is on windows. There is TLS protocol issue
  // Which by using these options we disable tls encryption
  dialectOptions: {
    // Observe the need for this nested `options` field for MSSQL
    instanceName: "MSSQLSERVER", // instance name of mssql server name
    requestTimeout: 1000000, // query execuation time
    options: {
      encrypt: false,
      enableArithAbort: false
    }
  },
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
});

const db = {};

db.DownloadKFSDetails = require('./downloadKFSDetails.js')(sequelize,Sequelize)

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.dbPoolConfig = dbPoolConfig;
module.exports = db;




