var express = require('express'),
	site_vhosts = [],
	vhost; // 웹서버 구축을 위한 모듈
var session = require('express-session'); // 쿠키 및 세션 생성을 위한 모듈
var app = express(); // 웹서버 구축 모듈 사용 
var fs = require('fs'); // 파일 입출력을 간단하게 해주는 모듈 
var bodyParser = require('body-parser'); // 클라이언트의 요청(request)를 json형식으로 변환하게 해주는 모듈
var requestURL = require('request'); // 페이지에 요청을 보내고 html 페이지를 가져 올 수 있는 모듈
var cheerio = require('cheerio'); // html 페이지의 파싱을 쉽게 할 수 있게 해주는 모듈
var nodemailer = require('nodemailer'); // 알람서비스를 위한 메일 모듈
var mysql = require('mysql'); // mysql 서버에 query를 보내기 위한 모듈
var client_id = 'zP4_7yKoudLDOkOsJsgU'; // 네이버 데이터 랩 api 사용을 위한 id
var client_secret = 'nd1Jp0tcCN'; // 네이버 데이터 랩 api 사용을 위한 고유키

var api_url = 'https://openapi.naver.com/v1/datalab/search'; // 네이버 데이터랩 api 요청 주소

var server = app.listen(80, function(){ // 80포트를 허용한 웹서버를 생성
    console.log("Express server has started on port 80")
})

// var connection = mysql.createConnection({
// 	host     : 'localhost',
// 	user     : 'root',
// 	password : '5427',
// 	database : 'mydb',
// 	port : 3306,
// 	charset : 'utf8'
// });

var connection = mysql.createConnection({ // mysql 서버와 연결을 위한 정보
	host     : '35.192.50.205',
	user     : 'rockpell',
	password : '5427',
	database : 'mydb',
	port : 3306,
	charset : 'utf8'
});

var transporter = nodemailer.createTransport({ // 알람을 보내는 메일 등록
	service: 'gmail',
	auth: {
		user: 'aythffk@gmail.com',
		pass: 'rock0147258#'
	}
});

var searchText = null; // 검색한 단어를 저장하는 변수
var isCheckRunning = false; // 데이터의 변경이 중복으로 일어나지 않게 막는 bool 변수

var realTimeKeywordList = Array(); // 실시간 검색어를 저장하기 위한 리스트
var alarmUserList = Array(); // 현재 알람을 등록한 유저를 검사하기 위한 리스트

connection.connect(); // mysql 서버와 연결

app.use(express.static(__dirname+'/hompage')); // 페이지를 띄울때 사용되는 파일들의 기본 디렉토리 지정
app.use(bodyParser.urlencoded({extended:true})); // url encoding의 확장을 허용 json 변환을 위해서
app.use(bodyParser.json()); // 서버와 클라이언트 간의 요청을 json형식으로 사용한다.
app.use(session({ // 세션을 사용하기 위한 설정 정보
	secret : 'xik,mc[qw.jlkxcnmkusdbnfglksdnmflkj', // 세션 암호화
	resave : false, // 세션의 자동 저장 설정
	saveUninitialized : true // 세션 저장 전 uninitialized 상태로 저장
}));

app.set('view engine', 'ejs'); // 클라이언트에게 보여줄 페이지 형태 지정(ejs 확장자로 지정)
app.set('views', './hompage'); // hompage 디렉토리에 있는 파일 사용

PatchWordForAlarm(function(){}); // 데이터베이스에서 알람 정보를 받아오는 함수
StartCheckLoop(); // 알람 확인 관련 데이터 중복 수정을 막기 위한 함수
setInterval(Update, 1000); // 알람을 보내기 위한 확인 처리를 반복 시키는 함수

app.get('/', function(request, response) { // 클라이언트가 '/' 경로로 요청 했을때 반응
	var isLogOn = false;
	if(request.session.authId) // 세션에 저장된 아이디가 있을 경우 로그인 유지
		isLogOn = true;
	Scraping(function(text){
		ToCsv(text, function(){
			const data = {
				logOn : isLogOn,
				name : request.session.authId
			}
			response.render('main', data, function(err, html){
				response.send(html);
			});
		});
	});
});

app.get('/real', function(request, response){ // 클라이언트가 '/real' 경로로 요청 했을때 반응
	var isLogOn = false;
	if(request.session.authId) // 세션에 저장된 아이디가 있을 경우 로그인 유지
		isLogOn = true;
	Scraping(function(text){
		ToCsv(text, function(){
			const data = {
				logOn : isLogOn,
				name : request.session.authId
			}
			response.render('main', data, function(err, html){
				response.send(html);
			});
		});
	});
	
});

