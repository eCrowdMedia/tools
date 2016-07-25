var $ = window.$;

var request = require('request');
var path = 'https://member.readmoo.com/oauth';
var client_id = '8bb43bdd60795d800b16eec7b73abb80';
// var client_id = 'd16be1ae708cac48aeef06491f8850fc'; //for full encrypted books testing
var redirect_uri = 'app://readmoo/login.html';
var response_type = 'token';
var udid = Math.floor((Math.random() * 100) + 1);
// var udid = '123456';

var scope = 'reading,highlight,like,comment,me,library';

var Utils = require('./Utils.js');

var readLocalToken = function(){
  return window.localStorage.getItem('-nw-access_token');
};

var downloadNavUrl = function(bookId){
  url = 'https://reader.readmoo.com/book/toc/full/'+bookId+'.json';
  return url;
};

var downloadEpubUrl = function(token, bookId){
  url = 'https://api.readmoo.com/epub/'+bookId+'?client_id='+client_id+'&access_token='+token;
  return url;
};

var publicKey = function(userId, token, publickey){
  var $dfd = new $.Deferred();
  var UDID = window.localStorage.getItem('-nw-udid');
  var url = 'https://api.readmoo.com/me/devices/'+UDID+'/publickey?access_token='+token;
  console.log('publicKey', url);
  options = {
    url: url,
    method: 'POST',
    form: {
      KeyName: userId,
      KeyValue: publickey
    },
    headers: {
      Authorization : 'Client '+ client_id
    }
  };

  request(options, function(error, response, body){
    console.log(response);
    if (!error && response.statusCode == 201){
      $dfd.resolve();
    }
  });
  return $dfd.promise();
};

var getMe = function(token){
  console.log('getMe');
  var $dfd = $.Deferred();
  var url = 'https://api.readmoo.com/me?access_token='+token;
  var options = {
    url: url,
    headers: {
      Authorization : 'Client '+ client_id
    }
  };
  request(options, function(error, response, body){
    if (!error && response.statusCode == 200) {
        var userProfile = $.parseJSON(body);
        $dfd.resolve(userProfile.user);
        // events.trigger('get_me_done' ,userProfile.user) ;
      }else{
        $dfd.reject(error);
      }
  });
  return $dfd.promise();
};

var getReading = function(utc){
  console.log('getReading() utc: ', utc);
  var $dtd = $.Deferred();
  var token = window.localStorage.getItem('-nw-access_token'),
      userId = window.localStorage.getItem('-nw-userid');
  var url = 'https://api.readmoo.com/users/'+userId+'/readings?access_token='+token+'&order=touched_at&from='+utc;
  var options = {
    url: url,
    headers: {
      Authorization : 'Client '+ client_id
    }
  };
  request(options, function(error, response, body) {
    if (!error && response.statusCode == 200) {
        var readings = $.parseJSON(body);
        console.log("readings =", readings);
        var length = readings.items.length;
        // console.log('readings.items: ' + JSON.stringify(readings.items));
        // console.log('readings.items.length: ' + readings.items.length);
        // window.App.Vent.trigger('get_reading_done' ,readings.items) ;

        var libraryItems = JSON.parse(window.localStorage.getItem('-nw-library')),
            bookId = 0,
            i = 0;
        // console.log('libraryItems[0][library_items][reading]: ' + JSON.stringify(libraryItems[0]['library_item']['reading']));
        if (length > 0) {
          window.localStorage.removeItem('-nw-library');
          for (i; i < length; i++) {
            // bookId = readings.items[i]['reading']['book']['id'];
            if (libraryItems)
              Utils.persist.updateReading(libraryItems, readings.items[i]);
            // console.log('readings.items: ' + JSON.stringify(readings.items[i]['reading']));
            // console.log('reading bookId: ' + bookId);
          }

          // ----------- checking for marathon ------- //
          var marathon = Utils.persist.marathonTag();

          if (typeof marathon !== 'undefined') {
            $.each(marathon['tag']['books'], function(index, bookId) {
              Utils.persist.updateMarathon(libraryItems, bookId);
            });
          }

          // ----------- end of checking for marathon ------- //

          window.localStorage.setItem('-nw-library', window.JSON.stringify(libraryItems));
          $dtd.resolve({update: true});

        }
        else {
          $dtd.resolve({update: false});
        }
    } else {
       console.log('got reading request error');
       $dtd.reject(error);
    }
  });
  return $dtd.promise();
};

var getMyReadingsWithHighlights = function(){
  var userId = window.localStorage.getItem('-nw-userid');
  var token = window.localStorage.getItem('-nw-access_token');
  var url = 'https://api.readmoo.com/users/'+userId+'/readings?access_token='+token+'&highlights_count[from] = 1';
  var options = {
    url: url,
    headers: {
      Authorization : 'Client '+ client_id
    }
  };
  request(options, function(error, response, body){
    console.log(response);
    if (!error && response.statusCode == 200) {
        var highlights = $.parseJSON(body);
        console.log(highlights);
      }
  });
};

