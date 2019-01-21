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
	
	
	me.getPath=function(uri) {
		var a=uri.indexOf(':');
		var b=uri.indexOf('?');
		if ((a>=0)&&(b>=0)) {
			var idIndex=String.fromCharCode(0)+String.fromCharCode(0)+String.fromCharCode(0)+String.fromCharCode(0);
			var callback='https'+uri.substr(a,b-a);
			
			var hash=bitcoinjs.bitcoin.crypto.sha256(idIndex+callback);
			
			var path="m/13'";
			for (var i=0;i<16;i+=4) {
				path+="/"+((hash[i+3]&0x7f)<<24|hash[i+2]<<16|hash[i+1]<<8|hash[i])+"'";
			}
			return path;
		}
	}	
	
};
DigiID.prototype={
	"getKeyPair":function(uri) {
		var me=this;
		var path=me.getPath(uri);
		return me.HDNode.derivePath(path).keyPair;
	}	
}
