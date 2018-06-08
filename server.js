var express = require('express');
var session = require('express-session');
var app = express();
var fs = require('fs');
var bodyParser = require('body-parser');
var requestURL = require('request');
var cheerio = require('cheerio');
var nodemailer = require('nodemailer');

var client_id = 'zP4_7yKoudLDOkOsJsgU';
var client_secret = 'nd1Jp0tcCN';

var api_url = 'https://openapi.naver.com/v1/datalab/search';

var server = app.listen(3000, function(){
    console.log("Express server has started on port 3000")
})

var mysql      = require('mysql');
var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : '5427',
	database : 'mydb',
	port : 3306,
	charset : 'utf8'
});

// var connection = mysql.createConnection({
// 	host     : '35.192.50.205',
// 	user     : 'rockpell',
// 	password : '5427',
// 	database : 'mydb',
// 	port : 3306,
// 	charset : 'utf8'
// });

var transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'aythffk@gmail.com',
		pass: 'rock0147258#'
	}
});

var searchText = null;
// var logOnId = "";
// var isLogOn = false;
var isCheckRunning = false;

var realTimeKeywordList = Array();
var alarmUserList = Array();

connection.connect();

app.use(express.static(__dirname+'/hompage'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(session({
	secret : 'xik,mc[qw.jlkxcnmkusdbnfglksdnmflkj',
	resave : false,
	saveUninitialized : true
}));

app.set('view engine', 'ejs');
app.set('views', './hompage');

PatchWordForAlarm(function(){});
StartCheckLoop();
setInterval(Update, 1000);

app.get('/', function(request, response) {
	var isLogOn = false;
	if(request.session.authId)
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

app.get('/real', function(request, response){
	var isLogOn = false;
	if(request.session.authId)
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

app.get('/search', function(request, response){
	var isLogOn = false;
	if(request.session.authId)
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

app.get('/alarm', function(request, response){
	var isLogOn = false;
	if(request.session.authId)
		isLogOn = true;
	console.log("get alarm");
	if(isLogOn){
		AlarmWordConfirmQuery(request.session.authId, function(inputWord, inputPeriod){
			const data = {
				logOn : isLogOn,
				name : request.session.authId,
				word : inputWord,
				period : inputPeriod
			}
			console.log("inputWord : " + inputWord + " inputPeriod : " + inputPeriod );
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

app.post('/signUp', function(request, response){
	var isLogOn = false;
	console.log("signUp");
	console.log(request.body);
	SignUpQuery(request.body.inputId, request.body.inputPassword, request.body.inputEmail);
	const data = {
		logOn : isLogOn,
		name : request.session.authId
	}
	response.render('main', data, function(err, html){
		response.send(html);
	});
});

app.post('/signIn', function(request, response){
	console.log("signIn");
	console.log(request.body);
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

app.post('/real', function(request, response){
	var isLogOn = false;
	if(request.session.authId)
		isLogOn = true;
	console.log("real");
	const data = {
		logOn : isLogOn,
		name : request.session.authId
	}
	response.render('main', data, function(err, html){
		response.send(html);
	});
})

app.post('/realOut', function(request, response){
	var isLogOn = false;
	console.log("realOut");
	console.log(request.body);
	delete request.session.authId; // 세션에 등록된 아이디 삭제
	const data = {
		logOn : isLogOn,
		name : request.session.authId,
	}
	response.render('main', data, function(err, html){
		response.send(html);
	});
})

app.post('/search', function(request, response){
	var isLogOn = false;
	if(request.session.authId)
		isLogOn = true;
	console.log(request.body);
	console.log("search");
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
	console.log("render search");
})

app.post('/searchOut', function(request, response){
	console.log(request.body);
	console.log("searchOut");
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

app.post('/searchRequest', function(request, response){
	var isLogOn = false;
	if(request.session.authId)
		isLogOn = true;
	console.log(request.body);
	console.log("searchRequest");
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

app.post('/alarmOut', function(request, response){
	console.log("alarmOut");
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

app.post('/alarmAdd', function(request, response){
	var isLogOn = false;
	if(request.session.authId)
		isLogOn = true;
	console.log("alarmAdd");
	console.log(request.body);
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

app.post('/alarmRemove', function(request, response){
	var isLogOn = false;
	if(request.session.authId)
		isLogOn = true;
	console.log("alarmRemove");
	console.log(request.body);
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

function ToCsv(csvText, callback){
	fs.writeFile('./hompage/t1.csv', csvText, function(err){
		if(err) throw err;
		console.log("File write completed");
		callback();
	});
}

function Scraping(callback){
	var url = 'https://www.naver.com/';

	var realTimeKeywords = Array();
	var resultText = "id,value\n";

	requestURL(url, function(error, response, html){
		if(error){throw error};
		var $ = cheerio.load(html);
		// const class_a = $('#ah_roll_area PM_CL_realtimeKeyword_rolling', '#ah_roll PM_CL_realtimeKeyword_rolling_base', '#area_hotkeyword PM_CL_realtimeKeyword_base', '#area_navigation', '#section_navbar' ,'#PM_ID_ct');
		
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

function RequestSerach(requestText, outputData, callback){
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

	requestURL.post({
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

function SignUpQuery(id, password, email){
	var sqlQuery = "INSERT INTO user (id, password, email) VALUES ('" + id + "', '" + password + "', '" + email + "')";
	connection.query(sqlQuery, function (err, result) {
	    if (err) throw err;
	    // console.log(result);
	});
}

function SignInQuery(id, password, callback){
	var sqlQuery = "SELECT id, password FROM user WHERE id = '" + id + "' AND password = '" + password + "';";
	connection.query(sqlQuery, function (err, result) {
	    if (err) throw err;
	    // console.log(result);
	    if(Object.keys(result).length > 0){
	    	callback(true);
	    } else {
	    	callback(false);
	    }
	});
}

function AlarmAddQuery(id, word, period, callback){
	var periodToint = period.substring(0, period.length - 1);
	periodToint = Number(periodToint);

	var sqlQuery = "UPDATE user SET word='" + word + "', period=" + periodToint +" WHERE id='" + id + "';";
	connection.query(sqlQuery, function (err, result) {
	    if (err) throw err;
	    // console.log(result);
	    callback();
	});
}

function AlarmWordConfirmQuery(id, callback){
	var sqlQuery = "SELECT word, period FROM user WHERE id = '" + id + "';";
	connection.query(sqlQuery, function (err, result) {
	    if (err) throw err;
	    // console.log(result);
	    callback(result[0].word, result[0].period);
	});
}

function AlarmWordDeleteQuery(id, callback){
	var sqlQuery = "UPDATE user SET word=NULL, period=NULL WHERE id= '" + id + "';";
	connection.query(sqlQuery, function (err, result) {
	    if (err) throw err;
	    // console.log(result);
	    callback();
	});
}

function Update(){
	if(isCheckRunning)
		CheckUserListForAlram();
}

function StartCheckLoop(){
	isCheckRunning = true;
}

function StopCheckLoop(){
	isCheckRunning = false;
}

function CheckUserListForAlram(){
	for(var i = 0; i < alarmUserList.length; i++){
		alarmUserList[i].leftPeriod -= 1;
		if(alarmUserList[i].leftPeriod <= 0){
			var target = alarmUserList[i];
			Scraping(function(){
				CheckRealTimeKeywordList(target);
			});
			alarmUserList[i].leftPeriod = alarmUserList[i].period * 60;
		}
	}
	// console.log("CheckUserListForAlram");
	// console.log(alarmUserList);
}

function CheckRealTimeKeywordList(target){
	// console.log(target);
	for(var i = 0; i < realTimeKeywordList.length; i++){
		if(realTimeKeywordList[i] == target.word){
			SendMail(target.email, target.word, (i+1) );
			return;
		}
	}
}

function SendMail(userMail, wordText, rank){
	var mailOptions = {
		from: 'pyg100794@gmail.com',
		to: userMail,
		subject: "등록하신 단어가 실시간 검색 순위에 올랐습니다.",
		text: "실시간 검색어 " + rank + " 위: " + wordText
	};

	transporter.sendMail(mailOptions, function(error, info){
		if (error) {
			console.log(error);
		} else {
			console.log('Email sent: ' + info.response);
		}
	});
}

function PatchWordForAlarm(callback){
	var sqlQuery = "SELECT id, email, word, period FROM user;"
	connection.query(sqlQuery, function (err, result) {
	    if (err) throw err;
	    console.log(result);
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
	    console.log("PatchWordForAlarm");
	    console.log(alarmUserList);
	    callback();
	});
}

function ContainAlarmSetting(userList, target){
	for(var i = 0; i < Object.keys(userList).length; i++){
		if(userList[i].id == target.id)
			return i;
	}
	return -1;
}