console.log("main.js")
console.log("navigator.onLine =", navigator.onLine);

var fs = require('fs-extra');
var path = require('path');
var request = require('requestretry').Request.request;
// var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
// var request = require('requestretry');
var _ = require('underscore');
// var NotificationCenter = require('node-notifier-allowed-in-mac-app-store').NotificationCenter;
// var notifier = new NotificationCenter();
// notifier.isOSX = true;
var pkg = require('./package.json');
var internal = require('./internal.json');
var updater = require('node-webkit-updater');
var nwNotify = require('nw-notify');
var progress = require('request-progress');
var server = require('./javascripts/simpleServer/Server.js');
// var md5File = require('md5-file');

// 虛擬路徑在 Server.js 定義

server.create(); //launch internal server
global.App.simpleServer = server;

// 以後需要陸續彙整至此
// var dbPath = (platform === 'darwin') ? '/Users/' + process.env['USER'] + '/Library/Containers/com.readmoo.readmoodesktop' : process.cwd();
// var appName = dbPath + (pkg.internal == 'yes' ? '/Readmoo-dev/' : '/Readmoo/');
// 實體路徑
// var osPath = (platform === 'darwin') ? '/Users/' + process.env['USER'] + '/Library/Containers/com.readmoo.desktop' : process.cwd();
// global.App.rootPath = osPath + (pkg.internal == 'yes' ? '/Readmoo-dev/' : '/Readmoo/');
global.App.dbPath = global.App.rootData + "db/";
global.App.pathAvatarRel = "api/avatar/";
global.App.pathCoverRel = "api/cover/";
global.App.pathBookRel = "api/book/";
global.App.pathAvatar = global.App.rootData + global.App.pathAvatarRel;
global.App.pathCover = global.App.rootData + global.App.pathCoverRel;
global.App.pathBook = global.App.rootData + global.App.pathBookRel;

Utils.fs.path.library = global.App.pathBook;
Utils.fs.path.cover = global.App.pathCover;

var gui = require('nw.gui');
var moment = require('moment');
Swag.registerHelpers(handlebars);

var LinvoDB = require("linvodb3");
LinvoDB.defaults.store = { db: require("medeadown") };
LinvoDB.dbPath = global.App.dbPath;

fs.ensureDirSync(global.App.dbPath, function(err) {
  console.log(err + " @ " + global.App.dbPath); //null
  //dir has now been created, including the directory it is to be placed in
})

// fs.mkdir(dbPath, function(e){
//     if(!e || (e && e.code === 'EEXIST')){
//         //do something with contents
//         LinvoDB.dbPath = dbPath;
//     } else {
//         //debug
//         console.error(e);
//     }
// });

var clientId = '8bb43bdd60795d800b16eec7b73abb80';
// var redirectURL = 'app://readmoo/';
var redirectURL = 'http://localhost:3300/';

var oauth_api = new window.readmoo.OAuthAPI(clientId, redirectURL); //for offline
window.App.oauth_api = oauth_api;
window.App.clientId = clientId;

var models = ["readings", "bookmarks", "highlights", "readingsCollection", "annosCollection", "bookmarksCollection", "encryption"];
var schema = { }; // Non-strict always, can be left empty
var options = { };
// 不能每次都開新的 DB，否則 App 一結束，DB 的內容就被清除了
var readingsDB = new LinvoDB(models[0], schema, options);
var bookmarksDB = new LinvoDB(models[1], schema, options);
var highlightsDB = new LinvoDB(models[2], schema, options);
var readingsCollectionDB = new LinvoDB(models[3], schema, options);
var annosCollectionDB = new LinvoDB(models[4], schema, options);
var bookmarksCollectionDB = new LinvoDB(models[5], schema, options);
var encryptionDB = new LinvoDB(models[6], schema, options);

// 離線資料庫（MooReader 寫入，Desktop App 補送）
window.App.readingsDB = readingsDB;
window.App.bookmarksDB = bookmarksDB;
window.App.highlightsDB = highlightsDB;
// 完整資料庫（透過 OAuth 取得並寫入）
window.App.readingsCollectionDB = readingsCollectionDB;
window.App.annosCollectionDB = annosCollectionDB;
window.App.bookmarksCollectionDB = bookmarksCollectionDB;
// 書檔的解密資料表
window.App.encryptionDB = encryptionDB;

// 恢復資料庫
// var arrOffineDB = [readingsDB, bookmarksDB, highlightsDB, readingsCollectionDB, annosCollectionDB, bookmarksCollectionDB];
// var arrOffineDB = [readingsDB, bookmarksDB, highlightsDB];
// $.each(arrOffineDB, function (index, db) {
//   db.reload(function (err) { if (err) console.log(err); });
// });