app.get('/search', function(request, response){ // 클라이언트가 '/search' 경로로 요청 했을때 반응
	var isLogOn = false;
	if(request.session.authId) // 세션에 저장된 아이디가 있을 경우 로그인 유지
		isLogOn = true;
	var testData = [];
	searchText = null;
	const data = {
		logOn : isLogOn,
		name : request.session.authId,
		datas : testData,
		text : searchText
	}
	response.render('search', data, function(err, html){
		response.send(html);
	});
});

app.get('/alarm', function(request, response){ // 클라이언트가 '/alarm' 경로로 요청 했을때 반응
	var isLogOn = false;
	if(request.session.authId) // 세션에 저장된 아이디가 있을 경우 로그인 유지
		isLogOn = true;
	if(isLogOn){
		AlarmWordConfirmQuery(request.session.authId, function(inputWord, inputPeriod){
			const data = {
				logOn : isLogOn,
				name : request.session.authId,
				word : inputWord,
				period : inputPeriod
			}
			response.render('alarm', data, function(err, html){
				response.send(html);
			});
		});
	} else {
		const data = {
			logOn : isLogOn,
			name : request.session.authId,
			word : "",
			period : 0
		}
		response.render('alarm', data, function(err, html){
				response.send(html);
		});
	}
});

app.post('/signUp', function(request, response){ // 클라이언트가 '/signUp' 경로로 요청 했을때 반응
	var isLogOn = false;
	SignUpQuery(request.body.inputId, request.body.inputPassword, request.body.inputEmail);
	const data = {
		logOn : isLogOn,
		name : request.session.authId
	}
	response.render('main', data, function(err, html){
		response.send(html);
	});
});

app.post('/signIn', function(request, response){ // 클라이언트가 '/signIn' 경로로 요청 했을때 반응
	SignInQuery(request.body.userId, request.body.userPassword, function(isSuccess){
		const data = {
			logOn : isSuccess,
			name : request.body.userId
		}
		// isLogOn = isSuccess;
		// logOnId = request.body.userId;
		
		request.session.authId = request.body.userId;
		request.session.save();

		response.render('main', data, function(err, html){
			
			if(!isSuccess)
				// response.send('<script type="text/javascript">alert("로그인 실패");</script>');
				console.log("로그인 실패");
			response.send(html);
		});
	});
	
});

app.post('/real', function(request, response){ // 클라이언트가 '/real' 경로로 요청 했을때 반응
	var isLogOn = false;
	if(request.session.authId) // 세션에 저장된 아이디가 있을 경우 로그인 유지
		isLogOn = true;
	const data = {
		logOn : isLogOn,
		name : request.session.authId
	}
	response.render('main', data, function(err, html){
		response.send(html);
	});
})

app.post('/realOut', function(request, response){ // 클라이언트가 '/real' 경로로 요청 했을때 반응
	var isLogOn = false;
	delete request.session.authId; // 세션에 등록된 아이디 삭제
	const data = {
		logOn : isLogOn,
		name : request.session.authId,
	}
	response.render('main', data, function(err, html){
		response.send(html);
	});
})

app.post('/search', function(request, response){ // 클라이언트가 '/search' 경로로 요청 했을때 반응
	var isLogOn = false;
	if(request.session.authId) // 세션에 저장된 아이디가 있을 경우 로그인 유지
		isLogOn = true;
	searchText = null;
	var testData = [];
	const data = {
		logOn : isLogOn,
		name : request.session.authId,
		datas : testData,
		text : searchText
	}
	response.render('search', data, function(err, html){
		response.send(html);
	});
})

app.post('/searchOut', function(request, response){ // 클라이언트가 '/searchOut' 경로로 요청 했을때 반응
	var isLogOn = false;
	searchText = null;
	delete request.session.authId; // 세션에 등록된 아이디 삭제
	var testData = [];
	const data = {
		logOn : isLogOn,
		name : request.session.authId,
		datas : testData,
		text : searchText
	}
	response.render('search', data, function(err, html){
		response.send(html);
	});
})

app.post('/searchRequest', function(request, response){ // 클라이언트가 '/searchRequest' 경로로 요청 했을때 반응
	var isLogOn = false;
	if(request.session.authId) // 세션에 저장된 아이디가 있을 경우 로그인 유지
		isLogOn = true;
	searchText = request.body.searchText;
	var testData = [];
	RequestSerach(request.body, testData, function(){
		const data = {
			logOn : isLogOn,
			name : request.session.authId,
			datas : testData,
			text : searchText
		}
		response.render('search', data, function(err, html){
			response.send(html);
		});
	});
})

