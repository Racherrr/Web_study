var express = require('express')
  , http = require('http')
  , path = require('path');
var bodyParser = require('body-parser')
  , cookieParser = require('cookie-parser')
  , static = require('serve-static')
var expressSession = require('express-session');

const { User } = require('./models/User');
const { Room } = require('./models/Room');
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
app.set('view engine', 'ejs')
app.use('/public', static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(expressSession({
	secret:'my key',
	resave:true,
	saveUninitialized:true
}));

var router = express.Router();

app.post("/process/register", (req, res) => {
    console.log("가입요청이 들어옴")
    const user = new User(req.body);
    user.save()
        .then(() => {
            res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
            res.write('<script>alert("가입성공! 로그인페이지로 이동합니다.")</script>');
            res.end("<script>location.replace('/public/login.html')</script>");
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


app.post("/process/changePwd", (req, res) =>{
    if(!req.session.userid){
        console.log("세션만료");
        res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
        res.write("<script>alert('로그인이 필요한 서비스입니다. 로그인창으로 이동됩니다.')</script>");
        res.end("<script>location.replace('/public/login.html')</script>");
        return;
    }

    User.findOne({id : req.session.userid})
    .then((user) => {
        console.log("비밀번호 변경 요청 : " + user.id)
        if(user.password == req.body.nowPassword){
            User.updateOne({ id : req.session.userid }, { password : req.body.newPassword})
            .then(()=>{
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                res.write("<script>alert('성공적으로 변경되었습니다.')</script>");
                res.end("<script>location.replace('/myPage')</script>");                        
            })
        } else {
            res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
            res.write("<script>alert('비밀번호가 틀립니다..')</script>");
            res.end("<script>location.replace('/myPage')</script>");        
        }
    })

})




app.post("/process/reserve", (req, res) =>{
    if(!req.session.userid){
        console.log("세션만료");
        res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
        res.write("<script>alert('로그인이 필요한 서비스입니다. 로그인창으로 이동됩니다.')</script>");
        res.end("<script>location.replace('/public/login.html')</script>");
        return;
    }

    console.log("강의실 예약 요청이 들어옴. 유저 : " + req.session.userid)
    Room.find({ room: req.body.room || req.query.room })
    .then((docs)=>{
        var dup = false;
        for(var i = 0; i < docs.length; i++){
            if(docs[i].startTime == req.body.startTime){
                dup = true;
                break;
            }
        }
        if(dup){
            res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
            res.write("<script>alert('이미 예약된 시간입니다.')</script>");
            res.end("<script>location.replace('/public/reserve.html')</script>");
        } else {
            var room = new Room({
                room : req.body.room,
                startTime: req.body.startTime,
                endTime: req.body.endTime,
                userId: req.session.userid,
            });
            room.save()
                .then((newFile) => {
                    res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                    res.write("<script>alert('예약성공!')</script>");
                    res.end("<script>location.replace('/public/reserve.html')</script>");
                });
        }
    })
})

app.post("/process/searchRoom", (req, res) =>{
    Room.find({room : req.body.room})
    .then((result)=>{
        ans = result.sort((a, b) => a.startTime - b.startTime);
        res.render('current.ejs', { rooms: ans });
    });

})

app.post("/process/delete", (req, res)=>{
    console.log(req.body.roomName)
    Room.deleteOne({_id:req.body.roomName})
    .then(()=>{
        res.redirect('/myPage');
    })
})


app.get('/current', function(req, res){
    res.render('current.ejs', { rooms: null});
})

app.get('/mypage', function(req, res){
//        res.render('mypage.ejs');

    Room.find({userId : req.session.userid})
    .then((docs)=>{
        console.log(docs)
        res.render('mypage.ejs', { user: req.session.userid ,rooms: docs});
    })
})

app.get('/register', function(req, res){
    User.find()
    .then((info) =>{
        res.render('register.ejs', { user: info});
    })
})

app.use('/', router);

http.createServer(app).listen(app.get('port'), function(){
    console.log('서버가 시작되었습니다. 포트 : ' + app.get('port'));     
  });
  