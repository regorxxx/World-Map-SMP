'use strict';
//04/03/23

/* 
	World Map 		(REQUIRES WilB's Biography Mod script for online tags!!!)
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
 */

window.DefineScript('World Map', {author:'XXX', version: '2.6.0', features: {drag_n_drop: false}});
include('helpers\\helpers_xxx.js');
include('helpers\\helpers_xxx_prototypes.js');
include('helpers\\helpers_xxx_properties.js');
include('helpers\\helpers_xxx_tags.js');
include('helpers\\map_xxx.js');
include('helpers\\callbacks_xxx.js');
include('main\\music_graph\\music_graph_descriptors_xxx_countries.js');
include('main\\world_map\\world_map_tables.js');
include('main\\world_map\\world_map_menu.js');
include('main\\world_map\\world_map_helpers.js');
include('main\\world_map\\world_map_flags.js');
include('main\\filter_and_query\\remove_duplicates.js');

checkCompatible('1.6.1', 'smp');

/* 
	Properties 
*/
const selMode = ['Follow selected track(s) (playlist)','Prefer now playing'];
const modifiers = [ // Easily expandable. Used at helpers and menu too
	{mask: MK_CONTROL, tag: 'modFirstTag', description: 'Control', val: 'GENRE' }, 
	{mask: MK_SHIFT, tag: 'modSecondTag', description: 'Shift', val: 'STYLE'},
	{mask: MK_SHIFT + MK_CONTROL, tag: 'modThirdTag', description: 'Shift + Control', val: 'STYLE,GENRE'}
];
const worldMap_properties = {
	mapTag				: 	['Tag name or TF expression for artist\'s country', '$meta(locale last.fm,$sub($meta_num(locale last.fm),1))', {func: isString}, '$meta(locale last.fm,$sub($meta_num(locale last.fm),1))'],
	imageMapPath		: 	['Path to your own world map (mercator projection)', '', {func: isStringWeak}, ''],
	iWriteTags			:	['When used along Biography script, tags may be written to files (if not present)', 0, {func: isInt, range: [[0, 2]]}, 0],
	writeToTag			:	['Where to write tag values (should be related to 1st property)', 'Locale Last.fm', {func: isString}, 'Locale Last.fm'],
	selection			:	['Follow selection or playback? (must match Biography script!)', selMode[0], {eq: selMode}, selMode[0]],
	bEnabled			:	['Enable panel', true, {func: isBoolean}, true],
	bEnabledBiography	:	['Enable WilB\'s Biography script integration', false, {func: isBoolean}, false],
	forcedQuery			:	['Global forced query', globQuery.filter, {func: (query) => {return checkQuery(query, true);}}, globQuery.filter],
	fileName			:	['JSON filename (for tags)', (_isFile(fb.FoobarPath + 'portable_mode_enabled') ? '.\\profile\\' + folders.dataName : folders.data) + 'worldMap.json'],
	firstPopup			:	['World Map: Fired once', false, {func: isBoolean}, false],
	tagFilter			:	['Filter these values globally for ctrl tags (sep. by comma)', 'Instrumental', {func: isStringWeak}, 'Instrumental'],
	iLimitSelection		:	['Repaint panel only if selecting less than...', 500, {func: isInt, range: [[2, 25000]]}, 5],
	factorX				:	['Percentage applied to X coordinates', 100, {func: isInt, range: [[50, 200]]}, 100],
	factorY				:	['Percentage applied to Y coordinates',137, {func: isInt, range: [[50, 200]]}, 137],
	bInstalledBiography	:	['Is installed biography mod?', false, {func: isBoolean}, false],
	customPanelColorMode:	['Custom background color mode', 0, {func: isInt, range: [[0, 2]]}, 0],
	customPanelColor	:	['Custom background color for the panel', window.InstanceType ? window.GetColourDUI(1): window.GetColourCUI(3)],
	customPointSize		:	['Custom point size for the panel', 16, {func: isInt}, 16],
	customPointColorMode:	['Custom point color mode', 0, {func: isInt, range: [[0, 1]]}, 0],
	customPointColor	:	['Custom point color for the panel', 0xFF00FFFF, {func: isInt}, 0xFF00FFFF],
	bPointFill			:	['Draw a point or a circular corona?', false, {func: isBoolean}, false],
	customLocaleColor	:	['Custom text color', 0xFF000000, {func: isInt}, 0xFF000000],
	bShowLocale			:	['Show current locale tag', true, {func: isBoolean}, true],
	fontSize			:	['Size of header text', 10, {func: isInt}, globFonts.standard.size],
	panelMode			:	['Display selection (0) or current library (1)', 0, {func: isInt, range: [[0, 1]]}, 0],
	fileNameLibrary		:	['JSON filename (for library tags)', (_isFile(fb.FoobarPath + 'portable_mode_enabled') ? '.\\profile\\' + folders.dataName : folders.data) + 'worldMap_library.json'],
	bShowFlag			:	['Show flag on header', false, {func: isBoolean}, false],
	pointMode			:	['Points (0), shapes (1) or both (2)', 2, {func: isInt, range: [[0, 2]]}, 2],
	bShowSelModePopup	:	['Show warning when selection mode changes', true, {func: isBoolean}, true]
};
modifiers.forEach( (mod) => {worldMap_properties[mod.tag] = ['Force tag matching when clicking + ' + mod.description + ' on point', mod.val, {func: isStringWeak}, mod.val];});
worldMap_properties['fileName'].push({portable: true}, worldMap_properties['fileName'][1]);
worldMap_properties['fileNameLibrary'].push({portable: true}, worldMap_properties['fileNameLibrary'][1]);
worldMap_properties['customPanelColor'].push({func: isInt}, worldMap_properties['customPanelColor'][1]);
setProperties(worldMap_properties, '', 0);

