'use strict';
//27/04/26

/*
	World Map 		(REQUIRES WilB's Biography Mod script for online tags!!!)
	Shows artist's country over a world map.
 */

if (!window.ScriptInfo.PackageId) { window.DefineScript('World-Map-SMP', { author: 'regorxxx', version: '4.5.0', features: { drag_n_drop: false } }); }

// GDI/D2D draw mode
window.DrawMode = Math.max(Math.min(window.GetProperty('Draw mode: GDI (0), D2D (1)', 0), 1), 0);

include('helpers\\helpers_xxx.js');
/* global checkCompatible:readable, globQuery:readable, folders:readable, globFonts:readable, globSettings:readable, clone:readable, checkUpdate:readable, globNoSplitArtist:readable */
/* global MK_CONTROL:readable, MK_SHIFT:readable, VK_SHIFT:readable, globTags:readable, globProfiler:readable, MF_GRAYED:readable , VK_CONTROL:readable, popup:readable, VK_ALT:readable, IDC_APPSTARTING:readable */
include('helpers\\helpers_xxx_flags.js');
/* global VK_LWIN:readable, VK_RWIN:readable */
include('helpers\\helpers_xxx_prototypes.js');
/* global isString:readable, isStringWeak:readable, isInt:readable, isBoolean:readable, isJSON:readable, _bt:readable */
include('helpers\\helpers_xxx_prototypes_smp.js');
/* global extendGR:readable */
include('helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable, overwriteProperties:readable, checkJsonProperties:readable */
include('helpers\\helpers_xxx_tags.js');
/* global checkQuery:readable, getHandleListTagsV2:readable */
include('main\\map\\map_xxx.js');
/* global _isFile:readable, _resolvePath:readable, _foldPath:readable, _scale:readable, RGB:readable, _save:readable, ImageMap:readable, _open:readable, _copyFile:readable, _jsonParseFileCheck:readable, utf8:readable */
include('helpers\\callbacks_xxx.js');
include('main\\music_graph\\music_graph_descriptors_xxx_countries.js');
include('main\\world_map\\world_map_tables.js');
/* global findCountryCoords:readable, findCountry:readable, isNearCountry:readable, nameReplacers:readable, getCountryISO:readable */
include('main\\world_map\\world_map_menu.js');
/* global settingsMenu:readable, onRbtnUpImportSettings:readable, WshShell:readable, Input:readable */
include('main\\world_map\\world_map_statistics.js');
/* global Chroma:readable, _mapStatistics:readable */
include('main\\world_map\\world_map_helpers.js');
/* global selPoint:readable, selFindPoint:readable, tooltipPoint:readable, tooltipFindPoint:readable, formatCountry:readable, biographyCheck:readable, saveLibraryTags:readable, tooltipPanel:readable, wheelResize:readable, drawHeader:readable, drawTaggingPoint:readable, paintLayers:readable, repaint:readable, debouncedRepaint:readable */
include('main\\filter_and_query\\remove_duplicates.js');
/* global removeDuplicates:readable */
include('main\\window\\window_xxx_background.js');
/* global _background:readable, createBackgroundMenu:readable */
include('main\\window\\window_xxx_dynamic_colors.js');
/* global dynamicColors:readable, mostContrastColor:readable */

globProfiler.Print('helpers');
checkCompatible('1.6.1', 'smp');

/*
	Properties
*/
const selMode = ['Follow selected track(s) (playlist)', 'Prefer now playing'];
const modifiers = [ // Easily expandable. Used at helpers and menu too
	{ mask: MK_CONTROL, tag: 'modFirstTag', description: 'Control', val: globTags.genre },
	{ mask: MK_SHIFT, tag: 'modSecondTag', description: 'Shift', val: globTags.style },
	{ mask: MK_SHIFT + MK_CONTROL, tag: 'modThirdTag', description: 'Shift + Control', val: [globTags.genre, globTags.style].join(',') }
];
const properties = {
	drawMode: ['Draw mode: GDI (0), D2D (1)', 0, { func: isInt, range: [[0, 1]] }],
	mapTag: ['Tag name or TF expression to read artist\'s country', '$meta(' + globTags.locale + ',$sub($meta_num(' + globTags.locale + '),1))', { func: isString }, '$meta(' + globTags.locale + ',$sub($meta_num(' + globTags.locale + '),1))'],
	imageMapPath: ['Path to your own world map (mercator projection)', '', { func: isStringWeak }, ''],
	imageMapAlpha: ['Map image opacity', 217, { func: isInt, range: [[0, 255]] }, 217],
	bImageMapMask: ['Apply a gradient mask at borders', true, { func: isBoolean }, true],
	iWriteTags: ['When used along Biography script, tags may be written to files (if not present)', 0, { func: isInt, range: [[0, 2]] }, 0],
	writeToTag: ['Tag name to write artist\'s country', globTags.locale, { func: isString }, globTags.locale],
	selection: ['Follow selection or playback (must match Biography script!)', selMode[0], { eq: selMode }, selMode[0]],
	bEnabled: ['Enable panel', true, { func: isBoolean }, true],
	bEnabledBiography: ['Enable WilB\'s Biography script integration', false, { func: isBoolean }, false],
	forcedQuery: ['Global forced query', globQuery.filter, { func: (query) => { return checkQuery(query, true); } }, globQuery.filter],
	fileName: ['JSON filename (for tags)', _foldPath(folders.data + 'worldMap.json')],
	firstPopup: ['World Map: Fired once', false, { func: isBoolean }, false],
	tagFilter: ['Filter these values globally for ctrl tags (sep. by comma)', 'Instrumental', { func: isStringWeak }, 'Instrumental'],
	iLimitSelection: ['Selection limit', 5, { func: isInt, range: [[2, 25000]] }, 5],
	factorX: ['Percentage applied to X coordinates', 100, { func: isInt, range: [[50, 200]] }, 100],
	factorY: ['Percentage applied to Y coordinates', 137, { func: isInt, range: [[50, 200]] }, 137],
	bInstalledBiography: ['Is installed biography mod', false, { func: isBoolean }, false],
	pointSize: ['Custom point size for the panel', 16, { func: isInt }, 16],
	customPointColorMode: ['Custom point color mode', 0, { func: isInt, range: [[0, 1]] }, 0],
	customPointColor: ['Custom point color for the panel', RGB(91, 165, 34), { func: isInt }, RGB(91, 165, 34)],
	bPointFill: ['Draw a point (true) or a circular corona (false)', false, { func: isBoolean }, false],
	customLocaleColor: ['Custom text color', RGB(121, 194, 255), { func: isInt }, RGB(121, 194, 255)],
	bShowLocale: ['Show current locale tag', true, { func: isBoolean }, true],
	fontSize: ['Size of header text', globFonts.standardSmall.size, { func: Number.isFinite }, globFonts.standardSmall.size],
	panelMode: ['Selection (0), library (1), stats (2), gradient (3)', 0, { func: isInt, range: [[0, 3]] }, 0],
	fileNameLibrary: ['JSON filename (for library tags)', _foldPath(folders.data + 'worldMap_library.json')],
	bShowFlag: ['Show flag on header', true, { func: isBoolean }, true],
	flagPosition: ['Flag position', 'center', { func: (s) => ['left', 'right', 'center', 'both'].includes(s) }, 'center'],
	headerPosition: ['Header position', 'top', { func: (s) => ['top', 'top-map', 'over-map', 'bottom', 'bottom-map', 'below-map'].includes(s) }, 'top'],
	pointMode: ['Points (0), shapes (1) or both (2)', 2, { func: isInt, range: [[0, 2]] }, 2],
	bShowSelModePopup: ['Show warning when selection mode changes', true, { func: isBoolean }, true],
	iRepaintDelay: ['Panel repaint delay (ms)', 1000, { func: isInt }, 1000],
	statsConfig: ['Stats mode configuration', JSON.stringify({
		background: { color: null },
		margin: { left: _scale(20), right: _scale(20), top: _scale(10), bottom: _scale(15) },
	})],
	bSplitTags: ['Split multi-value country tag by \'|\'', false, { func: isBoolean }, false],
	bSplitIds: ['Split multi-value artist tag by \', \'', true, { func: isBoolean }, true],
	bAutoUpdateCheck: ['Automatically check updates', globSettings.bAutoUpdateCheck, { func: isBoolean }, globSettings.bAutoUpdateCheck],
	bShowHeader: ['Show header', true, { func: isBoolean }, true],
	customShapeColor: ['Custom country layer color', RGB(0, 53, 89), { func: isInt }, RGB(0, 53, 89)],
	customShapeAlpha: ['Country layer opacity', 191, { func: isInt, range: [[0, 255]] }, 191],
	bProfile: ['Enable profiler', false, { func: isBoolean }, false],
	customGradientColor: ['Custom country layer gradient color', '', { func: isStringWeak }, ''],
	memMode: ['Memory mode. High (0), normal (1), low (2)', 1, { func: isInt, range: [[0, 2]] }, 1],
	layerFillMode: ['Country layer fill mode', '', { func: isStringWeak }, ''],
	background: ['Background options', JSON.stringify(_background.defaults())],
	headerColor: ['Custom header color', -1, { func: isInt }, -1],
	bFullHeader: ['Header full panel size', false, { func: isBoolean }, false],
	headerStyle: ['Header style: block (0), modern (1)', 1, { func: isInt, range: [[0, 1]] }, 1],
	bDynamicColors: ['Adjust colors to artwork', true, { func: isBoolean }],
	bDynamicColorsBg: ['Adjust colors to artwork (bg)', false, { func: isBoolean }],
	bOnNotifyColors: ['Adjust colors on panel notify', true, { func: isBoolean }],
	bNotifyColors: ['Notify colors to other panels', false, { func: isBoolean }]
};
modifiers.forEach((mod) => { properties[mod.tag] = ['Force tag matching when clicking + ' + mod.description + ' on point', mod.val, { func: isStringWeak }, mod.val]; });
properties['fileName'].push({ portable: true }, properties['fileName'][1]);
properties['fileNameLibrary'].push({ portable: true }, properties['fileNameLibrary'][1]);
properties['statsConfig'].push({ func: isJSON }, properties['statsConfig'][1]);
properties['background'].push({ func: isJSON, forceDefaults: true }, properties['background'][1]);
setProperties(properties, '', 0);

const worldMapImages = [
	{ text: 'Full', path: 'MC_WorldMap.jpg', factorX: 100, factorY: 109 },
	{ text: 'No Antarctica', path: 'MC_WorldMap_No_Ant.jpg', factorX: 100, factorY: 137 },
	{ text: 'Shapes', path: 'MC_WorldMap_Shapes.png', factorX: 100, factorY: 109 },
	{ text: 'Shapes No Antarctica', path: 'MC_WorldMap_Shapes_No_Ant.png', factorX: 100, factorY: 137, bDefault: true }
];
// Build the image paths according to portable/low mem options and update current image
{
	const prop = getPropertiesPairs(properties, '', 0);
	const bLowMemMode = prop.memMode[1] > 0;
	worldMapImages.forEach((img) => {
		const prefix = folders.xxxRootName + 'images\\';
		if (bLowMemMode) { img.path = prefix + img.path; }
		else { img.path = prefix + 'hires\\' + img.path; }
		if (_resolvePath(img.path).toLowerCase() === _resolvePath(prop.imageMapPath[1]).toLowerCase()) {
			prop.imageMapPath[1] = img.path;
			overwriteProperties(prop);
		}
	});
}

globProfiler.Print('init');

/*
	Map
*/
const worldMap = new ImageMap({
	imagePath: worldMapImages.find((img) => img.bDefault).path,
	properties: getPropertiesPairs(properties, '', 0), // Sets font, sizes, bSplitIds and bSplitTags
	fontStyle: 2, // Italic font
	font: globFonts.alt.name,
	jsonId: 'album artist', // id and tag used to identify different entries
	findCoordinatesFunc: findCountryCoords, // Function at helpers\world_map_tables.js
	findPointFunc: findCountry, // Function at helpers\world_map_tables.js
	isNearPointFunc: isNearCountry, // Function at helpers\world_map_tables.js
	selPointFunc: selPoint, // What happens when clicking on a point, helpers\world_map_helpers.js
	selFindPointFunc: selFindPoint, // What happens when clicking on the map, if current track has no tags, helpers\world_map_helpers.js
	tooltipFunc: tooltipPoint, // What happens when mouse is over point, helpers\world_map_helpers.js
	tooltipPanelFunc: tooltipPanel, // What happens when mouse is over panel, helpers\world_map_helpers.js
	tooltipFindPointFunc: tooltipFindPoint, // What happens when mouse is over the map, if current track has no tags, helpers\world_map_helpers.js
	bSkipInit: true,
	splitExcludeId: globNoSplitArtist.list
});
checkJsonProperties(worldMap.properties);

// Replace save/load code to ensure artist is always the id
worldMap.save = function (path = this.jsonPath) {
	let data = clone(this.jsonData);
	if (this.jsonId !== 'artist') {
		data = data.map((obj) => {
			return { artist: obj[this.jsonId], val: obj.val };
		});
	}
	_save(path, JSON.stringify(data, null, '\t').replace(/\n/g, '\r\n'));
};

worldMap.loadData = function (path = this.jsonPath) {
	if (_isFile(path)) {
		this.jsonData = [];
		let data = _jsonParseFileCheck(path, 'Tags json', window.FullPanelName, utf8);
		if (!data) { return; }
		if (this.jsonId !== 'artist') {
			const dic = new Map();
			data = data.map((obj) => {
				obj.val = obj.val.map((v) => {
					let nV = dic.get(v.toLowerCase());
					if (!nV) {
						nV = formatCountry(nameReplacers.get(v.toLowerCase()) || '') || v;
						dic.set(v.toLowerCase(), nV);
					}
					return nV;
				});
				return { [this.jsonId]: obj.artist, val: obj.val };
			});
		}
		data.forEach((item) => this.jsonData.push(item));
	}
};

worldMap.shareUiSettings = function (mode = 'popup') {
	const settings = Object.fromEntries(
		['imageMapPath', 'imageMapAlpha', 'factorX', 'factorY', 'pointSize', 'customPointColorMode', 'customPointColor', 'bPointFill', 'customLocaleColor', 'fontSize', 'bShowFlag', 'pointMode', 'customShapeColor', 'customShapeAlpha', 'customGradientColor', 'layerFillMode', 'memMode', 'background', 'statsConfig', 'headerColor', 'bFullHeader', 'bDynamicColors', 'bDynamicColorsBg', 'bOnNotifyColors', 'bNotifyColors']
			.map((key) => [key, clone(this.properties[key].slice(0, 2))])
	);
	switch (mode.toLowerCase()) {
		case 'popup': {
			const keys = ['Colors', 'Fonts', 'Background', 'Map', 'Points & layers'];
			const answer = WshShell.Popup('Share current UI settings with other panels?\nSettings which will be copied:\n\n' + keys.join(', '), 0, window.ScriptInfo.Name + ': share UI settings', popup.question + popup.yes_no);
			if (answer === popup.yes) {
				window.NotifyOthers(window.ScriptInfo.Name + ': share UI settings', settings);
				return true;
			}
			return false;
		}
		case 'path': {
			const input = Input.string('file', folders.export + 'ui_settings_' + window.Name + '.json', 'File name name:', window.ScriptInfo.Name + ': export UI settings', folders.export + 'ui_settings.json', void (0), true) || (Input.isLastEqual ? Input.lastInput : null);
			if (input === null) { return null; }
			return _save(input, JSON.stringify(settings, null, '\t').replace(/\n/g, '\r\n'))
				? input
				: null;
		}
		default:
			return settings;
	}
};

worldMap.applyUiSettings = function (settings, bForce) {
	window.highlight = true;
	if (window.IsVisible) { window.Repaint(); }
	const answer = bForce
		? popup.yes
		: WshShell.Popup('Apply current settings to highlighted panel?\nCheck UI.', 0, window.FullPanelName, popup.question + popup.yes_no);
	if (answer === popup.yes) {
		const newBg = JSON.parse(String(settings.background[1]));
		['x', 'y', 'w', 'h', 'callbacks'].forEach((key) => delete newBg[key]);
		['bPointFill', 'bShowFlag', 'bFullHeader', 'bDynamicColors', 'bDynamicColorsBg', 'bOnNotifyColors', 'bNotifyColors'].forEach((key) => {
			this.properties[key][1] = !!settings[key][1];
			if (Object.hasOwn(this, key)) { this[key] = this.properties[key][1]; }
		});
		['statsConfig'].forEach((key) => {
			this.properties[key][1] = String(settings[key][1]);
		});
		['imageMapAlpha', 'factorX', 'factorY', 'pointSize', 'customPointColorMode', 'customPointColor', 'customLocaleColor', 'fontSize', 'pointMode', 'customShapeColor', 'customShapeAlpha', 'memMode', 'headerColor'].forEach((key) => {
			this.properties[key][1] = Number(settings[key][1]);
			if (Object.hasOwn(this, key)) { this[key] = Number(this.properties[key][1]); }
		});
		this.pointSize = this.properties.pointSize[1];
		this.pointLineSize = this.properties.bPointFill[1] ? this.pointSize : this.pointSize * 2 + 5;
		if (this.properties.customPointColorMode[1] === 1) { this.defaultColor = this.properties.customPointColor[1]; }
		this.textColor = this.properties.customLocaleColor[1];
		['imageMapPath', 'customGradientColor', 'layerFillMode'].forEach((key) => {
			this.properties[key][1] = String(settings[key][1]);
			if (Object.hasOwn(this, key)) { this[key] = this.properties[key][1]; }
		});
		this.imageMapPath = this.properties.imageMapPath[1];
		background.changeConfig({ config: newBg, bRepaint: false, callbackArgs: { bSaveProperties: true } });
		if (stats.bEnabled) { stats.exit(); stats.init(); }
		this.init();
		this.colorsChanged();
		window.highlight = false;
		repaint(void (0), true, true);
	} else {
		window.highlight = false;
		if (window.IsVisible) { window.Repaint(); }
	}
};

worldMap.getSelection = function () {
	return this.properties.selection[1] === selMode[1]
		? fb.IsPlaying
			? new FbMetadbHandleList(fb.GetNowPlaying())
			: plman.GetPlaylistSelectedItems(plman.ActivePlaylist)
		: plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
};

// Additional config
worldMap.pointSize = worldMap.properties.pointSize[1];
worldMap.pointLineSize = worldMap.properties.bPointFill[1] ? worldMap.pointSize : worldMap.pointSize * 2 + 5;
if (worldMap.properties.customPointColorMode[1] === 1) { worldMap.defaultColor = worldMap.properties.customPointColor[1]; }
worldMap.textColor = worldMap.properties.customLocaleColor[1];
worldMap.imageMapAlpha = worldMap.properties.imageMapAlpha[1];
worldMap.bImageMapMask = worldMap.properties.bImageMapMask[1];

// Init with changes
worldMap.init();


/*
	Panel background
*/
const background = new _background({
	...JSON.parse(worldMap.properties.background[1]),
	x: 0, y: 0, w: window.Width, h: window.Height,
	callbacks: {
		change: function (config, changeArgs, callbackArgs) {
			if (callbackArgs && callbackArgs.bSaveProperties) {
				['x', 'y', 'w', 'h'].forEach((key) => delete config[key]);
				worldMap.properties.background[1] = JSON.stringify(config);
				overwriteProperties(worldMap.properties);
			}
		},
		artColors: (colArray, bForced) => {
			if (!bForced && !worldMap.properties.bDynamicColors[1]) { return; }
			else if (colArray) {
				const bChangeBg = worldMap.properties.bDynamicColorsBg[1] && background.useColors && !background.useColorsBlend;
				const { main, sec, note, secAlt } = dynamicColors(
					colArray,
					bChangeBg ? RGB(122, 122, 122) : background.getAvgPanelColor(),
					true
				);
				if (worldMap.properties.bShowHeader[1]) {
					worldMap.properties.headerColor[1] = main;
					worldMap.textColor = mostContrastColor(main).color;
				} else {
					worldMap.textColor = main;
				}
				worldMap.defaultColor = sec;
				worldMap.properties.customShapeColor[1] = secAlt;
				if (bChangeBg) {
					const gradient = [Chroma(note).saturate(2).luminance(0.005).android(), note];
					const bgColor = Chroma.scale(gradient).mode('lrgb')
						.colors(background.colorModeOptions.color.length, 'android')
						.reverse();
					background.changeConfig({ config: { colorModeOptions: { color: bgColor } }, callbackArgs: { bSaveProperties: false } });
				}
			} else {
				worldMap.properties = getPropertiesPairs(properties, '', 0);
				worldMap.textColor = worldMap.properties.customLocaleColor[1];
				worldMap.defaultColor = worldMap.properties.customPointColor[1];
				background.changeConfig({ config: { colorModeOptions: { color: JSON.parse(worldMap.properties.background[1]).colorModeOptions.color } }, callbackArgs: { bSaveProperties: false } });
			}
			worldMap.colorsChanged();
			repaint(void (0), true);
		},
		artColorsNotify: (colArray, bForced = false) => {
			if (!bForced && !worldMap.properties.bNotifyColors[1]) { return; }
			else if (colArray) {
				background.scheme = colArray;
				window.NotifyOthers('Colors: set color scheme', colArray);
			}
		}
	},
});

// Info Popup
if (!worldMap.properties['firstPopup'][1]) {
	worldMap.properties['firstPopup'][1] = true;
	overwriteProperties(worldMap.properties); // Updates panel
	const readmePath = folders.xxx + 'helpers\\readme\\world_map.txt';
	const readme = _open(readmePath, utf8);
	if (readme.length) { fb.ShowPopupMessage(readme, 'World-Map-SMP'); }
}

// Update check
if (worldMap.properties.bAutoUpdateCheck[1]) {
	include('helpers\\helpers_xxx_web_update.js');
	setTimeout(checkUpdate, 120000, { bDownload: globSettings.bAutoUpdateDownload, bOpenWeb: globSettings.bAutoUpdateOpenWeb });
}

// Additional check
worldMap.properties['bEnabledBiography'].push({ func: biographyCheck }, worldMap.properties['bInstalledBiography'][1]);
overwriteProperties(worldMap.properties); // Updates panel

// Library Mode
if (!_isFile(worldMap.properties.fileNameLibrary[1])) { saveLibraryTags(worldMap.properties.fileNameLibrary[1], worldMap.jsonId, worldMap); }
const libraryPoints = _isFile(worldMap.properties.fileNameLibrary[1])
	? _jsonParseFileCheck(worldMap.properties.fileNameLibrary[1], 'Library json', window.FullPanelName, utf8)
	: null;

{ // Default database
	const defDatabase = folders.xxx + 'presets\\World Map\\worldMap.json';
	if (!_isFile(worldMap.properties.fileName[1]) && _isFile(defDatabase)) {
		console.log('Using default database file: ' + defDatabase);
		_copyFile(defDatabase, worldMap.properties.fileName[1]);
		worldMap.init();
	}
}

// Statistics mode
const stats = new _mapStatistics(0, 0, 0, 0, worldMap.properties.panelMode[1] === 2, JSON.parse(worldMap.properties.statsConfig[1]));

/*
	Callbacks for painting
*/
globProfiler.Print('settings');

{
	const callback = () => {
		if (background.useCover && (!background.coverModeOptions.bNowPlaying || !fb.IsPlaying)) {
			background.updateImageBg();
		}
	};
	['on_item_focus_change', 'on_selection_changed', 'on_playlists_changed', 'on_playlist_items_added', 'on_playlist_items_removed', 'on_playlist_switch'].forEach((e) => addEventListener(e, callback));

	addEventListener('on_playback_stop', (reason) => {
		if (reason !== 2) { // Invoked by user or Starting another track
			if (background.useCover && background.coverModeOptions.bNowPlaying) { background.updateImageBg(); }
		}
	});

	addEventListener('on_playback_new_track', () => {
		if (background.useCover) { background.updateImageBg(); }
	});

	addEventListener('on_colours_changed', () => {
		background.colorsChanged();
	});
}

addEventListener('on_size', (width, height) => {
	worldMap.calcScale(width, height);
	background.resize({ w: window.Width, h: window.Height, bPaint: false });
});

addEventListener('on_colours_changed', () => {
	worldMap.colorsChanged();
	if (window.IsVisible) { window.RepaintRect(worldMap.posX, worldMap.posY, worldMap.imageMap.Width * worldMap.scale, worldMap.imageMap.Height * worldMap.scale); }
});

addEventListener('on_paint', (/** @type {GdiGraphics} */ gr) => {
	if (!window.ID) { return; }
	if (!window.Width || !window.Height) { return; }
	if (globSettings.bDebugPaint) { extendGR(gr, { Repaint: true }); }
	background.paint(gr);
	if (!worldMap.properties.bEnabled[1]) {
		worldMap.paintBg(gr);
		if (window.highlight) { extendGR(gr, { Highlight: true }); }
		if (window.debugPainting) { window.drawDebugRectAreas(gr); }
		return;
	}
	if (worldMap.properties.panelMode[1] === 2) {
		if (window.debugPainting) { window.drawDebugRectAreas(gr); }
		return;
	}
	if (worldMap.properties.panelMode[1] === 1 || worldMap.properties.panelMode[1] === 3) { // Display entire library
		if (libraryPoints && libraryPoints.length) {
			if (!worldMap.idSelected.length) { worldMap.idSelected = 'ALL'; }
			worldMap.lastPoint = libraryPoints;
		}
		worldMap.paint({ gr, bOverridePaintSel: worldMap.properties.pointMode[1] >= 1 });
		if (worldMap.properties.pointMode[1] >= 1) {
			const color = worldMap.properties.customShapeColor[1] === -1 ? worldMap.properties.customShapeColor[3] : worldMap.properties.customShapeColor[1];
			const gradient = worldMap.properties.panelMode[1] === 3
				? worldMap.properties.customGradientColor[1] || [Chroma(color).saturate(2).luminance(0.8).android(), Chroma(color).saturate(2).luminance(0.4).android()]
				: null;
			paintLayers({ gr, color, gradient, bProfile: worldMap.properties.bProfile[1] });
		}
	} else { // Get only X first tracks from selection, x = worldMap.properties.iLimitSelection[1]
		let sel = worldMap.getSelection();
		sel = removeDuplicates({ handleList: sel, checkKeys: [worldMap.jsonId] });
		if (sel.Count > worldMap.properties.iLimitSelection[1]) { sel.RemoveRange(worldMap.properties.iLimitSelection[1], sel.Count - 1); }
		const bPressWin = utils.IsKeyPressed(VK_RWIN) || utils.IsKeyPressed(VK_LWIN);
		const bPressShift = utils.IsKeyPressed(VK_SHIFT);
		const bInvertMap = new RegExp(/shapes/i).exec(worldMap.imageMapPath)
			? Chroma.contrast(background.getAvgPanelColor(), RGB(0, 0, 0)) * worldMap.imageMapAlpha / 255 < 1.25
			: false;
		worldMap.paint({ gr, sel, bOverridePaintSel: worldMap.properties.pointMode[1] >= 1 || (bPressShift && !bPressWin && worldMap.foundPoints.length), bInvertMap });
		if (sel.Count) {
			if (bPressShift && !bPressWin && worldMap.foundPoints.length) {
				drawTaggingPoint(gr);
			} else if (worldMap.lastPoint.length >= 1 && worldMap.properties.pointMode[1] >= 1) {
				const color = worldMap.properties.customShapeColor[1] === -1 ? worldMap.properties.customShapeColor[3] : worldMap.properties.customShapeColor[1];
				paintLayers({ gr, color, bProfile: worldMap.properties.bProfile[1] });
			}
		}
		if (sel.Count && worldMap.properties.bShowHeader[1]) { drawHeader(gr, sel); } // Header text
	}
	if (window.highlight) { extendGR(gr, { Highlight: true }); }
	if (window.debugPainting) { window.drawDebugRectAreas(gr); }
});

addEventListener('on_playback_new_track', (metadb) => {
	if (!worldMap.properties.bEnabled[1]) { return; }
	if (worldMap.properties.panelMode[1] === 2) { return; }
	if (!metadb) { return; }
	repaint(true);
});

addEventListener('on_selection_changed', () => {
	if (!worldMap.properties.bEnabled[1]) { return; }
	if (worldMap.properties.panelMode[1] === 2) { return; }
	worldMap.clearIdSelected();
	repaint();
});

addEventListener('on_item_focus_change', () => {
	if (!worldMap.properties.bEnabled[1]) { return; }
	if (worldMap.properties.panelMode[1] === 2) { return; }
	worldMap.clearIdSelected();
	repaint();
});

addEventListener('on_playlist_switch', () => {
	if (!worldMap.properties.bEnabled[1]) { return; }
	if (worldMap.properties.panelMode[1] === 2) { return; }
	repaint();
});

addEventListener('on_playback_stop', (/** @type {number} */ reason) => {
	if (reason !== 2) { // Invoked by user or Starting another track
		if (worldMap.properties.panelMode[1] === 2) { return; }
		if (!worldMap.properties.bEnabled[1]) { return false; }
		repaint();
	}
});

let playlistClear;
addEventListener('on_playlist_items_removed', (playlistIndex, newCount) => {
	if (worldMap.properties.panelMode[1] === 2) { return; }
	if (!worldMap.properties.bEnabled[1]) { return false; }
	if (playlistIndex === plman.ActivePlaylist && newCount === 0) {
		worldMap.clearIdSelected(); // Always delete point selected if there is no items in playlist
		if (worldMap.properties.selection[1] === selMode[1] && fb.IsPlaying) { return; }
		playlistClear = setTimeout(() => { // Workaround for library viewers selection update triggering a refresh without need
			worldMap.clearLastPoint(); // Only delete last points when selMode follows playlist selection
			repaint();
		}, 60);
	}
});

addEventListener('on_playlist_items_added', (playlistIndex, newCount) => {
	if (worldMap.properties.panelMode[1] === 2) { return; }
	if (!worldMap.properties.bEnabled[1]) { return false; }
	if (playlistIndex === plman.ActivePlaylist && newCount !== 0) { clearTimeout(playlistClear); } // Workaround for library viewers selection update triggering a refresh without need
});

addEventListener('on_metadb_changed', (handleList, fromHook) => {
	if (worldMap.properties.panelMode[1] === 2) { return; }
	if (fromHook) { return; }
	if (!worldMap.properties.bEnabled[1]) { return; }
	const sel = worldMap.getSelection();
	sel.Sort();
	const handleListClone = handleList.Clone();
	handleListClone.Sort();
	sel.MakeIntersection(handleListClone);
	if (sel && sel.Count) {
		const mapTag = !worldMap.properties.mapTag[1].includes('$') && !worldMap.properties.mapTag[1].includes('%')
			? '%' + worldMap.properties.mapTag[1] + '%'
			: worldMap.properties.mapTag[1];
		const tags = fb.TitleFormat('[' + mapTag + ']').EvalWithMetadbs(sel);
		if (tags.some((value) => { return worldMap.getLastPoint().some((last) => { return last.val !== value; }); })) {
			repaint();
		}
	}
});

/*
	Callbacks for move and click
*/
addEventListener('on_mouse_lbtn_up', (x, y, mask) => {
	if (worldMap.properties.panelMode[1] === 2) { return; }
	if (!worldMap.properties.bEnabled[1]) { return; }
	const sel = mask === MK_SHIFT || !worldMap.properties.panelMode[1]
		? worldMap.getSelection()
		: null;
	// On track mode disable point menu without selection
	if (!worldMap.properties.panelMode[1] && (!sel || !sel.Count)) { return; }
	// If an artist from current selection is missing country data, give preference to tagging
	let bForceTag;
	if (mask === MK_SHIFT) {
		const jsonId = getHandleListTagsV2(sel, [worldMap.jsonId], { bMerged: true, splitBy: worldMap.bSplitIds ? ', ' : null, splitExclude: worldMap.splitExcludeId });
		if (jsonId.some((idArr, i) => idArr.some((val) => !worldMap.findTag(sel[i], val)))) {
			bForceTag = true;
		}
	}
	worldMap.btn_up(x, y, worldMap.properties.panelMode[1] ? null : mask, bForceTag); // Disable shift on library mode
});

addEventListener('on_mouse_move', (x, y, mask) => {
	if (!worldMap.properties.bEnabled[1]) { return; }
	background.move(x, y, mask);
	if (worldMap.properties.panelMode[1] === 2) { return; }
	if (!worldMap.properties.panelMode[1]) { // On track mode disable tooltip without selection
		const sel = worldMap.getSelection();
		if (!sel || !sel.Count) { return; }
	}
	const cache = {
		foundPoint: worldMap.foundPoints.length ? worldMap.foundPoints[0] : null,
		idSelected: worldMap.idSelected
	};
	// Disable shift on library mode and override painting when using layers
	worldMap.move(x, y, worldMap.properties.panelMode[1] ? null : mask, worldMap.properties.pointMode[1] === 0);
	if (worldMap.properties.pointMode[1] >= 1 && !imgAsync.layers.bPaint) { window.SetCursor(IDC_APPSTARTING); }
	const bSel = worldMap.idSelected && worldMap.idSelected !== cache.idSelected;
	const bFound = !!cache.foundPoint && worldMap.foundPoints.length !== 0 && worldMap.foundPoints[0] !== cache.foundPoint;
	if (bSel || bFound) {
		debouncedRepaint['60'](worldMap.posX, worldMap.posY, worldMap.imageMap.Width * worldMap.scale, worldMap.imageMap.Height * worldMap.scale);
	}
});

addEventListener('on_key_up', (/** @type {number} */ vKey) => { // Repaint after pressing shift to reset
	if (worldMap.properties.panelMode[1] === 2) { return; }
	if (vKey === VK_SHIFT && !worldMap.properties.panelMode[1] && window.IsVisible) { window.RepaintRect(worldMap.posX, worldMap.posY, worldMap.imageMap.Width * worldMap.scale, worldMap.imageMap.Height * worldMap.scale); }
});

addEventListener('on_mouse_leave', () => {
	if (!worldMap.properties.bEnabled[1]) { return; }
	background.leave();
	if (worldMap.properties.panelMode[1] === 2) { return; }
	worldMap.move(-1, -1);
});

addEventListener('on_mouse_rbtn_up', (x, y) => { // NOSONAR
	if (utils.IsKeyPressed(VK_CONTROL) && utils.IsKeyPressed(VK_LWIN)) {
		return onRbtnUpImportSettings.call(worldMap).btn_up(x, y);
	}
	if (worldMap.properties.panelMode[1] === 2) { return true; }
	const menu = settingsMenu();
	createBackgroundMenu.call(
		background,
		{ menuName: 'Background', subMenuFrom: 'UI' },
		menu,
		{
			nameColors: true,
			onInit: (menu) => {
				if (worldMap.properties.memMode[1] >= 2) {
					const menuEntry = menu.getEntries()
						.find((entry) => entry.menuName.startsWith('Art mode') && entry.subMenuFrom.startsWith('Background'));
					if (menuEntry) { menuEntry.flags = MF_GRAYED; }
				}
			}
		}
	);
	menu.btn_up(x, y);
	return true; // Disable right button menu
});

/*
	Callbacks for integration with other scripts
*/
// When used along WilB's Biography script (on other panel), data may be fetched automatically
const bioCache = { rawPath: null, subSong: null };
addEventListener('on_notify_data', (name, info) => {
	if (name === 'bio_imgChange' || name === 'bio_chkTrackRev' || name === 'xxx-scripts: panel name reply') { return; }
	switch (name) {
		case window.ScriptInfo.Name + ': share UI settings': {
			if (info) { worldMap.applyUiSettings(clone(info)); }
			break;
		}
		case window.ScriptInfo.Name + ': set colors': {  // Needs an array of 4 colors or an object {background, text, default, shape}
			if (info && worldMap.properties.bOnNotifyColors[1]) {
				const colors = clone(info);
				const getColor = (key) => Object.hasOwn(colors, key) ? colors.background : colors[['background', 'text', 'default', 'shape'].indexOf(key)];
				const hasColor = (key) => typeof getColor(key) !== 'undefined';
				if (background.useColors && hasColor('background')) {
					background.changeConfig({ config: { colorModeOptions: { color: getColor('background') } }, callbackArgs: { bSaveProperties: false } });
				}
				if (hasColor('text')) {
					if (worldMap.properties.bShowHeader[1]) {
						worldMap.properties.headerColor[1] = getColor('text');
						worldMap.textColor = mostContrastColor(getColor('text')).color;
					} else {
						worldMap.textColor = getColor('text');
					}
				}
				if (hasColor('default')) { worldMap.defaultColor = getColor('default'); }
				if (hasColor('shape')) { worldMap.properties.customShapeColor[1] = getColor('shape'); }
				worldMap.colorsChanged();
				repaint(void (0), true);
			}
			break;
		}
		case 'Colors: set color scheme': // Needs an array of at least 6 colors to automatically adjust dynamic colors
		case window.ScriptInfo.Name + ': set color scheme': {
			if (info && worldMap.properties.bOnNotifyColors[1]) { background.callbacks.artColors(clone(info), true); }
			break;
		}
		case 'Colors: ask color scheme': {
			if (info && worldMap.properties.bNotifyColors[1] && background.scheme) {
				window.NotifyOthers(String(info), background.scheme);
			}
			break;
		}
	}
	if (worldMap.properties.panelMode[1] === 2) { return; }
	if (!worldMap.properties.bEnabled[1]) { return; }
	if (!worldMap.properties.bEnabledBiography[1]) { return; }
	switch (name) {
		// WilB's Biography script has a limitation, it only works with 1 track at once...
		// So when selecting more than 1 track, this only gets the focused/playing track's tag
		// If both panels don't have the same selection mode, it will not work
		case 'Biography notifyCountry':
		case 'biographyTags': {
			if (Object.hasOwn(info, 'handle') && Object.hasOwn(info, 'tags') && (info.handle.RawPath !== bioCache.rawPath || info.handle.SubSong !== bioCache.subSong)) {
				bioCache.handleRawPath = info.handle.RawPath;
				bioCache.subSong = info.handle.SubSong;
				// Find the biography track on the entire selection, since it may not be just the first track of the sel list
				const sel = worldMap.getSelection();
				// Get Tags
				const tagName = worldMap.properties.writeToTag[1] || globTags.locale;
				if (tagName.length) {
					let locale = [];
					if (Array.isArray(info.tags)) { // Biography 1.1.3
						locale = [...info.tags.find((tag) => { return tag.name === 'locale'; }).val]; // Find the tag with name === locale in the array of tags
					} else { // Biography 1.2.0+
						const tag = Object.keys(info.tags)
							.find((key) => key.toUpperCase() === tagName.toUpperCase());
						if (tag) {
							locale = [...info.tags[tag]]; // or  object key
						}
					}
					const len = locale.length;
					if (len) {
						// Replace country name with ISO standard name if it's a known variation
						const country = (locale[len - 1] || '').toLowerCase();
						if (nameReplacers.has(country)) { locale[len - 1] = formatCountry(nameReplacers.get(country)); }
						// worldMap.jsonId = artist
						const jsonIds = info.handle
							? getHandleListTagsV2(new FbMetadbHandleList(info.handle), [worldMap.jsonId], { bMerged: true, splitBy: worldMap.bSplitIds ? ', ' : null, splitExclude: worldMap.splitExcludeId }).flat(Infinity)
							: [];
						const jsonId = jsonIds.find((id) => info.artist === id.toUpperCase()) || '';
						if (jsonId.length && info.artist === jsonId.toUpperCase()) {
							// Set tag on map for drawing if found
							if (sel && sel.Count && sel.Find(info.handle) !== -1) {
								const prevTag = worldMap.findTag(info.handle, jsonId);
								if (!prevTag || !getCountryISO(prevTag)) {
									worldMap.setTag(locale[len - 1], jsonId);
									if (worldMap.lastPoint.length === 1 && worldMap.lastPoint[0].id !== locale[len - 1]) {
										repaint();
									}
								}
							}
							// Update tags or json if needed (even if the handle was not within the selection)
							if (worldMap.properties.iWriteTags[1] > 0) {
								const tfo = _bt(tagName);
								if (!fb.TitleFormat(tfo).EvalWithMetadb(info.handle).length) { // Check if tag already exists
									if (worldMap.properties.iWriteTags[1] === 1) {
										new FbMetadbHandleList(info.handle).UpdateFileInfoFromJSON(JSON.stringify([{ [tagName]: locale }])); // Uses tagName var as key here
									} else if (worldMap.properties.iWriteTags[1] === 2) {
										const prevData = worldMap.getDataById(jsonId);
										if (!prevData) { worldMap.saveData({ [worldMap.jsonId]: jsonId, val: locale }); } // use path at properties
										else if (!getCountryISO(prevData.val.slice(-1)[0])) {
											worldMap.modifyData(jsonId, { [worldMap.jsonId]: jsonId, val: locale });
										}
									}
								}
							}
						}
					}
				}
			}
			if (name === 'biographyTags') { // Follow WilB's Biography script selection mode, Biography 1.2.0
				if (Object.hasOwn(info, 'selectionMode')) {
					let bDone = false;
					switch (info.selectionMode) {
						case 'Prefer nowplaying': {
							if (worldMap.properties.selection[1] !== selMode[1]) { worldMap.properties['selection'][1] = selMode[1]; bDone = true; }
							break;
						}
						case 'Follow selected track (playlist)': {
							if (worldMap.properties.selection[1] !== selMode[0]) { worldMap.properties['selection'][1] = selMode[0]; bDone = true; }
							break;
						}
					}
					if (bDone) {
						if (worldMap.properties.bShowSelModePopup[1]) {
							fb.ShowPopupMessage('Selection mode at Biography panel has been changed (-> \'' + worldMap.properties['selection'][1] + '\'). This panel has been updated to use the new setting.\n\nThis is only an informative popup, you can disable it at the contextual menu (\'Selection mode\' submenu).', window.FullPanelName);
						} else {
							console.log(window.FullPanelName + ' Selection mode changed by Biography panel -> ' + worldMap.properties['selection'][1]);
						}
						overwriteProperties(worldMap.properties); // Updates panel
						repaint();
					}
				}
			}
			break;
		}
		case 'Biography notifySelectionProperty': { // Follow WilB's Biography script selection mode, Biography 1.1.3
			if (Object.hasOwn(info, 'property') && Object.hasOwn(info, 'val')) {
				// When ppt.focus is true, then selMode is selMode[0]
				if ((info.val && worldMap.properties.selection[1] === selMode[1]) || (!info.val && worldMap.properties.selection[1] === selMode[0])) {
					worldMap.properties.selection[1] = selMode[(info.val ? 0 : 1)]; // Invert value
					if (worldMap.properties.bShowSelModePopup[1]) {
						fb.ShowPopupMessage('Selection mode at Biography panel has been changed. This is only an informative popup, this panel has been updated properly to follow the change:\n' + '"' + worldMap.properties.selection[1] + '"', window.FullPanelName);
					}
					overwriteProperties(worldMap.properties); // Updates panel
					repaint();
				}
			}
			break;
		}
	}
});

addEventListener('on_mouse_wheel', (step) => {
	if (!worldMap.properties.bEnabled[1]) { return; }
	if (stats.bEnabled) { return; }
	if (utils.IsKeyPressed(VK_CONTROL) && utils.IsKeyPressed(VK_ALT)) {
		if (utils.IsKeyPressed(VK_SHIFT)) { background.wheelResize(step, void (0), { bSaveProperties: true }); }
		else { wheelResize(step); }
	} else if (utils.IsKeyPressed(VK_SHIFT)) { background.cycleArtAsync(step); }
});

stats.attachCallbacks();

if (worldMap.properties.bOnNotifyColors[1]) { // Ask color-servers at init
	setTimeout(() => {
		window.NotifyOthers('Colors: ask color scheme', window.ScriptInfo.Name + ': set color scheme');
		window.NotifyOthers('Colors: ask color', window.ScriptInfo.Name + ': set colors');
	}, 1000);
}

globProfiler.Print('callbacks');