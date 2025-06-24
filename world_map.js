'use strict';
//22/06/25

/*
	World Map 		(REQUIRES WilB's Biography Mod script for online tags!!!)
	Shows artist's country over a world map.
 */

if (!window.ScriptInfo.PackageId) { window.DefineScript('World Map', { author: 'regorxxx', version: '3.16.0', features: { drag_n_drop: false } }); }

include('helpers\\helpers_xxx.js');
/* global checkCompatible:readable, globQuery:readable, folders:readable, globFonts:readable, globSettings:readable, clone:readable, isPortable:readable, checkUpdate:readable, debounce:readable */
/* global MK_CONTROL:readable, MK_SHIFT:readable, InterpolationMode:readable, VK_SHIFT:readable, DT_CENTER:readable, DT_NOPREFIX:readable, globTags:readable, globProfiler:readable, MF_GRAYED:readable , VK_CONTROL:readable */
include('helpers\\helpers_xxx_flags.js');
/* global VK_LWIN:readable, VK_RWIN:readable */
include('helpers\\helpers_xxx_prototypes.js');
/* global isString:readable, isStringWeak:readable, isInt:readable, isBoolean:readable, isJSON:readable, deepAssign:readable, _bt:readable */
include('helpers\\helpers_xxx_prototypes_smp.js');
/* global extendGR:readable */
include('helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable, overwriteProperties:readable */
include('helpers\\helpers_xxx_tags.js');
/* global checkQuery:readable, getHandleListTagsV2:readable */
include('main\\map\\map_xxx.js');
/* global _isFile:readable, _resolvePath:readable, _scale:readable, RGB:readable, _save:readable, ImageMap:readable, _open:readable, _copyFile:readable, invert:readable, _jsonParseFileCheck:readable, utf8:readable, RGBA:readable, toRGB:readable */
include('helpers\\callbacks_xxx.js');
include('main\\music_graph\\music_graph_descriptors_xxx_countries.js');
include('main\\world_map\\world_map_tables.js');
/* global findCountryCoords:readable, findCountry:readable, isNearCountry:readable, nameReplacers:readable, getCountryISO:readable, getCountryName:readable, nameShortRev:readable */
include('main\\world_map\\world_map_menu.js');
/* global settingsMenu:readable, importSettingsMenu:readable, WshShell:readable, popup:readable, Input:readable */
include('main\\world_map\\world_map_helpers.js');
/* global selPoint:readable, selFindPoint:readable, tooltipPoint:readable, tooltipFindPoint:readable, formatCountry:readable, biographyCheck:readable, saveLibraryTags:readable, tooltiPanel:readable */
include('main\\world_map\\world_map_flags.js');
/* global loadFlagImage:readable */
include('main\\world_map\\world_map_statistics.js');
/* global Chroma:readable, _mapStatistics:readable */
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
const worldMap_properties = {
	mapTag: ['Tag name or TF expression to read artist\'s country', '$meta(' + globTags.locale + ',$sub($meta_num(' + globTags.locale + '),1))', { func: isString }, '$meta(' + globTags.locale + ',$sub($meta_num(' + globTags.locale + '),1))'],
	imageMapPath: ['Path to your own world map (mercator projection)', '', { func: isStringWeak }, ''],
	imageMapAlpha: ['Map image transparency', 217, { func: isInt, range: [[0, 255]] }, 217],
	iWriteTags: ['When used along Biography script, tags may be written to files (if not present)', 0, { func: isInt, range: [[0, 2]] }, 0],
	writeToTag: ['Tag name to write artist\'s country', globTags.locale, { func: isString }, globTags.locale],
	selection: ['Follow selection or playback? (must match Biography script!)', selMode[0], { eq: selMode }, selMode[0]],
	bEnabled: ['Enable panel', true, { func: isBoolean }, true],
	bEnabledBiography: ['Enable WilB\'s Biography script integration', false, { func: isBoolean }, false],
	forcedQuery: ['Global forced query', globQuery.filter, { func: (query) => { return checkQuery(query, true); } }, globQuery.filter],
	fileName: ['JSON filename (for tags)', '.\\profile\\' + folders.dataName + 'worldMap.json'],
	firstPopup: ['World Map: Fired once', false, { func: isBoolean }, false],
	tagFilter: ['Filter these values globally for ctrl tags (sep. by comma)', 'Instrumental', { func: isStringWeak }, 'Instrumental'],
	iLimitSelection: ['Selection limit', 5, { func: isInt, range: [[2, 25000]] }, 5],
	factorX: ['Percentage applied to X coordinates', 100, { func: isInt, range: [[50, 200]] }, 100],
	factorY: ['Percentage applied to Y coordinates', 137, { func: isInt, range: [[50, 200]] }, 137],
	bInstalledBiography: ['Is installed biography mod?', false, { func: isBoolean }, false],
	customPointSize: ['Custom point size for the panel', 16, { func: isInt }, 16],
	customPointColorMode: ['Custom point color mode', 0, { func: isInt, range: [[0, 1]] }, 0],
	customPointColor: ['Custom point color for the panel', RGB(91, 165, 34), { func: isInt }, RGB(91, 165, 34)],
	bPointFill: ['Draw a point or a circular corona?', false, { func: isBoolean }, false],
	customLocaleColor: ['Custom text color', 0xFF000000, { func: isInt }, 0xFF000000],
	bShowLocale: ['Show current locale tag', true, { func: isBoolean }, true],
	fontSize: ['Size of header text', globFonts.standardSmall.size, { func: isInt }, globFonts.standardSmall.size],
	panelMode: ['Selection (0), library (1), stats (2), gradient (3)', 0, { func: isInt, range: [[0, 3]] }, 0],
	fileNameLibrary: ['JSON filename (for library tags)', '.\\profile\\' + folders.dataName + 'worldMap_library.json'],
	bShowFlag: ['Show flag on header', true, { func: isBoolean }, true],
	pointMode: ['Points (0), shapes (1) or both (2)', 2, { func: isInt, range: [[0, 2]] }, 2],
	bShowSelModePopup: ['Show warning when selection mode changes', true, { func: isBoolean }, true],
	iRepaintDelay: ['Panel repaint delay (ms)', 1000, { func: isInt }, 1000],
	statsConfig: ['Stats mode configuration', JSON.stringify({
		// graph: {/* type, borderWidth, point */},
		// dataManipulation = {/* sort, filter, slice, distribution , probabilityPlot*/},
		background: { color: null },
		margin: { left: _scale(20), right: _scale(20), top: _scale(10), bottom: _scale(15) },
		// grid = {x: {/* show, color, width */}, y: {/* ... */}},
		// axis = {x: {/* show, color, width, ticks, labels, key, bSingleLabels */}, y: {/* ... */}}
	})],
	bSplitTags: ['Split multi-value country tag by \'|\'', false, { func: isBoolean }, false],
	bSplitIds: ['Split multi-value artist tag by \', \'', true, { func: isBoolean }, true],
	bAutoUpdateCheck: ['Automatically check updates?', globSettings.bAutoUpdateCheck, { func: isBoolean }, globSettings.bAutoUpdateCheck],
	bShowHeader: ['Show header', true, { func: isBoolean }, true],
	customShapeColor: ['Custom country layer color', RGB(0, 53, 89), { func: isInt }, RGB(0, 53, 89)],
	customShapeAlpha: ['Country layer transparency', 191, { func: isInt, range: [[0, 255]] }, 191],
	bProfile: ['Enable profiler', false, { func: isBoolean }, false],
	customGradientColor: ['Custom country layer gradient color', '', { func: isStringWeak }, ''],
	memMode: ['Memory mode. High (0), normal (1), low (2)', 1, { func: isInt, range: [[0, 2]] }, 1],
	layerFillMode: ['Country layer fill mode', '', { func: isStringWeak }, ''],
	background: ['Background options', JSON.stringify(deepAssign()(
		(new _background).defaults(),
		{ colorMode: 'gradient', colorModeOptions: { color: [RGB(270, 270, 270), RGB(300, 300, 300)] }, coverMode: 'front' }
	))],
	headerColor: ['Custom header color', -1, { func: isInt }, -1],
	bFullHeader: ['Header full panel size', true, { func: isBoolean }, true],
	bDynamicColors: ['Adjust colors to artwork', false, { func: isBoolean }],
	bDynamicColorsBg: ['Adjust colors to artwork (bg)', false, { func: isBoolean }],
};
modifiers.forEach((mod) => { worldMap_properties[mod.tag] = ['Force tag matching when clicking + ' + mod.description + ' on point', mod.val, { func: isStringWeak }, mod.val]; });
worldMap_properties['fileName'].push({ portable: true }, worldMap_properties['fileName'][1]);
worldMap_properties['fileNameLibrary'].push({ portable: true }, worldMap_properties['fileNameLibrary'][1]);
worldMap_properties['statsConfig'].push({ func: isJSON }, worldMap_properties['statsConfig'][1]);
worldMap_properties['background'].push({ func: isJSON }, worldMap_properties['background'][1]);
setProperties(worldMap_properties, '', 0);

const worldMapImages = [
	{ text: 'Full', path: 'MC_WorldMap.jpg', factorX: 100, factorY: 109 },
	{ text: 'No Antarctica', path: 'MC_WorldMap_No_Ant.jpg', factorX: 100, factorY: 137 },
	{ text: 'Shapes', path: 'MC_WorldMap_Shapes.png', factorX: 100, factorY: 109 },
	{ text: 'Shapes No Antarctica', path: 'MC_WorldMap_Shapes_No_Ant.png', factorX: 100, factorY: 137, bDefault: true }
];
// Build the image paths according to portable/low mem options and update current image
{
	const properties = getPropertiesPairs(worldMap_properties, '', 0);
	const bLowMemMode = properties.memMode[1] > 0;
	worldMapImages.forEach((img) => {
		const prefix = folders.xxxRootName + 'images\\';
		if (bLowMemMode) { img.path = prefix + img.path; }
		else { img.path = prefix + 'hires\\' + img.path; }
		if (_resolvePath(img.path).toLowerCase() === _resolvePath(properties.imageMapPath[1]).toLowerCase()) {
			properties.imageMapPath[1] = img.path;
			overwriteProperties(properties);
		}
	});
}

globProfiler.Print('init');

/*
	Map
*/
const worldMap = new ImageMap({
	imagePath: worldMapImages.find((img) => img.bDefault).path,
	properties: getPropertiesPairs(worldMap_properties, '', 0), // Sets font, sizes, bSplitIds and bSplitTags
	jsonId: 'album artist', // id and tag used to identify different entries
	findCoordinatesFunc: findCountryCoords, // Function at helpers\world_map_tables.js
	findPointFunc: findCountry, // Function at helpers\world_map_tables.js
	isNearPointFunc: isNearCountry, // Function at helpers\world_map_tables.js
	selPointFunc: selPoint, // What happens when clicking on a point, helpers\world_map_helpers.js
	selFindPointFunc: selFindPoint, // What happens when clicking on the map, if current track has no tags, helpers\world_map_helpers.js
	tooltipFunc: tooltipPoint, // What happens when mouse is over point, helpers\world_map_helpers.js
	tooltipPanelFunc: tooltiPanel, // What happens when mouse is over panel, helpers\world_map_helpers.js
	tooltipFindPointFunc: tooltipFindPoint, // What happens when mouse is over the map, if current track has no tags, helpers\world_map_helpers.js
	font: globFonts.standard.name,
	bSkiptInit: true
});

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
		let data = _jsonParseFileCheck(path, 'Tags json', window.Name, utf8);
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
		['imageMapPath', 'imageMapAlpha', 'factorX', 'factorY', 'customPointSize', 'customPointColorMode', 'customPointColor', 'bPointFill', 'customLocaleColor', 'fontSize', 'bShowFlag', 'pointMode', 'customShapeColor', 'customShapeAlpha', 'customGradientColor', 'layerFillMode', 'memMode', 'background', 'statsConfig', 'headerColor', 'bFullHeader', 'bDynamicColors', 'bDynamicColorsBg']
			.map((key) => [key, clone(this.properties[key].slice(0, 2))])
	);
	switch (mode.toLowerCase()) {
		case 'popup': {
			const keys = ['Colors', 'Fonts', 'Background', 'Map', 'Points & layers'];
			const answer = WshShell.Popup('Share current UI settings with other panels?\nSettings which will be copied:\n\n' + keys.join(', '), 0, 'World Map: share UI settings', popup.question + popup.yes_no);
			if (answer === popup.yes) {
				window.NotifyOthers('World Map: share UI settings', settings);
				return true;
			}
			return false;
		}
		case 'path': {
			const input = Input.string('file', folders.data + 'ui_settings_' + window.Name + '.json', 'File name name:', 'World Map: export UI settings', folders.data + 'ui_settings.json', void (0), true) || (Input.isLastEqual ? Input.lastInput : null);
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
	window.Repaint();
	const answer = bForce
		? popup.yes
		: WshShell.Popup('Apply current settings to highlighted panel?\nCheck UI.', 0, window.Name + ': World Map', popup.question + popup.yes_no);
	if (answer === popup.yes) {
		const newBg = JSON.parse(String(settings.background[1]));
		['x', 'y', 'w', 'h', 'callbacks'].forEach((key) => delete newBg[key]);
		['bPointFill', 'bShowFlag', 'bFullHeader', 'bDynamicColors', 'bDynamicColorsBg'].forEach((key) => {
			this.properties[key][1] = !!settings[key][1];
			if (Object.hasOwn(this, key)) { this[key] = this.properties[key][1]; }
		});
		['statsConfig'].forEach((key) => {
			this.properties[key][1] = String(settings[key][1]);
		});
		['imageMapAlpha', 'factorX', 'factorY', 'customPointSize', 'customPointColorMode', 'customPointColor', 'customLocaleColor', 'fontSize', 'pointMode', 'customShapeColor', 'customShapeAlpha', 'memMode', 'headerColor'].forEach((key) => {
			this.properties[key][1] = Number(settings[key][1]);
			if (Object.hasOwn(this, key)) { this[key] = Number(this.properties[key][1]); }
		});
		this.pointSize = this.properties.customPointSize[1];
		this.pointLineSize = this.pointSize * 2 + 5;
		if (this.properties.customPointColorMode[1] === 1) { this.defaultColor = this.properties.customPointColor[1]; }
		this.pointLineSize = this.properties.bPointFill[1] ? this.pointSize : this.pointSize * 2 + 5;
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
		window.Repaint();
	}
};

// Init with changes
worldMap.init();

// Additional config
worldMap.pointSize = worldMap.properties.customPointSize[1];
worldMap.pointLineSize = worldMap.pointSize * 2 + 5;
if (worldMap.properties.customPointColorMode[1] === 1) { worldMap.defaultColor = worldMap.properties.customPointColor[1]; }
worldMap.pointLineSize = worldMap.properties.bPointFill[1] ? worldMap.pointSize : worldMap.pointSize * 2 + 5;
worldMap.textColor = worldMap.properties.customLocaleColor[1];
worldMap.imageMapAlpha = worldMap.properties.imageMapAlpha[1];

/*
	Panel background
*/
const background = new _background({
	...JSON.parse(worldMap.properties.background[1]),
	x: 0, y: 0, w: window.Width, h: window.Height,
	callbacks: {
		change: function (config, changeArgs, callbackArgs) {
			if (callbackArgs && callbackArgs.bSaveProperties) {
				['x', 'y', 'w', 'h', 'callbacks'].forEach((key) => delete config[key]);
				worldMap.properties.background[1] = JSON.stringify(config);
				overwriteProperties(worldMap.properties);
			}
		},
		artColors: (colArray) => {
			if (!worldMap.properties.bDynamicColors[1]) { return; }
			if (colArray) {
				const bChangeBg = worldMap.properties.bDynamicColorsBg[1];
				const { main, sec, note, secAlt } = dynamicColors(
					colArray,
					bChangeBg ? RGB(122, 122, 122) : background.getColors()[0],
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
				if (bChangeBg && background.colorMode !== 'none') {
					const gradient = [Chroma(note).saturate(2).luminance(0.005).android(), note];
					const bgColor = Chroma.scale(gradient).mode('lrgb')
						.colors(background.colorModeOptions.color.length, 'android')
						.reverse();
					background.changeConfig({ config: { colorModeOptions: { color: bgColor } }, callbackArgs: { bSaveProperties: false } });
				}
			} else {
				worldMap.properties = getPropertiesPairs(worldMap_properties, '', 0);
				worldMap.textColor = worldMap.properties.customLocaleColor[1];
				worldMap.defaultColor = worldMap.properties.customPointColor[1];
				background.changeConfig({ config: { colorModeOptions: { color: JSON.parse(worldMap.properties.background[1]).colorModeOptions.color } }, callbackArgs: { bSaveProperties: false } });
			}
			worldMap.colorsChanged();
			repaint(void (0), true);
		}
	},
});

// Info Popup
if (!worldMap.properties['firstPopup'][1]) {
	worldMap.properties['firstPopup'][1] = true;
	overwriteProperties(worldMap.properties); // Updates panel
	isPortable([worldMap.properties['fileName'][0], worldMap.properties['imageMapPath'][0]]);
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
	? _jsonParseFileCheck(worldMap.properties.fileNameLibrary[1], 'Library json', window.Name, utf8)
	: null;

{ // Default database
	const defDatabase = folders.xxx + 'presets\\World Map\\worldMap.json';
	if (!_isFile(worldMap.properties.fileName[1]) && _isFile(defDatabase)) {
		console.log('Using default database file: ' + defDatabase);
		_copyFile(defDatabase, worldMap.properties.fileName[1]);
		worldMap.init();
	}
}

// Statisctics mode
const stats = new _mapStatistics(0, 0, 0, 0, worldMap.properties.panelMode[1] === 2, JSON.parse(worldMap.properties.statsConfig[1]));

/*
	Callbacks for painting
*/
const debouncedRepaint = {
	'60': debounce(window.RepaintRect, 60, false, window),
};
function repaint(bPlayback = false, bInmediate = false, bForce = false) {
	if (!worldMap.properties.bEnabled[1]) { return false; }
	if (worldMap.properties.panelMode[1] >= 1 && !bForce) { return false; }
	if (!bPlayback && worldMap.properties.selection[1] === selMode[1] && fb.IsPlaying) { return false; }
	if (bPlayback && worldMap.properties.selection[1] === selMode[0] && fb.IsPlaying) { return false; }
	imgAsync.fullImg = null;
	imgAsync.layers.imgs.length = 0;
	imgAsync.layers.id.length = 0;
	imgAsync.layers.iso.clear();
	imgAsync.layers.processedIso.clear();
	imgAsync.layers.bPaint = false;
	imgAsync.layers.bStop = true;
	imgAsync.layers.bCreated = false;
	const delay = bInmediate ? 0 : worldMap.properties.iRepaintDelay[1];
	if (delay > 0) {
		if (!Object.hasOwn(debouncedRepaint, delay)) { debouncedRepaint[delay] = debounce(window.RepaintRect, delay, false, window); }
		if (worldMap.properties.bFullHeader[1]) {
			debouncedRepaint[delay](0, worldMap.posY, window.Width, worldMap.imageMap.Height * worldMap.scale);
		} else {
			debouncedRepaint[delay](worldMap.posX, worldMap.posY, worldMap.imageMap.Width * worldMap.scale, worldMap.imageMap.Height * worldMap.scale);
		}
	} else {
		if (worldMap.properties.bFullHeader[1]) {
			window.RepaintRect(0, worldMap.posY, window.Width, worldMap.imageMap.Height * worldMap.scale);
		} else {
			window.RepaintRect(worldMap.posX, worldMap.posY, worldMap.imageMap.Width * worldMap.scale, worldMap.imageMap.Height * worldMap.scale);
		}
	}
	return true;
}
globProfiler.Print('settings');

addEventListener('on_size', (width, height) => {
	worldMap.calcScale(width, height);
	background.resize({ w: window.Width, h: window.Height, bPaint: false });
});

addEventListener('on_colours_changed', () => {
	worldMap.colorsChanged();
	window.RepaintRect(worldMap.posX, worldMap.posY, worldMap.imageMap.Width * worldMap.scale, worldMap.imageMap.Height * worldMap.scale);
});

const imgAsync = {
	layers: { bPaint: false, bStop: false, imgs: [], id: [], iso: new Set(), processedIso: new Set() },
	masks: { sel: null, std: null },
	lowMemMode: { maxSize: 1000 },
	fullImg: null
};
const fillSubLayer = (subLayer, id, mode, scale = Math.min(imgAsync.layers.w / worldMap.imageMap.Width, imgAsync.layers.h / worldMap.imageMap.Height)) => {
	if (!mode || !mode.length) { return; }
	const flagSize = 64; const w = 40; const h = 30;
	const flag = mode === 'flag'
		? loadFlagImage(id)
		: loadFlagImage(id).Clone((flagSize - w) / 2, (flagSize - h) / 2, (flagSize + w) / 2, (flagSize + h) / 2); // Extract center of flag
	const layerGr = subLayer.GetGraphics();
	const point = worldMap.point[id];
	switch (mode) {
		case 'color': {
			const flagColors = JSON.parse(flag.GetColourSchemeJSON(4)).sort((a, b) => a.freq - b.freq)
				.map((o) => o.col).filter((color) => {
					return Chroma.deltaE('#000000', color) > 20 && Chroma.deltaE('#ffffff', color) > 20;
				});
			const flagColor = flagColors[0] || RGB(255, 255, 255);
			layerGr.FillSolidRect(0, 0, imgAsync.layers.w, imgAsync.layers.h, flagColor);
			break;
		}
		case 'gradient': {
			const flagColors = JSON.parse(flag.GetColourSchemeJSON(4)).sort((a, b) => a.freq - b.freq).map((o) => o.col)
				.filter((color) => {
					return Chroma.deltaE('#000000', color) > 20 && Chroma.deltaE('#ffffff', color) > 20;
				});
			if (flagColors.length === 0) { flagColors.push(RGB(0, 0, 0)); }
			if (flagColors.length === 1) { flagColors.push(RGB(255, 255, 255)); }
			const w = imgAsync.layers.w / 2; const h = imgAsync.layers.h / 2;
			const x = point.x * scale - w / 2; const y = point.y * scale - h / 2;
			layerGr.FillGradRect(x, y, w, h, 0, flagColors[0], flagColors[1], 0.25);
			break;
		}
		case 'flag': {
			const w = imgAsync.layers.w / 2; const h = imgAsync.layers.h / 2;
			const x = point.x * scale - w / 2; const y = point.y * scale - h / 2;
			layerGr.DrawImage(flag, x, y, w, h, 0, 0, flag.Width, flag.Height);
			break;
		}
	}
	subLayer.ReleaseGraphics(layerGr);
};
const paintLayers = ({ gr, color = worldMap.properties.customShapeColor[1], gradient = null, bProfile = false } = {}) => {
	const profile = bProfile ? new FbProfiler('paintLayers') : null;
	const bMask = worldMap.properties.customShapeColor[1] !== -1 || worldMap.properties.panelMode[1] === 3;
	const idSel = worldMap.idSelected;
	const bLowMemMode = worldMap.properties.memMode[1] > 0;
	if (imgAsync.layers.bPaint && worldMap.properties.customShapeAlpha[1] > 0) {
		const bStatsModes = worldMap.properties.panelMode[1] == 1 || worldMap.properties.panelMode[1] === 3;
		const bFullImg = bStatsModes && imgAsync.fullImg;
		if (bFullImg) {
			const offsetX = bLowMemMode ? 50 : 100;
			const offsetY = bLowMemMode ? 50 : 100;
			const offsetYAntarc = bLowMemMode ? 310 : 620;
			const bAntr = /(?:^|.*_)no_ant(?:_.*|\..*$)/i.test(worldMap.imageMapPath);
			const w = (worldMap.imageMap.Width + offsetX * 2) * worldMap.scale;
			const h = (worldMap.imageMap.Height + offsetY * 2 + (bAntr ? offsetYAntarc : 0)) * worldMap.scale;
			const x = worldMap.posX - offsetX * worldMap.scale;
			const y = worldMap.posY - offsetY * worldMap.scale;
			gr.DrawImage(imgAsync.fullImg, x, y, w, h, 0, 0, imgAsync.fullImg.Width, imgAsync.fullImg.Height, 0, worldMap.properties.customShapeAlpha[1]);
			imgAsync.layers.bStop = true;
		} else if (bStatsModes && imgAsync.layers.imgs.length) {
			imgAsync.fullImg = gdi.CreateImage(imgAsync.layers.w, imgAsync.layers.h);
		}
		if (bProfile) { profile.Print('background'); }
		if (imgAsync.layers.imgs.length !== worldMap.lastPoint.length) { repaint(); }
		if (imgAsync.layers.imgs.length) {
			const layerW = imgAsync.layers.w;
			const layerH = imgAsync.layers.h;
			if (bFullImg && !idSel && imgAsync.layers.bCreated) { return; }
			if (bMask) {
				const grFullImg = bStatsModes && !bFullImg ? imgAsync.fullImg.GetGraphics() : null;
				let scheme = null;
				if (gradient) {
					const top = Math.round(Math.log(Math.max(...worldMap.lastPoint.map((p) => p.val))));
					scheme = Chroma.scale(gradient).mode('lrgb').colors(top + 1, 'android');
				}
				// Hardcoded values comparing Mercator map with Antarctica against python generated countries
				const bAntr = /(?:^|.*_)no_ant(?:_.*|\..*$)/i.test(worldMap.imageMapPath);
				const offsetX = bLowMemMode ? 50 : 100;
				const offsetY = bLowMemMode ? 50 : 100;
				const offsetYAntarc = bLowMemMode ? 310 : 620;
				const w = grFullImg ? layerW : (worldMap.imageMap.Width + offsetX * 2) * worldMap.scale;
				const h = grFullImg ? layerH : (worldMap.imageMap.Height + offsetY * 2 + (bAntr ? offsetYAntarc : 0)) * worldMap.scale;
				const x = grFullImg ? 0 : worldMap.posX - offsetX * worldMap.scale;
				const y = grFullImg ? 0 : worldMap.posY - offsetY * worldMap.scale;
				const layerFill = worldMap.properties.layerFillMode[1];
				let i = 0;
				for (const imgObj of imgAsync.layers.imgs) {
					const id = imgAsync.layers.id[i++];
					const bSel = idSel === id;
					if (!bSel && bFullImg) { continue; }
					const img = imgObj.img;
					if (grFullImg) {
						let subLayer = imgAsync.masks.std.Clone(0, 0, layerW, layerH);
						if (layerFill.length) { fillSubLayer(subLayer, id, layerFill); }
						if (gradient) {
							const count = Math.round(Math.log(worldMap.lastPoint.find((last) => { return last.id === id; }).val));
							const layerGr = subLayer.GetGraphics();
							layerGr.FillSolidRect(0, 0, layerW, layerH, scheme[count]);
							subLayer.ReleaseGraphics(layerGr);
						}
						subLayer.ApplyMask(img);
						grFullImg.DrawImage(subLayer, x, y, w, h, 0, 0, layerW, layerH);
					} else {
						let subLayer = imgAsync.masks[bSel && !gradient ? 'sel' : 'std'].Clone(0, 0, layerW, layerH);
						if (!bSel && !gradient && layerFill.length) { fillSubLayer(subLayer, id, layerFill); }
						if (gradient) {
							const count = Math.round(Math.log(worldMap.lastPoint.find((last) => { return last.id === id; }).val));
							const layerGr = subLayer.GetGraphics();
							layerGr.FillSolidRect(0, 0, layerW, layerH, bSel ? invert(scheme[count]) : scheme[count]);
							subLayer.ReleaseGraphics(layerGr);
						}
						subLayer.ApplyMask(img);
						gr.DrawImage(subLayer, x, y, w, h, 0, 0, layerW, layerH, 0, worldMap.properties.customShapeAlpha[1]);
					}
					if (bProfile) { profile.Print('Sub-layer'); }
					if (bSel && bFullImg) { break; }
				}
				if (grFullImg) {
					imgAsync.fullImg.ReleaseGraphics(grFullImg);
					imgAsync.layers.bCreated = true;
					window.RepaintRect(worldMap.posX, worldMap.posY, worldMap.imageMap.Width * worldMap.scale, worldMap.imageMap.Height * worldMap.scale);
				}
				if (bProfile) { profile.Print('Layers'); }
			} else {
				const grFullImg = worldMap.properties.panelMode[1] === 1 && !bFullImg ? imgAsync.fullImg.GetGraphics() : null;
				const bAntr = /(?:^|.*_)no_ant(?:_.*|\..*$)/i.test(worldMap.imageMapPath);
				const offsetX = bLowMemMode ? 50 : 100;
				const offsetY = bLowMemMode ? 50 : 100;
				const offsetYAntarc = bLowMemMode ? 310 : 620;
				const w = grFullImg ? layerW : (worldMap.imageMap.Width + offsetX * 2) * worldMap.scale;
				const h = grFullImg ? layerH : (worldMap.imageMap.Height + offsetY * 2 + (bAntr ? offsetYAntarc : 0)) * worldMap.scale;
				const x = grFullImg ? 0 : worldMap.posX - offsetX * worldMap.scale;
				const y = grFullImg ? 0 : worldMap.posY - offsetY * worldMap.scale;
				let i = 0;
				for (const imgObj of imgAsync.layers.imgs) {
					const id = imgAsync.layers.id[i++];
					const bSel = idSel === id;
					if (!bSel && bFullImg) { continue; }
					const img = imgObj.img;
					if (grFullImg) {
						grFullImg.DrawImage(img, x, y, w, h, 0, 0, imgAsync.layers.w, imgAsync.layers.h);
					} else {
						// Without masks, only transparency can be changed. It works fine except on library mode,
						// since the background already has the layer painted...
						if (worldMap.properties.panelMode[1] === 1 && bSel) { // NOSONAR
							gr.DrawImage(img.InvertColours(), x, y, w, h, 0, 0, imgAsync.layers.w, imgAsync.layers.h, 0, worldMap.properties.customShapeAlpha[1]);
						} else {
							const alpha = bSel
								? worldMap.properties.customShapeAlpha[1] > 200
									? worldMap.properties.customShapeAlpha[1] - 50
									: worldMap.properties.customShapeAlpha[1] > 100
										? worldMap.properties.customShapeAlpha[1] + 50
										: worldMap.properties.customShapeAlpha[1] + 100
								: worldMap.properties.customShapeAlpha[1];
							gr.DrawImage(img, x, y, w, h, 0, 0, imgAsync.layers.w, imgAsync.layers.h, 0, alpha);
						}
					}
					if (bSel && bFullImg) { break; }
				}
				if (grFullImg) {
					if (bLowMemMode) { imgAsync.fullImg = imgAsync.fullImg.Resize(worldMap.imageMap.Width * worldMap.scale, worldMap.imageMap.Height * worldMap.scale, InterpolationMode.HighQualityBicubic); }
					imgAsync.fullImg.ReleaseGraphics(grFullImg);
					imgAsync.layers.bCreated = true;
					window.RepaintRect(worldMap.posX, worldMap.posY, worldMap.imageMap.Width * worldMap.scale, worldMap.imageMap.Height * worldMap.scale);
				}
			}
		}
	}
	const promises = [];
	imgAsync.layers.bStop = false;
	worldMap.lastPoint.forEach((point, i) => {
		let id = point.id;
		if (worldMap.properties.pointMode[1] >= 1) { // Shapes or both
			const iso = id && id.length ? getCountryISO(id) : null;
			if (iso) {
				if (!imgAsync.layers.iso.has(iso)) {
					imgAsync.layers.iso.add(iso);
					const file = folders.xxx + 'helpers-external\\countries-mercator' + (bMask ? '-mask' : '') + '\\' + iso + '.png';
					if (_isFile(file)) {
						promises.push(new Promise((resolve) => {
							setTimeout(() => {
								if (imgAsync.layers.bStop) { resolve(); }
								if (imgAsync.layers.processedIso.has(iso)) { resolve(); }
								gdi.LoadImageAsyncV2(void (0), file).then((img) => {
									if (img && !imgAsync.layers.bStop && !imgAsync.layers.processedIso.has(iso)) {
										if (bLowMemMode) {
											const lowScale = Math.max(imgAsync.lowMemMode.maxSize / img.Width, imgAsync.lowMemMode.maxSize / img.Height);
											img = img.Resize(img.Width * lowScale, img.Height * lowScale, InterpolationMode.HighQualityBicubic);
										}
										imgAsync.layers.imgs.push({ img, iso });
										imgAsync.layers.processedIso.add(iso);
										imgAsync.layers.id.push(id);
									}
									resolve();
								});
							}, i * 250 + 25);
						}));
					}
				}
			}
		}
		if (worldMap.properties.pointMode[1] === 2) { // Both
			let point = worldMap.point[id];
			if (!point) {
				const [xPos, yPos] = worldMap.findCoordinates({
					id,
					mapWidth: worldMap.imageMap.Width,
					mapHeight: worldMap.imageMap.Height,
					factorX: worldMap.factorX,
					factorY: worldMap.factorY
				});
				if (xPos !== -1 && yPos !== -1) {
					point = { x: xPos, y: yPos, xScaled: xPos * worldMap.scale + worldMap.posX, yScaled: yPos * worldMap.scale + worldMap.posY, id };
				}
			}
			if (point) {
				gr.DrawEllipse(point.xScaled, point.yScaled, worldMap.pointSize * worldMap.scale, worldMap.pointSize * worldMap.scale, worldMap.pointLineSize * worldMap.scale, idSel === id ? worldMap.selectionColor : worldMap.defaultColor);
			}
		}
	});
	if (promises.length) {
		Promise.all(promises).then(() => {
			if (imgAsync.layers.bStop) { return; }
			imgAsync.layers.bPaint = true;
			imgAsync.layers.w = imgAsync.layers.imgs[0].img.Width;
			imgAsync.layers.h = imgAsync.layers.imgs[0].img.Height;
			if (bMask) {
				imgAsync.masks = {
					std: gdi.CreateImage(imgAsync.layers.w, imgAsync.layers.h),
					sel: gdi.CreateImage(imgAsync.layers.w, imgAsync.layers.h),
				};
				if (!gradient) {
					Object.keys(imgAsync.masks).forEach((type) => {
						const layerGr = imgAsync.masks[type].GetGraphics();
						layerGr.FillSolidRect(0, 0, imgAsync.layers.w, imgAsync.layers.h, type === 'sel' ? invert(color) : color);
						imgAsync.masks[type].ReleaseGraphics(layerGr);
					});
				}
			}
			if (bProfile) { profile.Print('Retrieve img layers'); }
			window.RepaintRect(worldMap.posX, worldMap.posY, worldMap.imageMap.Width * worldMap.scale, worldMap.imageMap.Height * worldMap.scale);
		});
	} else if (bProfile) { profile.Print('End'); }
};

addEventListener('on_paint', (gr) => {
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
			const color = worldMap.properties.customShapeColor[1] !== -1 ? worldMap.properties.customShapeColor[1] : worldMap.properties.customShapeColor[3];
			const gradient = worldMap.properties.panelMode[1] === 3
				? worldMap.properties.customGradientColor[1] || [Chroma(color).saturate(2).luminance(0.8).android(), Chroma(color).saturate(2).luminance(0.4).android()]
				: null;
			paintLayers({ gr, color, gradient, bProfile: worldMap.properties.bProfile[1] });
		}
	} else { // Get only X first tracks from selection, x = worldMap.properties.iLimitSelection[1]
		let sel = (worldMap.properties.selection[1] === selMode[1] ? (fb.IsPlaying ? new FbMetadbHandleList(fb.GetNowPlaying()) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist)) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist));
		sel = removeDuplicates({ handleList: sel, checkKeys: [worldMap.jsonId] });
		if (sel.Count > worldMap.properties.iLimitSelection[1]) { sel.RemoveRange(worldMap.properties.iLimitSelection[1], sel.Count - 1); }
		const bPressWin = utils.IsKeyPressed(VK_RWIN) || utils.IsKeyPressed(VK_LWIN);
		const bPressShift = utils.IsKeyPressed(VK_SHIFT);
		const bInvertMap = RegExp(/shapes/i).exec(worldMap.imageMapPath)
			? Chroma.contrast(background.getColors()[0], RGB(0, 0, 0)) * worldMap.imageMapAlpha / 255 < 1.25
			: false;
		worldMap.paint({ gr, sel, bOverridePaintSel: worldMap.properties.pointMode[1] >= 1 || (bPressShift && !bPressWin && worldMap.foundPoints.length), bInvertMap });
		if (sel.Count) {
			if (bPressShift && !bPressWin && worldMap.foundPoints.length) {
				const id = formatCountry(worldMap.foundPoints[0].key || '');
				let point = worldMap.point[id];
				if (!point) {
					const [xPos, yPos] = worldMap.findCoordinates({
						id,
						mapWidth: worldMap.imageMap.Width,
						mapHeight: worldMap.imageMap.Height,
						factorX: worldMap.factorX,
						factorY: worldMap.factorY
					});
					if (xPos !== -1 && yPos !== -1) {
						point = { x: xPos, y: yPos, xScaled: xPos * worldMap.scale + worldMap.posX, yScaled: yPos * worldMap.scale + worldMap.posY, id };
					}
				}
				if (point) {
					gr.DrawEllipse(point.xScaled, point.yScaled, worldMap.pointSize * worldMap.scale, worldMap.pointSize * worldMap.scale, worldMap.pointLineSize * worldMap.scale, worldMap.defaultColor);
				}
			} else if (worldMap.lastPoint.length >= 1 && worldMap.properties.pointMode[1] >= 1) {
				const color = worldMap.properties.customShapeColor[1] !== -1 ? worldMap.properties.customShapeColor[1] : worldMap.properties.customShapeColor[3];
				paintLayers({ gr, color, bProfile: worldMap.properties.bProfile[1] });
			}
		}
		if (sel.Count && worldMap.properties.bShowHeader[1]) { // Header text
			const posX = worldMap.properties.bFullHeader[1]
				? 0
				: worldMap.posX;
			const posY = worldMap.posY;
			const w = worldMap.properties.bFullHeader[1]
				? window.Width
				: worldMap.imageMap.Width * worldMap.scale;
			const h = worldMap.imageMap.Height * worldMap.scale;
			let countryName = '- none -';
			if (worldMap.properties.bShowLocale[1]) {
				if (worldMap.lastPoint.length === 1) {
					let id = worldMap.lastPoint[0].id;
					if (id) {
						const idLen = id.length;
						if ((idLen === 3 && getCountryISO(id) === id) || (idLen === 2 && getCountryISO(id, true) === id)) { // Tag has ISO codes instead of country names
							id = formatCountry(getCountryName(id));
						}
						countryName = nameShortRev.has(id.toLowerCase())
							? formatCountry(nameShortRev.get(id.toLowerCase()))
							: id; // Prefer replacement since its usually shorter...
					}
				} else if (worldMap.lastPoint.length > 1) {
					countryName = 'Multiple countries...';
				}
			}
			const textW = gr.CalcTextWidth(countryName, worldMap.gFont);
			const textH = gr.CalcTextHeight(countryName, worldMap.gFont);
			// Header
			const headerColor = worldMap.properties.headerColor[1] !== -1
				? RGBA(...toRGB(worldMap.properties.headerColor[1]), 150)
				: RGBA(...toRGB(worldMap.panelColor), 150);
			gr.FillSolidRect(posX, posY, w, textH, headerColor);
			// Flag
			if (worldMap.properties.bShowFlag[1] && worldMap.lastPoint.length === 1) {
				const id = worldMap.lastPoint[0].id;
				let flag = loadFlagImage(id);
				const flagScale = flag.Height / textH;
				flag = flag.Resize(flag.Width / flagScale, textH, InterpolationMode.HighQualityBicubic);
				gr.DrawImage(flag, worldMap.properties.bShowLocale[1] ? posX + 10 : posX + (w - flag.Width) / 2, posY, flag.Width, flag.Height, 0, 0, flag.Width, flag.Height);
				// Text
				if (worldMap.properties.bShowLocale[1]) {
					if (textW + flag.Width < w) { gr.GdiDrawText(countryName, worldMap.gFont, worldMap.textColor, posX, posY, w, h, DT_CENTER | DT_NOPREFIX); }
					else { gr.GdiDrawText(countryName.slice(0, Math.floor(20 * 35 / worldMap.gFont.Size)) + '...', worldMap.gFont, worldMap.textColor, posX, posY, w, h, DT_CENTER | DT_NOPREFIX); }
				}
			} else if (worldMap.properties.bShowLocale[1]) {
				if (textW < w) { gr.GdiDrawText(countryName, worldMap.gFont, worldMap.textColor, posX, posY, w, h, DT_CENTER | DT_NOPREFIX); }
				else { gr.GdiDrawText(countryName.slice(0, Math.floor(25 * 35 / worldMap.gFont.Size)) + '...', worldMap.gFont, worldMap.textColor, posX, posY, w, h, DT_CENTER | DT_NOPREFIX); }
			}
		}
	}
	if (window.highlight) { extendGR(gr, { Highlight: true }); }
	if (window.debugPainting) { window.drawDebugRectAreas(gr); }
});

