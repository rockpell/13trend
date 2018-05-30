var express = require('express');
var app = express();
var fs = require('fs');

var server = app.listen(3000, function(){
    console.log("Express server has started on port 3000")
})

app.use(express.static(__dirname+'/hompage'));

app.get('/', function(request, response) {
	// Scraping(ToCsv);
	Scraping(function(text){
		ToCsv(text, function(){
			response.sendFile(__dirname + '/hompage/main.html');
		});
	});
});

function ToCsv(csvText, method){
	fs.writeFile('./hompage/t1.csv', csvText, function(err){
		if(err) throw err;
		console.log("File write completed");
		method();
	});
}

function Scraping(method){
	var cheerio = require('cheerio');
	var request = require('request');

	var url = 'https://www.naver.com/';

	var realTimeKeywords = Array();
	var resultText = "id,value\n";

	request(url, function(error, response, html){
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