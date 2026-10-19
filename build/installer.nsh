; DoneDesk：安装/卸载后通知资源管理器刷新图标（覆盖安装旧版时旧图标缓存不会自动更新）
!macro customInstall
  ; 重新创建快捷方式并显式指定图标为程序本身
  Delete "$DESKTOP\DoneDesk.lnk"
  CreateShortCut "$DESKTOP\DoneDesk.lnk" "$INSTDIR\DoneDesk.exe" "" "$INSTDIR\DoneDesk.exe" 0
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0x1000, p 0, p 0)'
  nsExec::Exec '"$SYSDIR\ie4uinit.exe" -show'
!macroend
!macro customUnInstall
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0x1000, p 0, p 0)'
!macroend