addEventListener('on_playback_new_track', (metadb) => {
	if (background.coverMode.toLowerCase() !== 'none') { background.updateImageBg(); }
	if (worldMap.properties.panelMode[1] === 2) { return; }
	if (!metadb) { return; }
	repaint(true);
});

addEventListener('on_selection_changed', () => {
	if (background.coverMode.toLowerCase() !== 'none' && (!background.coverModeOptions.bNowPlaying || !fb.IsPlaying)) {
		background.updateImageBg();
	}
	if (worldMap.properties.panelMode[1] === 2) { return; }
	worldMap.clearIdSelected();
	repaint();
});

addEventListener('on_item_focus_change', () => {
	if (background.coverMode.toLowerCase() !== 'none' && (!background.coverModeOptions.bNowPlaying || !fb.IsPlaying)) {
		background.updateImageBg();
	}
	if (worldMap.properties.panelMode[1] === 2) { return; }
	worldMap.clearIdSelected();
	repaint();
});

addEventListener('on_playlist_switch', () => {
	if (background.coverMode.toLowerCase() !== 'none' && (!background.coverModeOptions.bNowPlaying || !fb.IsPlaying)) {
		background.updateImageBg();
	}
	if (worldMap.properties.panelMode[1] === 2) { return; }
	repaint();
});


