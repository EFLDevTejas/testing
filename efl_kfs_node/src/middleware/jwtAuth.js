const jwt = require('jsonwebtoken');
const db = require('../models');
const Op = db.Sequelize.Op;
const sql = require('mssql');


//jwt_token varify token for admin authentication

module.exports.auth = async (req, res, next) => {
  const config = {  //config to connect DASHBOARD database
    server:"192.168.1.53",
    user: 'SSIS_USER',
    password: "Efl!2023@",
    database: "EFL_CLICK",
    options: {
      trustServerCertificate: true // Change this according to your server configuration
    }
  };
  let userConnection = await sql.connect(config);

  const token = req.header('x-auth-token');
  console.log(token,"token");
  

  if (!token) return res.status(401).send({ statusCode: 401, message: "Access denied. No token provided." });

  try {
  let userQuery = `SELECT * FROM [EFL_CLICK].[dbo].[employees] WHERE token = '${token}'`
  console.log(userQuery);
    let userDetails = await userConnection.request()
    .query(userQuery);
    console.log(userDetails,"userDetails");
    userDetails = userDetails.recordset[0]
    
    // if (!userDetails) return res.status(401).send({ statusCode: 401, message: "Invalid token." });
    // jwt.verify(token, process.env.ACCESSTOKENSECRET,async function(err, decoded) {
    //   if (err) {
    //       return res.status(401).send({ statusCode: 401, message: "Invalid token." });
    //   }
      
    //   req.user = userDetails;
    //   console.log(req.user);
    //   await userConnection.close();
    //   next();
    // });
  
    req.user = userDetails;
    console.log(req.user);
    
    await userConnection.close();
    next();
  }
  catch (ex) {
    console.log(ex);
    
    return res.status(401).send({ statusCode: 401, message: "Invalid token." });
  }
  // finally{
  //   if(userConnection){
  //     await userConnection.close();
  //     console.log(dis);
      
  //   }
  // }
}
