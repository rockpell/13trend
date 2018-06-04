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
				logOn : false,
				name : "first"
			}
			response.render('main', data, function(err, html){
				response.send(html);
			});
		});
	});
});

app.get('/real', function(request, response){
	const data = {
		logOn : false,
		name : "rockpell"
	}
	Scraping(function(text){
		ToCsv(text, function(){
			// response.sendFile(__dirname + '/hompage/main.html');
			const data = {
				logOn : false,
				name : "first"
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
		logOn : false,
		name : "rockpell",
		datas : testData
	}
	response.render('search', data, function(err, html){
		response.send(html);
	});
});

app.get('/alarm', function(request, response){
	const data = {
		logOn : false,
		name : "rockpell"
	}
	response.render('alarm', data, function(err, html){
		response.send(html);
	});
});

app.post('/real', function(request, response){
	console.log("real");
	const data = {
		logOn : false,
		name : "rockpell"
	}
	response.render('main', data, function(err, html){
		response.send(html);
	});
})

app.post('/realIn', function(request, response){
	console.log(request.body);
	const data = {
		logOn : true,
		name : request.body.userId,
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
		logOn : false,
		name : "rockpell",
		datas : testData
	}
	response.render('search', data, function(err, html){
		response.send(html);
	});
	console.log("render search");
})

app.post('/searchIn', function(request, response){
	console.log(request.body);
	console.log("searchIn");
	var testData = [];
	const data = {
		logOn : true,
		name : request.body.userId,
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
			logOn : false,
			name : "rockpell",
			datas : testData
		}
		response.render('search', data, function(err, html){
			response.send(html);
		});
	});
})

app.post('/searchRequestIn', function(request, response){
	console.log(request.body);
	console.log("searchRequest");
	var testData = [];
	RequestSerach(request.body, testData, function(){
		const data = {
			logOn : true,
			name : "rockpell",
			datas : testData
		}
		response.render('search', data, function(err, html){
			response.send(html);
		});
	});
})

app.post('/alarm', function(request, response){
	const data = {
		logOn : false,
		name : "this is text"
	}
	response.render('Alarm', data, function(err, html){
		response.send(html);
	});
})

app.post('/alarmIn', function(request, response){
	const data = {
		logOn : true,
		name : request.body.userId
	}
	response.render('Alarm', data, function(err, html){
		response.send(html);
	});
})

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