addEventListener('on_playlist_switch', () => {
	if (background.coverMode.toLowerCase() !== 'none' && (!background.coverModeOptions.bNowPlaying || !fb.IsPlaying)) {
		background.updateImageBg();
	}
});

addEventListener('on_playback_stop', (/** @type {number} */ reason) => {
	if (reason !== 2) { // Invoked by user or Starting another track
		if (background.coverMode.toLowerCase() !== 'none' && background.coverModeOptions.bNowPlaying) { background.updateImageBg(); }
		if (worldMap.properties.panelMode[1] === 2) { return; }
		repaint();
	}
});

addEventListener('on_playlists_changed', () => { // To show/hide loaded playlist indicators...
	if (background.coverMode.toLowerCase() !== 'none' && (!background.coverModeOptions.bNowPlaying || !fb.IsPlaying)) {
		background.updateImageBg();
	}
});

addEventListener('on_playlist_items_removed', (playlistIndex, newCount) => {
	if (worldMap.properties.panelMode[1] === 2) { return; }
	if (playlistIndex === plman.ActivePlaylist && newCount === 0) {
		worldMap.clearIdSelected(); // Always delete point selected if there is no items in playlist
		if (worldMap.properties.selection[1] === selMode[1] && fb.IsPlaying) { return; }
		worldMap.clearLastPoint(); // Only delete last points when selMode follows playlist selection
		repaint();
	}
});

