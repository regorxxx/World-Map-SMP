'use strict';
//20/12/23

/*
	Biography Mod v 1.2.0 Beta
	-----------------------------------
	Redefines some methods found on WilB's Biography Script to enable integration with other panels.
*/

if (window.ScriptInfo.Name !== 'Biography' || window.ScriptInfo.Author !== 'WilB') { // Safety check to avoid using it alone
	fb.ShowPopupMessage('This script can only be used along WilB\'s Biography script.', window.Name);
}

function onNotifyData(name, info) {
	if (window.ScriptInfo.Name !== 'Biography' || window.ScriptInfo.Author !== 'WilB') {return;}
	switch (name) { // NOSONAR
		case 'bio_focusPpt':
			/* eslint-disable no-undef */
			// Mimics setsDisplay()
			if (ppt.focus !== info) {
				ppt.toggle('focus');
				panel.changed();
				txt.on_playback_new_track();
				img.on_playback_new_track();
			}
			/* eslint-enable no-undef */
			break;
	}
}
if (typeof on_notify_data !== 'undefined') {
	const oldFunc = on_notify_data;
	on_notify_data = function(name, info) {
		oldFunc(name, info);
		onNotifyData(name, info);
	};
	// eslint-disable-next-line no-redeclare
} else {var on_notify_data = onNotifyData;} // NOSONAR