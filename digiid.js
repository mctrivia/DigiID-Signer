(function(undefined){
	var magicLength=function(message) {
		//this is a simplified version of real function since lengths greater then 0xfd don't seem to work anyways
		var i=message.length;
		if (i < 0xfd) {
            return String.fromCharCode(i);
        } else {
            throw "Message to long";
        }
	}

	//DigiID object
	function DigiID(seedPhrase,passPhrase) {
		var me=this;
		
		//Get network being used
		me.network = bitcoinjs.bitcoin.networks.digibyte;
		
		//get languages
		var mnemonics = { "english": new Mnemonic("english") };
		var mnemonic = mnemonics["english"];
		
		//Set passPhrase to empty string if none given
		passPhrase=passPhrase||"";

		// **********************
		//should check language and validity of seedPhrase here.  For now will assume english
		// **********************
		
		//generate HDNode from seed
		var seed = mnemonic.toSeed(seedPhrase,passPhrase);
		me.HDNode=bitcoinjs.bitcoin.HDNode.fromSeedHex(seed, me.network);
		
		
		//define uri related values
		me.idIndex=String.fromCharCode(0)+String.fromCharCode(0)+String.fromCharCode(0)+String.fromCharCode(0);
		me.uri;
		me.url;
		me.keys;
	};
	DigiID.prototype={
		"setURI": function(uri) {
			var me=this;
			
			//store uri
			me.uri=uri;
			
			//get callback url
			var a=uri.indexOf(':');
			var b=uri.indexOf('?');
			if ((a<0)||(b<0)) throw "Invalid uri";
			me.url='https'+uri.substr(a,b-a);
			
			//calculate path
			var hash=bitcoinjs.bitcoin.crypto.sha256(me.idIndex+me.url);
			var path="m/13'";
			for (var i=0;i<16;i+=4) {
				path+="/"+((hash[i+3]&0x7f)<<24|hash[i+2]<<16|hash[i+1]<<8|hash[i])+"'";
			}
				
			//calculate key pair
			me.keys=me.HDNode.derivePath(path).keyPair;
		},
		_safe: function() {
			if (this.uri==undefined) throw "Need to set URI";
		},
		"getCallbackURL":function() {
			this._safe();
			return this.url;
		},
		"getKeyPair":function() {
			this._safe();
			return this.keys;
		},
		"getPrivate":function() {
			this._safe();
			return this.keys.toWIF();
		},
		"getAddress":function() {
			this._safe();
			return this.keys.getAddress();
		},
		"getSignature":function() {
			/*
			
				Untested
			
			*/
			var me=this;
			me._safe();
			var hash=bitcoinjs.bitcoin.crypto.hash256(me.network.messagePrefix+magicLength(me.uri)+me.uri);
			return me.keys.sign(hash);
		}
		
	}
	
	//make object public
	window['DigiID']=DigiID;
})();