addEventListener('on_metadb_changed', (handleList, fromHook) => {
	if (worldMap.properties.panelMode[1] === 2) { return; }
	if (fromHook) { return; }
	if (!worldMap.properties.bEnabled[1]) { return; }
	const sel = (worldMap.properties.selection[1] === selMode[1] ? (fb.IsPlaying ? new FbMetadbHandleList(fb.GetNowPlaying()) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist)) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist));
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
	let sel;
	if (mask === MK_SHIFT || !worldMap.properties.panelMode[1]) {
		sel = worldMap.properties.selection[1] === selMode[1]
			? (fb.IsPlaying
				? new FbMetadbHandleList(fb.GetNowPlaying())
				: plman.GetPlaylistSelectedItems(plman.ActivePlaylist)
			) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
	}
	// On track mode disable point menu without selection
	if (!worldMap.properties.panelMode[1] && (!sel || !sel.Count)) { return; }
	// If an artist from current selection is missing country data, give preference to tagging
	let bForceTag;
	if (mask === MK_SHIFT) {
		const jsonId = getHandleListTagsV2(sel, [worldMap.jsonId], { bMerged: true, splitBy: worldMap.bSplitIds ? ', ' : null });
		if (jsonId.some((idArr, i) => idArr.some((val) => !worldMap.findTag(sel[i], val)))) {
			bForceTag = true;
		}
	}
	worldMap.btn_up(x, y, worldMap.properties.panelMode[1] ? null : mask, bForceTag); // Disable shift on library mode
});

