var _this = this;
var app = require('express')();
var http = require('http').Server(app);
var nodehttp = require('http');
var https = require('https');
var io = require('socket.io')(http);
var request = require('request');
var db = require('odbc')();
var users = {};
var fs = require('fs');
var ioclient = require('socket.io-client')('http://localhost:33333');
var socketio_port = '33333';
var middleware_notify_port = '23456';
var sensehostname = 'win-6mdp3q63fnj';
var middleware_hostname = sensehostname;
var NotifyAppName = 'Breaking Bad';
var reloadtask_id;
var appid;
var appName;
var certificate = "C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\"+sensehostname+"\\client.pem";
var reloadinfo = {};


//////Get Task ID from Task Name /////////////
		var taskname = 'Reload Breaking Bad'// data.taskname
		//console.log(taskname)

		var getReloadTaskId_options = {
		  rejectUnauthorized: false,
		  hostname: sensehostname,
		  port: 4242,
		  path: '/qrs/task?xrfkey=abcdefghijklmnop&filter=name eq \''+taskname+'\'',
		  uri: 'https://'+sensehostname+':4242/qrs/task?xrfkey=abcdefghijklmnop&filter=name eq \''+taskname+'\'',
		  method: 'GET',
		  headers: {
		        'X-Qlik-xrfkey' : 'abcdefghijklmnop',
		        'X-Qlik-User' : 'UserDirectory='+sensehostname+'; UserId=qlik'
		    },
		  key: fs.readFileSync(certificate),
		  cert: fs.readFileSync(certificate)
		};



		// var deleteReloadTask_options = {
		//   rejectUnauthorized: false,
		//   hostname: sensehostname,
		//   port: 4242,
		//   path: '/qrs/task?xrfkey=abcdefghijklmnop&filter=name eq \''+taskname+'\'',
		//   uri: 'https://'+sensehostname+':4242/qrs/task?xrfkey=abcdefghijklmnop&filter=name eq \''+taskname+'\'',
		//   method: 'GET',
		//   headers: {
		//         'X-Qlik-xrfkey' : 'abcdefghijklmnop',
		//         'X-Qlik-User' : 'UserDirectory='+sensehostname+'; UserId=qlik'
		//     },
		//   key: fs.readFileSync(certificate),
		//   cert: fs.readFileSync(certificate)
		// };

        var reload_task_options;

		request.get(getReloadTaskId_options, function optionalCallback (err, httpResponse, body) {
		  if (err) {
		    return console.error('task get failed:', err);
		     } else {
		      //console.log(body);
				var resp = JSON.parse(httpResponse.body)
				//console.log(resp)
				reloadtask_id = resp[0].id;
				reloadinfo.reloadtask_id = reloadtask_id

				// var reload_task_options = {
				//   rejectUnauthorized: false,
				//   hostname: sensehostname,
				//   port: 4242,
				//   path: '/qrs/task/'+reloadtask_id+'/start?xrfkey=abcdefghijklmnop',
				//   method: 'POST',
				//   headers: {
				//         'X-Qlik-xrfkey' : 'abcdefghijklmnop',
				//         'X-Qlik-User' : 'UserDirectory='+sensehostname+'; UserId=qlik'
				//     },
				//   key: fs.readFileSync(certificate),
				//   cert: fs.readFileSync(certificate)
				// };

				// //Do the Reload:
				// https.get(reload_task_options, function(res) {
			 //      console.log("Got response: " + res.statusCode);
			 //      res.on("data", function(chunk) {
			 //        //console.log("BODY: " + chunk);
			 //      });
			 //    }).on('error', function(e) {
			 //      console.log("Got error: " + e.message);
			 //    });
			       // res.send({'Status': res.statusCode,
			 //       // 'StatusMsg': 'Reload Kicked Off'})

				// console.log(reload_task_options)
		     }
		    //console.log(httpResponse);
		});

//For Socket.io
app.get('/', function(req, res){
  res.sendFile('/index.html', { root: 'C:\\Users\\qlik\\Documents\\Extension-work\\AppChat-Node' });
});

