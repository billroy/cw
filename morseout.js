//
// morseout.js: morse transmission injector
//
//	Copyright 2012 Bill Roy (MIT License; see LICENSE file)
//

//////////
//
//	The Morsetab
//
// Each value in the table is bit-encoded as lllddddd, where:
//	lll is 3 bits of length [0..7] and 
//	ddddd is 5 bits of morse data, 1==dah and 0==dit
// since there are only 5 bits for morse data we handle 6 element symbols as a special case
// they are stored with a length of zero and an index into 'm6codes', an exception array below
//
function m(a,b) {return (a<<5 | b);}
function m6(b) {return m(0,b);}
var NIL = m(6,0xc);

morsetab = [
	//2 SP      !      "      #    $       %    &        '          (         )      *    +         ,      -      .          slash
		NIL, m6(2), m6(6), NIL, m(7,9), NIL, m(5,8), m(6,0x1e), m(5,0x16), m6(3), NIL, m(5,0xa), m6(4), m6(5), m(6,0x15), m(5,0x12),
	//3   0   		1   		2   	3   	4   		5   	6   	7   		8   		9   	 :  	;  		<    =   	   >    ?
		m(5,0x1f), m(5,0x0f), m(5,7), m(5,3), m(5,1), m(5,0), m(5,0x10), m(5,0x18), m(5,0x1c), m(5,0x1e), m6(0), m6(1), NIL, m(5,0x11), NIL, m(6,0xc),
	//4	@       	a		b		c		d		e		f		g		h			i		j		k		l		m		n		o
		m(6,0x1a), m(2,1), m(4,8), m(4,0xa), m(3,4), m(1,0), m(4,2), m(3,6), m(4,0), m(2,0), m(4,7), m(3,5), m(4,4), m(2,3), m(2,2), m(3,7),
	//5  P   	Q   		R   	S   	T   	U   	V   	W   	X   	Y   		Z     [    \          ]    ^    _
		m(4,6), m(4,0xd), m(3,2), m(3,0), m(1,1), m(3,1), m(4,1), m(3,3), m(4,9), m(4,0xb), m(4,0xc), NIL, m(5,0x12), NIL, NIL, m(6,0xd)
];

//  $ m(7,9)

var NUM_SPECIAL_CHARS = 13;
//              012345 6789012
var outliers = ":;!),-\"'.?@_#";

m6codes = [
//	0=:  1=;  2=!  3=)  4=,  5=-  6="  7='  8=.  9=?  10=@ 11=_ 12=SK/#
	0x38,0x2a,0x2b,0x2d,0x33,0x21,0x12,0x1e,0x15,0x0c,0x1a,0x0d,0x05
];

// State machine states
var M_IDLE			= 0;
var M_START_CHAR	= 1;
var M_START_ELEMENT	= 2;
var M_END_ELEMENT	= 3;
var M_END_TX		= 4;

var DEFAULT_WPM = 15;
var DEFAULT_SIDETONE = 440;
var PTT_DELAY = 1000;

function Morse(options, morseOn, morseOff) {
	console.log('Starting morse player:', options);
	this.init(options, morseOn, morseOff);
}

Morse.prototype = {

	//////////
	//
	//	Morse buffer handling
	//
	morsebuf: '',

	init: function(options, morseOn, morseOff) {
		this.morseOn = morseOn;
		this.morseOff = morseOff;
		this.options = options;
		this.frequency = options.frequency;
		this.setwpm(options.wpm || DEFAULT_WPM);
		this.repeat = options.repeat;
		this.morsePut(this.options.text);
		this.run();		// start the scheduler chain
	},

	morse_dit_ms: 0,
	morse_dah_ms: 0,

	setwpm: function(wpm) {
		this.morse_dit_ms = Math.floor(1200/wpm);
		this.morse_dah_ms = 3 * this.morse_dit_ms;
		//console.log('dit:', this.morse_dit_ms, ' dah:', this.morse_dah_ms);
	},

	morseAvailable: function() {
		return this.morsebuf.length > 0;
	},

	morseGet: function() {
		if (!this.morseAvailable()) return '?';
		var retchar = this.morsebuf[0];
		this.morsebuf = this.morsebuf.substr(1, this.morsebuf.length);
		return retchar;
	},
	
	morsePut: function(string) {
		this.morsebuf += string;
	},

	
	//////////
	//
	//	Morse output state machine
	//
	state: M_IDLE,
	morse_char: 0,
	morse_mask: 0,
	morse_data: 0,
		
	nextState: function(state, dt) {
		this.state = state;
		var self = this;
		setTimeout(function() {self.run();}, dt);
	},
		
	run: function() {
		switch (this.state) {
	
		case M_IDLE:
			if (this.morseAvailable()) {
				// engage PTT and schedule its delay
				//PTTOn();
				this.nextState(M_START_CHAR, PTT_DELAY);
			}
			break;
	
		case M_START_CHAR:
			if (!this.morseAvailable()) {		// ran out of chars - end transmission
				this.nextState(M_END_TX, 0);		// could add tx tail here
				break;
			}
			this.morse_char = this.morseGet();
	
			if (this.morse_char == ' ') {		// wordspace
				this.nextState(M_START_CHAR, 6 * this.morse_dit_ms);
				break;
			}
	
			// mapping and filtering action
			if ((this.morse_char >= 'a') && (this.morse_char <= 'z')) {
				this.morse_char = String.fromCharCode(this.morse_char.charCodeAt(0) - 'a'.charCodeAt(0) + 'A'.charCodeAt(0));
			}
			if ((this.morse_char < ' ') || (this.morse_char > '_')) break;    // ignore bogus 7-bit and all 8-bit
	
			// decode morse pattern from morsetab into morse_data and morse_mask
			this.morse_data = morsetab[this.morse_char.charCodeAt(0) - ' '.charCodeAt(0)];
			this.morse_mask = (this.morse_data >> 5) & 7;		// get # elts or 0 for special table
			if (!this.morse_mask) {
				this.morse_mask = 1 << (6-1);			// specials are 6 elts long
				this.morse_data = m6codes[this.morse_data];
			}
			else {
				this.morse_mask = 1 << (this.morse_mask - 1);	// convert # elts to one-bit mask
				this.morse_data &= 0x1f;
			}
			this.nextState(M_START_ELEMENT, 0);
			break;
	
		case M_START_ELEMENT:
			if (!this.morse_mask) {	// ran out of elements
				this.nextState(M_START_CHAR, 2 * this.morse_dit_ms);		// character space
				break;
			}
			this.morseOn();
			this.nextState(M_END_ELEMENT,
				(this.morse_mask & this.morse_data) ? this.morse_dah_ms : this.morse_dit_ms);
			this.morse_mask >>= 1;	// advance element bit pointer
			break;
	
		case M_END_ELEMENT:
			this.morseOff();
			this.nextState(M_START_ELEMENT, this.morse_dit_ms);
			break;
	
		case M_END_TX:
			//PTTOff();
			if (this.repeat) {
				this.morsePut(this.options.text);
				this.repeat--;
			}
			this.nextState(M_IDLE, 1000);	// could add tail delay here
			break;
		}	// switch
	}	// run
}	// Morse.prototype

module.exports.Morse = Morse;
