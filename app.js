const express = require('express');
const morgan = require('morgan');
const cors=require('cors');
const app = express();

const tourRouter=require('./routes/tourRoutes')
const userRouter=require('./routes/userRoutes');
const ApiError = require('./utils/apiError');
const globalError=require('./controller/errorController')

//Including Middleware
if(process.env.NODE_ENV === "development"){
    console.log("Dev Running")
    app.use(morgan('dev'))
}
app.use(express.json())

app.use(cors())

//Creating Our Own Middleware
app.use((req, res, next) => {
    console.log("Hello from middleware");
    next()
})

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next()
})

//Using 3rd Party Middleware
// app.use(morgan('dev'))

//Serving static files
app.use(express.static(`${__dirname}/public`))

app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)

//Error Handling using middleware--, if we place this code at top level it will throw same error for correct urls also - Handling all the unhandled routes

app.all('*',(req,res,next)=>{
    next(new ApiError(`Can't find requested url ${req.originalUrl} on this server!`,404))
})

//Implementing a Global Error Handling
//With the help of 4 parameters including "err", express automatically knows this entire function is error handling middleware
app.use(globalError)

module.exports=app;