/*bookmarksDB.find({ action: 'add'}, function (err, docs) { console.log('0928: ' + docs.length);
});*/

gui.App.addOriginAccessWhitelistEntry('https://member.readmoo.com/', 'app', 'readmoo', true);
var win = gui.Window.get();
window.App.mainWin = win;
window.App.pkg = pkg;
window.App.gui = gui;

// app/internal.json 仍須存在，為了 manifestUrl
if (pkg.internal == 'yes')
  var upd = new updater(internal);
else
  var upd = new updater(pkg);

window.App.BooksOpenList = [];

// var clipboard = gui.Clipboard.get();
// window.moo_clipboard = clipboard; //use for text content clip through the app
var oAuth = require('./javascripts/oAuth.js'); //oAuth is used to get, put, delete data via readmoo API.
var appMenu = require('./javascripts/menu.js');
var forge = require('node-forge');
var os = require('os');
var pki = forge.pki;
var rsa = pki.rsa;
// var loading_win;
var copyPath, execPath; //for auto update

// 本機作業系統環境
if (platform.startsWith("darwin")) {
  window.App.platform = "mac";
}
else if (platform.startsWith("win")) {
  window.App.platform = "win";
}
else {
  window.App.platform = "linux";
}

function getMacAppName() {
    // 判斷 App 的安裝目錄
    var arrMatched = process.cwd().match(/^\/Applications\/(.*?).app\/Contents/i);
    if (arrMatched && (arrMatched.length > 1)) {
      // Mac 正式版本：Readmoo 版本是「Readmoo.app」，App Store 版本是「Readmoo 看書.app」。
      strAppName = arrMatched[1];
    }
    else {
      strAppName = "";
    }

    return strAppName;
}
window.App.getMacAppName = getMacAppName;

if (gui.App.argv.length) {
  copyPath = gui.App.argv[0];
  execPath = gui.App.argv[1];
}

// console.log('copyPath: ' + copyPath);

appMenu.initMenu(pkg, copyPath);

nwNotify.setConfig({
  appIcon: nwNotify.getAppPath() + 'appicon/notify.png',
  defaultStyleText: {
      color: '#FF000',
      fontWeight: 'bold'
  },
});

// 偵測 MooReader 對資料庫的異動。但是應該讓 MooReader 與資料庫脫鉤才健康
// window.App.bookmarksDB.on('inserted', function(docs) {
//   console.log("window.App.bookmarksDB.on('inserted')");
// })

// 離線補送
var isOnline = function() {
  console.debug("isOnline() sync offline dbs");
  var oauth_api = window.App.oauth_api;

  _.delay(function(){

      //----------- readinglogs------------//

     window.App.readingsDB.find({}).sort({_id: -1}).exec(function (err, docs) {
      // 目前是每一筆新的 reading 都用新增的方式，感覺有隱憂，待測試
      // console.log("err", err);
      console.log("readingsDB docs", docs);
      var foo = _.sortBy(docs, 'bookId').reverse();
      var bar = _.indexBy(foo, 'bookId');
          $.each(bar, function (index, value){ // console.log(value);
            if (value.action == 'add') {
            // 閱讀進度
            oauth_api.api.readings(value.data).ping().success(function(){
              // value.remove(function(){
              //   console.log('readings commited and removed. bookId =', value.bookId);
              // });
              // 有隱憂，多本書的 readings 可能還來不及送出，就被清除了
              console.log('readings', docs);
              docs.forEach(function(doc){
                doc.remove(function(){
                  console.log('readings removed');
                });
              });
            });
            } else {
              // 移除殘留的資料
              value.remove(function(){
                console.log('readingsDB useless data removed');
              });
            }
          });
        window.App.readingsDB.save(function(err) {});
        // 確保 Medea 正確處理資料
        window.App.readingsDB.store.db.db.compact(function() {});
     });

     //----------- highlights ------------//

     window.App.highlightsDB.find({}).sort({_id: -1}).exec(function (err, items) {
      console.log("highlightsDB items", items);
        var foo = _.sortBy(items, 'action');
        $.each(foo, function(index, value){
          if (value.action == 'add') {
            // 新增畫線註記
            oauth_api.api.highlights(value.data).createHighlightByReadingId().success(function(){
              value.remove(function(){
                console.log('highlight add dbItem removed', value.data['highlight[content]']);
              });
            });
          } else if (value.action == 'remove') {
            // 刪除畫線註記
            oauth_api.api.highlights({highlightId: value.highlightId}).deleteHighlightByHighlightId().success(function(){
              value.remove(function(){
                console.log('highlight remove dbItem removed');
              });
            });
          } else {
            // 移除殘留的資料
            value.remove(function(){
              console.log('highlightsDB useless data removed');
            });
          }
        });
        window.App.highlightsDB.save(function(err) {});
        // 確保 Medea 正確處理資料
        window.App.highlightsDB.store.db.db.compact(function() {});
     });

     //----------- bookmarks ------------//

     window.App.bookmarksDB.find({}).sort({_id: 1}).exec(function (err, items) {
      console.log("bookmarksDB items", items);
       var foo = _.sortBy(items, 'action');
       $.each(foo, function(index, value){
         if (value.action == 'add') {
            // 新增書籤
            oauth_api.api.bookmarks(value.data).createBookmarkByReadingId().success(function(){
              value.remove(function(){
                console.log('bookmarks add dbItem removed. content =', value.data['bookmark[content]']);
              });
           });
         } else if (value.action == 'remove') {
            // 移除書籤
            oauth_api.api.bookmarks({bookmarkId: value.bookmarkId}).deleteBookmarkByBookmarkId().success(function(){
              value.remove(function(){
                console.log('bookmarks remove dbItem removed');
              });
           });
         } else {
            // 移除殘留的資料
            value.remove(function(){
              console.log('bookmarksDB useless data removed');
            });
         }
       });
       window.App.bookmarksDB.save(function(err) {});
       // 確保 Medea 正確處理資料
       window.App.bookmarksDB.store.db.db.compact(function() {});
     });

  }, 500);
};

