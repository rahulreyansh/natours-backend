const express = require('express');
const router = express.Router();
const userController=require('./../controller/userController')
const authController=require('./../controller/authController')


router.post('/signup',authController.signUp)
router.post('/login',authController.login)
router.post('/forgotPassword',authController.forgotPassword)
router.patch('/resetPassword/:token',authController.resetPassword)
router.patch('/updatePassword/',authController.protect, authController.updatePassword)

router.patch('/updateMe',authController.protect,userController.updateMe)


router.route('/').get(userController.getAllUsers).post(userController.createUser);
router.route('/:id').get(userController.getUser).patch(userController.updateUser).delete(userController.deleteUser)

module.exports=router;