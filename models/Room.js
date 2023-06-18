const mongoose = require('mongoose');



const roomSchema = mongoose.Schema({
    room: {
      type: Number
    },
    startTime: {
      type: Number,
    },
    endTime:{
      type: Number,
    },
    userId: {
      type: String,
    }
});


const Room = mongoose.model("room", roomSchema);
module.exports = { Room };