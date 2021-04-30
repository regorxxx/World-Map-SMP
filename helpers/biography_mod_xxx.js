'use strict';

/* 
	Biography Mod v 1.1.3 22/04/21
	-----------------------------------
	Redefines some methods found on WilB's Biography Script to enable integration with other panels.
	
	TODO: Add version comparison ?
*/

if (window.ScriptInfo.Name != 'Biography' || window.ScriptInfo.Author != 'WilB') { // Safety check to avoid using it alone
	fb.ShowPopupMessage('This script can only be used along WilB\'s Biography script.', window.Name);
} else { // Where t = new Text, tag = new Tagger
	// Rewrite entire function
	tag.notifyCountry = function(handles) { // tags
		// This 2 variables are private within tag object... so we need to define them again
		const kww = "Founded In: |Born In: |Gegründet: |Formado en: |Fondé en: |Luogo di fondazione: |出身地: |Założono w: |Local de fundação: |Место основания: |Grundat år: |Kurulduğu tarih: |创建于: |Geboren in: |Lugar de nacimiento: |Né\\(e\\) en: |Luogo di nascita: |出身地: |Urodzony w: |Local de nascimento: |Место рождения: |Född: |Doğum yeri: |生于: ";
		let ix = -1;
		// Up to here
		if (!handles) return;
		let a = "", a_o = "####",  aa = "", aa_o = "####", l = "", l_o = "####";
		let locale = [], tags = [], artTags = [];
		const tf_a = FbTitleFormat(p.tf.a), tf_aa = FbTitleFormat(p.tf.aa), tf_cue = FbTitleFormat("$ext(%path%)"), tf_l = FbTitleFormat(p.tf.l);
		tags.push({name: 'artist', val: tf_a.EvalWithMetadb(handles)});
		tags.push({name: 'album', val: tf_l.EvalWithMetadb(handles)});
		const artist = tags[0].val.toUpperCase(), album = tags[1].val.toUpperCase();
		if (!name.alb_strip) l = l.replace(/CD(\s*\d|\.0\d)|CD\s*(One|Two|Three)|Disc\s*\d|Disc\s*(III|II|I|One|Two|Three)\b/gi,"").replace(/\(\s*\)|\[\s*\]/g, " ").replace(/\s\s+/g, " ").replace(/-\s*$/g, " ").trim();
		else l = l.replace(/CD(\s*\d|\.0\d)|CD\s*(One|Two|Three)|Disc\s*\d|Disc\s*(III|II|I|One|Two|Three)\b|(Bonus\s*Track|Collector's|(Digital\s*|Super\s*|)Deluxe|Digital|Expanded|Limited|Platinum|Reissue|Special)\s*(Edition|Version)|(Bonus\s*(CD|Disc))|\d\d\w\w\s*Anniversary\s*(Expanded\s*|Re(-|)master\s*|)(Edition|Re(-|)master|Version)|((19|20)\d\d(\s*|\s*-\s*)|)(Digital(ly|)\s*|)(Re(-|)master(ed|)|Re(-|)recorded)(\s*Edition|\s*Version|)|\(Deluxe\)|\(Mono\)|\(Reissue\)|\(Revisited\)|\(Stereo\)|\(Web\)|\[Deluxe\]|\[Mono\]|\[Reissue\]|\[Revisited\]|\[Stereo\]|\[Web\]/gi,"").replace(/\(\s*\)|\[\s*\]/g, " ").replace(/\s\s+/g, " ").replace(/-\s*$/g, " ").trim();
		if (artist != a_o) {
			a_o = artist;
			if (p.tag[6].enabled || p.tag[7].enabled || p.tag[8].enabled && p.tag[8].enabled < 7) {
				const lfmBio = p.cleanPth(p.pth.lfmBio, handles, 'tag') + artist.clean() + ".txt";
				if (s.file(lfmBio)) {
					const lfm_a = s.open(lfmBio);
					if (p.tag[6].enabled) {ix = lfm_a.lastIndexOf("Top Tags: ");}
					if (p.tag[7].enabled) {
						let loc = lfm_a.match(RegExp(kww, "i")); if (loc) {
							loc = loc.toString();
							ix = lfm_a.lastIndexOf(loc);
							if (ix != -1) {
								locale = lfm_a.substring(ix + loc.length);
								locale = locale.split('\n')[0].trim().split(", ");
							}
						}
					}
				}
			}
		}
		tags.push({name: 'locale', val: locale});
		window.NotifyOthers(window.Name + ' notifyCountry', {handle: handles, tags: tags}); // tags
	}
	// Just rewrap
	const old_t_draw = t.draw;
	t.draw = function() {
		tag.notifyCountry(s.handle(ppt.focus)); // tags
		window.NotifyOthers(window.Name + ' notifySelectionProperty', {property: 'focus', val: ppt.focus}); // selection property
		return old_t_draw.apply(old_t_draw, arguments);
	}
}

// Retrieve data from other panels
function on_notify_data(name, info) {
	if (window.ScriptInfo.Name != 'Biography' || window.ScriptInfo.Author != 'WilB') {return;}
	if (name == 'World Map' + ' notifySelectionProperty') {
		ppt.focus = info; p.changed(); t.on_playback_new_track(); img.on_playback_new_track();
	}
	// Original
	let clone; if (ui.local) {clone = typeof info === 'string' ? String(info) : info; on_cui_notify(name, clone);} switch (name) {case "chkTrackRev_bio": if (!p.server && p.inclTrackRev) {clone = JSON.parse(JSON.stringify(info)); clone.inclTrackRev = true; window.NotifyOthers("isTrackRev_bio", clone);} break; case "isTrackRev_bio": if (p.server && info.inclTrackRev == true) {clone = JSON.parse(JSON.stringify(info)); serv.get_track(clone);} break; case "img_chg_bio": img.fresh(); men.fresh(); break; case "chk_arr_bio": clone = JSON.parse(JSON.stringify(info)); img.chk_arr(clone); break; case "custom_style_bio": clone = String(info); p.on_notify(clone); break; case "force_update_bio": if (p.server) {clone = JSON.parse(JSON.stringify(info)); serv.fetch(1, clone[0], clone[1]);} break; case "get_multi_bio": p.get_multi(); break; case "get_rev_img_bio": if (p.server) {clone = JSON.parse(JSON.stringify(info)); serv.get_rev_img(clone[0], clone[1], clone[2], clone[3], false);} break; case "get_img_bio": img.grab(info ? true : false); break; case "get_txt_bio": t.grab(); break; case "multi_tag_bio": if (p.server) {clone = JSON.parse(JSON.stringify(info)); serv.fetch(false, clone[0], clone[1]);} break; case "not_server_bio": p.server = false; timer.clear(timer.img); timer.clear(timer.zSearch); break; case "blacklist_bio": img.blkArtist = ""; img.chkArtImg(); break; case "script_unload_bio": p.server = true; window.NotifyOthers("not_server_bio", 0); break; case "refresh_bio": window.Reload(); break; case "reload_bio": if (!p.art_ix && ppt.artistView || !p.alb_ix && !ppt.artistView) window.Reload(); else {t.artistFlush(); t.albumFlush(); t.grab(); if (ppt.text_only) t.paint();} break; case "status_bio": ppt.panelActive = info; window.Reload(); break;}
}