if (window.addEventListener) {
    // 切換瀏覽器的 online/offline 狀態時，就會觸發對應事件
    window.addEventListener("online", isOnline, false);
}

window.App.nwNotify = nwNotify;

// 這一行會干擾除錯
// process.on("uncaughtException", function(e) { console.log(e); }); //

if (platform !== 'darwin' && pkg.internal == 'no')
  var win_path = process.env['USERPROFILE'] + '\\Readmoo\\';
else if (platform !== 'darwin' && pkg.internal == 'yes')
  var win_path = process.env['USERPROFILE'] + '\\Readmoo-dev\\';

var file = global.App.rootData + 'launch.ini';

function LaunchCheck(pkg) {
  console.log('LaunchCheck: ' + pkg.internal);
  if (pkg.debug == 'no' || pkg.internal == 'yes') {
    if (!fs.existsSync(file)) {
      console.log('first_launch.ini not exist!');
      // 先從 localStorage 取得 access_token
      var access_token = oAuth.readLocalToken();
      // 清空 localStorage
      // window.localStorage.clear();
      // 清空資料
      Utils.persist.cleanupData();
      // 暫時儲存 access_token
      window.localStorage.setItem('pre_access_token', access_token);
      if (platform == 'darwin')
        var ws = fs.createWriteStream(file);
      else
        var ws = fs.createWriteStream(win_path+'launch.ini');
      ws.write('launch verified\n');
      if (navigator.onLine) {
        var access_token = localStorage.getItem('pre_access_token');
        window.location = oAuth.logout(access_token);
        // 果然是錯誤來源 TypeError: Cannot read property 'navigate' of undefined
        // window.nwApp.navigate("library", {trigger: true});
      }
      // return true;
    } else {
      console.log('second times launch app!');
      return false;
    }
  }
}

LaunchCheck(pkg);

/*while (pkg.packages.win[process.arch]['md5'] = '3f4689da494217631570402ef699d9b9') {
  console.log('kyle is coming');
}*/