/* 
	Map 
*/
const worldMap = new imageMap({
	imagePath:				folders.xxx + 'images\\MC_WorldMap_No_Ant.jpg',
	properties:				getPropertiesPairs(worldMap_properties, '', 0),
	jsonId:					'artist', // id and tag used to identify different entries
	findCoordinatesFunc:	findCountryCoords, // Function at helpers\world_map_tables.js
	findPointFunc:			findCountry, // Function at helpers\world_map_tables.js
	selPointFunc:			selPoint, // What happens when clicking on a point, helpers\world_map_helpers.js
	selFindPointFunc:		selFindPoint, // What happens when clicking on the map, if current track has no tags, helpers\world_map_helpers.js
	tooltipFunc: 			tooltip, // What happens when mouse is over point, helpers\world_map_helpers.js
	tooltipFindPointFunc: 	tooltipFindPoint, // What happens when mouse is over the map, if current track has no tags, helpers\world_map_helpers.js
	font:					globFonts.standard.name
});

// Additional config
worldMap.pointSize = worldMap.properties.customPointSize[1];
worldMap.pointLineSize = worldMap.pointSize * 2 + 5;
if (worldMap.properties.customPointColorMode[1] === 1) {worldMap.defaultColor = worldMap.properties.customPointColor[1];}
worldMap.pointLineSize = worldMap.properties.bPointFill[1] ? worldMap.pointSize : worldMap.pointSize * 2 + 5;
worldMap.textColor = worldMap.properties.customLocaleColor[1];

// Info Popup
if (!worldMap.properties['firstPopup'][1]) {
	worldMap.properties['firstPopup'][1] = true;
	overwriteProperties(worldMap.properties); // Updates panel
	isPortable([worldMap.properties['fileName'][0], worldMap.properties['imageMapPath'][0]]);
	const readmePath = folders.xxx + 'helpers\\readme\\world_map.txt';
	const readme = _open(readmePath, utf8);
	if (readme.length) {fb.ShowPopupMessage(readme, window.Name);}
}

// Additional check
worldMap.properties['bEnabledBiography'].push({func: biographyCheck}, worldMap.properties['bInstalledBiography'][1]);
overwriteProperties(worldMap.properties); // Updates panel

// Library Mode
if (!_isFile(worldMap.properties.fileNameLibrary[1])) {saveLibraryTags(worldMap.properties.fileNameLibrary[1], worldMap.jsonId, worldMap);}
const libraryPoints = _isFile(worldMap.properties.fileNameLibrary[1]) ? _jsonParseFileCheck(worldMap.properties.fileNameLibrary[1], 'Library json', window.Name, utf8) : null;

{ // Default database
	const defDatabase = folders.xxx + 'presets\\World Map\\worldMap.json';
	if (!_isFile(worldMap.properties.fileName[1]) && _isFile(defDatabase)) {
		console.log('Using default database file: ' + defDatabase);
		_copyFile(defDatabase, worldMap.properties.fileName[1]);
		worldMap.init();
	}
}

