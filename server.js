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
    User.findOne({ id: req.body.id})
    .then((docs)=>{
        console.log("로그인 요청 : " + docs)
        if(!docs){
            res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
            res.write('<script>alert("아이디가 틀리거나 존재하지 않는 아이디입니다.")</script>');
            res.end("<script>location.replace('/public/login.html')</script>");
            return;
        }
        if(req.body.password != docs.password){
            res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
            res.write("<script>alert('비밀번호가 틀립니다.')</script>");
            res.end("<script>location.replace('/public/login.html')</script>");
            return;
        }
        if(req.body.password == docs.password){
            req.session.userid = req.body.id;
            res.redirect('/public/index_login.html')
            console.log(req.session);
        }
    })
})

app.get("/process/logOut", (req, res) =>{
    console.log("로그아웃 요청 : " + req.session.userid)
    req.session.destroy((err) => {
        if(err){
            res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
            res.write("<script>alert('로그아웃 실패.')</script>");
            res.end("<script>location.replace('/public/index_login.html')</script>");
            console.log(err)
            return
        }
    
        res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
        res.write("<script>alert('로그아웃합니다.')</script>");
        res.end("<script>location.replace('/public/index.html')</script>");
    })
})





app.use('/', router);

http.createServer(app).listen(app.get('port'), function(){
    console.log('서버가 시작되었습니다. 포트 : ' + app.get('port'));     
  });
  