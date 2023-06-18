const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');

const userSchema = mongoose.Schema({
  id: {
    type: String,
    maxlength: 20,
  },
  password: {
    type: String,
    minlength: 2,
  }
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

const User = mongoose.model("users", userSchema);

module.exports = { User };
