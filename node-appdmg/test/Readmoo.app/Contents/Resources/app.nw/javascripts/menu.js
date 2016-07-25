var os = require('os');
var nwNotify = require('nw-notify');

var arch = process.arch;
// if (platform == 'darwin'){
  // console.log('manifest: ' + upd.manifest.packages['mac'][arch].url);
// }

nwNotify.setConfig({
  appIcon: nwNotify.getAppPath() + 'appicon/notify.png',
  defaultStyleText: {
      color: '#FF000',
      fontWeight: 'bold'
  },
});

var initMenu = function(pkg, copyPath){
  //for loading page
    var platform = os.platform();
    if (platform === 'win32' || platform === 'win64') {
      var win = window.App.mainWin;
      var rootMenu = new window.gui.Menu({ type: 'menubar' });
      var fileMenu = new window.gui.Menu();

      fileMenu.append(new window.gui.MenuItem({
          label: '關於Readmoo',
          key: "s",
          modifiers: "cmd",
          click: function() {
            console.log('version: ' + pkg.version);
            nwNotify.notify('Readmoo看書版本', ' Version '+pkg.version);
          }
      }));

      fileMenu.append(new window.gui.MenuItem({
        label: '版本更新',
        click: function() {
          window.App.CheckUpdate(false, copyPath); //update manually
        }
      }));

      fileMenu.append(new window.gui.MenuItem({
          label: '隱藏',
          click: function() {
            win.minimize();
          }
      }));

      fileMenu.append(new window.gui.MenuItem({
          label: '離開Readmoo',
          click: function() {
            window.gui.App.quit();
          }
      }));

      var InfoMenu = new window.gui.Menu();

      InfoMenu.append(new window.gui.MenuItem({
        label: 'Readmoo說明中心',
        key: "i",
        modifiers: "cmd",
        click: function() {
          window.gui.Shell.openExternal('https://campaign.readmoo.com/apps/desktop.php');
        }
      }));

      window.App.InfoMenu = InfoMenu;

      rootMenu.append(new window.gui.MenuItem({ label: 'Readmoo', submenu: fileMenu}));

      var BookItemMenu = new window.gui.Menu(),
          mainWin = window.App.mainWin;

      BookItemMenu.append(new window.gui.MenuItem({
        label: '書櫃',
        key: "b",
        modifiers: "cmd",
        click: function(){
          mainWin.focus();
        }
      }));

      BookItemMenu.append(new window.gui.MenuItem({
        type: 'separator',
        tooltip: 'Hello separator'
      }));

      var BookMenu = new window.gui.MenuItem({ label: '視窗', submenu: BookItemMenu});
      rootMenu.append(BookMenu);
      rootMenu.append(new window.gui.MenuItem({ label: '說明中心', submenu: InfoMenu}));

      window.App.BookItemMenu = BookItemMenu;
      window.App.BookMenu = BookMenu;
      window.App.rootMenu = rootMenu;
      win.menu = rootMenu;

    } else {
      var rootMenu = new window.gui.Menu({type:"menubar"}),
          InfoMenu = new window.gui.Menu(),
          fileMenu = new window.gui.Menu(),
          win = window.gui.Window.get();

      InfoMenu.append(new window.gui.MenuItem({
        type: 'normal',
        label: 'Readmoo說明中心',
        key: "i",
        modifiers: "cmd",
        click: function(){
          window.gui.Shell.openExternal('https://campaign.readmoo.com/apps/desktop.php');
      }}));

      rootMenu.createMacBuiltin("Readmoo", {
        hideEdit: pkg.debug == 'yes' ? false : true,
        hideWindow: pkg.debug == 'yes' ? false : true
      });

      // Get the root menu from the default mac menu
      var rootSubMenu = rootMenu.items[0].submenu;
      // console.log(rootSubMenu.items);
      /*rootSubMenu.items.push(new window.gui.MenuItem({
          label: '版本更新',
          click : function () {
             window.App.CheckUpdate(false, copyPath); //update manually
          }
      }));*/
      // 2016/06/06 Apple 禁止使用版本更新
      strAppName = window.App.getMacAppName();
      if (!((window.App.platform == "mac") && (pkg.internal == "no")) || (strAppName == "Readmoo")) {
        // 不是 Mac App Store 正式版，才顯示「版本更新」（MAS 正式版必須依循 App Store 的規則）
      rootSubMenu.insert(
          new window.gui.MenuItem({
              label: '版本更新',
              click : function () {
                 window.App.CheckUpdate(false, copyPath); //update manually
              }
          })
      , 1);
      }

      var BookItemMenu = new window.gui.Menu(),
          mainWin = window.App.mainWin;

      BookItemMenu.append(new window.gui.MenuItem({
        label: '書櫃',
        key: "b",
        modifiers: "cmd",
        click: function(){
          mainWin.focus();
        }
      }));

      BookItemMenu.append(new window.gui.MenuItem({
        type: 'separator',
        tooltip: 'Hello separator'
      }));

      var BookMenu = new window.gui.MenuItem({ label: '視窗', submenu: BookItemMenu});
      rootMenu.append(BookMenu);

      rootMenu.append(new window.gui.MenuItem({
        label: '說明中心',
        submenu: InfoMenu
      }));

      window.App.BookItemMenu = BookItemMenu;
      // console.log(BookItemMenu);
      window.App.BookMenu = BookMenu;
      window.App.rootMenu = rootMenu;
      win.menu = rootMenu;
    }
};

var appMenu = {
  initMenu: initMenu
};

module.exports = appMenu;