function DownloadApp(cb, newManifest) {
  console.log('newManifest: ' + JSON.stringify(newManifest));
  var manifest = newManifest;
  var arch = process.arch;
  var platform = process.platform;
  platform = /^win/.test(platform)? 'win' : /^darwin/.test(platform)? 'mac' : 'linux' + (process.arch == 'ia32' ? '32' : '64');
  // console.log('manifest: ' + manifest.packages);
  console.log('platform: ' + platform);
  var url = manifest.packages[platform][arch].url;
  var body = "";
  var cur = 0;
  var len = 0;
  var total = 0;
  var $progress = $('#js-progress');
  var filename = path.basename(url);
  var destinationPath = path.join(os.tmpdir(), filename);

  $('.sidebar-wall').css({'display': 'block'});
  $progress.css({'display': 'block'});

  var pkg = request(url, function(err, response){
      console.log('total: ' + total + ' len: ' + len);
      if (err) {
          cb(err);
      }
      if (response.statusCode < 200 || response.statusCode >= 300) {
          pkg.abort();
          return cb(new Error(response.statusCode));
      }
  });

  pkg.on('response', function(response) {
    console.log('file size: ' + response.headers['content-length']);
    len = parseInt(response.headers['content-length'], 10);
    total = len / 1048576; //1048576 - bytes in  1Megabyte
    if (response && response.headers && response.headers['content-length']) {
      pkg['content-length'] = response.headers['content-length'];
      var options = {
        url: url,
        timeout: 8000
      };
      var p = progress(request(options), {throttle: 500});
      p.on('progress', function(state){
        // $progress.html("Downloading " + (100.0 * cur / len).toFixed(2) + "%" + '<br\>'+(cur / 1048576).toFixed(2) + " mb\r" + ".<br/> Total size: " + total.toFixed(2) + " mb");
        $progress.html("Downloading " + state.percent + "%" + ".<br/> Total size: " + total.toFixed(2) + " mb");
      }).on('error', function(err){
        console.log('download error: ' + err);
      }).on('end', function(){
        // do nothing
        $progress.html("Downloading 100%" + ".<br/> Total size: " + total.toFixed(2) + " mb");
      }).pipe(fs.createWriteStream(destinationPath))
      .on('error', function(err){
        console.log(err);
        cb(err, null, null);
      })
      .on('finish', appDownloaded);
    }
  });

  function appDownloaded() {
    process.nextTick(function() {
      if(pkg.response.statusCode >= 200 && pkg.response.statusCode < 300){
        cb(null, destinationPath, newManifest); //call newVersionDownloaded
      }
    });
  }
  return pkg;
};

function newVersionDownloaded(err, filename, manifest){
    // 2016/05/30 移出進度視窗，失敗時才可隱藏此視窗
    var $progress = $('#js-progress');

    if (!err) {
        var platform = process.platform;
        platform = /^win/.test(platform)? 'win' : 'mac';
        console.log('step3');
        $progress.html("Unpacking...");
        var first_launch = localStorage.getItem('first_launch');
        if (first_launch)
           localStorage.removeItem('first_launch');

        // 2016/05/05 存放書檔的目錄已經固定，不需要再為了清除書檔而登出
        // if (fs.existsSync(file)) {
        //   // 清除 launch.ini，強迫更新後必須重新登入（實測則是會有登出清除書檔的效果，但是仍會自動登入）
        //   fs.removeSync(file);
        // }

        console.log('excute filename: ' + filename);
        // ------------- Step 3 -------------

        if (platform !== 'win') {
          upd.unpack(filename, function(error, newAppPath) {
              if (!error){
                  console.log('step4');
                  // ------------- Step 4 -------------
                  console.log('newAppPath: ' + newAppPath + ' getAppPath' + upd.getAppPath() + 'exec: ' + upd.getAppExec());
                  var k = newAppPath.split('/').length;
                  var fileName = undefined;
                  if (process.arch == 'ia32') {
                      if (pkg.internal == 'yes')
                        fileName = '/osx32/Readmoo-dev.app';
                      else
                        fileName = '/osx32/Readmoo.app'
                  } else if (process.arch == 'x64') {
                      if (pkg.internal == 'yes')
                        fileName = '/osx64/Readmoo-dev.app'
                      else
                        fileName = '/osx64/Readmoo.app'
                  }
                  newAppPath = newAppPath.split('/').slice(0, k-1).join('/') + fileName;
                  // newAppPath = newAppPath.split('/').slice(0, k-1).join('/') + '/osx32/Readmoo.app';
                  // console.log('newAppPath: ' + newAppPath);
                  $progress.html("Closing App...");
                  upd.runInstaller(newAppPath, [upd.getAppPath(), upd.getAppExec()],{});
                  // _.delay(gui.App.quit, 5000);
                  gui.App.quit();
                  // process.on('exit', function(filename) {
                  //   console.log('About to exit with filename:', filename);
                  // });
                  // process.exit(filename); // 這種結束方式，才會進入 process.on('exit')
              } else {
                console.log(error);
                nwNotify.notify('Readmoo看書版本更新失敗', '請再重新執行升級操作');
                $progress.css({'display': 'none'});
                $('.sidebar-wall').css({'display': 'none'});
                $progress.empty();
                return Error(error);
              }
          }, manifest);
        } else { //window platform update skip step4
          var Installer = _.debounce(function(){

            $progress.html("Unpacking...");

            /* 關鍵其實是在 windows_installer.nsi，最好將 .exe .dll 移到最後再安裝
            # Copy .exe .dll at last
            SetOutPath "$PROFILE\Readmoo-dev"

            File ./ffmpegsumo.dll
            File ./icudtl.dat
            File ./libEGL.dll
            File ./libGLESv2.dll
            File ./nw.pak
            File ./Readmoo.exe
            */

            process.on('exit', function(filename) {
              console.log('About to exit with filename:', filename);

              // Jackie : child_process 還有 execSync, execFile, spawn 之類的指令
              // On Windows, setting options.detached to true makes it possible for the child process to continue running after the parent exits.
              // When using the detached option to start a long-running process, the process will not stay running in the background after the parent exits
              // unless it is provided with a stdio configuration that is not connected to the parent.
              const child = spawn(filename, [], {detached: true, stdio: 'ignore'});
              // const child = spawn(filename, [], {detached: true, stdio: 'inherit'});

              // To prevent the parent from waiting for a given child, use the child.unref() method.
              child.unref();

              child.on('error', function(err){
                nwNotify.notify('Readmoo看書版本更新失敗', '請再重新執行升級操作');
              });

              // exec(filename, function(error, stdout, stderr){
              //   if (error !== null){
              //     nwNotify.notify('Readmoo看書版本更新失敗', '請再重新執行升級操作');
              //   }
              // });
            });

            // 這種結束方式，才會進入 process.on('exit')
            process.exit(filename);
            // App 需結束才可更新，或者啟動另一隻小程式專做更新
            // gui.App.quit();
          }, 30);

          // 2016/04/07 簡化版本更新的相關步驟，不再檢查 MD5
          // var localMd5 = md5File(filename);

          // var calMd5 = _.debounce(function(){
          //   localMd5 = md5File(filename);
          // }, 3000);

          // //----------- make sure file has been wrting into HDD -----------//

          // while (window.manifest['packages']['win'][process.arch]['md5'] != localMd5) {
          //   alert('md5 mismatch, file not ready');
          //   console.log('md5 mismatch');
          //   calMd5();
          // }

          Installer();
        }
    } else {
       console.log('error case3');
       nwNotify.notify('Readmoo看書版本更新失敗', '請再重新執行升級操作');
       $progress.css({'display': 'none'});
       $('.sidebar-wall').css({'display': 'none'});
       $progress.empty();
       return Error(err);
    }
}

