const user = require('../controllers/login');
var router = require("express").Router();


router.post('/login',user.login)
router.get('/logout',user.logout)

module.exports = router;