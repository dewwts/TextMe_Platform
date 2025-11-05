const mongoose = require('mongoose')
export const connectDB = async()=>{
    const mongo_URI = process.env.MONGODB_URI
    if (!mongo_URI){
        console.error("MONGO_URI is not set");
        process.exit(1)
    }
    try{
        await mongoose.connect(mongo_URI)
        console.log("Successfuly connect MONGODB");
    }catch(err){
        console.error('MongoDB connection error:', err);
        process.exit(1)
    }
}
module.exports = { connectDB };