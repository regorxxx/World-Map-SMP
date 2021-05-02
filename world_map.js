'use strict';

/* 
	World Map v 1.0 01/05/21 REQUIRES WilB's Biography Mod script for online tags!!!
	Show artist's country drawing a circle over the world map. To get the country,
	'mapTag' set on properties is used. It may be a tag name or a TF expression.
	Therefore data must be previously on tracks or the database.
	
	'mapTag' may contain ISO values (ARG) or full names (Argentina). Capitalization
	doesn't matter. Full names are converted to ISO values before coordinates lookup.
	
	Country tags can be manually fetched:
		- Using Picard + Plugin (also created by me) (TODO)
		https://picard.musicbrainz.org/
		https://picard.musicbrainz.org/plugins/ (Look for -> Artist's Country)
		
		- WilB's Biography script: 
			+ shift Right Click / Write tags to selected tracks / Proceed
			+ Be sure 'Locale last.fm' is checked. Is the only tag needed.
			+ Check 'Images folder' for instructions. (you can use foo_preview as alternative)
		https://hydrogenaud.io/index.php?topic=112913.75
		
		- Using web scrappers and saving the data as json:
			[{artist: _artist_name_ , val: [_locale_tags_]}, ...]
	
	On playback the panel fetches tags from (by order of preference):
		- Track's tags.
		- Json database
		- WilB's Biography script integration (*):
		  https://hydrogenaud.io/index.php?topic=112913.75
		
	Panel is updated when playback changes, switching playlists, selecting tracks, ...
	Requires a full world map using Mercator projection to work. One is given
	for convenience, but can be changed if desired at properties.
	
	(*) Must use modified version provided at folder 'Biography 1.1.3_Mod' (not original one)
	Required until the author updates it.
	
	See also: 
		- helpers\world_map_tables.js (coordinates and country lookup logic)
		- helpers\map_xxx.js  (arbitrary map object)
		
	TODO:
		- Picard's Plugin does not exist yet.
 */

window.DefinePanel('World Map', {author:'xxx'});
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\helpers_xxx.js');
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\map_xxx.js');
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\world_map_tables.js');
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\menu_xxx.js');

/* 
	Properties 
*/
var worldMap_prefix = 'wm_';
const selMode = ['Follow selected track(s) (playlist)','Prefer now playing'];
const worldMap_properties = {
	mapTag				: 	['Tag name or TF expression for artist\'s country', '$meta(locale last.fm,$sub($meta_num(locale last.fm),1))'],
	imageMapPath		: 	['Path to your own world map (mercator projection)', ''],
	iWriteTags			:	['When used along Biography script, tags may be written to files (if not present)', 0],
	writeToTag			:	['Where to write tag values (should be related to 1st property)', 'locale last.fm'],
	selection			:	['Follow selection or playback? (must match Biography script!)', selMode[0]],
	bEnabled			:	['Enable panel', true],
	bEnabledBiography	:	['Enable WilB\'s Biography script integration', true],
	forcedQuery			:	['Global forced query', 'NOT (%rating% EQUAL 2 OR %rating% EQUAL 1) AND NOT (STYLE IS Live AND NOT STYLE IS Hi-Fi) AND %channels% LESS 3 AND NOT COMMENT HAS Quad'],
	fileName			:	['JSON filename (for tags)', folders.data + 'worldMap.json'],
	firstPopup			:	['World Map: Fired once', false],
	ctrlFirstTag		:	['Force first tag tag matching when clicking + ctrl on point', 'genre'],
	ctrlSecondTag		:	['Force second tag matching when clicking + ctrl on point', 'style'],
	genreStyleFilter	:	['Filter these values globally for ctrl tags (sep. by comma)', 'Instrumental'],
	iLimitSelection		:	['Repaint panel only if selecting less than...', 5000],
	bInstalledBiography	:	['Is installed biography mod?', false],
};
worldMap_properties['mapTag'].push({func: isString}, worldMap_properties['mapTag'][1]);
worldMap_properties['iWriteTags'].push({range: [[0,2]]}, worldMap_properties['iWriteTags'][1]);
worldMap_properties['selection'].push({eq: selMode}, worldMap_properties['selection'][1]);
worldMap_properties['forcedQuery'].push({func: (query) => {return checkQuery(query, true)}}, worldMap_properties['forcedQuery'][1]);
worldMap_properties['ctrlFirstTag'].push({func: isString}, worldMap_properties['ctrlFirstTag'][1]);
worldMap_properties['ctrlSecondTag'].push({func: isString}, worldMap_properties['ctrlSecondTag'][1]);
worldMap_properties['iLimitSelection'].push({func: Number.isSafeInteger}, worldMap_properties['iLimitSelection'][1]);
setProperties(worldMap_properties, worldMap_prefix);

