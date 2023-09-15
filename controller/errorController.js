const { Mongoose } = require('mongoose');
const ApiError = require('../utils/apiError');

//Customizing error for production - to human readable message
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new ApiError(message, 400);
};

const handleDuplicateFieldsDB=err=>{
  const message=`Duplicate field value:/ ${err?.keyValue?.name} / Please use another value`;
  return new ApiError(message,400)
}

const handleValidationErrorDB=err=>{
  let error=Object.values(err.errors).map(el=>el.message)
  const message = `Invalid Input Data. ${error.join('. ')}`;
  return new ApiError(message,400)
}

const handleJWTError=()=>new ApiError('Invalid token. Please log in again!',401)
const handleJWTExpired=()=>new ApiError('Log in timed out. Please log in again and try!',401)

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  //Operational, trusted error: send message to client
  if (err?.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });

    //Programming or other unknown error: don't leak error details
  } else {
    //Log Error
    // eslint-disable-next-line no-console
    console.error('ERROR 💥', err);

    //Send Generic Message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }
};

module.exports = (err,req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  const currEnv = process.env.NODE_ENV;
  if (currEnv === 'development') {
    sendErrorDev(err, res);
  } else if (currEnv.trim() === 'production') {
    let error;
    //Avoid making shallow copy with spread operator,it will not make copies of enumerable properties of an object
    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if(err.code === 11000) error = handleDuplicateFieldsDB(err);
    if(err.name === 'ValidationError') error = handleValidationErrorDB(err);
    if(err.name === 'JsonWebTokenError') error=handleJWTError()
    if(err.name === 'TokenExpiredError') error=handleJWTExpired()
    let currError;
    if(!error){
      currError=err
    }else{
      currError=error
    }
    sendErrorProd(currError, res);
  }
};
