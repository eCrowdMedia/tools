
var TopBarView = Backbone.View.extend({

  // template: _.template('<li>bookshelf_1</li>'),
  el: '.topbar',

  initialize: function(){
     var $filterWall = $('.filter-wall');
     this.$filterWall = $filterWall;
     this.$filter = $('.filter');
  },

  events: {
    'click .filter-bar': 'backOff'
  },

  backOff: function(event){
    event.preventDefault();
    document.body.style.overflow = 'hidden';
    var $filterWall = this.$filterWall,
        $filter = this.$filter;
    $filterWall.toggleClass('open');
    if($filterWall.hasClass('open')){
        $filterWall.css({"display":"block", "height":"auto"});
        $filter.css("display", "block");
        setTimeout(function(){
          $filterWall.css("opacity",1);
          $filter.css("opacity",1);
        }, 50);
    } else {
        document.body.style.overflow = 'auto';
        $filterWall.css("opacity",0);
        $filter.css("opacity",0);
        setTimeout(function(){
          $filterWall.css({"display":"block", "height":0});
          $filter.css("display","none");
        }, 600);
      }
  },

  render: function(){
    return this;
  }

});

