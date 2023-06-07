const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    maxlength: 50,
  },
  email: {
    type: String,
    trim: true,
    unique: 1,
  },
  password: {
    type: String,
    minlength: 5,
  },
  bookedLab: {
    type: Number,
  },
});

// userSchema.pre('save', (next)=>{
//     var user = this;

//     if(user.isModified('password')) {
//         bcrypt.genSalt(10, function(err, salt) {
//             if(err) return next(err);
//             bcrypt.hash(user.password, salt, function(err,hash) {
//                 if(err) return next(err);
//                 user.password = hash;
//                 next();
//             });
//         });
//     } else {
//         next();
//     }
// });

const User = mongoose.model("User", userSchema);

module.exports = { User };