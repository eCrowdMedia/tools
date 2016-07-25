

var OpinionsView = Backbone.View.extend({
  // el: '.opinions',
  events: {
    'click .close': 'close',
    'change #q-type': 'change',
    'submit form': 'submit'
  },

  initialize: function(){
    var that = this;
    // console.log('model: ' + this.model);
    this.setElement(window.document.querySelectorAll('.opinions'));

    window.App.$opinion = this.$el;
    window.App.$wall.on('click', function(){
      that.$el.removeClass('open');
      window.App.$wall.removeClass('open');
      window.App.$mainContent.show()
      // console.log('got close events!');
      if(window.nwApp)
        window.nwApp.navigate('library', {trigger: true});
    });

    this.getMe(window.localStorage.getItem('-nw-access_token')).done(function(){
       that.render();
    });
  },

  change: function(event){
    console.log('change!');
    var qtypeText = this.qtypeText,
        $subject = this.$subject,
        feedbackType = this.feedbackType,
        $qtype = this.$qtype;
    qtypeText = $('#q-type :selected').text();
    $subject.val('[' + qtypeText + ']');
    feedbackType = $qtype.val();
    this.feedbackType = feedbackType;
  },

  getMe: function(token){
    console.log('getMe');
    var dtd = $.Deferred();
    var that = this;
    var url = 'https://api.readmoo.com/me?access_token='+token;
    var options = {
      url: url,
      headers: {
        Authorization : 'Client '+ oAuth.oAuthInfo.client_id
      }
    };
    request(options, function(error, response, body){
      if (!error && response.statusCode == 200) {
          var userProfile = $.parseJSON(body);
              console.log('userProfile =', userProfile);
          that.model.set('userId', userProfile.user.id);
          that.model.set('email', userProfile.user.email);
          dtd.resolve();
        }
    });
    return dtd.promise();
  },

  submit: function(event) {
    event.preventDefault();
    var client_id = '8bb43bdd60795d800b16eec7b73abb80',
        token = window.localStorage.getItem('-nw-access_token'),
        url = 'https://api.readmoo.com/feedback?access_token='+token,
        arch = (process.arch == 'ia32' ? '32' : '64'),
        that = this,
        platform = process.platform;

    platform = /^win/.test(platform)? 'win' : 'mac';
    subjectvalue = this.$subject.val();
    emailvalue = this.$el.find('.email').val();
    contentvalue = this.$el.find('.content').val()+'<br><br><br><br>[UA] '+navigator.userAgent+'<br><br>[Platform] '+platform+arch+'<br><br>[AppVersion] '+pkg.version;

    this.$sendButton.text('傳送中...');

    params = {
        type: this.feedbackType,
        url: 'mooReader://feedback',
        subject: subjectvalue.match(/^\[.*\]$/) ? subjectvalue + (new Date()).getTime().toString() : subjectvalue,
        // subject: subjectvalue,
        email: emailvalue,
        client_id: client_id,
        bug: contentvalue
    };

    formData = this.filter(params, ['type', 'url', 'subject', 'email', 'client_id', 'bug']);

    // console.log('data: ' + JSON.stringify(this.filter(params,  ['type', 'url', 'subject', 'email', 'client_id', 'bug'])));

    request.post({
      url: url,
      headers: {
        'User-Agent': navigator.userAgent
      },
      formData: formData}, function optionalCallback(err, httpResponse, body) {
      if (err) {
        that.$fail.slideDown().delay(2000).slideUp();
        $sendButton.text('送出');
        return console.error('upload failed:', err);
      }
      that.$thankyou.slideDown().delay(2000).slideUp();
      that.$sendButton.text('送出');
      console.log('Upload successful!  Server responded with:', body);
    });

  },

  filter: function(options, includes){
    var data, n, v, _i, _len;
      if (options == null) {
        options = {};
      }
      data = {};
      for (_i = 0, _len = includes.length; _i < _len; _i++) {
        n = includes[_i];
        if (options.hasOwnProperty(n)) {
          v = options[n];
          if (typeof v === 'object') {
            v = JSON.stringify(v);
          }
          data[n] = v;
        }
      }
      return data;
  },

  close: function(){
    this.$el.removeClass('open');
    window.App.$wall.removeClass('open');
    window.App.$mainContent.show()
    console.log('got close events!');
    if(window.nwApp)
      window.nwApp.navigate('library', {trigger: true});
  },

  render: function(){
    var temp = require('./javascripts/templates/opinions.hbs');
    // console.log('0706 pkg: ' + pkg.version);
    // console.log('this.model.attributes: ' + this.model.get('email'));
    this.$el.html(temp({email: this.model.get('email')}));

    var $qtype = this.$el.find('#q-type'),
        $subject = this.$el.find('.subject'),
        qtypeText = this.$el.find('#q-type :selected').text(),
        feedbackType = $qtype.val(),
        $form = this.$el.find('form'),
        $thankyou = this.$el.find('.thankyou'),
        $fail = this.$el.find('.fail'),
        $sendButton = this.$el.find('button'),
        subjectvalue,
        emailvalue,
        contentvalue;

    $subject.val('[' + qtypeText + ']');
    this.$sendButton = $sendButton;
    this.$qtype = $qtype;
    this.$subject = $subject;
    this.qtypeText = qtypeText;
    this.feedbackType = feedbackType;
    this.$subject = $subject;
    this.$fail = $fail;
    this.$thankyou = $thankyou;
    this.$sendButton = $sendButton;
    // console.log('Opinions render');
  }

});
