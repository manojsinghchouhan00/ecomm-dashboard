const mongoose = require('mongoose');

const proSchema = new mongoose.Schema({
    name : String,
    loginId : String,
    password : String,
})

module.exports = mongoose.model('users' , proSchema)