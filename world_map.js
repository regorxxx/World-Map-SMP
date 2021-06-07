'use strict';

/* 
	World Map v 1.0.0 01/05/21 REQUIRES WilB's Biography Mod script for online tags!!!
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
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\helpers_xxx_prototypes.js');
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\helpers_xxx_properties.js');
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\helpers_xxx_tags.js');
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\map_xxx.js');
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\world_map_tables.js');
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\world_map_menu.js');
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\world_map_helpers.js');

/* 
	Properties 
*/
var worldMap_prefix = 'wm_';
const selMode = ['Follow selected track(s) (playlist)','Prefer now playing'];
const modifiers = [ // Easily expandable. Used at helpers and menu too
	{mask: MK_CONTROL, tag: 'modFirstTag', description: 'Control', val: 'genre' }, 
	{mask: MK_SHIFT, tag: 'modSecondTag', description: 'Shift', val: 'style'},
	{mask: MK_SHIFT + MK_CONTROL, tag: 'modThirdTag', description: 'Shift + Control', val: 'style,genre'}
];
const worldMap_properties = {
	mapTag				: 	['Tag name or TF expression for artist\'s country', '$meta(locale last.fm,$sub($meta_num(locale last.fm),1))'],
	imageMapPath		: 	['Path to your own world map (mercator projection)', ''],
	iWriteTags			:	['When used along Biography script, tags may be written to files (if not present)', 0],
	writeToTag			:	['Where to write tag values (should be related to 1st property)', 'locale last.fm'],
	selection			:	['Follow selection or playback? (must match Biography script!)', selMode[0]],
	bEnabled			:	['Enable panel', true],
	bEnabledBiography	:	['Enable WilB\'s Biography script integration', false],
	forcedQuery			:	['Global forced query', 'NOT (%rating% EQUAL 2 OR %rating% EQUAL 1) AND NOT (STYLE IS Live AND NOT STYLE IS Hi-Fi) AND %channels% LESS 3 AND NOT COMMENT HAS Quad'],
	fileName			:	['JSON filename (for tags)', folders.data + 'worldMap.json'],
	firstPopup			:	['World Map: Fired once', false],
	tagFilter			:	['Filter these values globally for ctrl tags (sep. by comma)', 'Instrumental'],
	iLimitSelection		:	['Repaint panel only if selecting less than...', 5000],
	factorX				:	['Percentage applied to X coordinates', 100],
	factorY				:	['Percentage applied to Y coordinates', 100],
	bInstalledBiography	:	['Is installed biography mod?', false],
};
modifiers.forEach( (mod) => {worldMap_properties[mod.tag] = ['Force tag matching when clicking + ' + mod.description + ' on point', mod.val, {func: isStringWeak}, mod.val];});
worldMap_properties['mapTag'].push({func: isString}, worldMap_properties['mapTag'][1]);
worldMap_properties['iWriteTags'].push({range: [[0,2]]}, worldMap_properties['iWriteTags'][1]);
worldMap_properties['selection'].push({eq: selMode}, worldMap_properties['selection'][1]);
worldMap_properties['forcedQuery'].push({func: (query) => {return checkQuery(query, true);}}, worldMap_properties['forcedQuery'][1]);
worldMap_properties['fileName'].push({portable: true}, worldMap_properties['fileName'][1]);
worldMap_properties['tagFilter'].push({func: isStringWeak}, worldMap_properties['tagFilter'][1]);
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

// Info Popup
if (!worldMap.properties['firstPopup'][1]) {
	worldMap.properties['firstPopup'][1] = true;
	overwriteProperties(worldMap.properties); // Updates panel
	isPortable([worldMap.properties['fileName'][0], worldMap.properties['imageMapPath'][0]]);
	const readmePath = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\readme\\world_map.txt';
	if ((isCompatible('1.4.0') ? utils.IsFile(readmePath) : utils.FileTest(readmePath, "e"))) {
		const readme = utils.ReadTextFile(readmePath, 65001);
		if (readme.length) {fb.ShowPopupMessage(readme, window.Name);}
	}
}

// Additional check
worldMap.properties['bEnabledBiography'].push({func: biographyCheck}, worldMap.properties['bInstalledBiography'][1]);
overwriteProperties(worldMap.properties); // Updates panel

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
	worldMap.paint({gr, sel});
}

function on_playback_new_track(metadb) {
	if (!metadb) {return;}
	repaint(true);
}

function on_selection_changed() {
	worldMap.clearIdSelected();
	repaint();
}

function on_item_focus_change() {
	worldMap.clearIdSelected();
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

function on_mouse_rbtn_up(x, y) {
	createMenu().btn_up(x, y);
	return true; // Disable right button menu
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
				const locale = [...info.tags.find( (tag) => {return tag.name === 'locale';}).val]; // Find the tag with name === locale in the array of tags
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
							const locale = [...info.tags.find( (tag) => {return tag.name === 'locale';}).val]; // Find the tag with name === locale in the array of tags
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