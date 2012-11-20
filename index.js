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
		io.sockets.emit('stx', data);
	});
	socket.on('etx', function (data) {
		//console.log('etx:', data);
		io.sockets.emit('etx', data);
	});
	socket.on('send', function (data) {
		startMorseFeed(data);
	});
	socket.on('ping', function(data) {
		socket.emit('pong', data);
	});
});

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
