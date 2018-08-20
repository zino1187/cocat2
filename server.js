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
					//재접속!! , 요청 끊어짐...
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
	
	pool.getConnection(function(error, con){
		//부모에 딸려있는 코멘트 게시물의 갯수도 같이 가져옴...
		var sql="select b.board_id, title, writer, date_format(regdate,'%Y-%m-%d') as regdate, count(comments_id) as cnt";
		sql+=" from board b left outer join comments c";
		sql+=" on b.board_id=c.board_id group by b.board_id,title,writer,regdate";
		
		console.log(sql);

		con.query(sql, function(err, result, fields){
			
			console.log(result);

			response.render("comments/list",{
				rows:result
			});
			con.release();
		});

	});
});

//상세보기 요청 처리 
app.get("/comments/detail", function(request, response){
	console.log(request.query);//{ board_id: '1' }	
	var board_id=request.query.board_id;

	pool.getConnection(function(error, con){
		var sql="select * from board where board_id=?";

		con.query(sql, [board_id], function(err,result,fields){
			if(err){
				console.log(err);
			}else{
				console.log(result);
				
				//현재 보고있는 글의 자식 코멘트 글의 목록 가져오기 
				sql="select * from comments where board_id=?";
				con.query(sql, [board_id] , function(e, result2, fields2){
					if(e){
						console.log(e);
					}else{
						response.render("comments/content", {
							row:result[0],
							rows:result2
						});
					}
				});
			}
			con.release();
		});
	});

	
});

//댓글 등록 요청 처리 
app.post("/comments/regist", function(request, response){
	console.log(request.body);

	pool.getConnection(function(error, con){
		var sql="insert into comments(msg,board_id) values(?,?)";	
		con.query(sql, [request.body.msg,request.body.board_id], function(err, result){
			var data;
			if(err){
				console.log(err);
				data="{\"result\":"+result.affectedRows+"}";
			}else{
				data="{\"msg\": \""+request.body.msg+"\",\"result\":"+result.affectedRows+"}";
			}
			response.writeHead(200,{"Content-Type":"text/json"});
			response.end(data);
			con.release();
		});	
	});

});

//게시물 삭제 (원글이 삭제되면, 자식글도 함께 삭제...)
//트랜잭션 상황...
app.post("/board/delete", function(request, response){
	var board_id=request.body.board_id;
	console.log(board_id);

	
	pool.getConnection(function(error, con){
		con.beginTransaction(function(e){
			if(e){
				console.log(e);
			}else{
				var sql="delete from board where board_id=?";
				con.query(sql,[board_id], function(err, result){
					if(err){
						console.log(err);
					}else{
						//부모글이 삭제되었으므로, 자식글 삭제하겟다!!
						sql="delete from comments where board_id=?";
						con.query(sql,[board_id], function(err2, result2){
							if(err2){
								console.log(err2,"트랜잭션 롤백하겠슴");
								con.rollback(function(err3){
									if(err3){
										console.log("롤백실패");
									}else{
										console.log("롤백완료,부모글 삭제 취소");
									}
								});
							}else{
								console.log("트랜잭션 확정 짓겠음");
								con.commit(function(err4){
									if(err4){
										console.log(err4,"커밋 실패");
									}else{
										console.log("커밋 성공");
										response.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});
										response.end("<script>alert('삭제완료');location.href='/board/list';</script>");
									}
								});
							}
						});
					}
				});
				con.release();
			}
		});	
	});
});


server.listen(9999, function(){
	console.log("웹서버 9999포트에서 실행중....");
});