/* 
	Map 
*/
const worldMap = new imageMap({
	imagePath:				fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\images\\MC_WorldMap.jpg',
	properties:				getPropertiesPairs(worldMap_properties, 'wm_'),
	jsonId:					'artist', // id and tag used to identify different entries
	findCoordinatesFunc:	findCountryCoords, // Function at helpers\world_map_tables.js
	selPointFunc:			selPoint, // What happens when clicking on a point, set below
	tooltipFunc: 			tooltip, // What happens when mouse is over point, set below
});

/* 
	Map helpers
*/

// Info Popup
if (!worldMap.properties['firstPopup'][1]) {
	worldMap.properties['firstPopup'][1] = true;
	overwriteProperties(worldMap.properties); // Updates panel
	const readmePath = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\readme\\world_map.txt';
	if ((isCompatible('1.4.0') ? utils.IsFile(readmePath) : utils.FileTest(readmePath, "e"))) {
		const readme = utils.ReadTextFile(readmePath, 65001);
		if (readme.length) {fb.ShowPopupMessage(readme, 'World Map');}
	}
}

// When clicking on a point
function selPoint(point, mask ) {
	let bDone = false;
	// The entire function is tag agnostic, it may be used for anything. 
	// When jsonId is set as 'artist' so it looks for artists with same map value
	// The ctrl modifier is set to force 'genre' and 'style' tags but can be used with anything
	if (!point.id.length) {return bDone;}
	if (!worldMap.jsonId.length) {return bDone;}
	let query = [];
	const dataId = worldMap.jsonId; // Set before. The tag used to match data
	// Any track with same locale tag
	const tag = worldMap.properties.mapTag[1].indexOf('$') !== -1 ? '"' + worldMap.properties.mapTag[1] + '"' : worldMap.properties.mapTag[1];
	if (tag.length) {query.push(tag + ' IS ' + point.id);}
	// What about JSON data? -> List of artists with same value
	let jsonQuery = [];
	worldMap.getData().forEach( (item) => {
		if (item.val[item.val.length - 1] === point.id) {jsonQuery.push(item[dataId]);}
	});
	if (jsonQuery.length) {query.push(query_combinations(jsonQuery, dataId, 'OR'));}
	// What about current tracks (from selected point)? -> Always a match
	const selPointData = worldMap.getLastPoint().find( (last) => {return (last.id === point.id);}); // Has list of artist on every paint
	if (selPointData.jsonId.size) { // Data is a set, so no duplicates
		const currentMatchData = [...selPointData.jsonId];
		query.push(query_combinations(currentMatchData, dataId, 'OR'));
	}
	// Merges all queries with OR
	query = [query_join(query,'OR')];
	// Add query with ctrl modifier
	if (mask === MK_CONTROL) { // When using ctrl + click
		const sel = (worldMap.properties.selection[1] === selMode[1] ? (fb.IsPlaying ? new FbMetadbHandleList(fb.GetNowPlaying()) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist)) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist));
		if (sel && sel.Count) { 
			if (selPointData.jsonId.size) { // Data is a set, so no duplicates
				let selPoint = new FbMetadbHandleList();
				const selJsonId = getTagsValuesV3(sel, [dataId], true).filter(Boolean);
				selJsonId.forEach( (jsonId, index) => {
					if (selPointData.jsonId.intersectionSize(new Set(jsonId))) {selPoint.Add(sel[index]);}
				});
				if (selPoint.Count) {
					let ctrlQuery = [];
					const ctrlFirstTag = worldMap.properties.ctrlFirstTag[1].split(',').filter(Boolean);
					const ctrlSecondTag = worldMap.properties.ctrlSecondTag[1].split(',').filter(Boolean);
					const genreStyleFilter = worldMap.properties.genreStyleFilter[1].length ? new Set(worldMap.properties.genreStyleFilter[1].split(',').concat('')) : null;
					const firstTag = (ctrlFirstTag.length !== 0) ? getTagsValuesV3(selPoint, ctrlFirstTag, true).filter(Boolean) : [];
					const secondTag = (ctrlSecondTag.length !== 0) ? getTagsValuesV3(selPoint, ctrlSecondTag, true).filter(Boolean) : [];
					let valSet = new Set(); // Don't add the same thing multiple times to the query, just for readability
					if (firstTag.length) {
						for (let i = 0; i < selPoint.Count; i++) {
							const firstTag_i = firstTag[i].filter((tag) => {return !genreStyleFilter.has(tag);});
							const firstTagId_i = firstTag_i.join(',');
							if (firstTag_i.length && !valSet.has(firstTagId_i)) {
								ctrlQuery.push(query_combinations(firstTag_i, ctrlFirstTag, "AND"));
								valSet.add(firstTagId_i);
							}
						}
					}
					if (secondTag.length) {
						for (let i = 0; i < selPoint.Count; i++) {
							const secondTag_i = secondTag[i].filter((tag) => !genreStyleFilter.has(tag));
							const secondTagId_i = secondTag_i.join(',');
							if (secondTag_i.length && !valSet.has(secondTagId_i)) {
								ctrlQuery.push(query_combinations(secondTag_i, ctrlSecondTag, "AND"));
								valSet.add(secondTagId_i);
							}
						}
					}
					query.push(query_join(ctrlQuery,'OR'));
				}
			}
		}
	}
	// Add forced query
	const forcedQuery = worldMap.properties.forcedQuery[1];
	if (forcedQuery.length) {query.push(forcedQuery);}
	// Merge all with AND
	query = query_join(query,'AND')
	// Create autoplaylist
	if (checkQuery(query)) {
		console.log('World Map: playlist created '+ query);
		const name = capitalize(dataId) + ' from '+ point.id + (mask === MK_CONTROL ? ' (+tags)' : '');
		const duplicPl = getPlaylistIndexArray(name);
		if (duplicPl.length === 1) {
			plman.ActivePlaylist = duplicPl[0];
		} else {
			if (duplicPl.length > 1) {removePlaylistByName(name);}
			plman.CreateAutoPlaylist(plman.PlaylistCount, name, query);
			plman.ActivePlaylist = plman.PlaylistCount - 1;
		}
		bDone = true;
		return bDone;
	} else {fb.ShowPopupMessage('Query not valid: ' + query, window.Name);}
	return bDone;
}

