
// var spawn = require('win-spawn');
// var notifier = require('node-notifier-allowed-in-mac-app-store');
// var notifier = require('node-notifier');

var nwNotify = window.App.nwNotify;
var pkg = require('./package.json');

// var child_process = require('child_process');

/*child_process.exec('ls -lh /usr', function(err, stdout, stderr){
  if(err)
    return;

  console.log(stdout);
});*/

var unzip = require('unzip');
var BookItemView = Backbone.View.extend({
  bookId: null,
  circle: null,
  $progressbar: null,
  $mask: null,
  options: null,
  winCover: undefined,
  winBook: undefined,
  events: {
    'click .book-left': 'clickEventHandler',
    'click .notice-icon': 'clickEventHandler',
    'click .book-cover img': 'clickEventHandler',
    'click .book_author': 'clickEventHandler',
    'click .book_title': 'clickEventHandler',
    'click .download-icon': 'clickEventHandler',
    'appear': 'checkBookItem',
    'contextmenu .book-left': 'onRightClick',
    'contextmenu .book-cover': 'onRightClick',
    'contextmenu .book_title': 'onRightClick',
    'contextmenu .book_author': 'onRightClick',
    'click #delete': 'removeBook',
    'click #open': 'clickEventHandler',
    'click #download': 'clickEventHandler',
    'contextmenu .book_cover img': 'onRightClick',
    'blur .iw-contextMenu': 'menuClean',
    'click .iw-contextMenu': 'menuClean',
    'mouseleave .iw-contextMenu': 'menuClean'
  },

  initialize: function(options) {
    window.App.$loadbook.addClass('show');
    this.options = options;
    if (options.type === 'grid')
      this.template = require('./javascripts/templates/library_grid_item.hbs');
    else
      this.template = require('./javascripts/templates/library_list_item.hbs');

    var that = this;
    // Windows 版本的相關路徑
    this.winCover = global.App.pathCover;
    this.winBook = global.App.pathBook;

    // var win_path = 'C:\\Readmoo\\api\\cover\\';
    if (!this.model.get('library_item'))
      return;
    this.bookId = this.model.get('library_item').book.id;
    this.model.set('cover_url', './images/openbook.png'); //default cover icon
    var el = this.template(this.model.attributes);
    this.setElement(el);

    if (options.type === 'grid') { //GridView
      this.$mask = this.$el.find('.mask');
      this.model.on('change:book_download_percent', function(model) {
        var percentage = model.get('book_download_percent');
        // this.onBookDownloading(options);
        this.updateDownloadProgress(options, percentage);
      }, this);

      //action reveal the status of downloading file.
      this.model.on('change:action', function(model) {
        console.log("change:action");
        var action = model.get('action');
        this.$el.attr('data-action', action);
        if (action === 'open') {
          console.log(this);
          this.onBookDownloaded();
        } else if (action === 'downloading') {
          this.onBookDownloading(options);
        } else if (action === 'download') {
          this.onBookNotDownloaded(options);//called while file deleted.
        }
      }, this);

      this.model.on('change:cover_url', function(model) {
        var url = model.get('cover_url');
        // console.log('redraw!');
        this.redraw(options);
        setTimeout(function() {
          this.redraw(options);
        }.bind(this), 1000);
      }, this);
    } else { //ListView

      this.model.on('change:book_download_percent', function(model) {
        var percentage = model.get('book_download_percent');
        this.updateDownloadProgress(options, percentage);
      }, this);

      this.model.on('change:action', function(model) {
        var action = model.get('action');
        this.$el.attr('data-action', action);
        if (action === 'open') {
          this.onBookDownloaded();
        } else if (action === 'downloading') {
          this.onBookDownloading(options);
        } else if (action === 'download') {
          this.onBookNotDownloaded(options);//called while file deleted.
        }
      }, this);

      this.model.on('change:cover_url', function(model) {
        var url = model.get('cover_url');
        // console.log('cover_url: ' + url);
        this.redraw(options);
        setTimeout(function() {
          this.redraw(options);
        }.bind(this), 1000);
      }, this);
    }

    // var coverDest = platform === 'darwin' ? './api/cover/'+this.bookId+'.jpg' : win_path+this.bookId+'.jpg';

    // if (this.checkCoverExist(coverDest)){
    //   var $cover = this.$el.find('img').attr('src', coverDest).addClass('open');
    //   /*$cover.on('load',function(){
    //     that.replaceCoverImg($cover);
    //   });*/
    // }
  },

  menuClean: function(event) {
    console.log("BookItemView menuClean()");

    // $('li[data-bookid] ul').css({display: 'none'});
    this.$el.find('.iw-contextMenu').css({display: 'none'});
  },

  clickEventHandler: function() {
    console.log("BookItemView clickEventHandler()");

    var action = this.model.get('action');
    var library_item = this.model.get('library_item');

    console.log('clickEventHandler', action);

    if (action === 'open' || library_item.file_size === 0) {
      this.openBook(library_item);
    } else if (action === 'download' || action === 'downloading') {
      // this.$el.find('.notice-icon').removeClass('notice-icon').addClass('progress-icon');
      if (navigator.onLine) //make sure network status is ready
        this.downloadBook();
      else {
         // notifier.notify({
         //     'title': 'Readmoo 暫停下載',
         //     'message': ' 網路連線不穩定，建議重新連線後再來下載本書',
         //     'sender': 'com.node-webkit-builder.readmoo',
         //     // 'contentImage': path,
         //     'sound': 'Pop'
         //    });
         var notification = new Notification('Readmoo 暫停下載', {
            tag: '',
            body: ' 網路連線不穩定，建議重新連線後再來下載本書'
         });
      }
    }
  },

  checkBinB: function(options) {
    console.log("BookItemView checkBinB()");

    var library_item = this.model.get('library_item');
    var that = this;
    // console.log('attributes: ' + library_item['file_size']);
    if (library_item['file_size'] === 0 && options.type === 'list') {
      console.info('got BinB book:' + JSON.stringify(library_item['book']));
      this.$el.find('.notice-icon').removeClass('notice-icon').addClass('binb-icon');
      this.$el.find('.progress-bar-wrapper').addClass('open');
      setTimeout(function(){
        that.$el.find('.binb-icon').addClass('open');
      }, 500);
    } else if (library_item['file_size'] === 0 && options.type === 'grid') {
      this.$el.find('.download-icon').removeClass('download-icon').addClass('binb-icon');
      this.$el.find('.binb-icon').addClass('open');
      this.$el.find('.progress-bar-wrapper').addClass('open');
      setTimeout(function() {
        that.$el.find('.binb-icon').addClass('open');
      }, 500);
    }
  },

  offClick: function(){
    console.log("message");
    // $('li[data-bookid] ul').css({display: 'none'});
  },

  //-------------------
  onRightClick: function(e) {
    console.log("BookItemView onRightClick()");

    var action = this.model.get('action');
    var posX = e.pageX;
    var posY = e.pageY - $(window).scrollTop();
    if (this.$el.attr("data-size")!=0) {
        var $this_book = this.$el.find('ul[data-item='+this.bookId+']');
      if (action === 'open') {
        // console.log("message");
        this.$el.parent().find('li[data-bookid] ul').css({display: 'none'});
        $this_book.find('#download').css({display: 'none'});
        $this_book.find('#open').css({display: 'block'});
        $this_book.find('#delete').css({display: 'block'});
        $this_book.css({display: 'block',position:"fixed",top:posY,left:posX});
      }else if (action === 'download') {
        this.$el.parent().find('li[data-bookid] ul').css({display: 'none'});
        console.log($('li[data-bookid="'+this.bookId+'"] #'+this.bookId+' #open'));
        $this_book.find('#open').css({display: 'none'});
        $this_book.find('#delete').css({display: 'none'});
        $this_book.find('#download').css({display: 'block'});
        $this_book.css({display: 'block',position:"fixed",top:posY,left:posX});

      }
    } else {
        var $this_book = this.$el.find('ul[data-item='+this.bookId+']');
        this.$el.parent().find('li[data-bookid] ul').css({display: 'none'});
        $this_book.find('#download').css({display: 'none'});
        $this_book.find('#open').css({display: 'block'});
        $this_book.find('#delete').css({display: 'none'});
        $this_book.css({display: 'block',position:"fixed",top:posY,left:posX});
    }
  },
  //-------------------

  checkCoverExist: function(coverDest) {
    return fs.existsSync(coverDest);
  },

  getFilesizeInBytes: function(coverDest) {
    var stats = fs.statSync(coverDest)
    var fileSizeInBytes = stats["size"]
    return fileSizeInBytes
  },

  checkBookExist: function(type) {
    // console.log("BookItemView checkBookExist()");

    // var win_path = 'C:\\Readmoo\\api\\book\\';
    if (type == "zip")
      var bookDest = platform === 'darwin' ? window.App.pathBook+this.bookId+'.zip' : this.winBook+this.bookId+'.zip';
    else if (type =="folder")
      var bookDest = platform === 'darwin' ? window.App.pathBook+this.bookId : this.winBook+this.bookId;

    var bookDest = window.App.pathBook+this.bookId;
    var exist = fs.existsSync(bookDest);
    var that = this;

    /*if (platform === 'darwin')
      return exist;
    else if (exist) {
      console.log('win book file exist');
      if (!fs.existsSync(bookDest)) {
        fs.mkdirs('./api/book/'+this.bookId, function(err){
            if (err)
              console.error(err);
            else {
              ncp(that.winBook+that.bookId, './api/book/'+that.bookId , function(err){
                if(err)
                  return console.error(err);
                console.log('done!');
              });
            }
        });
      }
    }*/

    // var bookDest = './api/book/'+this.bookId;

    // var bookDest = './api/book/'+this.bookId + '.zip';

    return exist;
  },

  onBookNotDownloaded: function(options) {
    console.log("BookItemView onBookNotDownloaded()");

    this.$el.find('.progress-icon svg').remove();
    this.$el.find('.progress-icon p').remove();
    // console.log('onBookNotDownloaded');
  },

  redraw: function(options) {

    // this.$el.empty();
    // var el = this.template(this.model.attributes);
    // this.setElement(el);
    // $('.library-grid-item:first-child').find('.book-left img').attr('src','api/cover/210030619000101.jpg')

    var dest = this.model.get('cover_url');
    if(options.type == 'grid') {
      var $bookLeft = this.$el.find('.book-left img');
      this.$el.find('.download-icon').addClass('open');
      this.$el.find('.progress-bar-wrapper').addClass('open');
      // this.$el.find('.book-left img').addClass('open');
      // var $cover = this.$el.find('.book-left img').attr('src', dest);
      // $bookLeft.fadeOut('slow')

      // var $cover = $('<img />').attr('src', dest).addClass('open').load(function() {
      //   // 強制將預設書封換成個別書封
      //   $bookLeft.replaceWith($cover);
      //   this.model.set('cover_ready', 'true');
      // }.bind(this));

      $bookLeft.attr('src', dest).addClass('open');
      this.model.set('cover_ready', 'true');

      /*$cover.one('load', function(){
        console.log('image onload fire');
        $bookLeft.replaceWith($cover).fadeOut();
        // this.replaceCoverImg($cover);
      });*/
    }
    else{
      this.$el.find('.download-icon').addClass('open');
      this.$el.find('.progress-bar-wrapper').addClass('open');
      // this.$el.find('.book-left img').hide();
      this.$el.find('.book-cover img').attr('src', dest).addClass('open');
    }

    /*this.$el.empty();
    var el = this.template(this.model.attributes);
    this.setElement(el);
    if(options.type == 'grid')
      $('.library-grid-container').prepend(this.el);
    else
      $('.library-list-container').prepend(this.el);*/

  },

  parseOpfPath: function(dtd) {
    var that = this;
    var bookPath = (platform == 'darwin') ? Utils.fs.path.library + this.bookId : this.winBook + this.bookId;
    // var absBookPath = 'app://readmoo/' + Utils.fs.path.library + this.bookId;
    // var readerPath = 'app://readmoo/javascripts/lib/MooReader';
    console.log("bookPath = " + bookPath);   
    var containerPath = bookPath + '/META-INF/container.xml';
    if (fs.existsSync(containerPath)) {
      fs.readFile(containerPath, {encoding: 'utf8'},function(err, data) {
        // console.log(data);
        console.log($(data).find('rootfile').attr('full-path'));
        var opf = $(data).find('rootfile').attr('full-path');
        // var opfPath = absBookPath + '/' + opf;
        // 特意在最後加上 '?app:' 模擬 app://
        var opfPath = global.App.localServer + '/' + global.App.pathBookRel + that.bookId + '/' + opf;
        console.log("opfPath = " + opfPath);   
        window.localStorage.setItem('-nw-'+that.bookId+'-opf', opfPath);
        // var parserContainer = new xml2js.Parser();
        // parserContainer.parseString(data, function(err, result){
        //  var opf = result.container.rootfiles[0].rootfile[0].$['full-path'];
        //  var opfPath = absBookPath + '/' + opf;
        //  window.localStorage.setItem('-nw-'+that.bookId+'-opf', opfPath);
        // });
        if (dtd)
          dtd.resolve();
      });
    } else {
      console.error('書檔不存在。');
      if (dtd)
        dtd.reject('書檔不存在。');
    }

  },

  openBook: function(library_item) {
    console.log("BookItemView openBook()");

    if (library_item.file_size === 0) {
      //Open Binb Book
      if (navigator.onLine) {
        gui.Shell.openExternal('https://reader.readmoo.com/reader/binbReader.html?cid=' + this.bookId, 'Binb', '');
      } else {
        if (platform !== 'darwin')
          nwNotify.notify('目前網路狀態為離線，本書需要網路連線才能閱讀！', '');
        else {
          // notifier.notify({
          //   'title': 'Readmoo 開啟書檔',
          //   'message': '目前網路狀態為離線，本書需要網路連線才能閱讀！',
          //   'sender': 'com.node-webkit-builder.readmoo',
          //   'sound': 'Pop',
          //   'wait': false
          // });
          var notification = new Notification('Readmoo 開啟書檔', {
             tag: '',
             body: '目前網路狀態為離線，本書需要網路連線才能閱讀！'
          });
        }
      }
      // window.open('https://reader.readmoo.com/reader/binbReader.html?cid=' + this.bookId);
      return;
    }

    var that = this;
    if (platform == 'darwin')
      var bookDest = global.App.pathBook+this.bookId;
    else
      var bookDest = this.winBook+this.bookId;

    function unzipBook() {
      var dtd = $.Deferred();

      /*if (platform === 'darwin'){
        var bookDest = './api/book/'+that.bookId;
      } else {
        var bookDest = that.winBook+that.bookId;
      }*/

      console.log('unzip bookDest: ' + bookDest);
      var unzipFile = unzip.Extract({path: bookDest});

      unzipFile.on('close', function() {
        console.log(that.bookId + ' unziped.');
        that.parseOpfPath(dtd); //save content.opf info localStorage
        /*if (platform === 'darwin')
          that.parseOpfPath(dtd); //save content.opf info localStorage
        else {
          // that.parseOpfPath(dtd);
          if (!fs.existsSync(Utils.fs.path.library+that.bookId)) {
            ncp(that.winBook+that.bookId, Utils.fs.path.library+that.bookId, function(err){
              if (err)
                return console.error(err);
              console.log('winbook parseopf');
              that.parseOpfPath(dtd); //save content.opf info localStorage
              console.log('done!');
            });
          } else {
            that.parseOpfPath(dtd);
          }
        }*/
      }).on('entry', function() {
        console.log(arguments);
      });

      fs.createReadStream(bookDest + '.zip', {autoClose: true})
      .on('error', function(err){
        console.log(err);
      })
      .on('close', function(){
        console.log('read file close.');
        // console.log(arguments);
      })
      .pipe(unzipFile);

      return dtd.promise();
    }

    // 2016 Jackie : 奇怪的邏輯待查，而且還有 window.App.BookMenu vs window.App.BookItemMenu
    function checkBookTitle(title) {
      console.log('checkBookTitle: ' + title);
      var BookMenu = window.App.BookMenu;
      for (var i=0; i<BookMenu.submenu.items.length; i++){
            // console.log(BookMenu.submenu.items[i].label);
            if (title == BookMenu.submenu.items[i].label){
              // console.log('equal');
              return true; //allow duplicate windows
            }
            // console.log('not equal');
      }
      return true; // not exists in bookmenu
    }

    function removeBookTitle(title) {
      // console.log('removeBookTitle: ' + title);

      var BookMenu = window.App.BookMenu;
      var BookItemMenu = window.App.BookItemMenu;
      // console.log('check: '+BookMenu.submenu.items[2].label == title);
      // console.log('before delete: ' + BookMenu.submenu.items);
      for (var i=0; i<BookMenu.submenu.items.length; i++){
            // console.log(BookMenu.submenu.items[i].label);
            if (title == BookMenu.submenu.items[i].label) {
                // console.log('equal @i: '+i);
               // BookMenu.submenu.items.splice(i,1);
               BookItemMenu.removeAt(i);
              // console.log(BookMenu.submenu.items[i].label);
            }

      }
      if (platform !== 'darwin') {
          var BookMenu = new window.gui.MenuItem({ label: '視窗', submenu: BookItemMenu});
          rootMenu = window.App.rootMenu;
          rootMenu.removeAt(1);
          rootMenu.insert(BookMenu, 1);
          window.App.BookItemMenu = BookItemMenu;
          // console.log(BookItemMenu);
          window.App.rootMenu = rootMenu;
          win.menu = rootMenu;
      }
      // console.log('after delete: ' + BookMenu.submenu.items);
      window.App.BookMenu = BookMenu;
      window.App.BookItemMenu = BookItemMenu;
    }

    function StartRead() {
        console.log("StartRead()");
        // 開啟 MooReader 'loader' 會出現 "Uncaught ReferenceError: global is not defined"
        // var bookUrl = global.localServer + '/javascripts/lib/MooReader/reader.html?cid=' + that.bookId+'&event=0';
        var bookUrl = './javascripts/lib/MooReader/reader.html?cid=' + that.bookId+'&event=0'; // for openbook #event stand for subscribe ch
        var libraryItemCollection = window.App.LibraryItemCollection,
            title;
        libraryItemCollection.each(function(model){
          if (model.get('library_item')){
            if (model.get('library_item').book.id == that.bookId) {
              console.log('title: ' + model.get('library_item').book.title);
              // return model.get('library_item').book.title;
              title = model.get('library_item').book.title;
            }
          }
        });

        var winOptions = {
          position: 'center',
          title: title,
          width: window.App.mainWin.width,
          height: window.App.mainWin.height - 25,
          focus: true,
          toolbar: pkg.debug =='yes' ? true : false,
          'new-instance' : false
        };

        // window.location.replace(bookUrl);

        /*var test_url = 'https://member.readmoo.com/oauth?client_id=76a95762391761d9aa4ca7b4e39dcb8e&response_type=token&redirect_uri=https%3A%2F%2Freader.readmoo.com%2Freader%2Freader.html&display=page&scope=reading%2Chighlight%2Clike%2Ccomment%2Cme%2Clibrary&state=%7B%22client_id%22%3A%2276a95762391761d9aa4ca7b4e39dcb8e%22%2C%22network%22%3A%22readmoo%22%2C%22display%22%3A%22page%22%2C%22callback%22%3A%22_hellojs_9vtlhw20%22%2C%22state%22%3A%22%22%2C%22oauth_proxy%22%3A%22%22%2C%22scope%22%3A%5B%22reading%22%2C%22highlight%22%2C%22like%22%2C%22comment%22%2C%22me%22%2C%22library%22%2C%22basic%22%5D%2C%22oauth%22%3A%7B%22version%22%3A2%2C%22auth%22%3A%22https%3A%2F%2Fmember.readmoo.com%2Foauth%22%2C%22logout%22%3A%22https%3A%2F%2Fmember.readmoo.com%2Foauth%2Fsign_out%22%7D%7D';
        window.location.replace(test_url);*/

        console.log('bookUrl = ' + bookUrl);

        // 此處的 bookUrl 必須保持 app:// 的方式，MooReader 才能取得傳遞資料的 global 物件
        // global.window.App[this.epubReadingSystem.bookId]['epubReadingSystem'] = epubReadingSystem;
        var bookWindow = gui.Window.open(bookUrl, winOptions);
        bookWindow.setPosition('center');

        bookWindow.on('focus', function() {
            // window.App[that.bookId].epubReadingSystem = window.epubReadingSystem;
        });

        bookWindow.on('close', function() {
          console.info("bookWindow.on('close') =", winOptions.title);
          console.log("navigator.onLine =", navigator.onLine);

          // var title = this.title;
          // title = title.split('|')[0].replace(/\s+/g, '');
          // console.log('closeing: '+title);
          // 書櫃的標題，有時候與書內的標題不同，所以此處必須使用書櫃的標題
          var title = winOptions.title;
          var win = gui.Window.get();

          // console.log(global.window.App.epubReadingSystem.hasPlugin('readinglog'));
          var epubReadingSystem = window.App[that.bookId]['epubReadingSystem']; //created by MooReader
          if ((typeof epubReadingSystem !== "undefined") && epubReadingSystem.hasPlugin('readinglog') && navigator.onLine) {
            // 更新閱讀進度
            epubReadingSystem.getPluginAsync('readinglog', function(readinglog) {
              // console.log(readinglog);
              readinglog.doPing();
              win.emit('readingSync'); // 發訊息到 main.js 做事情
              /*
              delete epubReadingSystem;
              // delete global.window.epubReadingSystem;
              delete window.App[that.bookId];
              removeBookTitle(title);
              // var libraryItems = JSON.parse(window.localStorage.getItem('-nw-library'));
              // window.App.mainWin.emit("reading", { bookId: '123456789', progress: '0.32', touched_at: '2015-08-31T17:00:37Z'});
              // window.App['BooksOpenList'].pop(that.bookId);
              bookWindow.close(true);
              */
            });
          }
          // } else {
          // 整理程式，將共同的邏輯拉出來
            delete window.App[that.bookId];
            delete epubReadingSystem;
            removeBookTitle(title);
            //TODO show lost data message!
            bookWindow.close(true);
            console.log('book closed');
          // }
        });

        // console.log('that.bookId: ' + that.bookId);

        window.App[that.bookId] = bookWindow;
        window.App['BooksOpenList'].push(that.bookId);

        // var bookWindow = gui.Window.open(Url , winOptions);
        // bookWindow.on('focus', function(){
        //  console.log(this);
        // });
        // bookWindow.on('blur', function(){
        //  console.log(this);
        // });

        //--------- Menu Item -----------//

        if (!window.App.BookItemMenu) {
          var BookItemMenu = new window.gui.Menu();
          BookItemMenu.append(new window.gui.MenuItem({
            label: title,
            click: function(){
              bookWindow.focus();
          }}));
          window.App.BookItemMenu = BookItemMenu;
          console.log(BookItemMenu);
        } else {
          // console.log('title');
          var BookItemMenu = window.App.BookItemMenu;
          if (checkBookTitle(title)) {
            BookItemMenu.append(new window.gui.MenuItem({
              label: title,
              click: function(){
                bookWindow.focus();
            }}));
          }
          window.App.BookItemMenu = BookItemMenu;
        }

        if (platform !== 'darwin') {
          var BookMenu = new window.gui.MenuItem({ label: '視窗', submenu: BookItemMenu});
          rootMenu = window.App.rootMenu;
          rootMenu.removeAt(1);
          rootMenu.insert(BookMenu, 1);
          window.App.BookItemMenu = BookItemMenu;
          // console.log(BookItemMenu);
          window.App.BookMenu = BookMenu;
          window.App.rootMenu = rootMenu;
          win.menu = rootMenu;
        }
        /*if (!window.App.BookMenu) {
          var BookMenu = new window.gui.MenuItem({ label: '視窗', submenu: BookItemMenu});
          window.App.rootMenu.append(BookMenu);
          window.App.BookMenu = BookMenu;
        } else {
          var BookMenu = window.App.BookMenu;
          console.log(BookMenu.submenu);
          if(checkBookTitle(title)){
            console.log('append check!');
            BookMenu.submenu = BookItemMenu; //set submenu
            window.App.BookMenu = BookMenu;
          }
        }*/

        // 2016/04/22 還原書櫃該項目的亮度
        that.$el.fadeTo("fast", 1.0);
    }

    // var bookUrl = './javascripts/lib/MooReader/reader.html?cid=' + '210021517000101'; // for cookie
    // var bookUrl = './javascripts/lib/MooReader/reader.html?cid=' + '210005747000101'; // for encryption

    //https://reader.readmoo.com/reader/binbReader.html?cid=220029760000101 // for BinB book
    console.log('download_status: ' + this.model.get('download_status'));

    // 2016/04/22 降低書櫃該項目的亮度，暗示正在行動中。開書完成後會恢復亮度
    this.$el.fadeTo("slow", 0.3);

     if (!fs.existsSync(bookDest)) {
       unzipBook().done(function() {
         // 2016/06/30 完成解壓縮後，刪除 zip 書檔
         fs.removeSync(bookDest + ".zip");
         StartRead();
       });
     } else if (window.App[that.bookId] == undefined) {
       // 變更每次異動的 port
       lsKey = "-nw-" + that.bookId + "-opf";
       opfUrl = window.localStorage.getItem(lsKey);
       newUrl = global.App.localServer + opfUrl.substr(21);
       console.log("newUrl = " + newUrl);
       window.localStorage.setItem(lsKey, newUrl);

       StartRead();
     } else {
        // notifier.notify({
        //   'title': 'Readmoo 開啟書檔',
        //   'message': '本書已經開啟',
        //   'sender': 'com.node-webkit-builder.readmoo',
        //   'sound': 'Pop',
        //   'wait': false
        // });
        var notification = new Notification('Readmoo 開啟書檔', {
           tag: '',
           body: '本書已經開啟'
        });
        // 2016/04/22 還原書櫃該項目的亮度
        this.$el.fadeTo("fast", 1.0);
     }

    /*if (platform === 'darwin') {
      if (!this.checkBookExist('folder')) {
        unzipBook().done(StartRead);
      } else {
        StartRead();
      }
    } else {
      var winBookDest = that.winBook+that.bookId,
          downloadStatus = localStorage.getItem('-nw-'+this.bookId+'-download');

      if (!fs.existsSync(bookDest)) {
        unzipBook().done(StartRead);
      } else {
        StartRead()
      }
      // this.checkWinBookExist().done(StartRead)
    }*/
  },

  onBookDownloaded: function() {
      // this.$el.find('.mask').css('opacity', '0');
    this.$el.find('.mask #progress_icon').children().remove();
    // this.parseOpfPath();
  },

  onBookDownloading: function(options) {
    // console.log('type: ' + options.type);
    if (options.type === 'grid') {
      // this.$progressbar = this.$el.find('.progress');
      var item = this.$el.find('#progress-icon');

      this.circle = new ProgressBar.Circle(item[0], {
          duration: 1500,
          color: "#00A0E8",
          trailColor: "#ddd",
          trailWidth: 2,
          strokeWidth: 8,
          easing: 'linear',
          text: {
            autoStyle: false,
            value: '0'
          },
          step: function(state, bar) {
              bar.setText((bar.value() * 100).toFixed(0) + '%');
          }
      });
    }
    else {
      var item = this.$el.find('#progress-icon');
      this.circle = new ProgressBar.Circle(item[0], {
          duration: 1500,
          color: "#00A0E8",
          trailColor: "#ddd",
          trailWidth: 1,
          strokeWidth: 6,
          easing: 'linear',
          text: {
            value: '0'
          },
          step: function(state, bar) {
              bar.setText((bar.value() * 100).toFixed(0) + '%');
          }
      });
    }
  },

  updateDownloadProgress: function(options, percentage){
    var startColor = '#FC5B3F',
        endColor = '#6FD57F';

    // if (options.type === 'grid') {
    //   percentage +='%';
    //   this.$progressbar.css('width', percentage);
    // } else {
      // console.log('list percentage: ' + percentage);
      percentage *=0.01;
      // console.log('percentage: ' + percentage);
      if (this.circle) {
        this.circle.animate(percentage,{
          from: {color: startColor},
          to: {color: endColor}
        });
      }
    // }
  },

  downloadBook: function() {
    var that = this;

    if (!fs.existsSync(global.App.pathBook) && platform === 'darwin') {
      fs.mkdir(global.App.pathBook);
    } else if (!fs.existsSync(this.winBook) && platform !== 'darwin') {
      fs.mkdir(this.winBook);
    }

    // var that.win_path = 'C:\\Readmoo\\api\\book\\';

    if (this.model.get('action') === 'download') {
      var that = this;
      var token = window.localStorage.getItem('-nw-access_token');
      if (token && this.bookId) {
        var reqUrl = oAuth.downloadEpubUrl(token, this.bookId);
        var navUrl = oAuth.downloadNavUrl(this.bookId);
        // console.log(reqUrl);
      } else {
        // notifier.notify({
        //   'title': 'Readmoo 下載書檔',
        //   'message': '使用者登入已經過期，建議登出後再重新登入',
        //   'sender': 'com.node-webkit-builder.readmoo',
        //   'sound': 'Pop',
        //   'wait': false
        // });
        var notification = new Notification('Readmoo 下載書檔', {
           tag: '',
           body: '使用者登入已經過期，建議登出後再重新登入'
        });

        return false;
      }

      var options = {
        url: navUrl,
        method: 'GET'
      };

      var title = 'dummy';
      var libraryItemCollection = App.LibraryItemCollection;

      libraryItemCollection.each(function(model) {
        if (model.get('library_item')){
          if (model.get('library_item').book.id == that.bookId) {
            // console.log('title: ' + model.get('library_item').book.title);
            // return model.get('library_item').book.title;
            title = model.get('library_item').book.title;
            // Jackie : 找到後應該中斷，或者直接用 id search
          }
        }
      });
      // var foundModel = libraryItemCollection.findWhere({library_item.book.title : that.bookId});
      // title = foundModel.get('library_item').book.title;
      // console.log("2016/01/21 title = " + title);

      request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          var weightsObj = $.parseJSON(body).weights;
          var weights = [];
          for( weight in weightsObj){
            weights.push(weightsObj[weight]);
          }
          window.localStorage.setItem('-nw-'+that.bookId+'-weights', weights);
          console.log(window.localStorage.getItem('-nw-'+that.bookId+'-weights'));
        }
      });

      console.log(reqUrl);

      if (platform !== 'darwin')
        var bookPath = this.winBook;
      else
        var bookPath = Utils.fs.path.library;

      var downloadPromise = Utils.fs.download(reqUrl, bookPath+this.bookId+'.zip', this.model, null);
      console.log("downloadPromise = ", downloadPromise);

      if (downloadPromise && platform !== 'darwin') { //for win platform downloading

        downloadPromise.done(function(result){
           /*if (!fs.existsSync(that.winBook+that.bookId)) {
            fs.mkdirs(that.winBook+that.bookId, function(err){
              if (err)
                return console.error(err);
            });
           }*/

           setTimeout(function(){ that.model.set('action', 'open'); }, 1000);
           nwNotify.notify('Readmoo 【' + title + '】 下載完成', '');

        }).fail(function(error){
          console.log('got an error: ' + error);
          // that.model.set('action','download');
          that.model.set('action','download'); // invoke onBookNotDownloaded
          console.log('error: ' + error);
          if (error == '403' || error == '401' || error == '412') {
            nwNotify.notify('Readmoo 下載錯誤', ' 使用者登入已經過期，建議登出後再重新登入');
          } else if (error == 'ESOCKETTIMEDOUT') {
            nwNotify.notify('Readmoo 下載異常', ' 網路連線不穩定，建議重新連線後再來下載本書');
          } else if(error == 'ETIMEDOUT') {
            nwNotify.notify('Readmoo 下載異常', ' 伺服器無回應，請重新下載本書');
          } else {
            nwNotify.notify('Readmoo 下載異常', ' 伺服器無回應，請重新下載本書');
          }
        });

      } else if (downloadPromise) {
        downloadPromise.done(function(){
          console.log('downloadPromise.done');
          // var path = window.App.pathCover+that.bookId+'.jpg';

          // setTimeout(function(){ that.model.set('action', 'open'); }, 3000);

          global.window.App.oauth_api.api.me().get().success(function(data){
            userId = data['user']['id'];
            console.log("userId =", userId)
            global.window.App.oauth_api.api.readings({userId: userId , book_id: that.bookId}).getReadingsByUserIdWithMatch().success(function(data){
              console.log("getReadingsByUserIdWithMatch() data =", data);
              if (data.status === 200 && (data['items'].length > 0)) {
                // 確保已經有 reading 的值（已經開過這本書）

                // 寫入 reading
                global.window.App.readingsCollectionDB.update(
                  { bookid: that.bookId },
                  { bookid: that.bookId,
                    reading: data['items'][0]['reading'] },
                  { upsert: true }
                );
                // 確保 Medea 正確處理資料
                global.window.App.readingsCollectionDB.store.db.db.compact(function(){});
                // global.window.App.readingsCollectionDB.insert([{
                //   bookid: that.bookId,
                //   reading: data['items'][0]['reading']
                // }]);

                 var readingId = data['items'][0]['reading']['id'];
                 global.window.App.oauth_api.api.highlights({readingId: readingId, count:100}).getHighlightsByReadingId().success(function(data){
                    console.log('getHighlightsByReadingId() data =', data);
                     data['items'] = _.pluck(data.items, 'highlight');
                    // 寫入 highlight
                    global.window.App.annosCollectionDB.update(
                      { bookid: that.bookId },
                      { bookid: that.bookId,
                        annos: data['items'],
                        readingId: readingId },
                      { upsert: true }
                    );
                    // 確保 Medea 正確處理資料
                    global.window.App.annosCollectionDB.store.db.db.compact(function(){});
                    // global.window.App.annosCollectionDB.insert([{
                    //   bookid: that.bookId,
                    //   annos: data['items'],
                    //   readingId: readingId
                    // }]);

                    global.window.App.oauth_api.api.bookmarks({ readingId: readingId, count: 100}).getBookmarksByReadingId().success(function(data){
                        console.log('getBookmarksByReadingId() data =', data);

                        data['items'] = _.pluck(data.items, 'bookmark')
                        if (data.status === 200 && data.hasOwnProperty('items')) {
                          // 寫入 bookmark
                          global.window.App.bookmarksCollectionDB.update(
                            { bookid: that.bookId },
                            { bookid: that.bookId,
                              bookmarks: data['items'],
                              readingId: readingId },
                            { upsert: true }
                          );
                          // 確保 Medea 正確處理資料
                          global.window.App.bookmarksCollectionDB.store.db.db.compact(function(){});
                          // global.window.App.bookmarksCollectionDB.insert([{
                          //   bookid: that.bookId,
                          //   bookmarks: data['items'],
                          //   readingId: readingId
                          // }]);
                        }

                        that.model.set('action', 'open');
                        var notification = new Notification('下載完成! :)', {
                          tag: '',
                          body: '【' + title + '】'
                        });
                      });
                  });
              }
              else {
                console.log('No readings');

                // 未開啟過的書，只要改變狀態即可
                that.model.set('action', 'open');
                var notification = new Notification('下載完成! :)', {
                  tag: '',
                  body: '【' + title + '】'
                });
              }
            });
          });

          /*notifier.notify({
             'title': '【' + title + '】',
             // 'subtitle': 'Readmoo',
             'message': '下載完成！',
             'contentImage': path,
             // 'appIcon': process.cwd() + '/appicon/notify.png',
             'sound': 'Submarine',
             'sender': 'com.node-webkit-builder.readmoo',
             'wait': false
          });*/

        }).fail(function(error){
          // var path = window.App.pathCover+that.bookId+'.jpg';
          // that.onBookDownloaded();
          that.model.set('action','download'); // invoke onBookNotDownloaded
          console.log('error: ' + error);
          if (error == '403' || error == '401' || error == '412') {
             // notifier.notify({
             //  'title': 'Readmoo 下載錯誤',
             //  'message': ' 使用者登入已經過期，建議登出後再重新登入',
             //  'sender': 'com.node-webkit-builder.readmoo',
             //  'contentImage': path,
             //  'sound': 'Pop',
             //  'wait': false
             // });
             var notification = new Notification('Readmoo 下載錯誤', {
                tag: '',
                body: '使用者登入已經過期，建議登出後再重新登入'
             });

          } else if (error == 'ESOCKETTIMEDOUT') {
            // notifier.notify({
            //   'title': 'Readmoo 下載異常',
            //   'message': ' 網路連線不穩定，建議重新連線後再來下載本書',
            //   'sender': 'com.node-webkit-builder.readmoo',
            //   'contentImage': path,
            //   'sound': 'Pop',
            //   'wait': false
            //  });
            var notification = new Notification('Readmoo 下載異常', {
               tag: '',
               body: '網路連線不穩定，建議重新連線後再來下載本書'
            });
          } else if(error == 'ETIMEDOUT') {
             // notifier.notify({
             //  'title': 'Readmoo 下載異常',
             //  'message': ' 伺服器無回應，請重新下載本書',
             //  'sender': 'com.node-webkit-builder.readmoo',
             //  'contentImage': path,
             //  'sound': 'Pop',
             //  'wait': false
             // });
             var notification = new Notification('Readmoo 下載異常', {
                tag: '',
                body: ' 伺服器無回應，請重新下載本書'
             });
          }
        });
      }
    } else if (this.model.get('action') === 'downloading' && !this.circle) {
      this.onBookDownloading(this.options); //initial circle svg object
    }
  },

  removeBook: function(bookId,options) {
    // 參數列上的 bookId 是 MouseEvent 物件，別被騙了！要用 this.bookId 取得書籍代號
    console.log("removeBook() this.bookId =", this.bookId);

    var that = this;
    var win_path = this.winBook;
    var path2 = win_path + this.bookId;
    this.$el.find('svg').remove(); //for ListView
    this.$el.find('.progressbar-text').remove(); //for ListView

    var str = '-nw-'+this.bookId+'-download';
    window.localStorage.removeItem(str);

    var deleteFolderRecursive = function(path) {
      if( fs.existsSync(path) ) {
        fs.readdirSync(path).forEach(function(file,index){
          var curPath = path + "/" + file;
          if(fs.lstatSync(curPath).isDirectory()) { // recurse
            deleteFolderRecursive(curPath);
          } else { // delete file
            fs.unlinkSync(curPath);
          }
        });
        fs.rmdirSync(path);
      }
    };
    if (this.model.get('action') === 'open') {
      if (platform=="win32" || platform=="win64"){
        fs.unlink('./'+win_path + this.bookId +".zip", function (err) {
          if (err) throw err;
          console.log('successfully deleted '+win_path);
          var str = '-nw-'+bookId+'-download';
          localStorage.removeItem(str);
        });

        deleteFolderRecursive(path2);
        this.model.set('action', 'download');
      } else {
        // fs.unlink('./'+Utils.fs.path.library + this.bookId+".zip", function (err) {
        //   if (err) throw err;
        //   console.log('successfully deleted '+'./'+Utils.fs.path.library + this.bookId+".zip");
        // });

        var path1 = Utils.fs.path.library + this.bookId;
        console.log("path1 = " + path1);
        // 清除已解開的書籍目錄及壓縮檔
        fs.removeSync(path1);
        fs.removeSync(path1 + ".zip");

        // deleteFolderRecursive(path1);

        this.model.set('action', 'download');
      }
    }

    // 移除 Table
    window.App.encryptionDB.remove({_id: this.bookId}, {multi: true}, function(err, table){
      // 確保 Medea 正確處理資料
      window.App.encryptionDB.store.db.db.compact(function(){});
    });

    var options = {type: "grid"}

    this.updateDownloadProgress(options, 0);
  },

  // replaceCoverImg: function(img){
  //   this.$el.find('img').replaceWith(img);
  // },

  checkBookItem: function(){
    // console.log('winCover: ' + this.winCover);
    // console.log('checkBookItem!');
    var action = this.model.get('action'),
        cover_ready = this.model.get('cover_ready');

    if (action === 'downloading') {
      this.$el.find('#download').trigger('click');
      // console.log('donothing!');
      // return;
    }

    var that = this;
    var request = require('requestretry'); // 用來取書封
    var options = this.options;
    var book = this.model.get('library_item').book;
    var bookId = book.id;
    var reqUrl = book.cover_url;

    // window.App.$loader.removeClass('show');
    // var win_path = 'C:\\Readmoo\\api\\cover\\';

    // console.log('fs.existsSync: ' + fs.existsSync(that.win_path));

    // 2016 已經沒有 BinB 的書了
    // this.checkBinB(options);

    if(!fs.existsSync(global.App.pathCover) && platform ==='darwin'){
      fs.mkdir(global.App.pathCover);
    } else if(!fs.existsSync(this.winCover) && platform !== 'darwin'){
      fse.mkdirs(this.winCover, function(err) {
      if(err)
        console.log('error');
      else
        console.log('success create cover folder');
      });
    }

    // var coverDest = platform === 'darwin' ? global.App.pathCoverRel+this.bookId+'.jpg' : this.winCover+this.bookId+'.jpg';
    var coverDest = global.App.pathCoverRel + this.bookId + '.jpg';
    var fileCover = global.App.rootData + coverDest;
    if (!this.checkCoverExist(fileCover)){
      // 不存在就立刻下載
       var options = {
         url : reqUrl,
         maxAttempts: 5,   // (default) try 5 times
         retryDelay: 5000,  // (default) wait for 5s before trying again
         retryStrategy: request.RetryStrategies.HTTPOrNetworkError
       };
       var r = request(options,function(err, response, body) {
          // console.log('requestretry: ' + response.statusCode);
       });
       // var dest = './api/cover/'+this.bookId+'.jpg';

       // 由 r 以 pipe() 方式寫入 ws
       var ws = fs.createWriteStream(fileCover);
       function handleError(){
          console.log('got an error when download cover');
          if (ws.bytesWritten === 0) {
            fs.unlinkSync(fileCover);
          }
       };
       // 重複的宣告
       // r.on('error', function() {
       //   //download error, clear empty file.
       //   console.log('error');
       //   if (ws.bytesWritten === 0) {
       //     console.log('it is 0! ');
       //     if (fs.exists(fileCover)) {
       //       fs.unlinkSync(fileCover);
       //     }
       //   }
       // });

       /*r.on('response', function(response){
         console.log('cover response: ' + response.statusCode);
       });*/

       ws.on('close', function() {
         //write over.
         // window.coverDownloading -= 1;
         that.model.set('cover_url', coverDest);
         // var $cover = $('<img>').attr('src', dest);
         if (platform !== 'darwin') { //for windows platform
           /*fse.move(dest, that.winCover + that.bookId + '.jpg', function(err){
             if (err) {
               return console.error('copy fail');
             }
             else {
                console.log("success!");
             }
           });*/
         }
         /*$cover.on('load',function(){
           // console.log($cover);
           that.replaceCoverImg($cover);
         });*/
       });
       r.on('error', handleError)
       .pipe(ws); //write stream to platform dest

    } else { //book cover exist
       // console.log('cover exist!');
       // console.log('cover_size: ' + this.getFilesizeInBytes(coverDest));
       var coverSize = this.getFilesizeInBytes(fileCover);
       if (coverSize > 100) {
          // 確認檔案無毀損才填入
          this.model.set('cover_url', coverDest);
       }
       var download_status = window.localStorage.getItem('-nw-'+this.bookId+'-download');
       if (download_status == 'finish')
          this.model.set('action', 'open');
       // that.model.set('cover_url', coverDest);
       // if(coverSize == 0){
       //    fs.unlinkSync(coverDest);
       // }
       // this.$el.find('.download-icon').addClass('open');
       // var $bookLeft = this.$el.find('.book-left img');
       // var $cover = this.$el.find('img').attr('src', coverDest);
       // // this.$el.find('img').attr('src', coverDest).addClass('open');
       // $cover.one('load', function(){
       //    $bookLeft.replaceWith($cover);
       // });
       // $cover.addClass('open');
       this.$el.find('.progress-bar-wrapper').addClass('open');
    }
  },

  // template: require('./javascripts/templates/library_item.hbs'),

  render: function() {
    /*this.$el.empty();
    var el = this.template(this.model.attributes);
    this.setElement(el);*/
    return this;
  }
});
