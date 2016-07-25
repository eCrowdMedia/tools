var oAuth = require('./javascripts/oAuth.js');
var forge = require('node-forge');
var pki = forge.pki;
var rsa = pki.rsa;

// var checkLogin = function(){
//     var udid = window.localStorage.getItem('-nw-udid');
//     console.log(udid);
//     var userId = window.localStorage.getItem('-nw-userid');
//     console.log(userId);
//     var userProfile = window.localStorage.getItem('-nw-'+userId+'-userprofile');
//     console.log(userProfile);
//     var accessToken = window.localStorage.getItem('-nw-access_token');
//     console.log(accessToken);
//     var privateKey = window.localStorage.getItem('privateKey');
//     console.log(privateKey);
//     if (udid && userId && accessToken && privateKey && userProfile){
//         return true;
//     }else{
//         return false;
//     }
// };

// href = "app://readmoo/login.html#token=da53fa418f4625360ea07925960e439a0235a4c7&state=" 之類的
if (window.location.hash){
    var token = window.location.hash.split("=")[1].split('&')[0];
    // loginModel.set('accessToken', token);
    window.localStorage.setItem('-nw-access_token', token);
    oAuth.getMe(token).done(function(userProfile){
        // loginModel.set('userId', userProfile.user.id);
        window.localStorage.setItem('-nw-userid', userProfile.id);
        // loginModel.set('userProfile', userProfile.user);
        window.localStorage.setItem('-nw-'+userProfile.id+'-userprofile', JSON.stringify(userProfile));
        var keypair = rsa.generateKeyPair(1024);
        var kpu_pem = pki.publicKeyToPem(keypair.publicKey);
        var kpr_pem = pki.privateKeyToPem(keypair.privateKey);
        oAuth.publicKey(window.localStorage.getItem('-nw-userid'), window.localStorage.getItem('-nw-access_token'), kpu_pem)
            .done(function(){
                console.log("login.js");
                window.localStorage.setItem('rsa_privateKey', kpr_pem);
                window.location = 'app://readmoo/server.html';
            });
        //TODO prepare storage for MooReader
        localStorage.setItem('__oa__', JSON.stringify({
          sync_service: "readmoo",
          readmoo: {
            access_token: token,
            state: "",
            client_id: oAuth.oAuthInfo.client_id,
            network: "readmoo",
            display: "page"
          }
        }));
    });
}else{
    window.location = oAuth.oAuthInfo.url();
}

