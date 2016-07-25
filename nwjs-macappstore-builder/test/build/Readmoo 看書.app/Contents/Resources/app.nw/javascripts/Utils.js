var fs = require('fs-extra');
var url = require('url');
var http = require('http');
var request = require('request');
var progress = require('request-progress');
var moment = require('moment');
var path = require('path');
var unzip = require('unzip');
var _ = require('underscore');
var os = require('os');
var $ = window.$;
var platform = os.platform();
var pkg = require('./../package.json');

var getDistribute = function () {
// 穩定後，可將 Server.js 內的類似程式移除
  // var dirname = process.cwd();
  // var dist;
  var dirCwd = process.cwd();

  if (platform === 'darwin') {
    dist = dirCwd.split('/');
    
    if (dist[dist.length - 1] === 'dist')
      dist = 'dist';
    else
      dist =  'mac';
  }
  else
    dist =  'win';

  return {'dist': dist, 'cwd': dirCwd}
};

var getRoot = function () {
    // var dirCwd = process.cwd();

// console.log(pkg.internal);

    // global.App.dist = getDistribute();
    // window.App.dist = getDistribute();
    dictDist = getDistribute();

    // 判斷作業系統的資料區路徑
    if (dist === 'win') {
      rootData = dictDist.cwd + '/';
    }
    else {
      // 參考 https://developer.apple.com/library/mac/documentation/General/Conceptual/MOSXAppProgrammingGuide/AppRuntime/AppRuntime.html#//apple_ref/doc/uid/TP40010543-CH2-SW9
      // 合法的路徑有：
      // Your application may write to the following directories:
      //   ~/Library/Application Support/<app-identifier>
      //   ~/Library/<app-identifier>
      //   ~/Library/Caches/<app-identifier>
      //   where <app-identifier> is your application's bundle identifier, its name, or your company’s name. This must exactly match what is in iTunes Connect for the application.
      // 判斷正式版、開發版
      rootData = '/Users/' + process.env['USER'] + '/Library/Containers/com.readmoo.readmoodesktop' + (pkg.internal == 'yes' ? '/Readmoo-dev/' : '/Readmoo/');
      // 不能用 ~
      // rootData = '~/Library/com.readmoo.desktop' + (pkg.internal == 'yes' ? '/Readmoo-dev/' : '/Readmoo/');
      // 被 Apple 詢問路徑原因
      // rootData = '/Users/' + process.env['USER'] + '/Library/Containers/com.readmoo.desktop' + (pkg.internal == 'yes' ? '/Readmoo-dev/' : '/Readmoo/');
    }

    // window.App.rootData = rootData;

    return rootData;
}

var download = function(reqUrl, dest, model, type) {

  //TODO type subscribe mode

  var options = {
    url : reqUrl,
    // 2016/04/20 加大開始傳輸的等待時間，避免伺服器來不及處理版式書籍的大檔案
    timeout: 60000 //60 seconds timeout
  };

  var promise = $.Deferred();

  if (fs.existsSync(dest)){
    console.log('file exist but download it again.');
    fs.unlinkSync(dest);
  }

  model.set('action', 'downloading');

  var r = request(options);
  r.on('error', function(err){
    console.log(err.code);
    console.log(arguments);
    promise.reject(err.code);
  });

  r.on('response', function(response){
    // console.log('response: ' + JSON.stringify(response));
    console.log('statusCode: ' + response.statusCode);
    var status = response.statusCode;
    if (status == '403' || status == '401' || status == '412') {
      promise.reject(status);
    } else if (status == '200'){
      // var options = {
      //   url : reqUrl,
      //   timeout: 8000
      // };
      // var p = progress(request(options), {throttle: 500});
      // 2016/04/20 減少一次連線（間接提升了可同時下載的書籍數量及穩定性），throttle 加大時間間隔可以減少下載完成時間
      var p = progress(r, {throttle: 2000});
      // console.log(p);
      p
      .on('progress', function(state){
        // console.log('state: ' + JSON.stringify(state));
        model.set('book_download_percent', state.percent);
      })
      .on('error', function(err){
        console.log('download error');
        promise.reject(err.code);
        console.log(err);
      })
      .on('end', function(state){
        try{
          // console.log('var download = function() on end state: ', state);
          if(model.get('book_download_percent') === undefined){
            throw new Error('download abnormal!');
          }
          // 保護沒有 state 的狀態
          if (typeof(state) !== 'undefined') {
            model.set('book_download_percent', state.percent);
          }
        } catch (err) {
          console.log('got Error event: ' + err);
        }
        // model.set('book_download_percent', 100);
      })
      .pipe(fs.createWriteStream(dest))
      .on('error', function(err){
        console.log(err);
      })
      .on('change', function(){
        console.log(arguments);
      })
      .on('open', function(){
        console.log(arguments);
      })
      .on('close',function(){
        model.set('book_download_percent', 100);
        var bookId = path.basename(dest, path.extname(dest));
        // var title = 'dummy';
        model.set({'download_status':'finish'});
        window.localStorage.setItem('-nw-'+bookId+'-download', 'finish');
        promise.resolve();
      });
    } else {
      promise.reject(status);
    }
  });

  return promise;
};