//Create a notification service listener on sense server
var sense_notification_options = {
  method: 'POST',
  hostname: sensehostname,
  port: 4242,
  rejectUnauthorized: false,
  path: '/qrs/notification?xrfkey=abcdefghijklmnop&name=executionresult',
  headers: {
        'X-Qlik-xrfkey' : 'abcdefghijklmnop',
        'X-Qlik-User' : 'UserDirectory='+sensehostname+'; UserId=qlik',
        'Content-Type' : 'application/json'//,
  		// 'Accept' : 'application/json',
  		// 'Accept-Charset' : 'utf-8;q=0.9, us-ascii;q=0.1, iso-8859-1'
  },
  key: fs.readFileSync(certificate),
  cert: fs.readFileSync(certificate)
}

var post_data = '"http://localhost:23456"';

var post_req = https.request(sense_notification_options, function(res) {
	res.setEncoding('utf8');
	res.on('data', function (chunk) {
		console.log('Response: '+ chunk);
	})
});

post_req.write(post_data);
post_req.end();

// https.get(sense_notification_options, function(res) {
// 	// console.log(res)
//   res.on("data", function(chunk) {
//   	console.log(chunk.toString())
//     //var chunkjson = JSON.parse(chunk);
//      //appname=chunkjson.name;
//      //console.log(res)
//      //console.log(appname)	
// 	 });
// }).on('error', function(e) {
// 	//console.log("Got error: " + e.message);
// });   

// request.post(sense_notification_options, function optionalCallback (err, httpResponse, body) {
//   if (err) {
//     return console.error('notification subscription creation failed:', err);
//      } else {
//     	console.log(httpResponse.body);
//     }
//   });

io.on('connection', function(socket){
	console.log('got a connection')
	var appname;
	
	socket.on('new appuser', function(data, callback) {
		console.log(data.appid);
		appid=data.appid;
		var appname_options = {
	        rejectUnauthorized: false,
	        hostname: sensehostname,
	        port: 4242,
	        path: '/qrs/app/'+data.appid+'?xrfkey=abcdefghijklmnop',
	        method: 'GET',
	        headers: {
	              'X-Qlik-xrfkey' : 'abcdefghijklmnop',
	              'X-Qlik-User' : 'UserDirectory='+sensehostname+'; UserId=qlik'
	            },
	       key: fs.readFileSync(certificate),
	       cert: fs.readFileSync(certificate)
	    };

	      https.get(appname_options, function(res) {
	          res.on("data", function(chunk) {
	            var chunkjson = JSON.parse(chunk);
	             appname=chunkjson.name;
	             //console.log(res)
	             //console.log(appname)	
	        	 });
	      }).on('error', function(e) {
	      	//console.log("Got error: " + e.message);
	      });    
	});

	socket.on('reload app', function(data, callback) {

///////////////////////////////////// Get the Task Id To Reload ////////////////////////////
		var taskname = 'Reload Breaking Bad'// data.taskname
		//console.log(taskname)

//Write to Aster:
db.open("DSN=Beehive;DATABASE=beehive; UID=db_superuser; PWD=db_superuser", function(err) {
        if (err) {
          console.log(err);
          socket.emit('reload status',err)
        }
           var ins = "Update BreakingBadParam set tvshow ='"+data.tvshow+"', minswindow="+data.minutes;

            console.log(ins);

	           db.query(ins, function (err) {
	        	   if (err) {
	        	   	//return 
	        	   	res.send({error: 400}); 
                }
                 
	           }) ;
	    db.close(function(){});  
        //socket.emit('reload status','Param written')
        console.log(ins)
       });

        var reload_task_options;
        
		request.get(getReloadTaskId_options, function optionalCallback (err, httpResponse, body) {
		  if (err) {
		    return console.error('task get failed:', err);
		     } else {
		        //console.log(body);
				var resp = JSON.parse(httpResponse.body)
				//console.log(resp)
				reloadtask_id = resp[0].id;
				reloadinfo.reloadtask_id = reloadtask_id

				var reload_task_options = {
				  rejectUnauthorized: false,
				  hostname: sensehostname,
				  port: 4242,
				  //path: 'qrs/task/start/synchronous?name=Reload Breaking Bad&xrfkey=abcdefghijklmnop',
				  path: '/qrs/task/'+reloadtask_id+'/start?xrfkey=abcdefghijklmnop',
				  method: 'POST',
				  headers: {
				        'X-Qlik-xrfkey' : 'abcdefghijklmnop',
				        'X-Qlik-User' : 'UserDirectory='+sensehostname+'; UserId=qlik',
				        'Content-Type' : 'application/json;charset=UTF-8'
				    },
				  key: fs.readFileSync(certificate),
				  cert: fs.readFileSync(certificate),
				  body:''

				};

				//Do the Reload:
				https.get(reload_task_options, function(res) {
			      //console.log("Got response: " + res.statusCode);
			      res.on("data", function(chunk) {
			        //console.log("BODY: " + chunk);
			      });
			    }).on('error', function(e) {
			      console.log("Got error: " + e.message);
			    });
			       // res.send({'Status': res.statusCode,
			       // 'StatusMsg': 'Reload Kicked Off'})
			    socket.emit('reload status', 'Reload Status: Submitted');
				console.log(reload_task_options)
		     }
		    //console.log(httpResponse);
		});

		///////////////////////////////////// Done Getting Task Id To Reload ////////////////////////////
	})

	socket.on('reload status', function(data, callback) {
		console.log('reload status socket triggered')
		console.log(data)
		socket.emit('reload status',data)
	});

});