// 比對版本字串的大小，回傳值：
//   < 0 if a < b
//   > 0 if a > b
//   = 0 if a = b
// function cmpVersions (a, b) {
//     var i, l, diff, segmentsA, segmentsB;

//     segmentsA = a.replace(/(\.0+)+$/, '').split('.');
//     segmentsB = b.replace(/(\.0+)+$/, '').split('.');
//     l = Math.min(segmentsA.length, segmentsB.length);

//     for (i = 0; i < l; i++) {
//         diff = parseInt(segmentsA[i], 10) - parseInt(segmentsB[i], 10);
//         if (diff !== 0) {
//             return diff;
//         }
//     }
//     return segmentsA.length - segmentsB.length;
// }

function CheckUpdate(auto, copyPath) {
  console.log('CheckUpdate!');
  if (!copyPath) {
    var result = LaunchCheck(pkg.debug);
    console.log('==================== check manifest from download Server ====================');
    console.log('check new Version:');

    strAppName = getMacAppName();

    if (!((window.App.platform == "mac") && (pkg.internal == "no")) || (strAppName == "Readmoo")) {
      // 不是 Mac App Store 正式版，才檢查版更資訊（MAS 正式版必須依循 App Store 的規則）

    upd.checkNewVersion(function(error, newVersionExists, manifest)  {

        if (pkg.debug == 'yes')
          console.log('manifest: ' + JSON.stringify(manifest));

        // 這裏的 manifest 是由 updater 解析 pkg.manifestUrl，透過網路取回的版更資訊
        // if ((!newVersionExists) && (manifest.hasOwnProperty('ver_readmoo'))) {
        //   if (cmpVersions(pkg.version, manifest.ver_readmoo) < 0) {
        //     newVersionExists = true;
        //   }
        //   // Mac 正式版會參考 manifest.version，所以必須維持一致
        //   // 其他版本可自行控管，所以替換成 manifest.ver_readmoo
        //   manifest.version = manifest.ver_readmoo;
        //   console.log('manifest: ' + JSON.stringify(manifest));
        // }

        window.manifest = manifest; //testing only

        if (!error && newVersionExists) {
            //  ------------- Step 2 -------------
            console.log('step2');
            confirmUpdate('有最新版本，請問是否要立即更新？<br/>提醒您，更新後，可能需要重新登入。', DownloadApp, newVersionDownloaded, manifest);
        } else if (error) {
          console.log('remote server not ready with error: \n' + error);
        } else {
          var first_launch = localStorage.getItem('first_launch');
          if (!first_launch && result) {
            localStorage.setItem('first_launch', false);
            if (platform == 'darwin'){
              // notifier.notify({
              //   'title': 'Readmoo 更新完成',
              //   'message': '版本已更新至' + pkg.version,
              //   'contentImage': window.avatar_url,
              //   'sound': 'avatar_url'
              // });
              var notification = new Notification('Readmoo 更新完成', {
                 tag: '',
                 body: '版本已更新至' + pkg.version
              });
            } else {
              nwNotify.notify('Readmoo 版本更新', '版本已更新至' + pkg.version );
            }
          }
          else if (!auto) {
            nwNotify.notify('Readmoo 版本更新', '版本' + pkg.version + '已是最新！');
          } else {
            console.log('result: ' + result);
            // nwNotify.notify('Readmoo 版本更新', '版本' + pkg.version + '已是最新！');
          }
          console.log('it\'s the latest version !');
        }
    });
    }
  } else {
    // ------------- Step 5 -------------
    console.log('step5 install new app');
    // nwNotify.notify('Readmoo 版本更新中', '版本正更新至' + pkg.version );
    /*notifier.notify({
         'title': 'nwApp Updating',
         'message': '更新系統中...',
         // 'contentImage': path,
         'sound': 'Pop'
    });*/
    upd.install(copyPath, newAppInstalled);

    function newAppInstalled(err) {
      if(err){
        console.log(err);
        return;
      }
      upd.run(execPath, null);
      gui.App.quit();
    }
  }
};

