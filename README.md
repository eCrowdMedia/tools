# tools

編譯 node-webkit-app，輸出為 Mac App Store(MAS) / Mac / Windows 的 nwjs 應用程式

##安裝

（有檔案超過 Github 50MB 的限制，必須搭配 Git Large File Storage (LFS) 套件，見 https://git-lfs.github.com/）
（建議安裝在 node-webkit-app 目錄下）
1. cd node-webkit-app
2. git clone https://github.com/eCrowdMedia/tools.git
3. 編譯工具會安裝在 node-webkit-app/tools 目錄下

##執行

1. 在 node-webkit-app 目錄下
2. 編譯「測試版」「v1.3.0」，執行 $ ./build_dev.sh v1.3.0
3. 編譯「正式版」「v1.3.0」，執行 $ ./build_prod.sh v1.3.0
