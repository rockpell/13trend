var express = require('express');
var app = express();
var fs = require('fs');
var bodyParser = require('body-parser');
var requestURL = require('request');
var cheerio = require('cheerio');

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

var logOnId = "";
var isLogOn = false;

connection.connect();

app.use(express.static(__dirname+'/hompage'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.set('view engine', 'ejs');
app.set('views', './hompage');

app.get('/', function(request, response) {
	Scraping(function(text){
		ToCsv(text, function(){
			// response.sendFile(__dirname + '/hompage/main.html');
			const data = {
				logOn : isLogOn,
				name : logOnId
			}
			response.render('main', data, function(err, html){
				response.send(html);
			});
		});
	});
});

app.get('/real', function(request, response){
	Scraping(function(text){
		ToCsv(text, function(){
			// response.sendFile(__dirname + '/hompage/main.html');
			const data = {
				logOn : isLogOn,
				name : logOnId
			}
			response.render('main', data, function(err, html){
				response.send(html);
			});
		});
	});
	
});

app.get('/search', function(request, response){
	var testData = [];
	const data = {
		logOn : isLogOn,
		name : logOnId,
		datas : testData
	}
	response.render('search', data, function(err, html){
		response.send(html);
	});
});

app.get('/alarm', function(request, response){
	console.log("get alarm");
	if(isLogOn){
		AlarmWordConfirmQuery(logOnId, function(inputWord, inputPeriod){
			const data = {
				logOn : isLogOn,
				name : logOnId,
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
			name : logOnId,
			word : "",
			period : 0
		}
		response.render('alarm', data, function(err, html){
				response.send(html);
		});
	}
});

app.post('/signUp', function(request, response){
	console.log("signUp");
	console.log(request.body);
	SignUpQuery(request.body.inputId, request.body.inputPassword, request.body.inputEmail);
	const data = {
		logOn : isLogOn,
		name : logOnId
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
		isLogOn = isSuccess;
		logOnId = request.body.userId;
		response.render('main', data, function(err, html){
			
			if(!isSuccess)
				// response.send('<script type="text/javascript">alert("로그인 실패");</script>');
				console.log("로그인 실패");
			response.send(html);
		});
	});
	
});

app.post('/real', function(request, response){
	console.log("real");
	const data = {
		logOn : isLogOn,
		name : logOnId
	}
	response.render('main', data, function(err, html){
		response.send(html);
	});
})

app.post('/realOut', function(request, response){
	console.log("realOut");
	console.log(request.body);
	isLogOn = false;
	const data = {
		logOn : isLogOn,
		name : logOnId,
	}
	response.render('main', data, function(err, html){
		response.send(html);
	});
})

app.post('/search', function(request, response){
	console.log(request.body);
	console.log("search");
	var testData = [];
	const data = {
		logOn : isLogOn,
		name : logOnId,
		datas : testData
	}
	response.render('search', data, function(err, html){
		response.send(html);
	});
	console.log("render search");
})

app.post('/searchOut', function(request, response){
	console.log(request.body);
	console.log("searchOut");
	isLogOn = false;
	var testData = [];
	const data = {
		logOn : isLogOn,
		name : logOnId,
		datas : testData
	}
	response.render('search', data, function(err, html){
		response.send(html);
	});
})

app.post('/searchRequest', function(request, response){
	console.log(request.body);
	console.log("searchRequest");
	var testData = [];
	RequestSerach(request.body, testData, function(){
		const data = {
			logOn : isLogOn,
			name : logOnId,
			datas : testData
		}
		response.render('search', data, function(err, html){
			response.send(html);
		});
	});
})

// app.post('/alarm', function(request, response){
// 	console.log("alarm");
// 	const data = {
// 		logOn : isLogOn,
// 		name : logOnId,
// 		word : null,
// 		period : 0
// 	}
// 	response.render('Alarm', data, function(err, html){
// 		response.send(html);
// 	});
// })

app.post('/alarmOut', function(request, response){
	console.log("alarmOut");
	isLogOn = false;
	const data = {
		logOn : isLogOn,
		name : logOnId,
		word : null,
		period : 0
	}
	response.render('Alarm', data, function(err, html){
		response.send(html);
	});
})

app.post('/alarmAdd', function(request, response){
	console.log("alarmAdd");
	console.log(request.body);
	var periodToint = Number(request.body.inputPeriod.substring(0, request.body.inputPeriod.length - 1));
	const data = {
		logOn : isLogOn,
		name : logOnId,
		word : request.body.inputWord,
		period : periodToint
	}
	AlarmAddQuery(logOnId, request.body.inputWord, request.body.inputPeriod, function(){
		response.render('Alarm', data, function(err, html){
			response.send(html);
		});
	});
	
});

app.post('/alarmRemove', function(request, response){
	console.log("alarmRemove");
	console.log(request.body);
	const data = {
		logOn : isLogOn,
		name : logOnId,
		word : null,
		period : 0
	}
	AlarmWordDeleteQuery(logOnId, function(){
		response.render('Alarm', data, function(err, html){
			response.send(html);
		});
	})
});

function ToCsv(csvText, method){
	fs.writeFile('./hompage/t1.csv', csvText, function(err){
		if(err) throw err;
		console.log("File write completed");
		method();
	});
}

function Scraping(method){
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
			// console.log("index : " + index + " text : " + $(this).text());
			
		})
		var temp = 5;
		var temp2 = 0;
		for(i = 0; i < realTimeKeywords.length; i++){
			// console.log((i+1)+"st : " + realTimeKeywords[i]);
			if(temp > 0) temp -= 1;
			if(i==0){
				temp2 = 40000;
			} else {
				temp2 = 0;
			}
			resultText += realTimeKeywords[i] + ", " + (40000+temp2 - i * (2000) + temp*3000) + "\n";
		}
		method(resultText);
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
        // console.log(body);
        var periodDatas = JSON.parse(body).results[0].data;
        for(var i = 0; i < Object.keys(periodDatas).length; i++){
        	outputData.push({x:periodDatas[i].period, y: periodDatas[i].ratio });
        }
        callback();
    });
}

