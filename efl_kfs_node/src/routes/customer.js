const customers = require('../controllers/customer');
const PDF = require('../controllers/KFS_PDF');
var router = require("express").Router();
const {auth} = require('../middleware/jwtAuth');


router.get('/generateWordKFS',customers.generateWordKFS)
router.get('/generatePDFKFS/:APPLICATION_NUMBER/:language',auth,PDF.generateKFSPdf)
router.get('/oracleConnection',customers.oracleConnection)

module.exports = router;