/* 
	Callbacks for painting 
*/
function repaint(bPlayback = false) {
	if (!worldMap.properties.bEnabled[1]) {return;}
	if (worldMap.properties.panelMode[1]) {return;}
	if (!bPlayback && worldMap.properties.selection[1] === selMode[1] && fb.IsPlaying) {return;}
	if (bPlayback && worldMap.properties.selection[1] === selMode[0] && fb.IsPlaying) {return;}
	imgAsync.layers.imgs.length = 0;
	imgAsync.layers.iso.clear();
	imgAsync.layers.processedIso.clear();
	imgAsync.layers.bPaint = false;
	imgAsync.layers.bStop = true;
	window.Repaint();
}

addEventListener('on_size', (width, height) => {
	worldMap.calcScale(width, height);
});

addEventListener('on_colours_changed', () => {
	worldMap.coloursChanged();
	window.Repaint();
});
const imgAsync = {layers: {bPaint: false, bStop: false, imgs: [], iso: new Set(), processedIso: new Set()}};
addEventListener('on_paint', (gr) => {
	if (!worldMap.properties.bEnabled[1]) {worldMap.paintBg(gr); return;}
	if (worldMap.properties.panelMode[1]) { // Display entire library
		if (libraryPoints && libraryPoints.length) {
			if (!worldMap.idSelected.length) {worldMap.idSelected = 'ALL';}
			worldMap.lastPoint = libraryPoints;
		}
		worldMap.paint({gr});
	} else { // Get only X first tracks from selection, x = worldMap.properties.iLimitSelection[1]
		let sel = (worldMap.properties.selection[1] === selMode[1] ? (fb.IsPlaying ? new FbMetadbHandleList(fb.GetNowPlaying()) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist)) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist));
		sel = removeDuplicatesV2({handleList: sel, checkKeys:[worldMap.jsonId]});
		if (sel.Count > worldMap.properties.iLimitSelection[1]) {sel.RemoveRange(worldMap.properties.iLimitSelection[1], sel.Count - 1);}
		const bPressWin = utils.IsKeyPressed(VK_RWIN) || utils.IsKeyPressed(VK_LWIN);
		const bPressShift = utils.IsKeyPressed(VK_SHIFT);
		worldMap.paint({gr, sel, bOverridePaintSel: worldMap.properties.pointMode[1] >= 1 || (bPressShift && !bPressWin && worldMap.foundPoints.length)});
		if (sel.Count) {
			if (bPressShift && !bPressWin && worldMap.foundPoints.length){
				const id = formatCountry(worldMap.foundPoints[0].key || '');
				let point = worldMap.point[id];
				if (!point) {
					const [xPos, yPos] = worldMap.findCoordinates(id, worldMap.imageMap.Width, worldMap.imageMap.Height, worldMap.factorX, worldMap.factorY);
					if (xPos !== -1 && yPos !== -1) {
						point = {x: xPos, y: yPos, xScaled: xPos * worldMap.scale + worldMap.posX, yScaled: yPos * worldMap.scale + worldMap.posY, id};
					}
				}
				if (point) {
					gr.DrawEllipse(point.xScaled, point.yScaled, worldMap.pointSize * worldMap.scale, worldMap.pointSize * worldMap.scale, worldMap.pointLineSize * worldMap.scale, worldMap.defaultColor);
				}
			} else if (worldMap.lastPoint.length >= 1 && worldMap.properties.pointMode[1] >= 1) {
				if (imgAsync.layers.bPaint) {
					if (imgAsync.layers.imgs.length !== worldMap.lastPoint.length) {repaint();}
					imgAsync.layers.imgs.forEach((imgObj) => {
						gr.DrawImage(imgObj.img, imgObj.x, imgObj.y, imgObj.w, imgObj.h, 0, 0, imgObj.w, imgObj.h, 0, 240);
					});
				}
				const promises = [];
				imgAsync.layers.bStop = false;
				worldMap.lastPoint.forEach((point, i) => {
					let id = point.id;
					if (worldMap.properties.pointMode[1] >= 1) { // Shapes or both
						const iso = id && id.length ? isoMap.get(id.toLowerCase()) : null;
						if (iso) {
							if (!imgAsync.layers.iso.has(iso)) {
								imgAsync.layers.iso.add(iso);
								const file = folders.xxx + 'helpers-external\\countries-mercator\\' + iso + '.png';
								if (_isFile(file)) {
									promises.push(new Promise((resolve) => {
										setTimeout(() => {
											if (imgAsync.layers.bStop) {resolve();}
											if (imgAsync.layers.processedIso.has(iso)) {resolve();}
											gdi.LoadImageAsyncV2(void(0), file).then((img) => {
												if (img && !imgAsync.layers.bStop && !imgAsync.layers.processedIso.has(iso)) {
													// Hardcoded values comparing Mercator map with Antarctica against python generated countries
													const bAntr = /(?:^|.*_)no_ant(?:_.*|\..*$)/i.test(worldMap.imageMapPath);
													const offsetX = 100, offsetY = 100, offsetYAntarc = 620;
													const w = (worldMap.imageMap.Width + offsetX * 2) * worldMap.scale;
													const h = (worldMap.imageMap.Height + offsetY * 2 + (bAntr ? offsetYAntarc : 0)) * worldMap.scale;
													img = img.Resize(w, h, InterpolationMode.HighQualityBicubic);
													imgAsync.layers.imgs.push({img, iso, x: worldMap.posX - offsetX * worldMap.scale, y: worldMap.posY - offsetY * worldMap.scale, w: img.Width, h: img.Height});
													imgAsync.layers.processedIso.add(iso);
												}
												resolve();
											});
										}, i * 250 + 25)
									}));
								}
							}
						}
					}
					if (worldMap.properties.pointMode[1] === 2) {  // Both
						let point = worldMap.point[id];
						if (!point) {
							const [xPos, yPos] = worldMap.findCoordinates(id, worldMap.imageMap.Width, worldMap.imageMap.Height, worldMap.factorX, worldMap.factorY);
							if (xPos !== -1 && yPos !== -1) {
								point = {x: xPos, y: yPos, xScaled: xPos * worldMap.scale + worldMap.posX, yScaled: yPos * worldMap.scale + worldMap.posY, id};
							}
						}
						if (point) {
							gr.DrawEllipse(point.xScaled, point.yScaled, worldMap.pointSize * worldMap.scale, worldMap.pointSize * worldMap.scale, worldMap.pointLineSize * worldMap.scale, worldMap.defaultColor);
						}
					}
				});
				if (promises.length) {
					Promise.all(promises).then(() => {
						if (imgAsync.layers.bStop) {return;}
						imgAsync.layers.bPaint = true;
						window.Repaint();
					});
				}
			}
		}
		if (sel.Count && worldMap.properties.bShowLocale[1]) { // Header text
			const posX = worldMap.posX;
			const posY = worldMap.posY;
			const w = worldMap.imageMap.Width * worldMap.scale;
			const h = worldMap.imageMap.Height * worldMap.scale;
			let countryName = '- none -';
			if (worldMap.lastPoint.length === 1) {
				const id = worldMap.lastPoint[0].id;
				countryName = nameReplacersRev.has(id.toLowerCase()) ? formatCountry(nameReplacersRev.get(id.toLowerCase())) : id; // Prefer replacement since its usually shorter...
			} else if (worldMap.lastPoint.length > 1 ) {
				countryName = 'Multiple countries...';
			}
			const textW = gr.CalcTextWidth(countryName, worldMap.gFont);
			const textH = gr.CalcTextHeight(countryName, worldMap.gFont);
			// Header
			gr.FillSolidRect(posX, posY, w, textH, RGBA(...toRGB(worldMap.panelColor), 150));
			// Flag
			if (worldMap.properties.bShowFlag[1] && worldMap.lastPoint.length === 1) {
				const id = worldMap.lastPoint[0].id;
				let flag = loadFlagImage(id);
				const flagScale = flag.Height / textH;
				flag = flag.Resize(flag.Width / flagScale, textH, InterpolationMode.HighQualityBicubic) 
				gr.DrawImage(flag, posX + 10, posY, flag.Width, flag.Height, 0, 0, flag.Width, flag.Height)
				// Text
				if (textW + flag.Width < w) {gr.GdiDrawText(countryName, worldMap.gFont, worldMap.textColor, posX, posY, w, h, DT_CENTER|DT_NOPREFIX);}
				else {gr.GdiDrawText(countryName.slice(0, Math.floor(20 * 35 / worldMap.gFont.Size)) + '...', worldMap.gFont, worldMap.textColor, posX, posY, w, h, DT_CENTER|DT_NOPREFIX)}
			} else {
				if (textW < w) {gr.GdiDrawText(countryName, worldMap.gFont, worldMap.textColor, posX, posY, w, h, DT_CENTER|DT_NOPREFIX);}
				else {gr.GdiDrawText(countryName.slice(0, Math.floor(25 * 35 / worldMap.gFont.Size)) + '...', worldMap.gFont, worldMap.textColor, posX, posY, w, h, DT_CENTER|DT_NOPREFIX)}
			}
		}
	}
});

