var testController = require('./controllers/testController')

var router = require('express').Router()
router.post('/test',testController.testing)


module.exports = router;