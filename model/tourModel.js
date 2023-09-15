const mongoose = require('mongoose')
const slugify = require('slugify')
const validator=require('validator')
//Creating Simple Schema
const tourSchema = new mongoose.Schema({
    //In mongoose schema we can pass both schema defination and schema option
    //Using Built in validators
    /*
     A>String Validators
    i>maxLength
    ii>minLength
    ENUM Validators - we can pass array
    B>Number Validators
    i>Min
    ii>Max
    */
    name: {
        type: String,
        required: [true, 'A tour must have name'],//Built in validators
        maxLength: [40, 'A tour name must have less or equal 40 characters'],//Built in validators
        minLength: [10, 'A tour name must have more or equal 10 characters'],//Built in validators
        unique: true,
        // validate:[validator.isAlpha,"Only Alphabets"]
    },
    duration: {
        type: Number,
        required: [true, 'A tour must have duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have group size']
    },
    slug: String,
    difficulty: {
        type: String,
        required: [true, 'A tour must have difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficulty'],
            message: 'Difficulty is either:easy, medium, difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        required: [true, 'A tour must have price'],
        min: [1, 'Rating must be 1 or more than 1'],
        max: [5, 'Rating must be 5 or less than 5']
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        default: 4.5
    },
    priceDiscount: {
        type: Number,
        validate: { //This is how we use custom validators
            validator: function (val) {
                //This only points to current doc on NEW document creation, will not work on update case
                return val < this.price
            },
            message: 'Price discount ({VALUE}) must be less than actual price'
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have summary']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false //This field 'createdAt' will never show in search results since select property is false
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    }
    //To show the virtual data on output
},
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
)

//using virtual properties - These virtual properties are computed properties that are derived from the existing data in the document. They are not persisted to the database but can be accessed just like regular fields of the document.

tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7
})

/*Mongoose Middleware - is also called pre and post hooks
There are 4 types of middleware in mongoose:
1.Document
2.Query
3.Aggregate
4.Model
We define middleware on the schema
*/

//DOCUMENT MIDDLEWARE: run before .save() and .create()
// tourSchema.pre('save',function(next){
//     this.slug=slugify(this.name,{
//         lower:true
//     })
//     next()
// })

// //POST middle executes after all the middleware
// tourSchema.post('save',function(doc,next){
//     console.log(doc)
//     next()
// })

//QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } })
    this.start = Date.now()
    next();
})

tourSchema.post(/^find/, function (doc, next) {
    console.log(`Query took ${Date.now() - this.start} milliseconds!`);
    next()
})


//Aggregation Middleware
tourSchema.pre('aggregate', function (next) {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } })
    next()
})

//Creating Model out of the schema
const Tour = mongoose.model('Tour', tourSchema)

module.exports = Tour;