app.post('/alarmOut', function(request, response){ // 클라이언트가 '/alarmOut' 경로로 요청 했을때 반응
	var isLogOn = false;
	delete request.session.authId; // 세션에 등록된 아이디 삭제
	const data = {
		logOn : isLogOn,
		name : request.session.authId,
		word : null,
		period : 0
	}
	response.render('alarm', data, function(err, html){
		response.send(html);
	});
})

app.post('/alarmAdd', function(request, response){ // 클라이언트가 '/alarmAdd' 경로로 요청 했을때 반응
	var isLogOn = false;
	if(request.session.authId) // 세션에 저장된 아이디가 있을 경우 로그인 유지
		isLogOn = true;
	var periodToint = Number(request.body.inputPeriod.substring(0, request.body.inputPeriod.length - 1));
	const data = {
		logOn : isLogOn,
		name : request.session.authId,
		word : request.body.inputWord,
		period : periodToint
	}
	AlarmAddQuery(request.session.authId, request.body.inputWord, request.body.inputPeriod, function(){
		response.render('alarm', data, function(err, html){
			response.send(html);
			StopCheckLoop();
			PatchWordForAlarm(StartCheckLoop);
		});
	});
	
});

app.post('/alarmRemove', function(request, response){ // 클라이언트가 '/alarmRemove' 경로로 요청 했을때 반응
	var isLogOn = false;
	if(request.session.authId) // 세션에 저장된 아이디가 있을 경우 로그인 유지
		isLogOn = true;
	const data = {
		logOn : isLogOn,
		name : request.session.authId,
		word : null,
		period : 0
	}
	AlarmWordDeleteQuery(request.session.authId, function(){
		response.render('alarm', data, function(err, html){
			response.send(html);
			StopCheckLoop();
			PatchWordForAlarm(StartCheckLoop);
		});
	})
});

function ToCsv(csvText, callback){ // 실시간 검색어 데이터를 csv 파일로 저장
	fs.writeFile('./hompage/t1.csv', csvText, function(err){
		if(err) throw err;
		callback();
	});
}

function Scraping(callback){ // 실시간 검색어 데이터를 naver 홈페이지에서 파싱하여 가져오는 함수
	var url = 'https://www.naver.com/';

	var realTimeKeywords = Array();
	var resultText = "id,value\n";

	requestURL(url, function(error, response, html){
		if(error){throw error};
		var $ = cheerio.load(html);
		
		const class_a = $('#PM_ID_ct');
		const class_b = class_a.children('.header').children('.section_navbar')
		.children('.area_hotkeyword').children('.ah_roll').children('.ah_roll_area').
		find("span");

		class_b.each(function(index, item){
			if(index % 2 != 0)
				realTimeKeywords.push($(this).text());
		})
		
		realTimeKeywordList = realTimeKeywords.slice();

		var temp = 5;
		var temp2 = 0;
		for(i = 0; i < realTimeKeywords.length; i++){
			if(temp > 0) temp -= 1;
			if(i==0){
				temp2 = 40000;
			} else {
				temp2 = 0;
			}
			resultText += realTimeKeywords[i] + ", " + (40000+temp2 - i * (2000) + temp*3000) + "\n";
		}
		callback(resultText);
	});
}

function RequestSerach(requestText, outputData, callback){ // 네이버 데이터랩 api를 사용하기 위해 요청하는 함수
	var request_body = {
	    "startDate": requestText.startDate,
	    "endDate": requestText.endDate,
	    "timeUnit": "week", // data, week, month
	    "keywordGroups": [
	        {
	            "groupName": requestText.searchText,
	            "keywords": [
	                requestText.searchText
	            ]
	        }
	    ],
	    "device": "pc",
	    "ages": [
	        "3"
	    ],
	    "gender": "m"
	};

	requestURL.post({ // 네이버 데이터랩 api 요청
        url: api_url,
        body: JSON.stringify(request_body),
        headers: {
            'X-Naver-Client-Id': client_id,
            'X-Naver-Client-Secret': client_secret,
            'Content-Type': 'application/json'
        }
    },
    function (error, response, body) {
        console.log(response.statusCode);
        var periodDatas = JSON.parse(body).results[0].data;
        for(var i = 0; i < Object.keys(periodDatas).length; i++){
        	outputData.push({x:periodDatas[i].period, y: periodDatas[i].ratio });
        }
        callback();
    });
}

function SignUpQuery(id, password, email){ // 회원가입 쿼리
	var sqlQuery = "INSERT INTO user (id, password, email) VALUES ('" + id + "', '" + password + "', '" + email + "')";
	connection.query(sqlQuery, function (err, result) {
	    if (err) throw err;
	});
}