window.App.CheckUpdate = CheckUpdate;

function confirmUpdate(message, DownloadApp, newVersionDownloaded, manifest) {
  $('#confirm').modal({
    closeHTML: "<a href='#' title='Close' class='modal-close'></a>",
    position: ["20%",],
    overlayId: 'confirm-overlay',
    containerId: 'confirm-container',
    onShow: function (dialog) {

      var modal = this;
      $('#confirm-container')[0].style.height = 'auto';
      // $('.message', dialog.data[0]).append(message);
      var dialogStr = message+'<br><br><p>'+manifest['descriptions']['Info']+'</p>';
      $('.header span').text(' 軟體更新');
      $('.message', dialog.data[0]).append(dialogStr);

      // if the user clicks "yes"
      $('.yes', dialog.data[0]).click(function(){
        // call the callback
        if ($.isFunction(DownloadApp)) {
          DownloadApp.call(null, newVersionDownloaded, manifest);
        }
        // close the dialog
        modal.close(); // or $.modal.close();
      });
      foo = ['.no', '.header>span'];
      $(foo.join(','), dialog.data[0]).click(function(){
        console.log('do nothing!');
        modal.close();
        return;
      })
    }
  });
}

//Tray
/*var tray = new gui.Tray({
    icon: 'images/readmoo_icon.png'
  });
var menu = new gui.Menu();
menu.append(new gui.MenuItem({
    type: 'checkbox',
    label: 'Always-on-top',
    click: function(){
        //todo
    }
  }));
menu.append(new gui.MenuItem({
    type: 'checkbox',
    label: 'Readmoo Special',
    click: function(){
        //todo
    }
  }));
tray.menu = menu;*/

//listen to close event for mainWindow
win.removeAllListeners('close');
win.on('close', function(){
  // 手動關閉書櫃，才會進入此處
  console.log("win.on('close')");
  var that = this;
  this.hide(); // Pretend to be closed already
  // 2016 Jackie : 難怪前一次當機，下一次開啟 App，畫面不會縮回
  window.localStorage.removeItem('splash');
  // this.close();
  if (!copyPath && window['App'] != undefined) {
    if (window.App['BooksOpenList'].length > 0) {
      $.each(window.App['BooksOpenList'], function(i, bookId){
        console.log('bookId: ' + bookId);
        if (typeof(window.App[bookId]) !== 'undefined')
          window.App[bookId].close();
      });
      checkDownloading().done(function(){
        that.close(true);
        nwNotify.closeAll();
      });
    } else {
      checkDownloading().done(function(){
        that.close(true);
        nwNotify.closeAll();
      });
    }
  } else {
    that.close(true);
    nwNotify.closeAll();
  }
});

