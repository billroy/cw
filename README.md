# Morse Planet

This is a Morse code practice server that works like an internet chat server for morse code: you can send and receive code between separate browsers connected to the server.  It simulates the on-the-air experience over your local network.  (Performance over the open internet is currently poor due to the impact of socket.io path latency jitter.)

The user interface is a simple digital CW radio.  You can send morse using the shift key or by clicking or touching the onscreen transmit button.  You can tune to different frequencies.  There is an FFT spectrum display so you can see signals nearby, and a spectrum waterfall so you can follow recent transmissions.

There is a feature for sending practice text; you can send multiple practice texts at once on different frequencies to simulate busy band conditions.

Runs on Safari and Chrome, and the other browsers when they support HTML5 Audio and SVG.

On iPad you can transmit and see the waterfall, but not receive.  On iPhone, no dice.

### Install and Run

	> git clone http://github.com/billroy/cw
	> cd cw
	> npm install
	> node index.js
	> open http://localhost:3000

You can optionally run on a port other than 3000, for example 8080:

	> node index.js -p 8080

### Keyboard Usage

Up, Down: increment/decrement frequency
Shift: straight key
Alt: iambic dit
Ctrl: iambic dah

y: enter text or URL to send at current frequency


### Uses:

HTML5 Audio, Socket.io, Express, Raphael.js


### TODO:

- click to tune
	- click in fft or waterfall to tune
	- bring clicked frequency to center
	- tuning should shift waterfall pixels left/right and prune
	- center frequency marker
	- fft: label with frequencies
	- fft: click to set frequency

	- BUG: tuning orphans any running oscillators

- BUG: waterfall pixels aren't perfect length

- BUG: Ugly latency jitter on Heroku and EC2

- BUG: stuck iambic paddle on rolloff
- BUG: 300 ms wait time on iPad makes it hard to send

- BUG: Oscillators get stuck ON sometimes during normal operation.  perhaps self-expire stuck oscillators?

- PUT /transmit for web transmit

- fft: show bandwidth

- farnsworth spacing
- sidetone control 300-900 step 50	
- sendtext: send contents of url

- mute

- button board

- color picker
- band pass control
- url query string -> frequency
- wpm control for iambic
- iambic on mouse right click

- noise
