; Changes Foobar playback on current playlist every 30 seconds to next track.
; Meant to automate Bio script scrapping on a list with all artist from library.
; Note you can easily get such list by filtering the entire library 
; with 'Duplicates and Tag filtering' from Playlist Tools by setting n = 0 and tag = artist.

#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
#Warn  ; Enable warnings to assist with detecting common errors.
SendMode Input  ; Recommended for new scripts due to its superior speed and reliability.
SetWorkingDir %A_ScriptDir%  ; Ensures a consistent starting directory.

#Persistent
SetTimer, foobar2000Preview, 30000
return

foobar2000Preview:
WinActivate foobar2000
Send {Down}
Send {Enter}
return