var getMeLibraryTags = function(){
  var $dtd = $.Deferred();
  var token = window.localStorage.getItem('-nw-access_token'),
      url = 'https://api.readmoo.com/me/tags?access_token='+token;

  var options = {
    url: url,
    headers: {
      Authorization: 'Client ' + client_id
    }
  };

  request(options, function(error, response, body){
    console.log(response);
    if (!error && response.statusCode == 200) {
      var tags = $.parseJSON(body);
      window.localStorage.setItem('-nw-tags', window.JSON.stringify(tags.items));
      //TODO update bookshelf views
      $dtd.resolve();
    } else {
      $dtd.reject(error);
    }
  });
  return $dtd.promise();
};

var getForever = function(){
  var $dfd = $.Deferred();
  console.log('getForever =>');
  var token = window.localStorage.getItem('-nw-access_token'), //f7996ded3917ede4418ee24734a66d9ca54bdad5
      url = 'https://api.readmoo.com/me/forever/?access_token='+'d84ed2b278b6bc1fabeb41bc61b0e82d15fdc470'+'&client_id='+client_id;

  var options = {
    url: url
  };

  request(options, function(err, res, body) {
    if (!err && res.statusCode == 200) {
      var subscribe_ch = $.parseJSON(body);
      // console.log('subscribe_ch: ' + JSON.stringify(subscribe_ch));
      console.log('subscribe_ch.items.length: ' + subscribe_ch.items.length);
      console.log('subscribe_ch[0]: ' + JSON.stringify(subscribe_ch.items[0]));
      console.log('subscribe_ch[1]: ' + JSON.stringify(subscribe_ch.items[1]));
      console.log('subscribe_ch[2]: ' + JSON.stringify(subscribe_ch.items[2]));
      window.localStorage.setItem('-nw-forever', JSON.stringify(subscribe_ch.items));
      $dfd.resolve(window.JSON.parse(window.localStorage.getItem('-nw-forever')));
    } else {
      console.log('getForever fail');
    }
  });
  return $dfd.promise();
};

var getFreeBooks = function(){
  //TODO
};

var getMeLibraryCompare = function(localIds, utc){
  console.log('getMeLibraryCompare() utc = ' + utc);

  var token = window.localStorage.getItem('-nw-access_token');
  var $dfd = $.Deferred();
  localIds = localIds ? localIds :'';

  if (!utc) {
    var url = 'https://api.readmoo.com/me/library/compare?access_token='+token+'&local_ids='+localIds+'&extra=reading';
    // 先把書櫃內容清空
    window.localStorage.removeItem('-nw-library');
  } else {  //&last_sync=
    var url = 'https://api.readmoo.com/me/library/compare?access_token='+token+'&local_ids='+localIds+'&extra=reading'+'&last_sync='+utc;
  }

  var options = {
    url: url,
    headers: {
      Authorization : 'Client '+ client_id
    }
  };

  request(options, function(error, response, body){
    if (typeof(response) !== 'undefined')
      console.log('response: ' + response.statusCode);
    // console.log($.parseJSON(body));
    if (!error && response.statusCode == 200) {
        var books = $.parseJSON(body),
            reading = undefined,
            i = 0,
            step = undefined,
            length = books.items.length;

        console.log(books);

        for(i; i < books.items.length; i++){
          reading = books.items[i].library_item.reading;
          step = ((i+1)/length);
          // console.log('notify step: ' + step);
          $dfd.notify(step); // 通知 nwAppRouter.js 的 oAuth.getMeLibraryCompare....progress(function(result)
          if (reading){
            // console.log('item[i].progress for ' + i + ': ' + books.items[i].library_item.reading.progress);
            var progress = books.items[i].library_item.reading.progress;
            progress *= 100;
            // console.log('progress: ' + Math.round(progress));
            // console.log('bookid: ' + books.items[i].library_item.book.id);
            books.items[i].library_item.reading.progress = Math.round(progress);
          }
        }
        if (!utc) // 全部寫入書櫃內容
          window.localStorage.setItem('-nw-library', window.JSON.stringify(books.items));
        else {
          var libraryItems = JSON.parse(window.localStorage.getItem('-nw-library')),
              foo;
          if (length > 0) {
            // console.log(libraryItems);
            // console.log(books.items[0]['library_item']['book']['id']);
            window.localStorage.removeItem('-nw-library');
            // console.log('books.items: ' + books.items[0]['action']);
            for (i=0; i< books.items.length; i++) {
              books.items[i]['action'] = 'download'; //change action state from update to download
              // 檢查這本書是否已在書櫃內
              foo = Utils.persist.checkDuplicate(libraryItems, books.items[i]['library_item']['book']['id']);
              if (!foo.result) {
                // 新增這本書
                libraryItems[libraryItems.length+i] = books.items[i];
              } else {
                // 更新這本書
                console.log('has duplicate item');
                // console.log(books.items[i]);
                libraryItems[foo.index] = books.items[i];
              }
            }
            window.localStorage.setItem('-nw-library', window.JSON.stringify(libraryItems));
          }
        }
        // window.App.Vent.trigger('get_me_library_compare_done' ,window.JSON.parse(window.localStorage.getItem('-nw-library')) );
        if (length > 0)
          $dfd.resolve({update: true});
        else
          $dfd.resolve({update: false});

    } else {
      console.log('sync library fail and response: ' + JSON.stringify(response));
      $dfd.reject();
    }
  });
  return $dfd.promise();
};

