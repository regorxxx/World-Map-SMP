'use strict';

/* 
	Biography Mod v 1.2.X 08/06/21
	-----------------------------------
	Redefines some methods found on WilB's Biography Script to enable integration with other panels.
	
	TODO: Add version comparison ?
*/

if (window.ScriptInfo.Name !== 'Biography' || window.ScriptInfo.Author !== 'WilB') { // Safety check to avoid using it alone
	fb.ShowPopupMessage('This script can only be used along WilB\'s Biography script.', window.Name);
}

function onNotifyData(name, info) {
	if (window.ScriptInfo.Name !== 'Biography' || window.ScriptInfo.Author !== 'WilB') {return;}
	switch (name) {
		case 'bio_focusPpt':
			if (ppt.focus !== info) { // Mimics setsDisplay()
				console.log('focus');
				ppt.toggle('focus');
				panel.changed();
				txt.on_playback_new_track();
				img.on_playback_new_track();
			}
			break;
	}
}
if (typeof on_notify_data !== 'undefined') {
	const oldFunc = on_notify_data;
	on_notify_data = function(name, info) {
		oldFunc(name, info);
		onNotifyData(name, info);
	}
} else {var on_notify_data = onNotifyData;}