// When mouse is over point
function tooltip(point) { 
	const count = worldMap.lastPoint.find( (last) => {return last.id === point.id;}).val;
	const tags = capitalize(worldMap.properties.ctrlFirstTag[1]) + '/' + capitalize(worldMap.properties.ctrlSecondTag[1]);
	let text = 'From: ' + point.id + ' (' + count + ')' + '\n(L. Click to create Autoplaylist from same zone)\n(Ctrl + L. Click forces same ' + tags + ' too)';
	return (point && point.hasOwnProperty('id') ? text : null);
}

/* 
	Callbacks for painting 
*/
function repaint(bPlayback = false) {
	if (!worldMap.properties.bEnabled[1]) {return;}
	if (!bPlayback && worldMap.properties.selection[1] === selMode[1] && fb.IsPlaying) {return;}
	if (bPlayback && worldMap.properties.selection[1] === selMode[0] && fb.IsPlaying) {return;}
	window.Repaint();
}

function on_size(width, height) {
	worldMap.calcScale(width, height);
}

function on_paint(gr) {
	if (!worldMap.properties.bEnabled[1]) {return;}
	// Get only X first tracks from selection, x = worldMap.properties.iLimitSelection[1]
	const sel = (worldMap.properties.selection[1] === selMode[1] ? (fb.IsPlaying ? new FbMetadbHandleList(fb.GetNowPlaying()) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist)) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist));
	if (sel.Count > worldMap.properties.iLimitSelection[1]) {sel.RemoveRange(worldMap.properties.iLimitSelection[1], sel.Count - 1);}
	worldMap.paint(gr, sel);
}

