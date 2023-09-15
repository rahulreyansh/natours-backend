const User = require("../model/userModel")
const ApiError = require("../utils/apiError")
const catchAsync = require("../utils/catchAsync")



exports.getAllUsers = catchAsync(async (req, res) => {
    const users= await User.find()
    res.status(200).json({
        status: "success",
        data:{
            users
        }
    })
})

exports.createUser = (req, res) => {
    res.status(500).json({
        status: "error",
        message: "Route is not defined"
    })
}

exports.updateMe=(req,res,next)=>{
    //1) Create error if user post password data
    if(req.body.passoword || req.body.confirmPassword){
        return next(new ApiError('Invalid password update request! Please use valid route',400))
    }
    //2)Update user content
    res.status(200).json({
        status:'Success'
    })
}

exports.getUser = (req, res) => {
    res.status(500).json({
        status: "error",
        message: "Route is not defined"
    })
}

exports.updateUser = (req, res) => {
    res.status(500).json({
        status: "error",
        message: "Route is not defined"
    })
}

exports.deleteUser = (req, res) => {
    res.status(500).json({
        status: "error",
        message: "Route is not defined"
    })
}