function SignInQuery(id, password, callback){ // 로그인 쿼리
	var sqlQuery = "SELECT id, password FROM user WHERE id = '" + id + "' AND password = '" + password + "';";
	connection.query(sqlQuery, function (err, result) {
	    if (err) throw err;
	    if(Object.keys(result).length > 0){
	    	callback(true);
	    } else {
	    	callback(false);
	    }
	});
}

function AlarmAddQuery(id, word, period, callback){ // 알람 단어 등록 쿼리
	var periodToint = period.substring(0, period.length - 1);
	periodToint = Number(periodToint);

	var sqlQuery = "UPDATE user SET word='" + word + "', period=" + periodToint +" WHERE id='" + id + "';";
	connection.query(sqlQuery, function (err, result) {
	    if (err) throw err;
	    callback();
	});
}

function AlarmWordConfirmQuery(id, callback){ // 알람 단어를 확인하기 위한 쿼리
	var sqlQuery = "SELECT word, period FROM user WHERE id = '" + id + "';";
	connection.query(sqlQuery, function (err, result) {
	    if (err) throw err;
	    callback(result[0].word, result[0].period);
	});
}

function AlarmWordDeleteQuery(id, callback){ // 알람 단어 삭제 쿼리
	var sqlQuery = "UPDATE user SET word=NULL, period=NULL WHERE id= '" + id + "';";
	connection.query(sqlQuery, function (err, result) {
	    if (err) throw err;
	    callback();
	});
}

function Update(){ // 알람 단어를 지속적으로 확인하기 위한 함수
	if(isCheckRunning)
		CheckUserListForAlram();
}

function StartCheckLoop(){ // 알람 확인 관련 데이터 중복 수정을 막기 위한 함수
	isCheckRunning = true;
}

function StopCheckLoop(){ // 알람 확인 관련 데이터 중복 수정을 막기 위한 함수
	isCheckRunning = false;
}

function CheckUserListForAlram(){ // 알람 단어 남은 주기를 확인하는 함수
	for(var i = 0; i < alarmUserList.length; i++){
		alarmUserList[i].leftPeriod -= 1;
		if(alarmUserList[i].leftPeriod <= 0){
			var target = alarmUserList[i];
			Scraping(function(){
				CheckRealTimeKeywordList(target);  // 현재 실시간 검색어 순위에 등록된 단어가 있으면 메일을 보내는 함수
			});
			alarmUserList[i].leftPeriod = alarmUserList[i].period * 60;
		}
	}
}

function CheckRealTimeKeywordList(target){ // 현재 실시간 검색어 순위에 등록된 단어가 있으면 메일을 보내는 함수
	for(var i = 0; i < realTimeKeywordList.length; i++){
		if(realTimeKeywordList[i] == target.word){
			SendMail(target.email, target.word, (i+1) );
			return;
		}
	}
}

function SendMail(userMail, wordText, rank){ // 메일을 보내는 함수
	var mailOptions = {
		from: 'pyg100794@gmail.com',
		to: userMail,
		subject: "등록하신 단어가 실시간 검색 순위에 올랐습니다.",
		text: "실시간 검색어 " + rank + " 위: " + wordText + "\n http://13trend.oa.to"
	};

	transporter.sendMail(mailOptions, function(error, info){
		if (error) {
			console.log(error);
		} else {
			console.log('Email sent: ' + info.response);
		}
	});
}

function PatchWordForAlarm(callback){ // 데이터베이스에 저장된 등록된 알람 정보를 받아와서 alarmUserList에 저장하는 함수
	var sqlQuery = "SELECT id, email, word, period FROM user;"
	connection.query(sqlQuery, function (err, result) {
	    if (err) throw err;
	    for(var i = 0; i < Object.keys(result).length; i++){
	    	var index = ContainAlarmSetting(alarmUserList, result[i]);
      		if(result[i].period > 0){
      			if(index == -1){
      				alarmUserList.push({
	      				id : result[i].id,
	      				email : result[i].email,
	      				word : result[i].word,
	      				period : result[i].period,
	      				leftPeriod : Number(result[i].period) * 60
	      			});
      			} else {
      				alarmUserList[index].word = result[i].word;
      				alarmUserList[index].period = result[i].period;
      				alarmUserList[index].leftPeriod = result[i].period * 60;
      			}
      		} else {
      			alarmUserList.splice(index, 1);
      		}
	    }
	    callback();
	});
}

function ContainAlarmSetting(userList, target){ // 이미 등록된 단어인지 확인하는 함수
	for(var i = 0; i < Object.keys(userList).length; i++){
		if(userList[i].id == target.id)
			return i;
	}
	return -1;
}