addEventListener('on_mouse_move', (x, y, mask) => {
	if (worldMap.properties.panelMode[1] === 2) { return; }
	if (!worldMap.properties.bEnabled[1]) { return; }
	if (!worldMap.properties.panelMode[1]) { // On track mode disable tooltip without selection
		const sel = worldMap.properties.selection[1] === selMode[1]
			? (fb.IsPlaying
				? new FbMetadbHandleList(fb.GetNowPlaying())
				: plman.GetPlaylistSelectedItems(plman.ActivePlaylist)
			): plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
		if (!sel || !sel.Count) { return; }
	}
	const cache = {
		foundPoint: worldMap.foundPoints.length ? worldMap.foundPoints[0] : null,
		idSelected: worldMap.idSelected
	};
	// Disable shift on library mode and override painting when using layers
	worldMap.move(x, y, worldMap.properties.panelMode[1] ? null : mask, worldMap.properties.pointMode[1] === 0);
	const bSel = worldMap.idSelected && worldMap.idSelected !== cache.idSelected;
	const bFound = !!cache.foundPoint && worldMap.foundPoints.length !== 0 && worldMap.foundPoints[0] !== cache.foundPoint;
	if (bSel || bFound) {
		debouncedRepaint['60'](worldMap.posX, worldMap.posY, worldMap.imageMap.Width * worldMap.scale, worldMap.imageMap.Height * worldMap.scale);
	}
});

