var nwNotify = require('nw-notify');

nwNotify.setConfig({
  appIcon: nwNotify.getAppPath() + 'appicon/notify.png',
      defaultStyleText: {
          color: '#FF000',
          fontWeight: 'bold'
      }
});

var MenuListView = Backbone.View.extend({
  el: '.menu',

  $iframe: undefined,

  initialize: function() {
    // this.collection.on('change', this.render, this);
    // console.log(this.model.toJSON());
    this.model.on('change:activePage', this.render, this);
    // console.log('client_id: ' + this.model.get('client_id'));
    this.$iframe = window.App.$iframe;
    this.$iframe.load(function(){
      console.log('finish load iframe!');
      window.App.$loadavatar.hide();
    });
    this.render();
  },

  events: {
    'click .menu-item': 'click'
  /*  'mouseenter .menu-item:first-child': 'rotate',
    'mouseleave .menu-item:first-child': 'rotate'*/
  },

  click: function(event) {

    event.preventDefault();
    var name = $(event.currentTarget).attr('data-name');
    console.log('name: ' + name);
    if (name == 'highlights' || name == 'badges' || name == 'settings') { //unsupport menu items
      window.App.$wall.removeClass('open');
      if (platform == 'darwin') {
        var notification = new Notification('此功能尚未完成，敬請期待！', {
            tag: '',
            body: ''
        });
        notification.onshow = function(){
          setTimeout(function(){ notification.close();}, 1000);
        };
      } else {
        nwNotify.notify('此功能尚未完成，敬請期待！', '');
      }
    } else if (name == 'award') {
      // console.log('click award item');
      if (navigator.onLine) {

        if (this.$iframe.attr('src'))
          this.$iframe.attr('src', '');

        window.App.$wall.removeClass('open');
        window.App.$opinion.removeClass('open');
        var $booklist = $('.mybooklist');
        var access_token = window.localStorage.getItem('-nw-access_token'),
            $mainContent = window.App.$mainContent;

        $booklist.addClass("close");

        /*var winOptions = {
            position: 'center',
            width: 512,
            height: 768,
            focus: true,
            toolbar: false,
            'new-instance' : false
        };*/

        var url = 'https://member.readmoo.com/oauth/redirect/aHR0cHM6Ly9yZWFkLnJlYWRtb28uY29tL2F3YXJk?client_id=' +
        this.model.get('client_id') + '&access_token=' + access_token + '&custom_layout=desktop';
        $mainContent.fadeOut('slow');
        if (this.$iframe.attr('src') == ''){
          window.App.$loadavatar.show();
          this.$iframe.attr({'src': url, 'style': 'display: block; position: absolute; width: 100%; height: 100%; margin-top: 1%; margin-left: 4%;'});
        }
        else
          this.$iframe.fadeIn('fast');
        // this.model.set('activePage', name);
        if(window.nwApp)
          window.nwApp.navigate(name, {trigger: true});
        /*gui.Window.open('https://member.readmoo.com/oauth/redirect/aHR0cHM6Ly9yZWFkLnJlYWRtb28uY29tL2F3YXJk?client_id=' +
        this.model.get('client_id') + '&access_token=' + access_token + '&custom_layout=app',winOptions);*/
      } else {
        nwNotify.notify('本頁面需網路連線狀態才能呈現喔！', '');
      }
    } else if (name == 'opinions') {
      var $mainContent = window.App.$mainContent,
          $booklist = $('.mybooklist'),
          $iframe = $('iframe');
      $booklist.addClass("close");
      window.App.$wall.addClass('open');
      window.App.$opinions.addClass('open');

      if(window.nwApp)
            window.nwApp.navigate(name, {trigger: true});

      $mainContent.fadeOut();
      $iframe.fadeOut();

    } else if (name == 'subscribe') {
      console.log('subscribe mode do nothing now!');
      // TODO gui.Window.open('https://....');
      // this.model.set('activePage', name);
    } else if (name == 'library') {
      window.App.$wall.removeClass('open');
      window.App.$opinion.removeClass('open')
      $("#list_icon").toggleClass('imgActive');
      this.model.set('activePage', name);

      // if(window.nwApp)
      //   window.nwApp.navigate(name, {trigger: true});
      // var $node = $(this.$el.find('.menu-item')[1]);
      var $booklist = $('.mybooklist');
      // $node.toggleClass("collapsed");
      $booklist.toggleClass("close");

      // 只為了將 url 填上 library
      if (window.nwApp)
        window.nwApp.navigate('library',{trigger: true});

      /*if ($node.hasClass("collapsed"))
        $booklist.slideUp(450);
      else
        $booklist.slideDown(450);*/
    } else {
      window.App.$wall.removeClass('open');
      this.model.set('activePage', name);
    }
  },

  template: require('./javascripts/templates/menu_list.hbs'),

  rotate: function(event) {
    event.preventDefault();
    // this.$el.find('#sync_icon').toggleClass('notify');
    // console.log('rotate now!');
  },

  render: function() {
    console.log(' MenuListView render!');
    // this.$el.empty();
    //TODO login check
    var login_status = true;

    if (localStorage.getItem('login_status') == "false") {
      var pageConfig = [ {name: "portal", text: "最新書籍"}, { name: "freebooks", text: "免費書籍"}, { name: "login", text: "登入"}];
      this.model.set('pageConfig', pageConfig);
      console.log('attributes: ' + JSON.stringify(this.model.attributes));
      login_status = false;
    }

    var temp = this.template(this.model.attributes),
        activePage = this.model.get('activePage'),
        Page = login_status ? 'logout' : 'login';

    console.log('activePage: ' + activePage);

    /*if(activePage === 'sync'){
        activePage = 'library'; //override
        //TODO sync percent diagram
    }*/

   /* if(activePage === 'library')
      document.styleSheets[0].addRule('.topbar .grid-style::before', 'background-color: seagreen');*/

    // temp  = $(temp).find('[data-name='+activePage+']').attr('data-state', 'active');
    // console.log(temp);

    this.$el.empty().append(temp);
    if (login_status !== false) {
      var $item1 = $(this.$el.find('.menu-item')[0]),
          $item2 = $(this.$el.find('.menu-item')[1]);
      $item1.append('<img id="sync_icon" src="images/sync.png" style=" width: 13px;height: 13px;top: 7px;float: right;position: relative;margin-right: 20%"/>');
      $item2.append('<img id="list_icon" src="images/RO.png" style=" width: 15px;height: 15px;position: relative;top: 5px;float: right;margin-right: 20%"/>');
      this.$el.find('[data-name='+activePage+']').attr('data-state', 'active');
    }

    /*this.$el.find('[data-name=freebooks]').before('<li class="shopping"><a style=" \
    position:relative; top:4px; left:0px; color: inherit; text-decoration: none; cursor: pointer"> \
    前往Readmoo買書</a></li>');*/


    /*// this.$el.find('[data-name=library]').toggleClass('collapsed');
    $node = $(this.$el.find('.menu-item')[0]);
    $node.addClass("collapsed");*/

    if(window.nwApp)
      window.nwApp.navigate(activePage, {trigger: true});

    // this.collection.each(function(model){
    //  var menuItemView = new App.Views.MenuItemView({model: model})
    //  this.$el.append(menuItemView.render().el);
    // }, this);
  }
});
