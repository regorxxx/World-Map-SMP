'use strict';
//25/09/25

/*
	Biography Mod v 1.1.X
	-----------------------------------
	Redefines some methods found on WilB's Biography Script to enable integration with other panels.
*/

if (window.ScriptInfo.Name !== 'Biography' || window.ScriptInfo.Author !== 'WilB') { // Safety check to avoid using it alone
	fb.ShowPopupMessage('This script can only be used along WilB\'s Biography script.', window.Name + ' (' + window.ScriptInfo.Name + ')');
} else { // Where t = new Text, tag = new Tagger
	// Rewrite entire function
	/* eslint-disable no-undef */
	tag.notifyCountry = function(handles) { // tags
		// This 2 variables are private within tag object... so we need to define them again
		const kww = 'Founded In: |Born In: |Gegründet: |Formado en: |Fondé en: |Luogo di fondazione: |出身地: |Założono w: |Local de fundação: |Место основания: |Grundat år: |Kurulduğu tarih: |创建于: |Geboren in: |Lugar de nacimiento: |Né\\(e\\) en: |Luogo di nascita: |出身地: |Urodzony w: |Local de nascimento: |Место рождения: |Född: |Doğum yeri: |生于: ';
		let ix = -1;
		// Up to here
		if (!handles) {return;}
		let a_o = '####';
		let locale = [], tags = [];
		const tf_a = FbTitleFormat(p.tf.a), tf_l = FbTitleFormat(p.tf.l);
		tags.push({name: 'artist', val: tf_a.EvalWithMetadb(handles)});
		tags.push({name: 'album', val: tf_l.EvalWithMetadb(handles)});
		const artist = tags[0].val.toUpperCase();
		if (artist !== a_o) {
			a_o = artist; // NOSONAR
			if (p.tag[6].enabled || p.tag[7].enabled || p.tag[8].enabled && p.tag[8].enabled < 7) {
				const lfmBio = p.cleanPth(p.pth.lfmBio, handles, 'tag') + artist.clean() + '.txt';
				if (s.file(lfmBio)) {
					const lfm_a = s.open(lfmBio);
					if (p.tag[6].enabled) {ix = lfm_a.lastIndexOf('Top Tags: ');}
					if (p.tag[7].enabled) {
						let loc = lfm_a.match(RegExp(kww, 'i')); if (loc) {
							loc = loc.toString();
							ix = lfm_a.lastIndexOf(loc);
							if (ix !== -1) {
								locale = lfm_a.substring(ix + loc.length);
								locale = locale.split(/\r\n|\n\r|\n|\r/)[0].trim().split(', ');
							}
						}
					}
				}
			}
		}
		tags.push({name: 'locale', val: locale});
		window.NotifyOthers(window.Name + ' notifyCountry', {handle: handles, tags}); // tags
	};
	// Just rewrap
	const old_t_draw = t.draw;
	t.draw = function() {
		tag.notifyCountry(s.handle(ppt.focus)); // tags
		window.NotifyOthers(window.Name + ' notifySelectionProperty', {property: 'focus', val: ppt.focus}); // selection property
		return old_t_draw.apply(old_t_draw, arguments);
	};
	/* eslint-enable no-undef */
}

// Retrieve data from other panels
function onNotifyData(name, info) {
	if (window.ScriptInfo.Name !== 'Biography' || window.ScriptInfo.Author !== 'WilB') {return;}
	if (name === 'World Map' + ' notifySelectionProperty') {
		ppt.focus = info; p.changed(); t.on_playback_new_track(); img.on_playback_new_track(); // eslint-disable-line no-undef
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