addEventListener('on_key_up', (/** @type {number} */ vKey) => { // Repaint after pressing shift to reset
	if (worldMap.properties.panelMode[1] === 2) { return; }
	if (vKey === VK_SHIFT && !worldMap.properties.panelMode[1]) { window.RepaintRect(worldMap.posX, worldMap.posY, worldMap.imageMap.Width * worldMap.scale, worldMap.imageMap.Height * worldMap.scale); }
});

addEventListener('on_mouse_leave', () => {
	if (worldMap.properties.panelMode[1] === 2) { return; }
	if (!worldMap.properties.bEnabled[1]) { return; }
	worldMap.move(-1, -1);
});

addEventListener('on_mouse_rbtn_up', (x, y) => { // NOSONAR
	if (utils.IsKeyPressed(VK_CONTROL) && utils.IsKeyPressed(VK_LWIN)) {
		return importSettingsMenu().btn_up(x, y);
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
						.find((entry) => entry.menuName.startsWith('Cover mode') && entry.subMenuFrom.startsWith('Background'));
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
	if (name === 'World Map: share UI settings') {
		if (info) { worldMap.applyUiSettings(clone(info)); }
	}
	if (worldMap.properties.panelMode[1] === 2) { return; }
	if (!worldMap.properties.bEnabled[1]) { return; }
	if (!worldMap.properties.bEnabledBiography[1]) { return; }
	// WilB's Biography script has a limitation, it only works with 1 track at once...
	// So when selecting more than 1 track, this only gets the focused/playing track's tag
	// If both panels don't have the same selection mode, it will not work
	if (name === 'Biography notifyCountry' || name === 'biographyTags') {
		if (Object.hasOwn(info, 'handle') && Object.hasOwn(info, 'tags') && (info.handle.RawPath !== bioCache.rawPath || info.handle.SubSong !== bioCache.subSong)) {
			bioCache.handleRawPath = info.handle.RawPath;
			bioCache.subSong = info.handle.SubSong;
			// Find the biography track on the entire selection, since it may not be just the first track of the sel list
			const sel = worldMap.properties.selection[1] === selMode[1]
				? (fb.IsPlaying
					? new FbMetadbHandleList(fb.GetNowPlaying())
					: plman.GetPlaylistSelectedItems(plman.ActivePlaylist)
				) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
			// Get Tags
			const tagName = worldMap.properties.writeToTag[1];
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
						? getHandleListTagsV2(new FbMetadbHandleList(info.handle), [worldMap.jsonId], { bMerged: true, splitBy: worldMap.bSplitIds ? ', ' : null }).flat(Infinity)
						: [];
					const jsonId = jsonIds.find((id) => info.artist === id.toUpperCase()) || '';
					if (jsonId.length && info.artist === jsonId.toUpperCase()) {
						// Set tag on map for drawing if found
						if (sel && sel.Count && sel.Find(info.handle) !== -1) {
							if (!worldMap.findTag(info.handle, jsonId)) {
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
									const newData = { [worldMap.jsonId]: jsonId, val: locale };
									if (!worldMap.hasDataById(jsonId)) { worldMap.saveData(newData); } // use path at properties
								}
							}
						}
					}
				}
			}
		}
	}
	// Follow WilB's Biography script selection mode
	if (name === 'Biography notifySelectionProperty') { // Biography 1.1.3
		if (Object.hasOwn(info, 'property') && Object.hasOwn(info, 'val')) {
			// When ppt.focus is true, then selmode is selMode[0]
			if ((info.val && worldMap.properties.selection[1] === selMode[1]) || (!info.val && worldMap.properties.selection[1] === selMode[0])) {
				worldMap.properties.selection[1] = selMode[(info.val ? 0 : 1)]; // Invert value
				if (worldMap.properties.bShowSelModePopup[1]) {
					fb.ShowPopupMessage('Selection mode at Biography panel has been changed. This is only an informative popup, this panel has been updated properly to follow the change:\n' + '"' + worldMap.properties.selection[1] + '"', window.Name);
				}
				overwriteProperties(worldMap.properties); // Updates panel
				repaint();
			}
		}
	} // Follow WilB's Biography script selection mode
	if (name === 'biographyTags') { // Biography 1.2.0
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
					fb.ShowPopupMessage('Selection mode at Biography panel has been changed. This is only an informative popup, this panel has been updated properly to follow the change:\n' + '"' + worldMap.properties.selection[1] + '"', window.Name);
				}
				overwriteProperties(worldMap.properties); // Updates panel
				repaint();
			}
		}
	}
});

stats.attachCallbacks();
globProfiler.Print('callbacks');