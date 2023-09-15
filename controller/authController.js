const User = require("../model/userModel")
const catchAsync = require("../utils/catchAsync")
const jwt = require('jsonwebtoken')
const AppError = require('./../utils/apiError')
const { promisify } = require('util')
const sendEmail = require('../utils/email')
const crypto = require('crypto')

const signToken = id => {
    return jwt.sign({ id }, process.env.PRIVATE_KEY, {
        expiresIn: process.env.EXPIRY
    })
}

exports.signUp = catchAsync(async (req, res, next) => {
    console.log("req",req)
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        passwordChangedAt: req.body.passwordChangedAt,
    })
    //in payload we assign id
    const token = signToken(newUser._id)
    res.status(201).json({
        status: 'success',
        token: token,
        data: {
            newUser
        }
    })
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    //Check if email and password exist in the req body
    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400))
    }
    //Check if users exists and password is correct
    const user = await User.findOne({ email }).select('+password')
    //accessing correct password (instance method)
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401))
    }
    //If everything ok, send token to client
    const token = signToken(user._id);
    res.status(201).json({
        status: 'success',
        token
    })
});

exports.protect = catchAsync(async (req, res, next) => {
    // 1) Getting token and check token if its there
    let token;
    if (req?.headers?.authorization && req?.headers?.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
    }
    if (!token) {
        return next(new AppError('You are not logged in! Please log in', 401))
    }

    //2) Verification Token
    const decoded = await promisify(jwt.verify)(token, process.env.PRIVATE_KEY);

    // //3) Check if user still exists
    const freshUser = await User.findById(decoded.id)
    if (!freshUser) {
        return next(new AppError('User does not exist with this token', 401))
    }

    //4) Check if user changed password after JWT exist
    if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password! Please login again.', 401))
    }

    //GRANT ACCESS TO USER-- Current logged in user
    req.user = freshUser;
    next()
})

//Authorization user role and permissions
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You are not authorized to access this resource', 403))
        }
        next()
    }

}

//Password Reset Functionality
exports.forgotPassword = catchAsync(async (req, res, next) => {
    //1)Get user based on posted email
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        return next(new AppError('User not found with the given email', 404))
    }
    //2)Generate the random reset token
    const resetToken = user.createPasswordResetToken()
    await user.save({ validateBeforeSave: false })

    //3)Send it to user's email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    const message = `Forgot your password? Visit this link ${resetURL} to reset your password!`;
    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token! (Valid for 10 min)',
            message
        })

        res.status(200).json({
            status: 'Success',
            message: 'Token sent to mail!'
        })
    } catch (err) {
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        await user.save({ validateBeforeSave: false })
        console.log("Error", err)
        return next(new AppError('There was an error sending email. Try again later', 500))
    }
})

exports.resetPassword = catchAsync(async (req, res, next) => {
    //1)Get user based on token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() }})
    //2)If token has not expired and there is user set the new password
        if(!user){
            return next(new AppError('Token is invalid or has expired',400))
        }
        user.password=req.body.password
        user.confirmPassword=req.body.confirmPassword
        user.passwordResetToken=undefined
        user.passwordResetExpires=undefined
        await user.save()
    //3)Update changedPasswordAt property for the user

    //4)Log the user in, send JWT
    const token = signToken(user._id);
    res.status(201).json({
        status: 'success',
        token
    })
});

exports.updatePassword=catchAsync(async(req,res,next)=>{
    //1)Get user from collection
    const user=await User.findById(req.body.id).select('+password')
    //2)Check if posted current password is correct
    if(!user.correctPassword(req.body.passwordCurrent,user.password)){
        return next(new AppError('Invalid password',401))
    }
    //3)If so update password
    user.password=req.body.passwordCurrent
    user.confirmPassword=req.body.confirmPassword
    user.save()
    //4)Long user in, send JWT
    const token = signToken(user._id);
    res.status(201).json({
        status: 'success',
        token
    })
})