var getMyHighlights = function(){
  var $dfd = $.Deferred();
  var userId = window.localStorage.getItem('-nw-userid');

  var url = 'https://api.readmoo.com/users/'+userId+'/highlights?access_token='+window.localStorage.getItem('-nw-access_token')+'&count=40';
  var options = {
    url: url,
    headers: {
      Authorization : 'Client '+ client_id
    }
  };
  request(options, function(error, response, body){
    // console.log(error);
    // console.log(response.toJSON());
    // // console.log(body);
    if (!error && response.statusCode == 200){
      var highlights = $.parseJSON(body);
      $dfd.resolve(highlights);
      window.App.Vent.trigger('getMyHighlights_done' , highlights);
    }else{
      console.error('getMyHihglights error');
      $dfd.reject();
    }
  });
  return $dfd.promise();
};

var getMoreHighlights = function(url){
  var $dfd = $.Deferred();
  var options = {
    url: url,
    headers: {
      Authorization : 'Client '+ client_id
    }
  }
  request(options, function(error, response, body){
    // console.log(error);
    // console.log(response.toJSON());
    // // console.log(body);
    if (!error && response.statusCode == 200){
      var highlights = $.parseJSON(body);
      $dfd.resolve(highlights);
    }else{
      console.error('getMyHihglights error', error);
      $dfd.reject();
    }
  });
  return $dfd.promise();
};

var getHighlightsByReadingId = function(readingId){
  var url = 'https://api.readmoo.com/users/'+readingId+'/highlights';
};

var logout = function(access_token) {
console.log("oAuth logout()");
  // var redirectUri = 'https://member.readmoo.com/oauth?client_id='+client_id+'&redirect_uri='+ redirect_uri +'&scope=reading,highlight,like,comment,me,library&response_type=token';
  var redirectUri = 'app://readmoo/server.html';
  // var url = 'https://member.readmoo.com/oauth/sign_out?client_id='+client_id+'&response_type=token&redirect_uri='+encodeURIComponent(redirectUri);
  var url = 'https://member.readmoo.com/oauth/sign_out?client_id='+ client_id+'&access_token='+access_token+'&redirect_uri='+encodeURIComponent(redirectUri);
  window.localStorage.setItem('oauthLogout', url);
  console.log(url);
  return url;
};

/*
var ajaxTest = function(access_token){
  var token = window.localStorage.getItem('-nw-access_token');
   // var redirectUri = 'https://member.readmoo.com/oauth?client_id='+client_id+'&redirect_uri='+ redirect_uri +'&scope=reading,highlight,like,comment,me,library&response_type=token';
  var redirectUri = 'app://readmoo/index.html';
  // var url = 'https://member.readmoo.com/oauth/sign_out?client_id='+client_id+'&response_type=token&redirect_uri='+encodeURIComponent(redirectUri);
  var url = 'https://member.readmoo.com/oauth/sign_out?client_id='+ client_id+'&access_token='+token+'&redirect_uri='+encodeURIComponent(redirectUri);
  // console.log(url);
  var xhr = $.ajax({
    url: url,
    type: "GET",
    dataType: "json"
  });

  xhr.done(function(resp){
    console.log('get resp: ' + JSON.stringify(resp));
  }).fail(function(err){
    console.log('err: ' + err);
  });

};
*/

var oAuthInfo = {
  path : path,
  client_id : client_id,
  redirect_uri : redirect_uri,
  response_type : response_type,
  udid : udid,
  scope : scope,
  url : function(){
    window.localStorage.setItem('-nw-udid', this.udid);
    var oauthURL = this.path + '?client_id=' + this.client_id + '&redirect_uri=' + this.redirect_uri + '&udid=' + this.udid + '&response_type='+ this.response_type + '&scope=' + scope + '&custom_layout=desktop';
    console.log('oauthURL: ' + oauthURL);
    window.localStorage.setItem('-nw-oauthLogin', oauthURL);
    return oauthURL
    // return this.path + '?client_id=' + this.client_id + '&redirect_uri=' + this.redirect_uri + '&udid=' + this.udid + '&response_type='+ this.response_type + '&scope=' + scope + '&custom_layout=desktop';
  }
};

var oAuth = {
  oAuthInfo: oAuthInfo,
  getMe: getMe,
  getMeLibraryCompare: getMeLibraryCompare,
  getReading: getReading,
  getMyReadingsWithHighlights: getMyReadingsWithHighlights,
  getMyHighlights: getMyHighlights,
  getHighlightsByReadingId: getHighlightsByReadingId,
  getMoreHighlights: getMoreHighlights,
  getForever: getForever,
  getMeLibraryTags: getMeLibraryTags,
  downloadEpubUrl: downloadEpubUrl,
  downloadNavUrl: downloadNavUrl,
  readLocalToken: readLocalToken,
  publicKey: publicKey,
  logout: logout
  // ajaxTest: ajaxTest
};

module.exports = oAuth;
