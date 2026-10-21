' AI Info Hub - daily background sync (no admin rights needed)
' Put a shortcut to this file in your Startup folder.
' It runs hidden on boot, then once every 24 hours.
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh  = CreateObject("WScript.Shell")
root   = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))
script = root & "\scripts\sync.ps1"
If Not fso.FileExists(script) Then WScript.Quit
Do
  sh.Run "powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File """ & script & """", 0, True
  WScript.Sleep 86400000
Loop
