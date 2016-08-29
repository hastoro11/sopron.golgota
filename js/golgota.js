var app = (function ($) {
  function init() {
    $(window).off('.affix');
    //    $('.navbar-plain').removeClass('affix-top affix affix-bottom').removeData('bs.affix');
  }
  return {
    init: init
  }
})(jQuery);
// init
app.init();