addEventListener('on_playback_new_track', (metadb) => {
	if (!metadb) {return;}
	repaint(true);
});

addEventListener('on_selection_changed', () => {
	worldMap.clearIdSelected();
	repaint();
});

addEventListener('on_item_focus_change', () => {
	worldMap.clearIdSelected();
	repaint();
});

addEventListener('on_playlist_switch', () => {
	repaint();
});

addEventListener('on_playback_stop', (reason) => {
	if (reason !== 2) { // Invoked by user or Starting another track
		repaint();
	}
});

addEventListener('on_playlist_items_removed', (playlistIndex, newCount) => {
	if (playlistIndex === plman.ActivePlaylist && newCount === 0) {
		worldMap.clearIdSelected(); // Always delete point selected if there is no items in playlist
		if (worldMap.properties.selection[1] === selMode[1] && fb.IsPlaying) {return;}
		worldMap.clearLastPoint(); // Only delete last points when selMode follows playlist selection
		repaint();
	}
});

addEventListener('on_metadb_changed', (handleList, fromHook) => {
	if (fromHook) {return;}
	if (!worldMap.properties.bEnabled[1]) {return;}
	const sel = (worldMap.properties.selection[1] === selMode[1] ? (fb.IsPlaying ? new FbMetadbHandleList(fb.GetNowPlaying()) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist)) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist));
	sel.Sort();
	const handleListClone = handleList.Clone();
	handleListClone.Sort();
	sel.MakeIntersection(handleListClone);
	if (sel && sel.Count) {
		const mapTag = worldMap.properties.mapTag[1].indexOf('$') === -1 && worldMap.properties.mapTag[1].indexOf('%') === -1 ? '%' + worldMap.properties.mapTag[1] + '%' : worldMap.properties.mapTag[1];
		const tags = fb.TitleFormat('[' + mapTag + ']').EvalWithMetadbs(sel);
		if (tags.some((value) => {return worldMap.getLastPoint().some((last) => {return last.val !== value;});})) {
			repaint();
		}
	}
});

