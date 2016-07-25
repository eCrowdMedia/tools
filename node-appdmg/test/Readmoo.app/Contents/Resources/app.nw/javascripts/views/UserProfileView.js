

var UserProfileView = Backbone.View.extend({
  el: '.user-profile-container',

  events: {
    'focusin .profile img': 'dialog',
    'focusout .profile img': 'dialog',
    'focusin .nickname': 'dialog',
    'focusout .nickname': 'dialog',
    'click .logout': 'logout',
    'click .account': 'account'
  },

  initialize: function(){
    // console.log('0518 user_profile: ' + this.model.get('userProfile').avatar_url);
    if(this.model.get('userProfile'))
      this.downloadAvatar(this.model.get('userProfile').avatar_url);
    else
      this.downloadAvatar('default');

    $('.app-title #avatar').on('click', this.dialog);

    // console.log(this.model.toJSON());
  },

  template: require('./javascripts/templates/user_profile.hbs'),

  downloadAvatar: function(url){
    var that = this;
    avatarPath = global.App.pathAvatar;
    // window.App.pathAvatar = avatarPath; // 登出的時候要刪除

    if (!fs.existsSync(avatarPath)) {
      fs.mkdir(avatarPath);
    }

    if (url === 'default'){
      window.avatar_url = './images/default-avatar.jpg';
      this.model.set('avatar_url','./images/default-avatar.jpg');
      return;
    }

    window.avatar_url = global.App.pathAvatarRel + 'avatar-'+this.model.get('userId')+'.jpg';
    var dest = global.App.rootData + window.avatar_url;

    var r = request(url);
    var ws = fs.createWriteStream(dest);
    r.on('error', function(){
      //download error, clear empty file.
      console.log('error');
      if (fs.exists(dest)) {
        fs.unlink(dest);
      }
    });
    ws.on('close', function(){
      //write over.
      // window.coverDownloading -= 1;
      // var $avatar = $('<img>').attr('src', dest);
      that.$el.find('img').attr('src', window.avatar_url);
      // that.$el.find('img').attr('src', dest);
      // $avatar.on('load',function(){
      //  that.replaceAvatarImg($avatar);
      // });
    });
    r.pipe(ws);
  },

  dialog: function(event){
    console.log('dialog');
    if (this.$el)
      this.$el.find('#dialog_avatar').toggleClass('open');
  },

  logout: function(event){
    if (window.nwApp) {
      window.nwApp.navigate('logout', {trigger: true});
    }
  },

  account: function(event){
    gui.Shell.openExternal('https://member.readmoo.com');
  },

  render: function(){
    console.log('userprofile render');
    if (localStorage.getItem('login_status') == "true") {
      var temp = this.template(this.model.get('userProfile'));
      this.$el.append(temp);
    } else {
      var temp = this.template(this.model.attributes);
      this.$el.append(temp);
    }
    return this;
  }
});
