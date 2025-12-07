const mongoose = require('mongoose');

module.exports.connect = async () => {
    try {
        await mongoose.connect(process.env.CONNECT_STRING);
        console.log("Connect to MongoDB successfully");
    } catch (error) {
        console.error(" Connect to MongoDB failed", error);
    }
};