var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '5427',
  database : 'mydb',
  port : 3306,
  charset : 'utf8'
});

// var sqlQuery = "CREATE TABLE user(id varchar(20), password varchar(20), email varchar(30), word varchar(40), period INT, PRIMARY KEY(id))";
// var sqlQuery = "INSERT INTO user (id, password, email) VALUES ('rockpell', '1134', 'ffk@gmail.com')";
// var sqlQuery = "UPDATE user SET word='아주긴 문자열이 필요한데 뭐가 좋을까', period=10 WHERE id='woodpell';";
// var sqlQuery = "SELECT id, password FROM user WHERE id = 'rockpell' AND password = '1134';"
// var sqlQuery = "SELECT * FROM user;"
var sqlQuery = "UPDATE user SET word=NULL, period=NULL WHERE id='rockpell';";

connection.connect();
 
connection.query(sqlQuery, function (err, result) {
    if (err) throw err;
    console.log(result);
    // console.log(Object.keys(result).length);
    // console.log(result[0].id);
    // console.log(result[0].password);
    connection.end();
  });