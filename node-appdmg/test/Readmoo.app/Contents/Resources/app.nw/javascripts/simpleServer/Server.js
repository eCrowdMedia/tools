var express = require('express');
var serveStatic = require('serve-static');
var nwNotify = require('nw-notify');
var fs = require('fs-extra');
var xml2js = require('xml2js');
var forge = require('node-forge');
var streamifier = require('streamifier');
var Utils = require('./../Utils.js');
// var LinvoDB = require("linvodb3");
// LinvoDB.defaults.store = { db: require("medeadown") };
// LinvoDB.dbPath = process.cwd();

nwNotify.setConfig({
  appIcon: nwNotify.getAppPath() + 'appicon/notify.png',
    defaultStyleText: {
        color: '#FF000',
        fontWeight: 'bold'
    }
});

var encryptionMethods = {
    /*'http://www.idpf.org/2008/embedding': this.embeddedFontDeobfuscateIdpf,
    'http://ns.adobe.com/pdf/enc#RC': this.embeddedFontDeobfuscateAdobe,*/
    'http://www.w3.org/2001/04/xmlenc#aes128-cbc': aes256Decrypt //actually use aes256-cbc
};

function aes256Decrypt(aesKey, fetchCallback, input, file, path){

      var iv = input.slice(0,16),
          ciphertext = input.slice(16),
          decipher = forge.cipher.createDecipher('AES-CBC', aesKey),
          type = file.split('.')[1];

          decipher.start({iv: iv});
          decipher.update(forge.util.createBuffer(ciphertext, 'binary'));
          decipher.finish(function(){ console.log('Decrypt process finished.');});

          // console.log(forge.util.createBuffer(iv, 'binary').toHex());
          // console.log(forge.util.createBuffer(aesKey, 'binary').toHex());
          /* Padding is added by XML Encryption Standard, so we need to remove it by ourself. */
          var output = decipher.output;
          var padding_length = output.last();
          // console.log('Output(' + output.length() + ') - Padding(' + padding_length + ') = ');
          var plaintextBuffer = output.truncate(padding_length);
          // console.log('Plaintext(' + plaintextBuffer.length() + ')');
          if (type !== 'css') {

            /*transform from forge Buffer to node.js Buffer*/
            var nodeBuffer = new Buffer(plaintextBuffer.getBytes(), 'binary');
            // streamifier.createReadStream(nodeBuffer);
            /*var tmpPath = process.cwd()+'/tmp/'+file;
            fs.writeFileSync(tmpPath, plaintextBuffer.data, 'binary');*/

            // var debugBuffer = plaintextBuffer.truncate(plaintextBuffer.length() - 40);
            // console.log('Plaintext in Hex: ' + debugBuffer.toHex());

            fetchCallback(nodeBuffer, plaintextBuffer.length());
          } else {
            fetchCallback(plaintextBuffer.toString(), plaintextBuffer.length());
          }

          /*  var output = forge.util.createBuffer(cipher.output, 'raw');
            // output.putBuffer(cipher.output);
            var bytes = forge.util.hexToBytes(output.toHex());
            if (type == 'css')
              console.log(' output.length' + output.length()+ ' 0708 rawData: ' + bytes);
            fetchCallback(cipher.output.toString(), output.length());*/
          // }

          console.log('aes256Decrypt');
}

var decryptDocument = function(encryptionInfo, retrivalObj, input, file, path, fetchCallback) {
  console.log("decryptDocument()");
  // console.log("window.localStorage.getItem('rsa_privateKey')", window.localStorage.getItem('rsa_privateKey'));
  console.log("retrivalObj", retrivalObj);

  // 2016/07/14 不支援就直接回傳空內容
  if (!retrivalObj) {
    fetchCallback("", 0);
    return
  }

  var cipher = retrivalObj.cipher,
      pki = forge.pki,
      kpr_pem = window.localStorage.getItem('rsa_privateKey'),
      kpr = pki.privateKeyFromPem(kpr_pem),
      ciphertext = forge.util.decode64(cipher),
      aesKey = kpr.decrypt(ciphertext);
      //TODO get decipher from Buffer directly
      encryptionAlgorithm = encryptionMethods[encryptionInfo.encryptionAlgorithm];

  if(encryptionAlgorithm)
      encryptionAlgorithm.call(this, aesKey, fetchCallback, input, file, path);
  else
      console.log('not support this aes decryption mode yet');
};

