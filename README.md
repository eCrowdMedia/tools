# tools

編譯 node-webkit-app，輸出為 Mac App Store(MAS) / Mac / Windows 的 nwjs 應用程式

##安裝前準備

1. 有檔案超過 Github 50MB 的限制，必須搭配 Git Large File Storage (LFS) 套件，見 https://git-lfs.github.com/
2. 先安裝 node-webkit-app，再將 tools 安裝在 node-webkit-app 目錄下

##安裝

1. cd node-webkit-app
2. git clone https://github.com/eCrowdMedia/tools.git
3. 編譯工具會安裝在 node-webkit-app/tools 目錄下

##執行

1. 在 node-webkit-app 目錄下
2. 編譯「測試版」「v1.3.0」，執行 $ ./build_dev.sh v1.3.0
3. 編譯「正式版」「v1.3.0」，執行 $ ./build_prod.sh v1.3.0

##套件說明

1. node-appdmg : 將 Mac 版本包裝成 .dmg
2. nwjs-macappstore-builder : 編譯成 Mac App Store(MAS) 的版本
3. nwjs-macappstore-v0.12.3-osx-x64 : MAS 版本的資料檔（提供給 nwjs-macappstore-builder 使用）
4. nwjs-v0.12.3-win-* : 使用 makensis 編譯成 Windows 版本（不可混用，因為 Icon 必須直接改入 .exe 內）