function on_playback_new_track(metadb) {
	if (!metadb) {return;}
	repaint(true);
}

function on_selection_changed() {
	repaint();
}

function on_item_focus_change() {
	repaint();
}


function on_playlist_switch() {
	repaint();
}

function on_playback_stop(reason) {
	if (reason !== 2) { // Invoked by user or Starting another track
		repaint();
	}
}

function on_playlist_items_removed(playlistIndex, new_count) {
	if (playlistIndex === plman.ActivePlaylist && new_count === 0) {
		worldMap.clearIdSelected(); // Always delete point selected if there is no items in playlist
		if (worldMap.properties.selection[1] === selMode[1] && fb.IsPlaying) {return;}
		worldMap.clearLastPoint(); // Only delete last points when selMode follows playlist selection
		repaint();
	}
}

function on_metadb_changed(handle_list) {
	if (!worldMap.properties.bEnabled[1]) {return;}
	const sel = (worldMap.properties.selection[1] === selMode[1] ? (fb.IsPlaying ? new FbMetadbHandleList(fb.GetNowPlaying()) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist)) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist));
	sel.Sort();
	const handle_listClone = handle_list.Clone();
	handle_listClone.Sort();
	sel.MakeIntersection(handle_listClone);
	if (sel && sel.Count) {
		const tags = fb.TitleFormat('[%' + worldMap.properties.mapTag[1] + '%]').EvalWithMetadbs(sel);
		if (tags.some((value) => {value !== worldMap.tagValue;})) {
			repaint();
		}
	}
}

/* 
	Callbacks for move and click
*/
function on_mouse_lbtn_up(x, y, mask) {
	if (!worldMap.properties.bEnabled[1]) {return;}
	worldMap.btn_up(x, y, mask);
}

function on_mouse_move(x, y, mask) {
	if (!worldMap.properties.bEnabled[1]) {return;}
	worldMap.move(x, y);
}

function on_mouse_leave() {
	if (!worldMap.properties.bEnabled[1]) {return;}
	worldMap.move(-1, -1);
}

/* 
	Callbacks for integration with other scripts
*/
 // When used along WilB's Biography script (on other panel), data may be fetched automatically
function on_notify_data(name, info) {
	if (!worldMap.properties.bEnabled[1]) {return;}
	if (!worldMap.properties.bEnabledBiography[1]) {return;}
	// WilB's Biography script has a limitation, it only works with 1 track at once...
	// So when selecting more than 1 track, this only gets the focused/playing track's tag
	// If both panels don't have the same selection mode, it will not work
	if (name === 'Biography notifyCountry') {
		if (info.hasOwnProperty('handle') && info.hasOwnProperty('tags')) {
			// Find the biography track on the entire selection, since it may not be just the first track of the sel list
			const sel = (worldMap.properties.selection[1] === selMode[1] ? (fb.IsPlaying ? new FbMetadbHandleList(fb.GetNowPlaying()) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist)) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist));
			// Set tag on map for drawing if found
			if (sel && sel.Count && sel.Find(info.handle) !== -1) {
				const locale = [...info.tags.find( (tag) => {return tag.name === 'locale';}).val]; // Find the tag with name == locale in the array of tags
				const jsonId =  fb.TitleFormat('[%' + worldMap.jsonId + '%]').EvalWithMetadb(info.handle); // worldMap.jsonId = artist
				if (locale.length) {
					worldMap.setTag(locale[locale.length - 1], jsonId);
					window.Repaint();
				}
			}
			// Update tags or json if needed (even if the handle was not within the selection)
			if (worldMap.properties.iWriteTags[1] > 0){
				const tagName = worldMap.properties.writeToTag[1];
				if (tagName.length) { // Check there is a track and tag is valid
					const tfo = '[%' + tagName + '%]';
					if (!fb.TitleFormat(tfo).EvalWithMetadb(info.handle).length) { // Check if tag already exists
						if (worldMap.properties.iWriteTags[1] === 1) {
							new FbMetadbHandleList(info.handle).UpdateFileInfoFromJSON(JSON.stringify([{[tagName]: locale}])); // Uses tagName var as key here
						} else if (worldMap.properties.iWriteTags[1] === 2) {
							const jsonId =  fb.TitleFormat('[%' + worldMap.jsonId + '%]').EvalWithMetadb(info.handle); // worldMap.jsonId = artist
							const locale = [...info.tags.find( (tag) => {return tag.name === 'locale';}).val]; // Find the tag with name == locale in the array of tags
							if (jsonId.length && locale.length) { // uses worldMap.jsonId
								const newData = {artist: jsonId, val: locale};
								if (!worldMap.hasData(newData)) {worldMap.saveData(newData);} // use path at properties
							}
						}
					}
				}
			}
		}
	}
	// Follow WilB's Biography script selection mode
	if (name === 'Biography notifySelectionProperty') {
		if (info.hasOwnProperty('property') && info.hasOwnProperty('val')) {
			// When ppt.focus is true, then selmode is selMode[0]
			if ((info.val && worldMap.properties.selection[1] === selMode[1]) || (!info.val && worldMap.properties.selection[1] === selMode[0])) {
				worldMap.properties['selection'][1] = selMode[(info.val ? 0 : 1)]; // Invert value
				fb.ShowPopupMessage('Selection mode at Biography panel has been changed. This is only an informative popup, this panel has been updated properly to follow the change:\n' + '"' + worldMap.properties.selection[1] + '"', window.Name);
				overwriteProperties(worldMap.properties); // Updates panel
				window.Repaint();
			}
		}
	}
}

