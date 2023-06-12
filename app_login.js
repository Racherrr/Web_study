/**
 * 데이터베이스 사용하기
 * 
 * 몽고디비에 연결하고 클라이언트에서 로그인할 때 데이터베이스 연결하도록 만들기
 
 * 웹브라우저에서 아래 주소의 페이지를 열고 웹페이지에서 요청
 *    http://localhost:3000/public/login.html
 *
 * @date 2016-11-10
 * @author Mike
 */

/**
 * 2023.06. 일부 메소드, callback, DB 쿼리문 등을 수정한 버전. 정상적인 동작수행 확인 
 * 수정 내용: 사용자 추가, 로그인(author), 사용자 수정 함수 전부 수정, Router 등록 함수는 그대로 사용 가능  
 */
 
// Express 기본 모듈 불러오기
var express = require('express')
  , http = require('http')
  , path = require('path');

// Express의 미들웨어 불러오기
var bodyParser = require('body-parser')
  , cookieParser = require('cookie-parser')
  , static = require('serve-static')
  , errorHandler = require('errorhandler');

// 에러 핸들러 모듈 사용
var expressErrorHandler = require('express-error-handler');

// Session 미들웨어 불러오기
var expressSession = require('express-session');

// 익스프레스 객체 생성
var app = express();


// 기본 속성 설정
app.set('port', process.env.PORT || 3000);

// body-parser를 이용해 application/x-www-form-urlencoded 파싱
app.use(bodyParser.urlencoded({ extended: false }))

// body-parser를 이용해 application/json 파싱
app.use(bodyParser.json())

// public 폴더를 static으로 오픈
app.use('/public', static(path.join(__dirname, 'public')));
 
// cookie-parser 설정
app.use(cookieParser());

// 세션 설정
app.use(expressSession({
	secret:'my key',
	resave:true,
	saveUninitialized:true
}));


//===== 데이터베이스 연결 =====//

// 몽고디비 모듈 사용
var MongoClient = require('mongodb').MongoClient;


// 데이터베이스 객체를 위한 변수 선언
var database;

//데이터베이스에 연결
function connectDB() {
	// 데이터베이스 연결 정보
	var databaseUrl = 'mongodb://127.0.0.1:27017/local';
    //const options = {useUnifiedTopology: true}; 
	
	// 데이터베이스 연결
	 MongoClient.connect(databaseUrl)
	.then(db => {		
        console.log('데이터베이스에 연결되었습니다. : ' + databaseUrl);
		database = db.db('local');	//DB 객체 획득	
	})
	.catch(err => {
		console.log('에러에러');
		console.log(err);
	})
	.finally(() => {
		console.log('DB 사용 준비 완료');
	});
}


//===== 라우팅 함수 등록 =====//

// 라우터 객체 참조
var router = express.Router();

// 로그인 라우팅 함수 - 데이터베이스의 정보와 비교
router.route('/process/login').post(function(req, res) {
	console.log('/process/login 호출됨.');

    // 요청 파라미터 확인
    var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;
	
    console.log('요청 파라미터 : ' + paramId + ', ' + paramPassword);
    
    // 데이터베이스 객체가 초기화된 경우, authUser 함수 호출하여 사용자 인증
	if (database) {//DB 객체가 있다면
		authUser(database, paramId, paramPassword, function(err, docs) { //사용자 인증 함수 등록
			if (err) {throw err;}
			
            // 조회된 문서(레코드)가 있으면 성공 응답 전송
			if (docs) { //조회된레코드가 있다면
				console.dir(docs); 

                // 조회 결과에서 사용자 이름 확인
				var username = docs[0].name; // 첫 번째 문서에서 이름을 확인하여 username 변수에 저장
				
				res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h1>로그인 성공</h1>');
				res.write('<div><p>사용자 아이디 : ' + paramId + '</p></div>'); //id 출력
				res.write('<div><p>사용자 이름 : ' + username + '</p></div>'); // username 출력
				res.write("<br><br><a href='/public/login.html'>다시 로그인하기</a>");
				res.end();
			
			} else {  // 조회된 레코드가 없는 경우 실패 응답 전송
				res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h1>로그인  실패</h1>');
				res.write('<div><p>아이디와 패스워드를 다시 확인하십시오.</p></div>');
				res.write("<br><br><a href='/public/login.html'>다시 로그인하기</a>");
				res.end();
			}
		});
	} else {  // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h2>데이터베이스 연결 실패</h2>');
		res.write('<div><p>데이터베이스에 연결하지 못했습니다.</p></div>');
		res.end();
	}
	
});

//새로 작성한 사용자 인증 함수
var authUser = function(database, id, password, callback) { //사용자 인증 함수 본체, DB 객체, id, password 및 callback을 인자로 받음
	console.log('authUser 호출됨 : ' + id + ', ' + password);
	
    // users 컬렉션 참조
	var users = database.collection('users');

    // users 컬렉션에서 아이디와 비밀번호를 이용해 검색
	users.find({"id":id, "password":password}).toArray()  //find()는 컬렉션에서 여러 개의 문서를 찾아오기 때문에 이를 배열화(배열 객체로 변환)
    .then((docs) => { //docs가 find().toArray() 동작 결과로 반환되는 배열
        if (docs.length > 0) {
	        console.log('아이디 [%s], 패스워드 [%s] 가 일치하는 사용자 찾음.', id, password);
	    	callback(null, docs);
        } else {
            console.log("일치하는 사용자를 찾지 못함.");
	    	callback(null, null);
        }
    })
    .catch((err) => {  // 에러 발생 시 콜백 함수를 호출하면서 에러 객체 전달
            callback(err, null);
			return;
    })    
   
}



