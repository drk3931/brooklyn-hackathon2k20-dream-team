var testController = require('./controllers/testController')
var userController = require('./controllers/userController')

var router = require('express').Router()


router.post('/test',testController.testing)
router.post('/createUser',userController.createUser)
router.post('/loginUser',userController.loginUser)
router.post('/userAddItem',userController.userAddItem)
router.post('/getItemsNearLocation',userController.getItemsNearLocation)

//r
module.exports = router;