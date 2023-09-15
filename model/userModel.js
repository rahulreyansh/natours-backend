const mongoose = require('mongoose');
const validator = require('validator');
const bCrypt = require('bcrypt');
const crypto=require('crypto')
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name']
    },
    email: {
        type: String,
        required: [true, 'Please provide valid name'],
        unique: true, //Emails are always unique,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    photo: String,
    role:{
        type:String,
        enum:['user','guide','lead-guide','admin'],
        default:'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide your password'],
        minLength: 8,
        select: false
    },
    confirmPassword: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            //This only works on SAVE and CREATE
            validator: function (val) {
                return val === this.password
            },
            message: 'Passwords doesnt match please check'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken:String,
    passwordResetExpires: Date
});

userSchema.pre('save', async function (next) {
    //Only run this function if actually modified
    if (!this.isModified('password')) return next();

    //Hash the password with cost of 12
    this.password = await bCrypt.hash(this.password, 12);

    //Delete ConfirmPassword field
    this.confirmPassword = undefined;
    next()
})

userSchema.pre('save',function(next){
    if(!this.isModified('password') || this.isNew) return next();
    this.passwordChangedAt=Date.now()-1000;
    next()
})

//Creating instance method - Instance method is a method is gonna available at all the documents of a certain collection
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bCrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.changedPasswordAfter=function(JWTTimestamp){
    if(this.passwordChangedAt){
        const changedTimeStamp=parseInt(this.passwordChangedAt.getTime()/1000,10)
        console.log(this.passwordChangedAt,JWTTimestamp)
        return JWTTimestamp < changedTimeStamp
    }
    return false;
}

userSchema.methods.createPasswordResetToken=function(){
    const resetToken=crypto.randomBytes(32).toString('hex')
    crypto.createHash('sha256').update(resetToken).digest('hex')
    this.passwordResetToken=crypto.createHash('sha256').update(resetToken).digest('hex');
    console.log({resetToken},this.passwordResetToken)
    this.passwordResetExpires=Date.now()+10*60*1000
    return resetToken;
}


const User = mongoose.model('User', userSchema)
module.exports = User;