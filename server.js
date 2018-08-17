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
	var title=request.body.title;
	var writer=request.body.writer;
	var content=request.body.content;

	pool.getConnection(function(error, con){
		if(error){
			console.log(error);
		}else{
			var sql="insert into board(title,writer,content) values(?,?,?)";
			
			con.query(sql,[title ,writer ,content], function(err, result){
				console.log(result);

				if(result.affectedRows==1){
					//클라이언트의 브라우저로 하여금, 지정한 url로 다시 
					//재접속!!
					response.redirect("/board/list");
				}else{
					response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
					response.end("<script>alert('등록실패');history.back()</script>");
				}
			});
		}
		con.release();//다시반납
	});
});

//글 목록 요청처리 
app.get("/board/list", function(request, response){
	response.render("comments/list");
});


server.listen(9999, function(){
	console.log("웹서버 9999포트에서 실행중....");
});
