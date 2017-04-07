// Initialize Express
var express = require("express");
var app = express();
app.use(express.static(__dirname + '/static'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
  res.render('index');
});

var server = app.listen(8000, function() {
  console.log("listening on port 8000");
});

var io = require('socket.io').listen(server);
var users = [];
var messageLog = [];

function checkTime(i) {
  if(i < 10) {
    i = "0" + i;
  }
  return i;
}

function timestamp() {
  var time = new Date();
  return `${time.getHours()}:${checkTime(time.getMinutes())}:${checkTime(time.getSeconds())}`
}

io.sockets.on('connection', function(socket){
  console.log("Connection established with", socket.id);
  socket.on("new_user", function(data) {
    users.push([socket.id, data.name]);
    for(var i = 0; i < messageLog.length; i++) {
      socket.emit("message", messageLog[i]);
    }
    socket.emit("new_connect", {timestamp: timestamp(), contents:`Welcome ${data.name}!`, users:users});
    socket.broadcast.emit("new_connect", {timestamp: timestamp(), contents:`${data.name} has joined the channel.`, users:users});
  });
  socket.on("send_message", function(data) {
    messageLog.push(data);
    if(data.contents == "admin") {
      console.log(users );
    }
    io.emit("message", {timestamp: data.timestamp, sender: data.sender, contents: data.contents});
  });
  socket.on('disconnect', function() {
    console.log(socket.id, "has disconnected");
    var username = "";
    for(var i = 0; i < users.length; i++) {
      if(users[i][0] == socket.id) {
        username = users[i][1];
        users.splice(i, 1);
        break;
      }
    }
    console.log("disconnected:", username, users.length, "users");
    io.emit("lost_user", {timestamp: timestamp(), contents: `${username} has disconnected.`, users:users});
  });
});
