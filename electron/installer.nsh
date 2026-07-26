; SATZE Playtest — se gia installato: Si aggiorna, No disinstalla, Annulla esci

!ifndef BUILD_UNINSTALLER

Function SatzePromptExistingInstall
  ReadRegStr $R0 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "UninstallString"
  StrCmp $R0 "" 0 satze_install_has_uninstaller
  ReadRegStr $R0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "UninstallString"
  StrCmp $R0 "" satze_install_done

  satze_install_has_uninstaller:
  MessageBox MB_YESNOCANCEL|MB_ICONQUESTION "SATZE Playtest e gia installato.$\r$\n$\r$\nSi = aggiorna alla nuova versione$\r$\nNo = disinstalla$\r$\nAnnulla = esci dal setup" IDYES satze_install_done IDNO satze_install_remove
  Quit

  satze_install_remove:
  ReadRegStr $R2 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "InstallLocation"
  StrCmp $R2 "" 0 satze_install_run_uninst
  ReadRegStr $R2 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "InstallLocation"
  satze_install_run_uninst:
  StrCmp $R2 "" 0 satze_install_run_uninst2
  ExecWait '$R0 /S'
  Goto satze_install_removed
  satze_install_run_uninst2:
  ExecWait '$R0 /S _?=$R2'
  satze_install_removed:
  MessageBox MB_OK|MB_ICONINFORMATION "Disinstallazione completata."
  Quit

  satze_install_done:
FunctionEnd

!endif

!macro customInit
  !ifndef BUILD_UNINSTALLER
    Call SatzePromptExistingInstall
  !endif
!macroend
