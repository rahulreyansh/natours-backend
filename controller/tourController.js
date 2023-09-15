const Tour = require('./../model/tourModel')
const APIFeatures = require('../utils/apiFeatures')
const catchAsync = require('./../utils/catchAsync');
const ApiError = require('../utils/apiError');

//For accessing data from file--> Will not use it anymore
// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next()
}

exports.getTours = catchAsync(async (req, res) => {
    //EXECUTE THE QUERY
    const features = new APIFeatures(Tour.find(), req.query).filter().sort().paginate()
    const tours = await features.query;

    //SEND RESPONSE
    res.status(200).json({
        status: "success",
        requestedAt: req.requestTime,
        results: tours.length,
        data: {
            tours
        }
    })
})

exports.createTour = catchAsync(async (req, res, next) => {
    const newTour = await Tour.create(req.body)
    res.status(201).json({
        status: "success",
        data: {
            tour: newTour
        }
    })
})

// exports.getTour =async (req, res) => {
//     try{
//         const responseData= await Tour.findById(req.params.id)
//         res.status(200).json({
//             status: "success",
//             data: {
//                 responseData
//             }
//         })
//     }catch(err){
//         console.error("ERROR",err)
//         console.log('Error Name:', err?.name);
//         res.status(404).json({
//             status:"Request failed",
//             message:err
//         })
//     }

// }

exports.getTour = catchAsync(async (req, res, next) => {
    const responseData = await Tour.findById(req.params.id)
    if (!responseData) {
        return next(new ApiError("No tour found with that ID", 404))
    }
    res.status(200).json({
        status: "success",
        data: {
            responseData
        }
    })
})

exports.updateTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })
    if (!tour) {
        return next(new ApiError("No tour found with that ID", 404))
    }
    res.status(200).json({
        status: "success",
        data: {
            tour
        }
    })
})

exports.deleteTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndDelete(req.params.id)
    if (!tour) {
        return next(new ApiError("No tour found with that ID", 404))
    }
    res.status(204).json({
        status: "success",
        data: null
    })
})

//Aggregate Pipeline Matching and Grouping
exports.getTourStats = catchAsync(async (req, res, next) => {
    const tourStats = await Tour.aggregate([
        {
            $match: {
                ratingsAverage: {
                    $gte: 4.5
                }
            }
        },
        {
            $group: {
                _id: { $toUpper: '$difficulty' },
                numTours: { $sum: 1 },
                numRatings: { $avg: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        },
        {
            $sort: {
                avgPrice: 1
            }
        },
        // {
        //     $match:{_id:{$ne:'EASY'}}
        // }
    ])
    res.status(200).json({
        status: "success",
        data: {
            tourStats
        }
    })
})

exports.getMonthlyPlan = catchAsync(async (req, res) => {
    const year = req.params.year;
    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numToursStarts: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: { month: '$_id' }
        },
        {
            $project: { _id: 0 }
        },
        {
            $sort: { numToursStarts: -1 }
        },
        // {
        //     $limit:5
        // }
    ])
    res.status(200).json({
        status: "success",
        data: {
            plan
        }
    })
})
