# Morse Planet

This is a Morse code practice server that works like an internet chat server for morse code: you can send and receive code between separate browsers connected to the server.  It simulates the on-the-air experience over your local network.

The user interface is a simple digital CW radio.  You can send morse using the shift key or by clicking or touching the onscreen transmit button.  You can tune to different frequencies.  There is an FFT spectrum display so you can see signals nearby, and a spectrum waterfall so you can follow recent transmissions.

There is a feature for sending practice text; you can send multiple practice texts at once to simulate busy band conditions.

Runs on Safari and Chrome, and the other browsers when they support HTML5 Audio.


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


### TODO:


- Heroku install/test
	- BUG: ugly latency jitter (55-700) 
		- compare with localhost:1-5

- AWS install/test
	- BUG: ugly latency jitter

- BUG: stuck iambic paddle on rolloff
- BUG: 300 ms wait time on iPad makes it hard to send

- click to tune
	- BUG: Oscillators get stuck ON.  perhaps self-expire stuck oscillators?
	- BUG: change frequency: all running oscillators are stuck
		- adjust or kill them
	- tuning should shift waterfall pixels left/right and prune
	- waterfall pixels aren't perfect length
	- click in fft or waterfall to tune

- PUT /transmit for web transmit

- fft: show bandwidth
- fft: label with frequencies
- fft: click to set frequency

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