var Arrange = function(bookshelfItemCollection) {
   var total = 0,
       adult = 0,
       private_count = 0,
       libraryItemCollection = window.App.LibraryItemCollection;

   if (libraryItemCollection) {
     libraryItemCollection.each(function(model){
       // console.log('Item model: ' + model.get('library_item')['private']);
       if (model.get('library_item')){
         if (model.get('library_item')['private'])
           private_count+=1;
       }
     });
   }

   if (private_count > 0 ) {
      bookshelfItemCollection.push({
        tag:{
          id: 'private',
          name: '私密書籍',
          count: private_count
        }
      }, { at: 3, silent : true});
   }

   bookshelfItemCollection.each(function(model){
     /*if (model.get('tag').id == 'archive')
       model.destroy();*/
       var tag = model.get('tag');
       // console.log('model: ' + JSON.stringify(model));
       if (tag.name == '限制級書籍')
         adult = tag.count;
       if (tag.name == '未分類書籍')
         tag.count+=adult;
       if (tag.name !== '封存書籍' && tag.name !== '限制級書籍' && tag.name !== '私密書籍')
         total+=tag.count;
   });

   bookshelfItemCollection.add({
    tag:{
      id: 0,
      name: '全部書籍',
      count: total
    }
   }, { at: 0});
};

// 檢查該書是否已在書櫃內
var checkDuplicate = function (libraryItems, bookId) {
  console.log('checkDuplicate');
  for (var j=0; j< libraryItems.length; j++) {
    if (libraryItems[j]['library_item']['book']['id'] == bookId) {
      console.log('Book exist in library. id = ' + bookId + ', title = ' + libraryItems[j]['library_item']['book']['title']);
      return { index: j, result: true};
    }
  }
  return { index: 0, result: false}
};

var updateReading = function (libraryItems, readingItem) {
  for (var j=0; j<libraryItems.length; j++){
     if (libraryItems[j]['library_item']['book']['id'] == readingItem['reading']['book']['id']) {
        // console.log("updateReading() readingItem =", readingItem)

        // 保護沒有 reading 的狀態
        if (typeof(libraryItems[j]['library_item']['reading']) === 'undefined') {
          libraryItems[j]['library_item']['reading'] = {'touched_at': '', 'progress': ''};
        }

        if (libraryItems[j]['library_item']['reading']['state'] == 'finish') {
          //update touched_at
          libraryItems[j]['library_item']['reading']['touched_at'] = readingItem['reading']['touched_at'];
        } else {
          // update both touched_at and progress
          // if (typeof(libraryItems[j]['library_item']['reading']) === 'undefined') {
          //   libraryItems[j]['library_item']['reading'] = {'touched_at': '', 'progress': ''};
          // }
          libraryItems[j]['library_item']['reading']['touched_at'] = readingItem['reading']['touched_at'];
          // console.log('progress: ' + readingItem['reading']['progress']);
          // 2016/04/27 確保閱讀進度只顯示整數
          libraryItems[j]['library_item']['reading']['progress'] = parseInt(readingItem['reading']['progress'] * 100);
        }
        break;
     }
  }
};

