var testController = require('./controllers/testController')
var userController = require('./controllers/userController')

var router = require('express').Router()
router.post('/test',testController.testing)
router.post('/createUser',userController.createUser)
router.post('/loginUser',userController.loginUser)


module.exports = router;