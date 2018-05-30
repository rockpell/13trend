var cheerio = require('cheerio');
var request = require('request');

var url = 'https://www.naver.com/';

var realTimeKeywords = Array();

request(url, function(error, response, html){
	if(error){throw error};

	// console.log(html);

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
	
	var result_text = "";

	for(i = 0; i < realTimeKeywords.length; i++){
		// console.log((i+1)+"st : " + realTimeKeywords[i]);
		result_text += realTimeKeywords[i] + ", " + (20000 - i * 970) + "\n";
	}
	console.log(result_text);
});