var changeReading = function (libraryItems, bookId) {
  var localStorage = window.localStorage;
  window.localStorage.removeItem('-nw-library');

  for (var j=0; j<libraryItems.length; j++){
     if (libraryItems[j]['library_item']['book']['id'] == bookId) {
        var utc = moment().utc().format();
        utc = utc.split('+')[0]+'Z';
        console.log('reading: ' + libraryItems[j]['library_item']['reading']);
        if (typeof(libraryItems[j]['library_item']['reading']) !== 'undefined') {
          libraryItems[j]['library_item']['reading']['touched_at'] = utc;
        }
        else {
           libraryItems[j]['library_item']['reading'] = {'touched_at': utc};
        }
        break;
     }
  }

  var marathon = Utils.persist.marathonTag();
  $.each(marathon['tag']['books'], function(index, bookId){
    Utils.persist.updateMarathon(libraryItems, bookId);
  });

  localStorage.setItem('gridView_update', true);
  localStorage.setItem('listView_update', true);
  window.localStorage.setItem('-nw-library', window.JSON.stringify(libraryItems));
  Utils.persist.triggerState();

};

var updateMarathon = function (libraryItems, bookId) {
  for (var j=0; j<libraryItems.length; j++) {
     if (libraryItems[j]['library_item']['book']['id'] == bookId) {
        libraryItems[j]['library_item']['marathon'] = true;
        break;
     }
  }
};

var marathonTag = function () {
  var tags = JSON.parse(window.localStorage.getItem('-nw-tags'));
  // var tags = $.parseJSON(window.localStorage.getItem('-nw-tags'));
  // console.log('tags: ' + JSON.stringify(tags));
  var i = undefined;
  var len = tags.length;
  for (i = 0; i < len; i++) {
    // console.log('tag: '+tags[i]['tag']['id']);
    if (tags[i]['tag']['id'] == 'marathon') {
        return tags[i];
    }
  }
  return;
};

var triggerState = _.debounce(function() {
  console.log('triggerState');
  window.menuListView.model.set('activePage', 'library')
  if (window.App.viewTypeModel.get('grid')=='enable') {
    // 模擬點擊「格狀」項目
    window.nwApp.grid();
    // $('#grid').trigger('click');
        // $('#grid').trigger('click', [{ update: res.update}]);
  } else {
    // 模擬點擊「條列」項目
    window.nwApp.list();
    // $('#list').trigger('click');
        // $('#list').trigger('click', [{ update: res.update}]);
  }
}, 50);

var getLastSyncTime = function(moment) {
  var localStorage = window.localStorage;
  var syncTime = localStorage.getItem('last_library_sync'),
      utc = moment().utc().format();
  if (!syncTime) {
    utc = utc.split('+')[0]+'Z';
    syncTime = utc;
    localStorage.setItem('last_library_sync', syncTime);
    return syncTime;
  } else {
    utc = utc.split('+')[0]+'Z';
    localStorage.setItem('last_library_sync', utc);
    return syncTime;
  }
};

// 清除資料
var cleanupData = function () {
  // 清除 localStorage
  window.localStorage.clear();

  // 清除資料庫
  var arrDBs = [window.App.readingsDB,
                window.App.bookmarksDB,
                window.App.highlightsDB,
                window.App.readingsCollectionDB,
                window.App.annosCollectionDB,
                window.App.bookmarksCollectionDB,
                window.App.encryptionDB];
  $.each(arrDBs, function (index, db) {
    db.remove({}, {multi: true}, function(){});
    // 確保 Medea 正確處理資料
    if (typeof(db.store.db.db) !== 'undefined')
      db.store.db.db.compact(function(){});
  });

  // 清除書檔
  fs.removeSync(global.App.pathBook);
  fs.removeSync(global.App.pathCover);
  fs.removeSync(global.App.pathAvatar);
}

var pathConfig = {
  library : 'api/book/',
  cover : 'api/cover/'
};

var Utils = {
  fs: {
    download: download,
    path: pathConfig
  },
  persist: {
    getDistribute: getDistribute,
    getRoot: getRoot,
    Arrange: Arrange,
    checkDuplicate: checkDuplicate,
    updateReading: updateReading,
    changeReading: changeReading,
    getLastSyncTime: getLastSyncTime,
    triggerState: triggerState,
    cleanupData: cleanupData,
    marathonTag: marathonTag,
    updateMarathon: updateMarathon
  }
};

module.exports = Utils;