/* 
	Callbacks for move and click
*/
addEventListener('on_mouse_lbtn_up', (x, y, mask) => {
	if (!worldMap.properties.bEnabled[1]) {return;}
	if (!worldMap.properties.panelMode[1]) { // On track mode disable point menu without selection
		const sel = (worldMap.properties.selection[1] === selMode[1] ? (fb.IsPlaying ? new FbMetadbHandleList(fb.GetNowPlaying()) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist)) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist));
		if (!sel || !sel.Count) {return;}
	}
	worldMap.btn_up(x, y, worldMap.properties.panelMode[1] ? null : mask); // Disable shift on library mode
});

addEventListener('on_mouse_move', (x, y, mask) => {
	if (!worldMap.properties.bEnabled[1]) {return;}
	if (!worldMap.properties.panelMode[1]) { // On track mode disable tooltip without selection
		const sel = (worldMap.properties.selection[1] === selMode[1] ? (fb.IsPlaying ? new FbMetadbHandleList(fb.GetNowPlaying()) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist)) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist));
		if (!sel || !sel.Count) {return;}
	}
	const cache = worldMap.foundPoints.length ? worldMap.foundPoints[0] : null;
	worldMap.move(x, y, worldMap.properties.panelMode[1] ? null : mask); // Disable shift on library mode
	if (cache && worldMap.foundPoints.length && worldMap.foundPoints[0] !== cache) {window.Repaint();}
});

addEventListener('on_key_up', (vKey) => { // Repaint after pressing shift to reset
	if (vKey === VK_SHIFT && !worldMap.properties.panelMode[1]) {window.Repaint();}
});

addEventListener('on_mouse_leave', () => {
	if (!worldMap.properties.bEnabled[1]) {return;}
	worldMap.move(-1, -1);
});

addEventListener('on_mouse_rbtn_up', (x, y) => {
	createMenu().btn_up(x, y);
	return true; // Disable right button menu
});

/* 
	Callbacks for integration with other scripts
*/
 // When used along WilB's Biography script (on other panel), data may be fetched automatically
