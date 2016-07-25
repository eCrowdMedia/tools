
!include MUI2.nsh


!define BITMAP_FILE "icon-win.bmp"
!define GRAPHICAL_INSTALLER_SPLASH_BITMAP "./icon-win.bmp"
!define PRODUCT_NAME "Readmoo"
!define VERSIONMAJOR 1
!define VERSIONMINOR 1
!define VERSIONBUILD 0

!define MUI_PAGE_HEADER_TEXT Readmoo
!define MUI_PAGE_HEADER_SUBTEXT EcrowdMedia
!define MUI_ABORTWARNING

#!define MUI_HEADERIMAGE
    #!define MUI_HEADERIMAGE_BITMAP icon-win.bmp

#!define MUI_WELCOMEFINISHPAGE_BITMAP icon-win.bmp

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English" ;first language is the default language
!insertmacro MUI_LANGUAGE "TradChinese"

AutoCloseWindow true

RequestExecutionLevel user

Icon "icon-win.ico"
UninstallIcon "icon-win.ico"
UninstallText "Remove Readmoo Desktop App"
UninstallCaption "Readmoo Desktop App"
WindowIcon "on"
Caption "Readmoo Desktop App"
SubCaption "0" "買書x看書x分享書"
BrandingText "Readmoo created by eCrowdMedia"

Name "${PRODUCT_NAME}"

#!define APPNAME "Readmoo"
#!define COMPANYNAME "eCrowdMedia"
#!define DESCRIPTION "Buying Reading Sharing Books"
# This is the size (in kB) of all the files copied into "Program Files"
!define INSTALLSIZE 58323

# define the resulting installer's name:
OutFile "Readmoo_installer.exe"

# default section start
Section
  CreateDirectory "$PROFILE\Readmoo"

  # define the path to which the installer should install
  SetOutPath "$PROFILE\Readmoo"

  # specify the files to go in the output path
  # these are the Windows files produced by grunt-node-webkit-builder
  # File ./ffmpegsumo.dll
  # File ./icudtl.dat
  # File ./libEGL.dll
  # File ./libGLESv2.dll
  # File ./nw.pak
  # File ./Readmoo.exe
  File ./dist/server.html
  File ./dist/index.html
  File ./dist/login.html
  File ./dist/offline.html
  # File ./dist/main.js
  File ./dist/package.json
  File ./dist/internal.json
  File ./dist/style.css

  #copy holefolder to specific directory of user's system

  SetOutPath "$PROFILE\Readmoo\api"
  File /nonfatal /r "./dist/api\" #note back slash at the end
  SetOutPath "$PROFILE\Readmoo\appicon"
  File /nonfatal /r "./dist/appicon\" #note back slash at the end
  SetOutPath "$PROFILE\Readmoo\fonts"
  File /nonfatal /r "./dist/fonts\" #note back slash at the end
  SetOutPath "$PROFILE\Readmoo\images"
  File /nonfatal /r "./dist/images\" #note back slash at the end
  SetOutPath "$PROFILE\Readmoo\javascripts"
  File /nonfatal /r "./dist/javascripts\" #note back slash at the end
  SetOutPath "$PROFILE\Readmoo\node_modules"
  File /nonfatal /r "./dist/node_modules\" #note back slash at the end
  SetOutPath "$PROFILE\Readmoo\stylesheets"
  File /nonfatal /r "./dist/stylesheets\" #note back slash at the end

  # Copy .exe .dll at last
  SetOutPath "$PROFILE\Readmoo"

  File ./ffmpegsumo.dll
  File ./icudtl.dat
  File ./libEGL.dll
  File ./libGLESv2.dll
  File ./nw.pak
  File ./Readmoo.exe

  SetShellVarContext current
  #Installer body---------(creating desktop/start menu short cuts, granting permissions, etc)

  #Writing registry keys
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Readmoo" "DisplayName" "Readmoo"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Readmoo" "UninstallString" "$PROFILE\Readmoo\Readmoo_uninstaller.exe"

  # define the uninstaller name
  WriteUninstaller "$PROFILE\Readmoo\Readmoo_uninstaller.exe"

  # create a shortcut in the start menu
  # point the shortcute at your-app-name.exe
  SetShellVarContext current
  CreateDirectory "$SMPROGRAMS\Readmoo"
  CreateShortCut "$SMPROGRAMS\Readmoo\Readmoo.lnk" "$PROFILE\Readmoo\Readmoo.exe"
  CreateShortCut "$SMPROGRAMS\Readmoo\ReadmooUninstall.lnk" "$PROFILE\Readmoo\Readmoo_uninstaller.exe"

  #create a shortcut in desktop
  CreateShortCut "$DESKTOP\Readmoo.lnk" "$PROFILE\Readmoo\Readmoo.exe"
  SetShellVarContext all
  WriteRegStr HKLM "Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\" "UninstallString" "$PROFILE\Readmoo_uninstaller.exe"
  WriteRegStr HKLM "Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\Readmoo" "InstallLocation"  "$PROFILE\Readmoo"
  WriteRegStr HKLM "Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\Readmoo" "DisplayName" "Readmoo"
  WriteRegStr HKLM "Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\Readmoo" "DisplayVersion" "$\"${VERSIONMAJOR}.${VERSIONMINOR}.${VERSIONBUILD}$\""
  WriteRegDWORD HKLM "Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\Readmoo" "EstimatedSize" "${INSTALLSIZE}"

  Exec '"$PROFILE\Readmoo\Readmoo.exe"'

sectionEnd

# create a section to define what the uninstaller does
Section "Uninstall"

  SetShellVarContext current
  # delete the uninstaller
  Delete $INSTDIR\Readmoo_uninstaller.exe

  # delete the installed files
  Delete $DESKTOP\Readmoo.lnk
  Delete $SMPROGRAMS\Readmoo\Readmoo.lnk
  Delete $SMPROGRAMS\Readmoo\ReadmooUninstall.lnk
  Delete $INSTDIR\ffmpegsumo.dll
  Delete $INSTDIR\icudt.dat
  Delete $INSTDIR\libEGL.dll
  Delete $INSTDIR\libGLESv2.dll
  Delete $INSTDIR\nw.pak
  Delete $INSTDIR\Readmoo.exe

  SetShellVarContext current
  RMDir /r "$PROFILE\Readmoo\api"
  RMDir /r "$PROFILE\Readmoo\appicon"
  RMDir /r "$PROFILE\Readmoo\fonts"
  RMDir /r "$PROFILE\Readmoo\images"
  RMDir /r "$PROFILE\Readmoo\locales"
  RMDir /r "$PROFILE\Readmoo\node_modules"
  RMDir /r "$PROFILE\Readmoo\stylesheets"
  RMDir /r "$PROFILE\Readmoo"
  RMDir /r $SMPROGRAMS\Readmoo

  DeleteRegKey HKEY_LOCAL_MACHINE "SOFTWARE\Readmoo"
  DeleteRegKey HKEY_LOCAL_MACHINE "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Readmoo"

SectionEnd