function QuerySend(){
	// var sqlQuery = "CREATE TABLE user(id varchar(20), password varchar(20), email varchar(30), word varchar(40), period INT, PRIMARY KEY(id))";
	// var sqlQuery = "INSERT INTO user (id, password, email) VALUES ('woodpell', '1234', 'aythffk@gmail.com')";
	// var sqlQuery = "UPDATE user SET word='아주긴 문자열이 필요한데 뭐가 좋을까', period=10 WHERE id='woodpell';";
	var sqlQuery = "SELECT * FROM user;"
	// delete from 테이블명  [where 검색조건] ; 	 
	connection.query(sqlQuery, function (err, result) {
	    if (err) throw err;
	    console.log(result);
	});
}

function SignUpQuery(id, password, email){
	var sqlQuery = "INSERT INTO user (id, password, email) VALUES ('" + id + "', '" + password + "', '" + email + "')";
	connection.query(sqlQuery, function (err, result) {
	    if (err) throw err;
	    console.log(result);
	});
}

function SignInQuery(id, password, callback){
	var sqlQuery = "SELECT id, password FROM user WHERE id = '" + id + "' AND password = '" + password + "';";
	connection.query(sqlQuery, function (err, result) {
	    if (err) throw err;
	    console.log(result);
	    console.log(Object.keys(result).length);
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
	    console.log(result);
	    callback();
	});
}

function AlarmWordConfirmQuery(id, callback){
	var sqlQuery = "SELECT word, period FROM user WHERE id = '" + id + "';";
	connection.query(sqlQuery, function (err, result) {
	    if (err) throw err;
	    console.log(result);
	    callback(result[0].word, result[0].period);
	});
}

function AlarmWordDeleteQuery(id, callback){
	var sqlQuery = "UPDATE user SET word=NULL, period=NULL WHERE id= '" + id + "';";
	connection.query(sqlQuery, function (err, result) {
	    if (err) throw err;
	    console.log(result);
	    callback();
	});
}