addEventListener('on_notify_data', (name, info) => {
	if (name === 'bio_imgChange' || name === 'bio_chkTrackRev' || name === 'xxx-scripts: panel name reply') {return;}
	if (!worldMap.properties.bEnabled[1]) {return;}
	if (!worldMap.properties.bEnabledBiography[1]) {return;}
	// WilB's Biography script has a limitation, it only works with 1 track at once...
	// So when selecting more than 1 track, this only gets the focused/playing track's tag
	// If both panels don't have the same selection mode, it will not work
	if (name === 'Biography notifyCountry' || name === 'biographyTags') {
		if (info.hasOwnProperty('handle') && info.hasOwnProperty('tags')) {
			// Find the biography track on the entire selection, since it may not be just the first track of the sel list
			const sel = (worldMap.properties.selection[1] === selMode[1] ? (fb.IsPlaying ? new FbMetadbHandleList(fb.GetNowPlaying()) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist)) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist));
			// Get Tags
			const tagName = worldMap.properties.writeToTag[1];
			if (tagName.length) {
				let locale = '';
				if (isArray(info.tags)) { // Biography 1.1.3
					locale = [...info.tags.find( (tag) => {return tag.name === 'locale';}).val]; // Find the tag with name === locale in the array of tags
				} else if (info.tags.hasOwnProperty(tagName)) { // Biography 1.2.0
					locale = [...info.tags[tagName]]; // or  object key
				}
				// Replace country name with iso standard name if it's a known variation
				if (nameReplacers.has(locale[locale.length - 1])) {locale[locale.length - 1] = formatCountry(nameReplacers.get(locale[locale.length - 1]));}
				const jsonId =  fb.TitleFormat(_bt(worldMap.jsonId)).EvalWithMetadb(info.handle); // worldMap.jsonId = artist
				if (jsonId.length && locale.length) {
					// Set tag on map for drawing if found
					if (sel && sel.Count && sel.Find(info.handle) !== -1) {
						worldMap.setTag(locale[locale.length - 1], jsonId);
						window.Repaint();
					}
					// Update tags or json if needed (even if the handle was not within the selection)
					if (worldMap.properties.iWriteTags[1] > 0){
						const tfo = _bt(tagName);
						if (!fb.TitleFormat(tfo).EvalWithMetadb(info.handle).length) { // Check if tag already exists
							if (worldMap.properties.iWriteTags[1] === 1) {
								new FbMetadbHandleList(info.handle).UpdateFileInfoFromJSON(JSON.stringify([{[tagName]: locale}])); // Uses tagName var as key here
							} else if (worldMap.properties.iWriteTags[1] === 2) {
								const newData = {[worldMap.jsonId]: jsonId, val: locale};
								if (!worldMap.hasDataById(jsonId)) {worldMap.saveData(newData);} // use path at properties
							}
						}
					}
				}
			}
		}
	}
	// Follow WilB's Biography script selection mode
	if (name === 'Biography notifySelectionProperty') { // Biography 1.1.3
		if (info.hasOwnProperty('property') && info.hasOwnProperty('val')) {
			// When ppt.focus is true, then selmode is selMode[0]
			if ((info.val && worldMap.properties.selection[1] === selMode[1]) || (!info.val && worldMap.properties.selection[1] === selMode[0])) {
				worldMap.properties.selection[1] = selMode[(info.val ? 0 : 1)]; // Invert value
				if (worldMap.properties.bShowSelModePopup[1]) {
					fb.ShowPopupMessage('Selection mode at Biography panel has been changed. This is only an informative popup, this panel has been updated properly to follow the change:\n' + '"' + worldMap.properties.selection[1] + '"', window.Name);
				}
				overwriteProperties(worldMap.properties); // Updates panel
				window.Repaint();
			}
		}
	}// Follow WilB's Biography script selection mode
	if (name === 'biographyTags') { // Biography 1.2.0
		if (info.hasOwnProperty('selectionMode')) {
			let bDone = false;
			switch (info.selectionMode) {
				case 'Prefer nowplaying': {
					if (worldMap.properties.selection[1] !== selMode[1]) {worldMap.properties['selection'][1] = selMode[1]; bDone = true;}
					break;
				}
				case 'Follow selected track (playlist)': {
					if (worldMap.properties.selection[1] !== selMode[0]) {worldMap.properties['selection'][1] = selMode[0]; bDone = true;}
					break;
				}
			}
			if (bDone) {
				if (worldMap.properties.bShowSelModePopup[1]) {
					fb.ShowPopupMessage('Selection mode at Biography panel has been changed. This is only an informative popup, this panel has been updated properly to follow the change:\n' + '"' + worldMap.properties.selection[1] + '"', window.Name);
				}
				overwriteProperties(worldMap.properties); // Updates panel
				window.Repaint();
			}
		}
	}
});