const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const path = require('path');
const fs = require('fs');

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  socket.on('updateSession', (data) => {
    console.log("Connection!");
    if (typeof socket['sessionID'] == "undefined") {
      socket['sessionID'] = data.split("~")[0].replace(" ", "");
    }
    socket.emit('echo', {
      message: data
    });
    if (!fs.existsSync('sessions/' + socket['sessionID'] + "/session")) {
      fs.mkdirSync('sessions/' + socket['sessionID']);
    }
    fs.writeFile('sessions/' + socket['sessionID'] + "/session", data, function(err) {
      if (err) throw err;
      console.log('Saved!');
    });
  });

  socket.on('getSession', (data) => {
    console.log("Connection-Recieve!");
    socket['sessionID'] = data;
    fs.readFile('sessions/' + data.split("~")[0].replace(" ", "") + "/session", "utf8", function read(err, data) {
      if (err) {
        console.log("ID doesn't exist!");
        return;
      }
      const content = data;
      socket.emit('recieveSession', {
        message: content
      });
    });

  });


  socket.on('disconnect', function() {
    console.log('session disconnected');
    if (!socket['sessionID']) {
      return;
    }
    fs.unlink("sessions/" + socket['sessionID'] + "/session", function(err) {
      if (err) throw err;
      console.log('Disconnected-1!');
    });
    fs.rmdir("sessions/" + socket['sessionID'], function(err) {
      if (err) throw err;
      socket['sessionID'] = "";
      console.log('Disconnected-2!');
    });
  });

});

server.listen(3000, function() {
  console.log('Server listening at port %d', 3000);
});
var jsonBody = "";
var foreachI = 0;
app.get('/api', (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  fs.readdir("sessions/", (err, files) => {
    files.forEach(file => {
      if (file == "file") { return; }
      fs.readFile('sessions/' + file + "/session", "utf8", function read(err, data) {
        if (err) {
          console.log("ID doesn't exist!");
          return;
        }
        if ((files.length - 2) == foreachI) {
          jsonBody += "{\"id\":\"" + file + "\", \"animeID\": \"" + data.split("~")[1] + "\", \"season\":\"" + data.split("~")[2] + "\", \"episode\":\"" + data.split("~")[3] + "\"}";
          foreachI++;
          return;
        }
        jsonBody += "{\"id\":\"" + file + "\", \"animeID\": \"" + data.split("~")[1] + "\", \"season\":\"" + data.split("~")[2] + "\", \"episode\":\"" + data.split("~")[3] + "\"},";
        foreachI++;
      });
    });
  });
  let body = '{"results": [' + jsonBody + ']}';
  foreachI = 0;
  jsonBody = "";
  res.send(body)
})
