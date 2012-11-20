//
// index.js: run the morse server
//
//	Copyright 2012 Bill Roy (MIT License; see LICENSE file)
//

var Morse = require('./morseout.js');
var opt = require('optimist');
var argv = opt.usage('Usage: $0 [flags]')
	.alias('p', 'port')
	.describe('p', 'port for the http server')
	.alias('e', 'echo')
	.describe('e', 'echo server name or ip')
	.argv;

if (argv.help) {
	opt.showHelp();
	process.exit();
} 

var port;
var heroku;
if (argv.port) port = argv.port;
else if (process && process.env && process.env.PORT) {
	heroku = true;
	port = process.env.PORT;
}
else port = 3000;

var express = require('express');
var app = module.exports = express.createServer().listen(port);
var io = require('socket.io').listen(app);
var request = require('request');

app.configure(function () {
	//app.use(express.logger());
	app.use(express.bodyParser());
	app.use(express.static(__dirname + '/public'));
});

app.get('/', function(req, res) {
	res.sendfile(__dirname + '/public/index.html');
});

app.post('/tx', function(req, res) {
	//console.log('post:', req.body);
	startMorseFeed(req.body);
	res.send('OK');
});

// for heroku,
// per https://devcenter.heroku.com/articles/using-socket-io-with-node-js-on-heroku
if (1 || heroku) {
	io.configure(function () { 
		io.set("transports", ["xhr-polling"]); 
		io.set("polling duration", 10); 
	});
}
io.set('log level', 1);

io.sockets.on('connection', function (socket) {
	//console.log('Client connected via', socket.transport);
	socket.on('stx', function (data) {
		//console.log('stx:', data);
		if (echoserver) sendUpstream('stx', data);
		else io.sockets.emit('stx', data);
	});
	socket.on('etx', function (data) {
		//console.log('etx:', data);
		if (echoserver) sendUpstream('etx', data);
		else io.sockets.emit('etx', data);
	});
	socket.on('send', function (data) {
		startMorseFeed(data);
	});
	socket.on('ping', function(data) {
		if (echoserver) sendUpstream('pong', data);
		else socket.emit('pong', data);
	});
});


//////////
//
//	Upstream echo server
//
var net = require('net');
var echoserver;
var echoport = 5000;
var input_buffer = '';

if (argv.echo) {
	console.log('Connecting to echo server:', argv.echo, echoport);
	echoserver = net.connect(echoport, argv.echo, function() {
		console.log('Connected to echo server:', argv.echo, echoserver.address().port);
		echoserver.on('data', function(datatext) {
			input_buffer += ('' + datatext);

			for (;;) {					// de-concatenate json packets
				if ((input_buffer.length > 0) && (input_buffer.charAt(0) != '{')) {
					console.log('Echo server frame error:', input_buffer);
					input_buffer = '';
					return;
				}
				var m = input_buffer.match(/\}/);
				if (!m) return;
				var topchunk = input_buffer.slice(0, m.index + 1);
				input_buffer = input_buffer.slice(m.index + 1);

console.log('echo:', topchunk, input_buffer);

				var data = JSON.parse(topchunk);
				var cmd = data.cmd;
				delete data.cmd;			
				if (cmd == 'stx') io.sockets.emit('stx', data);
				else if (cmd == 'etx') io.sockets.emit('etx', data);
				else if (cmd == 'pong') io.sockets.emit('pong', data);
				else console.log('Unknown command from upstream:', cmd, data);
			}
		});
	});
}

function sendUpstream(cmd, data) {
	data.cmd = cmd;
	echoserver.write(JSON.stringify(data));
}


//////////
//
//	Output messages
//
function morseOn() {
	io.sockets.emit('stx', {frequency: this.frequency, color:'white'});
}

function morseOff() {
	io.sockets.emit('etx', {frequency: this.frequency});
}


function startMorseFeed(data) {

	//console.log('send:', data);
	if (data.text && data.text.match(/^http|https\:\/\//)) {
		request(data.text, function (error, response, body) {
			if (error || response.statusCode != 200 || !body) {
				console.log('Request error:', error);
				if (response) console.log(response.statusCode);
				if (body) console.log(body.length);
				return;
			}
			data.text = response.body;
			new Morse.Morse(data, morseOn, morseOff);
		});
	}
	else if (data.text && data.text.match(/^feed\:\/\//)) {
		var spread_articles = false;	// true for one cw feed per article
		var feed = require('feed-read');
		var feedname = data.text.replace(/^feed\:\/\//, 'http://');
		feed(feedname, function (error, articles) {
			if (error || !articles) {
				console.log('Feed error:', error);
				if (articles) console.log(articles.length);
				return;
			}
			var output = [];
			for (var a=0; a<articles.length; a++) {
				data.text = [
					articles[a].name, ' - ',
					articles[a].title, ' - ',
					articles[a].content, ' - - - '
				].join('');
				if (spread_articles) {
					new Morse.Morse(data, morseOn, morseOff);
					data.frequency += 1000;
				}
				else output.push(data.text);
			}
			if (!spread_articles) {
				data.text = output.join('');
				new Morse.Morse(data, morseOn, morseOff);
			}
		});
	}

	else {
		new Morse.Morse(data, morseOn, morseOff);
	}
}