win.removeAllListeners('focus');
win.on('focus', function(){
  console.log('got focus event: ' + location.pathname);
  var syncTime = Utils.persist.getLastSyncTime(moment);
  oAuth.getMeLibraryCompare('', syncTime).done(function(res) {
    // console.log('focus update: ' + res.update);
    window.localStorage.setItem('gridView_update', res.update);
    window.localStorage.setItem('listView_update', res.update);

    // 2016 Jackie : 這幾行的位置有問題
    // 'syncTime' 是用來檢查 24 小時的間隔時間（如：暢讀 99）
    var now = moment();
    window.localStorage.setItem('syncTime', now);
    window.AppSyncTime = now;

    oAuth.getMeLibraryTags().done(function() {
      var tags = $.parseJSON(window.localStorage.getItem('-nw-tags'));
      var bookshelfItemCollection = new App.Collections.BookshelfItemCollection(tags);
      // Utils.persist.Arrange(bookshelfItemCollection);
      window.App.BookshelfItemCollection = bookshelfItemCollection;
    });
    if (res.update) {
      // call navigate in order to update the URL.
      // If you also wish to call the route function, set the trigger option to true.
      // To update the URL without creating an entry in the browser's history, set the replace option to true.
      window.nwApp.navigate('library', {trigger: true});
      // 下方強制點擊，不好（是為了可能有新書加入的狀況嗎？）
      // if (window.App.viewTypeModel.get('grid')=='enable') {
      //    $('#grid').trigger('click');
      // } else {
      //   $('#list').trigger('click');
      // }
    }
    setTimeout(function(){
      window.bookShelfPageView.render();
    }, 300);
  }).fail(function(){
    console.log('getMeLibraryCompare() fail');
  });
});

// 從 BookItemView.js on('close' 的一部分處理程序 win.emit('readingSync');
win.removeAllListeners('readingSync');
win.on('readingSync', function() {
  console.log('readingSync()');
  // 2016 Jackie 這裏的同步時間有隱憂（2016/04/27 只要一關書，就會破壞「同步書櫃」需要用到的時間標記）
  // var syncTime = Utils.persist.getLastSyncTime(moment);
  // console.log('jackie checking syncTime: ' + syncTime);
  // 改用自行組合時間格式
  var syncTime = moment().utc().format().split('+')[0]+'Z';
  console.log("syncTime =", syncTime);

 window.App.$loadbook.show();
 oAuth.getReading(syncTime).done(function(res){
   console.log('reading update: ' + res.update);
   window.localStorage.setItem('gridView_update', res.update);
   window.localStorage.setItem('listView_update', res.update);
   window.nwApp.navigate('library', {trigger: true}); //work around for redirect route path
   window.App.$loadbook.hide();
   if (window.App.viewTypeModel.get('grid')=='enable') {
      $('#grid').trigger('click');
   } else {
     $('#list').trigger('click');
   }
   // Utils.persist.triggerState();
 }).fail(function(){
  console.log('network fail');
 });
});

/*win.on('loaded', function(){
  if (copyPath)
    nwNotify.notify('Readmoo 版本更新中', '版本正更新至' + pkg.version );
});*/

function checkDownloading() {
  var dtd = $.Deferred();
  if (App.LibraryItemCollection && window.localStorage.getItem('login_status') == "true") {
    var count = window.App.LibraryItemCollection.length;
    App.LibraryItemCollection.each(function(model){
      count -=1;
      // console.log('action: ' + model.get('action') +  ' count: ' + count);
      if (model.get('action') === 'downloading') {
        model.set('action', "download");
        model.set('download_status', "none");
      }
      if(count == 0)
        dtd.resolve();
    });
  } else {
    dtd.resolve();
  }
  return dtd.promise();
};

var splashAnimation = function(copyPath){
    var dtd = $.Deferred();
    if (!localStorage.getItem('splash') || localStorage.getItem('splash') === 'false') {
      // $('.splash').css('top','0%');
      console.log('copyPath: ' + copyPath);
      if (!copyPath) {
        if (pkg.debug == 'yes') {
          var version = '<p class="ver_logo">版本編號： ' + pkg.version + '</p>',
          $version = $(version);
          $('.splash img').after($version);
        }
        setTimeout(function(){
            $('.splash').animate({ top: '-100%' }, 1000, 'swing');
            localStorage.setItem('splash', true);
            $('.topbar').attr('data-action', 'open');
            dtd.resolve();
        },1500);
      } else {
         var version = '<p class="ver_logo">更新至版本： ' + pkg.version + ' 中 ...</p>',
         $version = $(version);
         $('.splash img').after($version);
         dtd.resolve();
      }
    } else {
        console.log('app crash in previous run');
        setTimeout(function(){
            $('.splash').animate({ top: '-100%' }, 1000, 'swing');
        },1500);
        // localStorage.setItem('splash', true);
        dtd.resolve();
        $('.topbar').attr('data-action', 'open');
        $('.wrapper').attr('data-action', 'open');
    }
    return dtd.promise();
};

// if (window.location.hash){
//  window.localStorage.setItem('-nw-udid', '123456');
//     var token = window.location.hash.split("=")[1].split('&')[0];
//     window.localStorage.setItem('-nw-access_token', token);
//     oAuth.getMe(token).done(function(userProfile){
//      window.localStorage.setItem('-nw-userid', userProfile.id);
//         window.localStorage.setItem('-nw-'+userProfile.id+'-userprofile', JSON.stringify(userProfile));
//      var keypair = rsa.generateKeyPair(1024);
//         var kpu_pem = pki.publicKeyToPem(keypair.publicKey);
//         var kpr_pem = pki.privateKeyToPem(keypair.privateKey);
//      oAuth.publicKey(userProfile.id, token, kpu_pem)
//        .done(function(){
//          window.localStorage.setItem('privateKey', kpr_pem);
//          loginModel.getFromLocalStorage();
//          window.App.Vent.trigger('login_done');
//        });
//     });
// }