// var get_distribute = function (dirname){
//   var dist;
//   if (dirname.match(':') === null)
//     dist = dirname.split('/');
//   else
//     return 'win';

//   if(dist[5] === 'dist')
//     return 'dist';
//   else
//     return dist[7];
// };

var getRetrivalMethod = function (encryptionTable, RSA_id){
    for (var i=0; i< encryptionTable.rsakey.length; i++){
        // console.log('encryptionTable.rsakey[i].id: ' + encryptionTable.rsakey[i].id);
        if(RSA_id === encryptionTable.rsakey[i].id){
            //return cipherdata to rsa decode
            return {
                'algorithm': encryptionTable.rsakey[i].algorithm,
                'cipher': encryptionTable.rsakey[i].cipher
                //TODO decipher Buffer
            };
        }
    }
};

var encryptionHandle = function(path, bookid){
  console.log('encryption.xml path: ' + path);
  var encryptionTable = {
      encryptions: undefined,
      rsakey: undefined,
      bookid: bookid
  }

  var xml = fs.readFileSync(path);

  xml2js.parseString(xml, function(err, result){
    // console.dir(JSON.stringify(result));
    var encryptRSAkey = result.encryption['enc:EncryptedKey'];

    for (var i = 0; i < encryptRSAkey.length; i++){
      var encryptRSAalgorithm = encryptRSAkey[i]['enc:EncryptionMethod'][0].$.Algorithm,
          encryptRSAId = encryptRSAkey[i].$.Id,
          cipher =  encryptRSAkey[i]['enc:CipherData'][0]['enc:CipherValue'][0],
          rsaObj = {
              'id': '#'+encryptRSAId,
              'cipher': cipher,
              'algorithm': encryptRSAalgorithm
          };

          if(!encryptionTable.rsakey) {
              encryptionTable.rsakey = [];
          }
          encryptionTable.rsakey.push(rsaObj);
          console.log('encryptionTable.rsakey.id: ' + encryptionTable.rsakey[i].id + ' encryptionTable.rsakey.cipher: ' + encryptionTable.rsakey[i].cipher +
                       ' encryptionTable.rsakey.algotithm: ' + encryptionTable.rsakey[i].algorithm);

    }

    var encryptedData = result.encryption['enc:EncryptedData'];

    for (var j = 0; j < encryptedData.length; j++) {
      var encryptionAlgorithm = encryptedData[j]['enc:EncryptionMethod'][0].$.Algorithm;
      // 2016/07/13
      if (encryptionAlgorithm == "http://www.idpf.org/2008/embedding")
        continue
      var retrievalMethod  = encryptedData[j]['ds:KeyInfo'][0]['ds:RetrievalMethod'][0].$.URI;
      var cipherReferenceURI = encryptedData[j]['enc:CipherData'][0]['enc:CipherReference'][0].$.URI;

      // console.dir(JSON.stringify(encryptedData[j]));
      if (!encryptionTable.encryptions) {
          encryptionTable.encryptions = {};
      }
      encryptionTable.encryptions[cipherReferenceURI] = {encryptionAlgorithm: encryptionAlgorithm, RSA_ID: retrievalMethod};
    }
    // console.dir(JSON.stringify(result.encryption['enc:EncryptedData']));
  });

  return encryptionTable;
};

