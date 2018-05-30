var request = require('request');

var client_id = 'zP4_7yKoudLDOkOsJsgU';
var client_secret = 'nd1Jp0tcCN';

var api_url = 'https://openapi.naver.com/v1/datalab/search';
var request_body = {
    "startDate": "2018-02-01",
    "endDate": "2018-03-23",
    "timeUnit": "week",
    "keywordGroups": [
        {
            "groupName": "레드벨벳",
            "keywords": [
                "레드벨벳",
                "redvelvet"
            ]
        }
    ],
    "device": "pc",
    "ages": [
        "3"
    ],
    "gender": "m"
};

request.post({
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
        console.log(body);
    });