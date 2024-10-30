const express = require("express");
const bodyParser = require("body-parser"); /* deprecated */
const cors = require("cors");
const https = require("https");
const fs=require("fs");

const app = express();
var corsOptions = {
  origin: "*"
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json({limit: '50mb'}));  /* bodyParser.json() is deprecated */
app.use(express.urlencoded({limit: '50mb'}));
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));   /* bodyParser.urlencoded() is deprecated */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const db = require("./src/models");
const { response } = require("express");

db.sequelize.sync();

require("./src/config/routes")(app);

app.get('/',(req,res)=>{
  res.send("Welcome our Application efl")
})
if(process.env.NODE_ENV == "local"){
     //set port, listen for requests
    const PORT = process.env.PORT || 3400;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}.`);
    });
   
}else{
  const httpServer = https.createServer({
    key: fs.readFileSync('./src/ssl/efl.key'),
    cert: fs.readFileSync('./src/ssl/efl.crt'),
    
  }, app).listen(process.env.PORT, () => {
    console.info(`Server up successfully - port: ${process.env.PORT}`);
  })
  
  const closeHandler = () => {
    () => sequelize.close();
    httpServer.close(() => {
      console.info("Server is stopped successfully");
      process.exit(0);
    });
  };
   
  process.on("????", closeHandler);
  process.on("__________", closeHandler);
}
