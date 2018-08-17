var http=require("http");
var express=require("express");
var bodyParser=require("body-parser");
var mysql=require("mysql");


var app=express();
var server=http.createServer(app);

//각종 미들웨어 및 기타 설정
app.use(express.static(__dirname+"/views"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.set("view engine","ejs"); //include 가능 & fs.readFile() + ejs.render()

//풀 사용 
var pool=mysql.createPool({
	host:"localhost",
	user:"root",
	password:"",
	database:"cocat"
});

//커맨트 원글 등록 요청 
app.post("/board/write", function(request, response){
	pool.getConnection(function(error, con){
		if(error){
			console.log(error);
		}
		console.log(con);
	});
});


server.listen(9999, function(){
	console.log("웹서버 9999포트에서 실행중....");
});
