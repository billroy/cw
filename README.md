# CW

CW is a virtual software-defined radio for morse code practice.

CW works like an internet chat server for morse code: you can send and receive code between separate browsers connected to the server.  It simulates the on-the-air experience over your local network.  (Performance over the open internet is currently poor due to the impact of network path latency jitter.)

The user interface is a simple digital CW radio.  You can send morse using the shift key or by clicking or touching the onscreen transmit button.  You can tune to different frequencies.  There is an FFT spectrum display so you can see signals nearby, and a spectrum waterfall so you can follow recent transmissions.

There is a feature for sending practice text; you can send multiple practice texts at once on different frequencies to simulate busy band conditions.

Runs on Safari and Chrome, and the other browsers when they support HTML5 Audio and SVG.  

On iPad you can transmit and see the waterfall, but not receive.  On iPhone, no dice.

### Install and Run

You need Node (http://nodejs.org) and Git (http://git-scm.com)

	> git clone http://github.com/billroy/cw
	> cd cw
	> npm install
	> node index.js
	> open http://localhost:3000

You can optionally run on a port other than 3000, for example 8080:

	> node index.js -p 8080

### Keyboard Usage

- Up, Down: increment/decrement frequency, 10 Hz steps
- Left, Right: increment/decrement frequency, 100 Hz steps
- Shift: straight key
- Alt: iambic dit
- Ctrl: iambic dah

-y: enter text or URL to send at current frequency
-i: zoom in fft
-o: zoom out fft


### Alpha "frequencies"

You can enter an alphanumeric frequency that is not a number, like "chatroom23".  Only others with exactly the same frequency will hear your transmissions, and vice versa.

Privacy note: Don't count on this for privacy.  Every client sees every dit, even if you're on a non-numeric channel.


### POSTing text and urls for playback

You can post play requests to the server:

	$ curl -X POST -H 'Content-Type:application/json' -d @testmsg.json localhost:3000/tx
	$ cat testmsg.json 
	{
		"frequency": 7030000,
		"wpm": 20,
		"text": "This is the text of the test message.",
		repeat: 10
	}

If text is a url, the contents of the url are retrieved and played back, instead of the url.  To play a url, put a blank in front of it.

### Technologies:

HTML5 Audio, Socket.io, Express, Raphael.js

### EC2 Install

- Ubuntu 12.04 image

	sudo apt-get install python-software-properties
	sudo add-apt-repository ppa:chris-lea/node.js
	sudo apt-get update
	sudo apt-get install nodejs npm
	sudo apt-get install git-core
	... then as above:
	git clone https://billroy/cw
	cd cw
	npm install
	sudo node index -p 80

Install "forever" to make node run as a daemon.
	
### TODO:

- BUG: key down while tuning leaves stuck oscillators

- @sources
	- tick server
	- echo server
	- play-text server
		@dirname gives random content from dirname

- handle window resize events
- command from client to stop traffic
- visible zoom controls

- BUG: waterfall pixels aren't perfect length

- BUG: Ugly latency jitter on Heroku and EC2

- BUG: stuck iambic paddle on rolloff
- BUG: 300 ms wait time on iPad makes it hard to send

- BUG: Oscillators get stuck ON sometimes during normal operation.  perhaps self-expire stuck oscillators?

- server serial input -> morse @ frequency...
	source: @serial

- privacy: filter packets on the server



- handle server down/up better

- farnsworth spacing
- sidetone control 300-900 step 50	

- mute

- button board

- color picker
- audio band pass control
- display band width control
	i and o
- url query string -> frequency
- wpm control for iambic
- iambic on mouse right click

- noise