$(document).ready(function() {

  var checkLogin = function() {

    console.log('checkLogin');
    var dtd = $.Deferred();
    var udid = window.localStorage.getItem('-nw-udid');
    var userId = window.localStorage.getItem('-nw-userid');
    var userProfile = window.localStorage.getItem('-nw-'+userId+'-userprofile');
    var accessToken = window.localStorage.getItem('-nw-access_token');
    var privateKey = window.localStorage.getItem('rsa_privateKey');
    if (udid && userId && accessToken && privateKey && userProfile) {
      window.localStorage.setItem('login_status', true); //make sure finish login.
      dtd.resolve();
    } else {
      window.localStorage.setItem('login_status', false);
      if (navigator.onLine)
        dtd.reject('online');
      else
        dtd.reject('offline');
    }
    return dtd.promise();
  };

  var checkSyncTime = function() {
    var now = moment(),
        start = window.AppSyncTime,
        timeGap = now.diff(start, 'hours'),
        login_status = localStorage.getItem('login_status');
        // subscribe_ch =

    if (timeGap >= 24 && login_status == 'true'){ //TODO  for subscribe user only
      // notifier.notify({
      //   'title': 'Readmoo 強制同步',
      //   'message': '請立即進行書櫃同步，方能正常閱讀！',
      //   // 'contentImage': path,
      //   'sound': 'Pop'
      // });
      var notification = new Notification('Readmoo 強制同步', {
         tag: '',
         body: '請立即進行書櫃同步，方能正常閱讀！'
      });
      $.get('http://localhost:3300/sync');
    }
  };

  checkLogin().done(function() {
    console.log("main.js checkLogin().done");
    // console.log(global.window.App.nwAppRouter);

    // 2016 加個已存在的判斷
    // if (!global.window.App.nwAppRouter) { // 只有這種寫法，在 .app 才會成功
    if (!window.nwApp) {
      var nwApp = new window.App.nwAppRouter();
      // 提供 window.nwApp.navigate 的用途
      window.nwApp = nwApp; //place router to global variable
    }

    // nwApp.on('route:filter', function(actions) {
    //     console.log(actions);
    //     alert(actions);
    // });

    // console.log("Backbone.history", Backbone.history);
    // 看到 Backbone.history.location.href = "app://readmoo/index.html"

    // nwApp.start();
    // window.nwApp.start();
    // 2016 Jackie : 網站都是示範這種啟動方式，為何以前用 nwApp.start()？
    // 因為 nwApp.start 裡面也有做這件事！但是用起來怪怪的，開到書櫃後就無法點擊任何功能
    Backbone.history.start();

    var arch = (process.arch == 'ia32' ? '32' : '64'),
        platform = process.platform,
        Info = {
          platform: platform,
          arch: arch,
          version: pkg.version
        };

    window.localStorage.setItem('-nw-app-systemInfo', JSON.stringify(Info));

    if (!window.localStorage.getItem('syncTime')) {
      var now = moment();
      localStorage.setItem('syncTime', now);
      console.log("localStorage.setItem('syncTime', now) =", now)
      window.AppSyncTime = now;
    } else {
      window.AppSyncTime = localStorage.getItem('syncTime');
    }
    // setInterval(checkSyncTime, 1000*300); //turn off check function until subscribe mode ready

    // App 啟動後，固定進行一次離線補送的程序
    isOnline();
  }).fail(function(status) { //re-login
    console.log("main.js checkLogin().fail");
    if (status == 'online') {
      console.log('re-login');
      // 2016 在導向藍色登入畫面之前，global.window.App 與 window.App 都還存在
      // 一出現藍色登入畫面，就出現一條錯誤訊息："Uncaught ReferenceError: require is not defined"
      // 是否因為登入畫面是 https？
      // 所以目前 Desktop App 有這條錯誤訊息，尚無法處理
      window.location = oAuth.oAuthInfo.url();
      /*var nwApp = new window.App.nwAppRouter();
      window.nwApp = nwApp;
      nwApp.start();*/
    }
    else {
      if ($(location).attr('pathname') != '/offline.html')
        window.location = 'app://readmoo/offline.html';
      // alert('please check your network!');
      // window.location = 'app://readmoo/offline.html';
    }
  });
});//end of document ready.
