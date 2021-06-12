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

function on_notify_data(name, info) {
	if (window.ScriptInfo.Name !== 'Biography' || window.ScriptInfo.Author !== 'WilB') {return;}
	let clone;
	if (ui.id.local) {
		clone = typeof info === 'string' ? String(info) : info;
		on_cui_notify(name, clone);
	}
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
		case 'bio_chkTrackRev':
			if (!panel.server && panel.style.inclTrackRev) {
				clone = JSON.parse(JSON.stringify(info));
				clone.inclTrackRev = true;
				window.NotifyOthers('bio_isTrackRev', clone);
			}
			break;
		case 'bio_isTrackRev':
			if (panel.server && info.inclTrackRev == true) {
				clone = JSON.parse(JSON.stringify(info));
				server.getTrack(clone);
			}
			break;
		case 'bio_imgChange':
			img.fresh();
			men.fresh();
			break;
		case 'bio_checkImgArr':
			clone = JSON.parse(JSON.stringify(info));
			img.checkArr(clone);
			break;
		case 'bio_customStyle':
			clone = String(info);
			panel.on_notify(clone);
			break;
		case 'bio_forceUpdate':
			if (panel.server) {
				clone = JSON.parse(JSON.stringify(info));
				server.download(1, clone[0], clone[1]);
			}
			break;
		case 'bio_getLookUpList':
			panel.getList();
			break;
		case 'bio_getRevImg':
			if (panel.server) {
				clone = JSON.parse(JSON.stringify(info));
				server.getRevImg(clone[0], clone[1], clone[2], clone[3], false);
			}
			break;
		case 'bio_getImg':
			img.grab(info ? true : false);
			break;
		case 'bio_getText':
			txt.grab();
			break;
		case 'bio_lookUpItem':
			if (panel.server) {
				clone = JSON.parse(JSON.stringify(info));
				server.download(false, clone[0], clone[1]);
			}
			break;
		case 'bio_newCfg':
			cfg.updateCfg($.jsonParse(info, {}));
			break;
		case 'bio_notServer':
			panel.server = false;
			timer.clear(timer.img);
			timer.clear(timer.zSearch);
			break;
		case 'bio_blacklist':
			img.blackList.artist = '';
			img.check();
			break;
		case 'bio_scriptUnload':
			panel.server = true;
			window.NotifyOthers('bio_notServer', 0);
			break;
		case 'bio_refresh':
			window.Reload();
			break;
		case 'bio_reload':
			if (panel.stndItem()) window.Reload();
			else {
				txt.artistFlush();
				txt.albumFlush();
				txt.grab();
				if (ppt.text_only) txt.paint();
			}
			break;
		case 'bio_status':
			ppt.panelActive = info;
			window.Reload();
			break;
	}
}