// 사용자 추가 라우팅 함수 - 클라이언트에서 보내오는 데이터를 이용해 데이터베이스에 추가
router.route('/process/adduser').post(function(req, res) {
	console.log('/process/adduser 호출됨.');

    var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;
    var paramName = req.body.name || req.query.name;
	
    console.log('요청 파라미터 : ' + paramId + ', ' + paramPassword + ', ' + paramName);
    
    // 데이터베이스 객체가 초기화된 경우, addUser 함수 호출하여 사용자 추가
	if (database) {
		addUser(database, paramId, paramPassword, paramName, function(err, result) {
			if (err) {throw err;}
			
            // 결과 객체 확인하여 추가된 데이터 있으면 성공 응답 전송
			if (result && result.insertedCount > 0) {
				console.dir(result);
 
				res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>사용자 추가 성공</h2>');
				res.end();
			} else {  // 결과 객체가 없으면 실패 응답 전송
				res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>사용자 추가  실패</h2>');
				res.end();
			}
		});
	} else {  // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h2>데이터베이스 연결 실패</h2>');
		res.end();
	}
	
});


//사용자를 추가하는 함수 - 수정버전
var addUser = function(database, id, password, name, callback) {
	console.log('addUser 호출됨 : ' + id + ', ' + password + ', ' + name);
	
	// users 컬렉션 참조
	var users = database.collection('users');

	// id, password, username을 이용해 사용자 추가
	users.insertMany([{"id":id, "password":password, "name":name}])
    .then((result) => {
        if (result.insertedCount > 0) {
	        console.log("사용자 레코드 추가됨 : " + result.insertedCount);
            callback(null, result);
        } else {
            console.log("추가된 레코드가 없음.");
            callback(null, null);
        }
    })
    .catch((err) => {  // 에러 발생 시 콜백 함수를 호출하면서 에러 객체 전달
            console.log('DB insert 에러 발생');
			callback(err, null);
			return;
    })
}
	


// 사용자 수정 라우팅 함수 - 클라이언트에서 보내오는 데이터를 이용해 데이터베이스의 사용자 정보 수정
app.post('/process/updateuser', function(req, res) {
	console.log('/process/updateuser 호출됨.');

	var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;
    var paramName = req.body.name || req.query.name;
	
    console.log('요청 파라미터 : ' + paramId + ', ' + paramPassword + ', ' + paramName);
	
    // 데이터베이스 객체가 초기화된 경우, updateUser 함수 호출하여 사용자 추가
	if (database) {
        console.log("여기까지 옴??");
		updateUser(database, paramId, paramPassword, paramName, function(err, result) {
			if (err) {throw err;}
			
            // 결과 객체 확인하여 업데이트된 데이터 있으면 성공 응답 전송
			if (result && result.modifiedCount > 0) {
				console.dir(result);

				res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>사용자 수정 성공</h2>');
				res.end();
			} else {  // 결과 객체가 없으면 실패 응답 전송
				res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>사용자 수정  실패</h2>');
				res.end();
			}
		});
	} else {  // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h2>데이터베이스 연결 실패</h2>');
		res.end();
	}
	
});


// 라우터 객체 등록
app.use('/', router);







//사용자를 수정하는 함수
var updateUser = function(database, id, password, name, callback) {
	console.log('updateUser 호출됨 : ' + id + ', ' + password + ', ' + name);
	
	// users 컬렉션 참조
	var users = database.collection('users');

	// id, password, name을 이용해 사용자 수정
	//users.updateOne({"id":id}, {"id":id, "password":password, "name":name}).exec(); //중요부분
    users.updateOne({"id":id}, {$set: {"id":id, "password":password, "name":name}}) //중요 변경, $set이 필요
     .then((result) => {
        if (result.modifiedCount > 0) {
	        console.log("사용자 레코드 수정됨 : " + result.modifiedCount);
            callback(null, result);
        } else {
            console.log("수정된 레코드가 없음.");
            callback(null, result);
        }
    })
    .catch((err) => {  // 에러 발생 시 콜백 함수를 호출하면서 에러 객체 전달
            console.log('DB 수정 에러 발생');
			callback(err, null);
			return;
    })   
   
}

/*
//사용자를 수정하는 함수-구버전
var updateUser = function(database, id, password, name, callback) {
	console.log('updateUser 호출됨 : ' + id + ', ' + password + ', ' + name);
	
	// users 컬렉션 참조
	var users = database.collection('users');

	// id, password, name을 이용해 사용자 수정
	users.updateOne({"id":id}, {"id":id, "password":password, "name":name}, function(err, result) {
		if (err) {
			callback(err, null);
			return;
		}
		
        // 에러 아닌 경우, 콜백 함수를 호출하면서 결과 객체 전달
        if (result.modifiedCount > 0) {
	        console.log("사용자 레코드 수정됨 : " + result.modifiedCount);
        } else {
            console.log("수정된 레코드가 없음.");
        }
        
	    callback(null, result);
	});
}
*/

// 404 에러 페이지 처리
var errorHandler = expressErrorHandler({
 static: {
   '404': './public/404.html'
 }
});

app.use( expressErrorHandler.httpError(404) );
app.use( errorHandler );


// Express 서버 시작
http.createServer(app).listen(app.get('port'), function(){
  console.log('서버가 시작되었습니다. 포트 : ' + app.get('port'));

  // 데이터베이스 연결을 위한 함수 호출
  connectDB();
   
});
