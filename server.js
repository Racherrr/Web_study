const express = require('express')
const app = express()
const port = 5000
const { User } = require('./models/User');

const mongoose = require('mongoose')
mongoose
    .connect(
        "mongodb+srv://admin:admin@cluster0.f0cw65x.mongodb.net/?retryWrites=true&w=majority"
    )
    .then(()=> console.log('MongoDB connecting sucessful!'))
    .catch((err)=> console.log(err));

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.post("/api/users/register", (req, res) => {
    const user = new User(req.body);
  
    user.save()
        .then(() => {
            res.status(200).json({ success: true, user : user})
        .catch((err)=>{
            return res.json({ success: false, err })
        });
    });
});
app.get('/', (req,res)=>{
    res.send('Hello World!')
})

app.listen(port, () =>{
    console.log(`Server is starting! ${port}`);
})