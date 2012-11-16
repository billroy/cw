//
// index.js: run the morse server
//
//	Copyright 2012 Bill Roy (MIT License)
//

var Morse = require('./morseout.js');
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
if (argv.port) port = argv.port;
else if (process && process.env && process.env.PORT) port = process.env.PORT;
else port = 3000;

var express = require('express');
var app = module.exports = express.createServer().listen(port);
var io = require('socket.io').listen(app);
var request = require('request');

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
	socket.on('send', function (data) {
		console.log('send:', data);
		if (data.text && data.text.match(/^http|https\:\/\//)) {
			request(data.text, function (error, response, body) {
				if (error || response.statusCode != 200 || !body) {
					console.log('Request error:');
					console.log(error);
					if (response) console.log(response.statusCode);
					if (body) console.log(body.length);
					return;
				}
				data.text = response.body;
console.log('Body:', data);
				new Morse.Morse(io, data);
			});
		}
		else {
			new Morse.Morse(io, data);
		}
	});
	socket.on('ping', function(data) {
		console.log('ping', data);
		socket.emit('pong', data);
	});
});

if (0) {
var m1 = new Morse.Morse(io, {
	frequency: 7029000,
	text: 'cqcqcq cqcqcq cqcqcq de w1aw w1aw w1aw k',
	wpm: 15,
	repeat: true
});
}