http.listen(socketio_port, function(){
  console.log('listening on *:'+socketio_port);
});



///////// Sense Notification Service listener - listens for incoming requests
nodehttp.createServer(function (req, res) {
    var body = '';

    req.on('data', function(chunk) {
                 body += chunk;
    });

    req.on('end', function() {

		//socket.emit('private message', { user: 'me', msg: 'whazzzup?' });
       //console.log(JSON.parse(body));
       var notification = JSON.parse(body);
       var id = notification[0].objectID;
       var type = notification[0].objectType;

       //Get the data about that result and log it out, options seen above as well, but overridden here.
        var exec_result_options = {
          rejectUnauthorized: false,
          hostname: sensehostname,
          port: 4242,
          path: '/qrs/executionresult/'+id+'?xrfkey=abcdefghijklmnop',
          method: 'GET',
          headers: {
                'X-Qlik-xrfkey' : 'abcdefghijklmnop',
                'X-Qlik-User' : 'UserDirectory='+sensehostname+'; UserId=qlik'
            },
         key: fs.readFileSync(certificate),
         cert: fs.readFileSync(certificate)
        };
    console.log('id: '+id+' and reloadtask_id: '+reloadtask_id)
      https.get(exec_result_options, function(res) {
        //console.log(res)

	          res.on("data", function(chunk) {
	            //console.log(chunk)

	            var chunkjson = JSON.parse(chunk);
	            
		             console.log(chunkjson);
		            
		            var status = chunkjson.status;
		            var taskStartTime= chunkjson.startTime
		            var taskStopTime= chunkjson.stopTime
		            var statustext = '';
		            //console.log(status);
		            if (status===1) {
		                var statustext = 'Task Reload Started'
		            } else if (status ===3) {
		                var statustext = 'Task Reload Succeeded'
		            } else if (status ===4) {
		                var statustext = 'Task Reload Failed'
		            }
///// IF IT'S MY TASK ID LOG INFORMATION ABOUT THE EXECUTION RESULT		            
                    if (chunkjson.taskID === reloadtask_id) { 

		            console.log(statustext);
		            console.log('start time: '+taskStartTime);
		            console.log('stop time: '+taskStopTime);

		   //          var sockety = ioclient.connect('localhost', {
					//     port: 33333
					// });
					console.log('trying to emit reload status');
					io.sockets.emit('reload status', statustext);
					ioclient.emit('reload status', statustext);

		            // sockety.on('connect', function (err) {
		            // 	if (err) {console.log(err)} 
		            // 	console.log("socket connected"); 
		            	
		            // });

		            } else {
				    	console.log('got status but its not mine, it was '+id)
				    }      

	           });
	      }).on('error', function(e) {
	      	console.log("Got error: " + e.message);
	      });     
    });

    res.writeHead(200, {'Content-Type': 'text/plain'});
}).listen(middleware_notify_port);


console.log('Notification Server running at 0.0.0.0:'+middleware_notify_port); 


//Reload Execution
