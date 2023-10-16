var express = require('express');
var router = express.Router();
const host_controller = require('../controllers/hostController')

// host login
router.post('/login', host_controller.host_login_post);

module.exports = router;