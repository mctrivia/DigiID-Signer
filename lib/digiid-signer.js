//library to access api.  request is more common but has been deprecated so should not be used
const got = require("got");

/**
 * Decodes a uri
 * Things of note:  if result.contract!==false please show the user before they sign:
 *                                              By signing you agree to:
 *                                              {result.contract}
 * You should also always ask the user to check that result.domain= the domain shown on the web site address bar.
 * If the user does this check phishing is impossible
 *
 * @param {string} uri
 * @return {{
 *     asset:       {id:string,dual:boolean}|boolean,
 *     contract:    string|boolean,
 *     uri:         string,
 *     callback:    string,
 *     domain:      string
 * }}
 */
const decodeURI=function(uri) {
    let result={};

    //make sure uri is for digiid
    if (uri.substr(0,9)!=='digiid://') throw new Error("Not a DigiID uri");

    //decode all the parameters
    /** @type {object<string>} */
    let params = {};
    uri.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        params[key] = value;
    });
    let indexOfQuestionMark=uri.indexOf("?");

    //make sure there is a nonce.  If none is provided use the UTC epoch time in ms as a 64bit hex number
    if (params["x"]===undefined) {
        let x=(new Date()).getTime().toString(16);
        uri+=(indexOfQuestionMark===-1)?'?x='+x:'&x='+x;
    }

    //check for digiID DigiAsset extensions
    if (params["assetid"]!==undefined) {
        result.asset={
            id:     params["assetid"],
            dual:   (uri.indexOf("&assetdualsubmit")!==-1)
        };
    } else {
        result.asset=false;
    }

    //check of contract extension
    if (params["agree"]!==undefined) {
        result.contract=atob(params["agree"]);
    } else {
        result.contract=false;
    }

    //get the callback url
    result.uri=uri;
    result.callback='https://'+uri.substr(9,(indexOfQuestionMark===-1)?undefined:indexOfQuestionMark-9);   //character 9 to end of uri or until ?

    //get the domain
    const matches = uri.match(/^digiid\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
    result.domain=matches[1];

    return result;
};
module.exports.decode=decodeURI;


/**
 * Shows how to sign a DigiID URI.  Since wallets will already have some way of generating private keys from a path
 * and maintaining a list of addresses used already i have included hook functions for this purpose.  Feel free to
 * replace with the appropriate code from your wallet
 * @param {string} uri
 * @param {array<string>} addresses
 * @param {function(string)} getPrivateKeyByAddress        expects {priv: privatekey,addr: address} returned
 * @param {function(string)} getPrivateKeyByPath           expects {priv: privatekey,addr: address} returned
 * @return {Promise<boolean>}
 */
const signURI=async function(uri,addresses,getPrivateKeyByAddress,getPrivateKeyByPath) {
    //get what address we should use
    const uriData=decodeURI(uri);
    let signingAddresses=[];

    //handle asset based addresses
    if (uriData.asset!==false) {                                                                                        //check if uri is looking for an asset
        const response=await got.get(DigiAssets_Block_Explorer+`/getassetholders?assetId=${uriData.asset.id}`,{responseType: "json"});//look up info about asset holders
        if (response.statusCode!==200) throw new Error("Server responded with error code: "+response.statusCode);       //usually because server is down
        const holders=response.body.holders;                                                                            //keep list of those holding the asset
        for (let aa of holders) {                                                                                       //set aa to each element of holders
            if (addresses.indexOf(aa.address)!==-1) {                                                                   //if holder address found in provided user address list
                signingAddresses.push(getPrivateKeyByAddress(aa.address));                                              //record we need to sign with this address and get its key
                break;                                                                                                  //stop looking for matches
            }
        }
        if (signingAddresses.length===0) throw new Error("User does not hold the needed asset");                        //user does not have permission to enter.  throw error so we know why
    }

    //handle standard DigiID addresses
    if ((uriData.asset===false)||(uriData.asset.dual)) {
        //calculate the path to the address
        let hash=crypto.createHash('sha256').update(idIndex+uriData.callback).digest();
        let path="m/13'";                                                                                               //DigiID is SLIP-0013 so we start with 13'
        for (let i=0;i<16;i+=4) path+="/"+((hash[i+3]&0x7f)<<24|hash[i+2]<<16|hash[i+1]<<8|hash[i])+"'";                //each section of path is based on next 4 bytes of hash
        signingAddresses.push(getPrivateKeyByPath(path));                                                               //get the address and key from wallet and record we need to sign with it
    }

    //create signatures
    for (let entry of signingAddresses) {
        entry.sig=(new Message(uriData.uri)).sign(entry.priv);                                                          //generates a compact ecdsa signature
    }

    //create  post payload
    let postPayload;
    if (signingAddresses.length===1) {
        postPayload= {
            "uri":          uriData.uri,
            "address":      signingAddresses[0].addr,
            "signature":    signingAddresses[0].sig
        }
    } else {
        postPayload= {
            "uri":          uriData.uri,
            "address":      signingAddresses[1].addr,
            "signature":    signingAddresses[1].sig,
            "assetaddress": signingAddresses[0].addr,
            "assetsignature":signingAddresses[0].sig
        }
    }

    //send payload to callback
    const response=await got.post(uriData.callback,{
        json:   postPayload,
        responseType: "json"
    });
    return (response.statusCode===200);
};
module.exports.sign=signURI;