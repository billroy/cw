

var opt = require('optimist');
var argv = opt.usage('Usage: $0 [flags]')
	.alias('p', 'port')
	.describe('p', 'port for the http server')
	.argv;

if (argv.help) {
	opt.showHelp();
	process.exit();
} 

var port;
if (process && process.env && process.env.PORT) port = process.env.PORT;
else port = argv.port | 3000;

var express = require('express');
var app = module.exports = express.createServer().listen(port);
var io = require('socket.io').listen(app);

app.configure(function () {
	app.use(express.logger());
	app.use(express.static(__dirname + '/public'));
});

app.get('/', function(req, res) {
	res.sendfile(__dirname + '/public/index.html');
});

io.sockets.on('connection', function (socket) {
	console.log('Client connected.');
	socket.on('startTX', function (data) {
		console.log('startTX:', data);
		io.sockets.emit('startTX', data);
	});
	socket.on('endTX', function (data) {
		console.log('endTX:', data);
		io.sockets.emit('endTX', data);
	});
	socket.on('ping', function(data) {
		console.log('ping', data);
		socket.emit('pong', data);
	});
});