/* 
	Menus
*/
const menu = new _menu();
{	
	{	// Enabled?
		const menuName = menu.newMenu('Map panel functionality');
		const options = [{text: 'Enabled' + nextId('invisible', true, false), val: true}, {text: 'Disabled' + nextId('invisible', true, false), val: false}];
		menu.newEntry({menuName, entryText: 'Switch all functionality:', func: null, flags: MF_GRAYED});
		menu.newEntry({menuName, entryText: 'sep'});
		options.forEach( (mode) => {
			menu.newEntry({menuName: menuName, entryText: mode.text, func: () => {
				worldMap.properties = getPropertiesPairs(worldMap.properties, '', 0); // Update properties from the panel
				if (worldMap.properties['bEnabled'][1] === mode.val) {return;}
				worldMap.properties['bEnabled'][1] = mode.val; // And update property with new value
				overwriteProperties(worldMap.properties); // Updates panel
				window.Repaint();
			}});
		});
		menu.checkMenu(menuName, options[0].text, options[options.length - 1].text,  (args = worldMap.properties) => {
			args = getPropertiesPairs(args, '', 0); // Update properties from the panel
			return (args['bEnabled'][1] ? 0 : 1);
		});
	}
	{	// Enabled Biography?
		const menuName = menu.newMenu('WilB\'s Biography integration');
		const options = [{text: 'Enabled' + nextId('invisible', true, false), val: true}, {text: 'Disabled' + nextId('invisible', true, false), val: false}];
		menu.newEntry({menuName, entryText: 'Switch Biography functionality:', func: null, flags: MF_GRAYED});
		menu.newEntry({menuName, entryText: 'sep'});
		options.forEach( (mode) => {
			menu.newEntry({menuName: menuName, entryText: mode.text, func: () => {
				worldMap.properties = getPropertiesPairs(worldMap.properties, '', 0); // Update properties from the panel
				if (worldMap.properties['bEnabledBiography'][1] === mode.val) {return;}
				if (mode.val) { // Warning check
					let answer = WshShell.Popup('Warning! Enabling WilB\'s Biography integration requires selection mode to be set the same on both panels. So everytime a tag is not found locally, the online tag is used instead.\n\nSelection mode will be synchronized automatically whenever one of the panels change it.\nDo you want to continue?', 0, window.Name, popup.question + popup.yes_no);
					if (answer === popup.no) {return;}
				}
				worldMap.properties['bEnabledBiography'][1] = mode.val; // And update property with new value
				overwriteProperties(worldMap.properties); // Updates panel
				window.NotifyOthers(window.Name + ' notifySelectionProperty', mode === selMode[0] ? true : false); // synchronize selection property
				window.Repaint();
			}, flags: () => {return (worldMap.properties.bInstalledBiography[1] ? MF_STRING : MF_GRAYED);}});
		});
		menu.checkMenu(menuName, options[0].text, options[options.length - 1].text,  (args = worldMap.properties) => {
			args = getPropertiesPairs(args, '', 0); // Update properties from the panel
			return (args['bEnabledBiography'][1] ? 0 : 1);
		});
		menu.newEntry({menuName, entryText: 'sep'});
		menu.newEntry({menuName, entryText: () => {return (worldMap.properties.bInstalledBiography[1] ? 'Uninstall mod (reverts changes)' : 'Install mod (required to enable)');}, func: () => {
			let fileArr = findRecursivefile('*.js', [fb.ProfilePath, fb.ComponentPath]); // All possible paths for the scripts
			const modText = "\ninclude(fb.ProfilePath + 'scripts\\\\SMP\\\\xxx-scripts\\\\helpers\\\\biography_mod_xxx.js');";
			const idText = "window.DefinePanel('Biography', {author:'WilB'";
			const backupExt = '.back';
			let text = '', foundArr = [];
			fileArr.forEach( (file) => {
				text = utils.ReadTextFile(file);
				if (text.indexOf(idText) !== -1 && text.indexOf('omit this same script') === -1) { // Omit this one from the list!
					if (!worldMap.properties.bInstalledBiography[1]) {
						if (text.indexOf(modText) === -1) {foundArr.push(file);} // When installing, look for not modified script
					} else {
						if (text.indexOf(modText) !== -1) {foundArr.push(file);} // Otherwise, look for the mod string
					}
				}
			});
			let i = 1;
			let input = '';
			if (foundArr.length) {fb.ShowPopupMessage('Found these files:\n' + i + ': ' + foundArr.join('\n' + ++i + ': '), window.Name);}
			else {fb.ShowPopupMessage('WilB\'s ' + (worldMap.properties.bInstalledBiography[1] ? 'modified ' : '') +'Biography script not found neither in the profile nor in the component folder.\nIf you are doing a manual install, edit or replace the files and change the property on this panel manually:\n"' + worldMap.properties.bInstalledBiography[0] + '"', window.Name); return;}
			try {input = utils.InputBox(window.ID, 'Select by number the files to edit (sep by comma).\nCheck new window for paths' + '\nNumber of files: ' + foundArr.length, window.Name);}
			catch (e) {return;}
			if (!input.trim().length) {return;}
			input = input.trim().split(',');
			if (input.some((idx) => {return idx > foundArr.length;})) {return;}
			let selectFound = [];
			input.forEach( (idx) => {selectFound.push(foundArr[idx - 1]);});
			let bDone = true;
			selectFound.forEach( (file) => {
				if (!bDone) {return;}
				console.log('World Map: Editing file ' + file);
				text = utils.ReadTextFile(file);
				if (!worldMap.properties.bInstalledBiography[1]) {
					text += modText;
					if (!_isFile(file + backupExt)) {
						bDone = _copyFile(file, file + backupExt);
					} else {bDone = false; fb.ShowPopupMessage('Selected file already has a backup. Edit aborted.\n' + file, window.Name); return;}
					if (bDone) {
						bDone = utils.WriteTextFile(file, text);
					} else {fb.ShowPopupMessage('Error creating a backup.\n' + file, window.Name); return;}
					if (!bDone) {fb.ShowPopupMessage('Error editing the file.\n' + file, window.Name); return;}
				} else {
					let bDone = false;
					if (_isFile(file + backupExt)) {
						bDone = _recycleFile(file);
					} else {bDone = false; fb.ShowPopupMessage('Selected file does not have a backup. Edit aborted.\n' + file, window.Name); return;}
					if (bDone) {
						bDone = _renameFile(file + backupExt, file);
					} else {fb.ShowPopupMessage('Error deleting the modified file.\n' + file, window.Name); return;}
					if (!bDone) {fb.ShowPopupMessage('Error renaming the backup.\n' + file, window.Name); return;}
					// TODO: Revert changes editing file if not backup is found?
				}
			});
			if (bDone) {fb.ShowPopupMessage('Script(s) modified sucessfully:\n' + selectFound.join('\n') + '\nPlease reload the Biography panel.', window.Name);}
			else {fb.ShowPopupMessage('There were some errors during script modification. Check the other windows.', window.Name); return;}
			worldMap.properties.bInstalledBiography[1] = !worldMap.properties.bInstalledBiography[1];
			if (!worldMap.properties.bInstalledBiography[1]) {worldMap.properties.bEnabledBiography[1] = false;}
			overwriteProperties(worldMap.properties); // Updates panel
		}});
	}
	menu.newEntry({entryText: 'sep'});
	{	// Selection mode
		const menuName = menu.newMenu('Selection mode');
		const options = selMode;
		options.forEach( (mode) => {
			menu.newEntry({menuName, entryText: mode, func: () => {
				worldMap.properties = getPropertiesPairs(worldMap.properties, '', 0); // Update properties from the panel
				if (worldMap.properties['selection'][1] === mode) {return;}
				if (worldMap.properties['bEnabledBiography'][1]) { // Warning check
					let answer = WshShell.Popup('Warning! WilB\'s Biography integration is enabled. This setting will be applied on both panels!\n\nDo you want to continue?', 0, window.Name, popup.question + popup.yes_no);
					if (answer === popup.no) {return;}
				}
				worldMap.properties['selection'][1] = mode; // And update property with new value
				overwriteProperties(worldMap.properties); // Updates panel
				// When ppt.focus is true, then selmode is selMode[0]
				if (worldMap.properties.bEnabledBiography[1]) {
					window.NotifyOthers(window.Name + ' notifySelectionProperty', mode === selMode[0] ? true : false); // synchronize selection property
				}
				window.Repaint();
			}});
		});
		menu.checkMenu(menuName, options[0], options[options.length - 1],  (args = worldMap.properties) => {
			args = getPropertiesPairs(args, '', 0); // Update properties from the panel
			return options.indexOf(args['selection'][1]);
		});
	}
	{	// Write tags?
		const menuName = menu.newMenu('Write tags on playback');
		menu.newEntry({menuName, entryText: 'Used along WilB\'s Biography script:', func: null, flags: MF_GRAYED});
		menu.newEntry({menuName, entryText: 'sep'});
		const options = [{text: 'No (read only from tags, online or json)', val: 0}, {text: 'Yes, when tag has not been already set on track', val: 1}, {text: 'Yes, as json (for internal use on the script)', val: 2}];
		options.forEach( (mode) => {
			menu.newEntry({menuName, entryText: mode.text, func: () => {
				worldMap.properties = getPropertiesPairs(worldMap.properties, '', 0); // Update properties from the panel
				if (worldMap.properties['iWriteTags'][1] === mode.val) {return;}
				if (mode.val) { // Warning check
					let answer = WshShell.Popup('Warning! Writing tags on playback has 2 requirements:\n- WilB\'s Biography script installed on another panel.\n- Both configured with the same selection mode (otherwise, the script will try to add tags from one track to another track).\n\nNot following these requisites will make the feature to not work or work unexpectedly.\nDo you want to continue?', 0, window.Name, popup.question + popup.yes_no);
					if (answer === popup.no) {return;}
				}
				worldMap.properties['iWriteTags'][1] = mode.val; // And update property with new value
				overwriteProperties(worldMap.properties); // Updates panel
			}});
		});
		menu.checkMenu(menuName, options[0].text, options[options.length - 1].text,  (args = worldMap.properties) => {
			args = getPropertiesPairs(args, '', 0); // Update properties from the panel
			return (args['iWriteTags'][1]);
		});
		menu.newEntry({menuName, entryText: 'sep', func: null});
		menu.newEntry({menuName, entryText: 'Show data folder', func: () => {
			_explorer(worldMap.properties.fileName[1]);
		}, flags: () => {return _isFile(worldMap.properties.fileName[1]) ? MF_STRING : MF_GRAYED;}});
	}
}

function on_mouse_rbtn_up(x, y) {
	menu.btn_up(x, y);
	return true; // Disable right button menu
}