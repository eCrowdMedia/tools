var NodeRSA = require('node-rsa');
var key = new NodeRSA({b: 1024});
key.generateKeyPair();
window.console.log(key.getPrivatePEM());
window.console.log(key.getPublicPEM());

module.exports = {
	privateKey: key.getPrivatePEM(),
	publicKey: key.getPublicPEM()
};