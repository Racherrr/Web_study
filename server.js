var express = require('express')
  , http = require('http')
  , path = require('path');
var bodyParser = require('body-parser')
  , cookieParser = require('cookie-parser')
  , static = require('serve-static')
  , errorHandler = require('errorhandler');
var expressErrorHandler = require('express-error-handler');
var expressSession = require('express-session');
var fs = require('fs');

const { User } = require('./models/User');
const mongoose = require('mongoose')
mongoose
    .connect(
        "mongodb+srv://admin:admin@cluster0.f0cw65x.mongodb.net/?retryWrites=true&w=majority"
    )
    .then(()=> console.log('MongoDB connecting sucessful!'))
    .catch((err)=> console.log(err));

var app = express();
app.set('port', process.env.PORT || 3000);
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
app.use('/public', static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(expressSession({
	secret:'my key',
	resave:true,
	saveUninitialized:true
}));

var router = express.Router();

app.post("/process/register", (req, res) => {
    const user = new User(req.body);
  
    user.save()
        .then(() => {
            res.status(200).json({ success: true})
        })
        .catch((err)=>{
            return res.json({ success: false, err })
        });
});

app.post("/process/login", (req,res)=>{
    User.find({ id: req.body.id, password:req.body.password })
    .then((docs)=>{
        if(docs){
            req.session.userid = req.body.id;
            res.redirect('/public/success.html')
            console.log(req.session);
        }else {
            return res.json({
                loginSuccess:false,
                message:"아이디가 없습니다.",
            });
        }
    })
})







app.use('/', router);

http.createServer(app).listen(app.get('port'), function(){
    console.log('서버가 시작되었습니다. 포트 : ' + app.get('port'));     
  });
  