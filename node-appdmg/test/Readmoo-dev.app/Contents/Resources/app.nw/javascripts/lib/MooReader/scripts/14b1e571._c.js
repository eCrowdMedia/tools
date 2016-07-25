(function() {
  'use strict';
  var doReload;
  doReload = function() {
    return window.location.reload();
  };
  applicationCache.addEventListener('updateready', doReload);
  return applicationCache.addEventListener('cached', doReload);
})();