var create_Server = function (){

  if (global.window.App.nwAppRouter) { // 只有這種寫法，在 .app 才會成功
    console.log("create_Server() but window.nwApp already exist.")
    global.App = {};
    global.App.localServer = window.localStorage.getItem('localServer');
    global.App.rootData = Utils.persist.getRoot();
    return;
  }

  // console.log('create internal server!');
  console.log("~~~~~~~~~~~~~~~~~~~~ Create HTTP Server ~~~~~~~~~~~~~~~~~~~~");
  console.log("global.App.rootData = " + global.App.rootData);
  console.log("window.App.rootData = " + window.App.rootData);

  var app = express();
  // var modelName = "doc";
  // var schema = { }; // Non-strict always, can be left empty
  // var options = { };

  // 宣告 Simple Server 的進入位址
  global.App.Url = {};
  global.App.Url.protocol = 'http:';
  global.App.Url.host = 'localhost';
  global.App.Url.port = 3000 + Math.round(Math.random() * 1000); // 使用動態的 port (3000 ~ 4000)
  global.App.Url.pathname = '/index.html';
  global.App.Url.origin = global.App.Url.protocol + '//' + global.App.Url.host + ':' + global.App.Url.port;
  // window.App.Url.href = window.App.Url.origin + window.App.Url.pathname;
  console.log('port = ' + global.App.Url.port);

  global.App.localServer = global.App.Url.origin;
  window.localStorage.setItem('localServer', global.App.localServer);

  // 2016/04/15 支援 CORS
  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  app.use(serveStatic(global.App.rootData));

  // global.localDB = new LinvoDB(modelName, schema, options);
  // var EncryptDB = new LinvoDB(modelName, schema, options);
  var encryptionTable = '';
  // window.App.EncryptDB = EncryptDB;

/*
  // 2016/01/18 似乎未用到的函數
  var handlePath = function(req, res, next) {
    var _path = path;
    dist = get_distribute(__dirname),
    bookid = req.params.bookid,
    file = req.params.file,
    folder = req.params.folder;

    console.log('got request file route 1');
    if (dist === 'dist') {
      _path = window.App.pathBook + bookid + '/' + folder + '/' + file; //develop ver
    } else if (dist === 'win'){
      _path = process.cwd();
      _path += '\\api\\book\\' + bookid + '\\' + folder + '\\'+ file; // win32/64
    } else {
       _path = process.cwd();
       _path += '/api/book/' + bookid + '/' + folder + '/' + file; // osx32/64
    }
    next();
  };

  // 2016/01/18 似乎未用到的函數
  var provideFile = function(req, res, next) {
      res.sendFile(_path, function(err){
        if(err)
          console.warn('file not exist.')
        else
          console.log('send file: ' + req.params.file);
      });

      app.get('/fonts/:file', function(req, res){
        if (req.params.file) {
           var _path = process.cwd() + '/api/font/' + req.params.file;
           res.sendFile(_path, function(err){
            if(err)
              console.log('file not exist.');
            else
              console.log('send file: ' + req.params.file);
           })
        }
      });
  };

  // var dist = get_distribute(__dirname);
  if ((global.dist === 'dist') || (global.dist === 'mac')) {
    // var path = process.cwd();
    // console.log("2016/01/19 cwd path = " + path);
    // var path = window.App.rootPath;
    // console.log("2016/01/18 server path = " + path);
    // path = "/Users/jackie/Library/Containers/com.readmoo.readmoodesktop/Readmoo-dev";

// app.get('/', function (req, res) {
//   res.send('Hello World')
// })

    console.log(global.pathBook);
    app.use(serveStatic(global.pathBook));
    // app.use(serveStatic(window.App.rootPath));

    // global.rootPath = window.App.rootPath;
    // app.use("/", serveStatic(path));
    // app.use("/test", serveStatic(path + "/api"));
    // app.use("api/cover", serveStatic(path + "api/cover"));
    // nwNotify.notify(window.App.rootPath, '伺服器');
    // window.localStorage.setItem('rootPath', window.App.rootPath);   
  } else if (global.dist === 'win') {
    var path = process.env['USERPROFILE'] + '\\Readmoo';

    if (!fs.existsSync(path)) {
      fs.mkdirs(path, function (err) {
        if (err) return console.error(err)
        console.log("success!")
        app.use(serveStatic(path));
      });
    }
    // var path = process.cwd();
    app.use(serveStatic(path));
  }
*/
  // app.get() 就是對應處理 http://localhost:3787/readmooStore 這類 url 的入口
  app.get('/', function(req, res){
    console.log('hello welcom to internal server!');
    res.send(global.dist + ' @ ' + global.App.rootData);
  });

  app.get('/sync', function(req, res){
    console.log('hello welcom to internal server!');
    // nwNotify.notify('貼心提醒：', '請重新執行同步書櫃操作！');
    res.send('please sync again!');
  });

  app.get('/readmooStore', function(req, res){
    console.log('/readmooStore');
    global.window.gui.Shell.openExternal('https://store.readmoo.com');
    res.end();
  });

  app.get('/fonts/:file', function(req, res){
    console.log('/fonts/:file');
    if (req.params.file) {
       var _path = process.cwd() + '/fonts/' + req.params.file;
       res.sendFile(_path, function(err){
        if(err)
          console.log('file not exist.');
        else
          console.log('send file: ' + req.params.file);
       })
    }
  });

  // //for  犢月刊
  // app.get('/:bookid/:folder/:file', function(req, res){
  //   var _path = path,
  //   dist = get_distribute(__dirname),
  //   bookid = req.params.bookid,
  //   file = req.params.file,
  //   folder = req.params.folder;

  //   console.log('got request file route 1');
  //   if (dist === 'dist') {
  //     _path += '/api/book/' + bookid + '/' + folder + '/' + file; //develop ver
  //   } else if (dist === 'win'){
  //     _path = process.cwd();
  //     _path += '\\api\\book\\' + bookid + '\\' + folder + '\\'+ file; // win32/64
  //   } else {
  //      _path = process.cwd();
  //      _path += '/api/book/' + bookid + '/' + folder + '/' + file; // osx32/64
  //   }

  //   res.sendFile(_path, function(err){
  //     if(err)
  //       console.warn('file not exist.')
  //     else
  //       console.log('send file: ' + req.params.file);
  //   });

  // });

   var openEncrypedFolderFiles = function(req, res){
      console.log('openEncrypedFolderFiles');

      // 2016/07/18 不支援路徑或多檔案，順便補足參數
      req.params.type = '';
      // 導向開啟單一檔案
      openEncrypedBook(req, res);
      return

      var _path = path,
          // dist = get_distribute(__dirname),
          bookid = req.params.bookid,
          file = req.params.file,
          folder = req.params.folder,
          encryptionPath,
          encryptedPath,
          encryptionInfo,
          retrivalObj;
      encryptionPath = window.App.pathBook + bookid + '/META-INF/'+'encryption.xml';
      encryptedPath = folder + '/' + file;

      console.log('got request file route 1');
      if ((global.dist === 'dist') || (global.dist === 'mac')) {
        _path = window.App.pathBook + bookid + '/' + folder + '/' + file; //develop ver
      } else if (global.dist === 'win'){
        _path = process.cwd();
        _path += '\\api\\book\\' + bookid + '\\' + folder + '\\'+ file; // win32/64
      } else {
         _path = process.cwd();
         _path += '/api/book/' + bookid + '/' + folder + '/' + file; // osx32/64
      }

      encryptionInfo = encryptionTable.encryptions[encryptedPath];
      // console.log('solution: ' + JSON.stringify(encryptionTable.encryptions[encryptedPath]));

      if (encryptionInfo)
        retrivalObj = getRetrivalMethod(encryptionTable, encryptionInfo.RSA_ID);

      var input = fs.readFileSync(_path, {encoding: 'binary'});

      decryptDocument(encryptionInfo, retrivalObj, input, file, _path, function(decryptedData, length){
        var type = file.split('.')[1];
        console.log('image type: ' + type);
        if (type == 'css'){
          res.set({
            'Content-Type': 'text/'+type,
            'Content-Length': length
          });
          // console.log(decryptedData);
          res.send(decryptedData);
        } else {
          console.log('set image Header');
          res.set({
            'Content-Type': 'image/'+type
          });
          streamifier.createReadStream(decryptedData).pipe(res);
        }
      });
   };

   var openEncrypedBookFiles = function(req, res){
      console.log('openEncrypedBookFiles');

      // 2016/07/18 不支援路徑或多檔案，順便補足參數
      req.params.folder = '';
      req.params.type = '';
      // 導向開啟單一檔案
      openEncrypedBook(req, res);
      return

      var _path = path,
        // dist = get_distribute(__dirname),
        bookid = req.params.bookid,
        encryptionPath,
        encryptedPath,
        encryptionInfo,
        retrivalObj,
      file = req.params.file;
      encryptionPath = window.App.pathBook + bookid + '/META-INF/'+'encryption.xml';
      encryptedPath = file;

      fs.stat(window.App.pathBook+bookid+'/'+file, function(err, stats){
          if (err)
            console.error(err);
          console.log('0717-2 stats:');
          console.log(stats.isDirectory());
      });

      // console.log('got request file route 1');
      if ((global.dist === 'dist') || (global.dist === 'mac')) {
         // _path = process.cwd();
        _path = window.App.pathBook + bookid + '/' + file; //develop ver
      } else if (global.dist === 'win'){
        _path = process.cwd();
        _path += '\\api\\book\\' + bookid + '\\' + file; // win32/64
      }

      encryptionInfo = encryptionTable.encryptions[encryptedPath];
      // console.log('solution: ' + JSON.stringify(encryptionTable.encryptions[encryptedPath]));

      if (encryptionInfo)
        retrivalObj = getRetrivalMethod(encryptionTable, encryptionInfo.RSA_ID);

      var input = fs.readFileSync(_path, {encoding: 'binary'});

      decryptDocument(encryptionInfo, retrivalObj, input, file, _path, function(decryptedData, length){
        var type = file.split('.')[1];
        console.log('image type: ' + type);
        if (type == 'css'){
          res.set({
            'Content-Type': 'text/'+type,
            'Content-Length': length
          });
          // console.log(decryptedData);
          res.send(decryptedData);
        } else {
          console.log('set image Header');
          res.set({
            'Content-Type': 'image/'+type
          });
          streamifier.createReadStream(decryptedData).pipe(res);
        }
      });
    };

    var openEncrypedBook = function(req, res){
      console.log("openEncrypedBook()");
      console.log('pull resource file from internal server.');
      // console.log('got request file route 2');
      var bookid,
          type,
          file,
          folder,
          encryptionPath,
          encryptedPath,
          encryptionInfo,
          retrivalObj,
          _path = process.cwd();
          // encryptionTable = undefined,
          // dist = get_distribute(__dirname);
      // console.log('dist: ' + dist);
      console.log('params: ' + JSON.stringify(req.params));
      bookid = req.params.bookid;
      type = req.params.type;
      file = req.params.file;
      folder = req.params.folder;
      encryptionPath = global.App.pathBook + bookid + '/META-INF/'+'encryption.xml';
      // encryptedPath = folder + '/' + type + '/' + file;
      // 2016/07/19 將其他函數都接來此處，所以需要條件判斷
      encryptedPath = "";
      if (folder.length) encryptedPath += (folder + '/');
      if (type.length) encryptedPath += (type + '/');
      if (file.length) encryptedPath += file;

      console.log("global.dist = " + global.dist);
      if ((global.dist === 'dist') || (global.dist === 'mac')) {
        // _path = process.cwd();
        _path = global.App.pathBook + bookid + '/' + folder +'/' + type + '/' + file; //develop ver
      } else if (global.dist === 'win') {
        // _path = process.cwd();
        // _path += '\\api\\book\\' + bookid + '\\OEBPS\\' + type + '\\' + file; // win32/64
        // 2016/07/19 勿寫死路徑
        _path += '\\api\\book\\' + bookid + '\\' + folder + '\\' + type + '\\' + file; // win32/64
      } else {
         // _path = process.cwd();
         _path += '/api/book/' + bookid + '/' + folder + '/' + type + '/' + file; // osx32/64
      }

      encryptionInfo = encryptionTable.encryptions[encryptedPath];
        // console.log('solution: ' + JSON.stringify(encryptionTable.encryptions[encryptedPath]));
      if (encryptionInfo)
        retrivalObj = getRetrivalMethod(encryptionTable, encryptionInfo.RSA_ID);

      var input = fs.readFileSync(_path, {encoding: 'binary'});

      decryptDocument(encryptionInfo, retrivalObj, input, file, _path, function(decryptedData, length){
        var type = file.split('.')[1];
        console.log('image type: ' + type);
        if (type == 'css'){
          res.set({
            'Content-Type': 'text/'+type,
            'Content-Length': length
          });
          // console.log(decryptedData);
          res.send(decryptedData);
        } else if (type == 'js') { // 2016/07/13
          res.set({
            'Content-Type': 'text/javascript',
            'Content-Length': length
          });
          res.send(decryptedData);
        } else if (type == 'mp3') { // 2016/07/13
          // 2016/07/14 HTTP 206 的支援，參考自 https://gist.github.com/DingGGu/8144a2b96075deaf1bac
          range = req.headers.range;
          var readStream;

          if (range !== undefined) {
              var parts = range.replace(/bytes=/, "").split("-");

              var partial_start = parts[0];
              var partial_end = parts[1];

              if ((isNaN(partial_start) && partial_start.length > 1) || (isNaN(partial_end) && partial_end.length > 1)) {
                  return res.sendStatus(500); //ERR_INCOMPLETE_CHUNKED_ENCODING
              }

              // 將 .mp3 轉成 .ogg
              // var args = "-i input.mp3 -c:a libvorbis -q:a 4 output.ogg";
              // // console.log("ffmpeg =", ffmpeg);
              // var results = ffmpeg.ffmpeg_run({
              // // var results = ffmpeg.run({
              //     arguments: args.split(" "),
              //     files: [
              //       {
              //           // data: decryptedData,
              //           data: new Uint8Array(decryptedData, 0, length),
              //           "name": "input.mp3"
              //       }
              //     ]
              // });
              // console.log("results =", results);
              // if (results) {
              //     var ogg = results[0];
              //     console.log("ogg =", ogg);
              //     console.log("File recieved", ogg.name, ogg.data);
              //     console.log("length =", ogg.data.length);
              //     // return new Blob([file.data], { type: "audio/mpeg" });
              // }

              // var start = parseInt(partial_start, 10);
              // var end = partial_end ? parseInt(partial_end, 10) : length - 1;
              // var content_length = (end - start) + 1;

              // res.status(206).header({
              //     'Content-Type': 'audio/ogg',
              //     'Content-Length': content_length,
              //     'Content-Range': "bytes " + start + "-" + end + "/" + length
              // });

              // readStream = streamifier.createReadStream(decryptedData, {start: start, end: end});

              // 直接給 .ogg
              // _path = global.App.pathBook + bookid + '/' + folder + '/' + 'audio' + '/' + 'sample.ogg'; // osx32/64
              // console.log("_path =", _path);
              // var stat = fs.statSync(_path);
              // length = stat.size;
              // console.log("stat.size =", stat.size);

              // var start = parseInt(partial_start, 10);
              // var end = partial_end ? parseInt(partial_end, 10) : length - 1;
              // var content_length = (end - start) + 1;

              // res.status(206).header({
              //     'Content-Type': 'audio/ogg',
              //     'Content-Length': content_length,
              //     'Content-Range': "bytes " + start + "-" + end + "/" + length
              // });

              // readStream = fs.createReadStream(_path, {start: start, end: end});

              // 直接給 .mp3
              var start = parseInt(partial_start, 10);
              var end = partial_end ? parseInt(partial_end, 10) : length - 1;
              var content_length = (end - start) + 1;

              res.status(206).header({
                  'Content-Type': 'audio/mpeg',
                  'Content-Length': content_length,
                  'Content-Range': "bytes " + start + "-" + end + "/" + length
              });

              readStream = streamifier.createReadStream(decryptedData, {start: start, end: end});
          }
        } else {
          console.log('set image Header');
          res.set({
            'Content-Type': 'image/'+type
          });
          streamifier.createReadStream(decryptedData).pipe(res);
        }
      });
    };

    var getTable = function(req, res, next){
      console.log("2016/01/21 getTable()");
      console.log(req.originalUrl);
      var bookid,
          file,
          folder,
          encryptionPath,
          _path = process.cwd();
          // encryptionTable = undefined,

      bookid = req.params.bookid;
      file = req.params.file;
      folder = req.params.folder;
      encryptionPath = global.App.pathBook + bookid + '/META-INF/'+'encryption.xml';
      console.log("encryptionPath", encryptionPath);


      window.App.encryptionDB.find({ _id: bookid }, function(err, doc){
      // global.encryptionDB.find({ _id: bookid }).exec(function(err, doc){
        // 2016 Jackie 為何開一本書，會進來三次？（moofont.css, mooheader.css, Style.css）
        console.log("encryptionDB.find bookid = " + bookid);
        console.log("doc (Why always use doc[0]?)", doc);
        // 不應該假設第一筆就是正確的資料，待確認
          if (doc[0]) {
            encryptionTable = JSON.parse(doc[0].table);
            console.log("(doc[0]) encryptionTable", encryptionTable)
            next();
          }
          else {
            encryptionTable = encryptionHandle(encryptionPath, bookid);
            console.log("(else) encryptionTable", encryptionTable)
            window.App.encryptionDB.insert([{_id: bookid, table: JSON.stringify(encryptionTable)}], function(err, newDoc){
            // console.log('check: ' + JSON.stringify(encryptionTable));
               if (err) {
                  console.error(err);
                  next();
               } else {
                  next();
               }
            });
          }
      });
    };

    /*res.sendFile(_path, function(err){
      if(err)
        console.warn('file not exist.')
      else
        console.log('send file: ' + req.params.file);
    });*/

  // for  犢月刊
  // 2016/01/21 移除（改版後，三節式的 url 會進入此段程式）
  // 來自 Failed to load resource: the server responded with a status of 404 (Not Found) http://localhost:3720/javascripts/lib/underscore-min.map
  // app.get('/:bookid/:folder/:file', [getTable, openEncrypedFolderFiles]);
  // 將 bookid 限定為數字（為了區分 javascripts/lib/underscore-min.map 這類的誤入）
  app.get('/:bookid([0-9]+)/:folder/:file', [getTable, openEncrypedFolderFiles]);

  // for  犢月刊
  app.get('/:bookid([0-9]+)/:file', [getTable, openEncrypedBookFiles]);

  // app.get('/:bookid/:folder/:type/:file', [getTable, openEncrypedBook]);
  app.get('/:bookid([0-9]+)/:folder/:type/:file', [getTable, openEncrypedBook]);

  app.listen(global.App.Url.port, global.App.Url.host);
}

simpleServer = {
  create: create_Server
};

module.exports = simpleServer;
