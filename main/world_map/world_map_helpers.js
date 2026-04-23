'use strict';
//22/04/26

/* exported selPoint, tooltipPoint, tooltipPanel, selFindPoint, tooltipFindPoint, biographyCheck, saveLibraryTags, wheelResize, headerCountryName, headerCoords, drawHeader, drawTaggingPoint, paintLayers */

/* global worldMap:readable,selMode:readable, modifiers:readable, music_graph_descriptors_countries:readable, overwriteProperties:readable */
// '..\\..\\helpers\\helpers_xxx_file.js';
/* global _save:readable, _isFile:readable */
// '..\\..\\helpers\\helpers_xxx.js';
/* global WshShell:readable, popup:readable, folders:readable, debounce:readable, globTags:readable */
/* global MF_GRAYED:readable, InterpolationMode:readable, TextRenderingHint:readable, DT_CENTER:readable, DT_NOPREFIX:readable, DT_WORD_ELLIPSIS:readable */
include('..\\..\\helpers\\helpers_xxx_playlists.js');
/* global removePlaylistByName:readable, getPlaylistIndexArray:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global _t:readable, capitalize:readable, capitalizeAll:readable, _bt:readable, _p:readable, _qCond:readable */
include('..\\..\\helpers\\helpers_xxx_tags.js');
/* global queryCombinations:readable, queryJoin:readable, checkQuery:readable, getHandleListTags:readable, getHandleListTagsV2:readable */
// '..\\..\\helpers\\helpers_xxx_ui.js';
/* global _scale:readable, RGB:readable, RGBA:readable, toRGB:readable, _textWidth:readable, _textHeight:readable, invert:readable, */
include('..\\..\\helpers\\menu_xxx.js');
/* global _menu:readable, */
include('world_map_flags.js');
/* global loadFlagImage:readable */
// 'world_map_tables.js';
/* global getCountryISO:readable, getCountryName:readable, nameShortRev:readable */
// 'world_map_statistics.js';
/* global Chroma:readable */

/*
	Map helpers
*/

// When clicking on a point
function selPoint(point, mask) {
	let bDone = false;
	// The entire function is tag agnostic, it may be used for anything.
	// When jsonId is set as 'artist' so it looks for artists with same map value
	// The ctrl modifier is set to force 'genre' and 'style' tags but can be used with anything
	if (!point.id.length) { return bDone; }
	if (!worldMap.jsonId.length) { return bDone; }
	let query = [];
	const dataId = worldMap.jsonId; // Set before. The tag used to match data
	const dataIdTag = dataId.toUpperCase(); // for readability
	// Any track with same locale tag
	const tag = worldMap.properties.mapTag[1].includes('$') ? '"' + worldMap.properties.mapTag[1] + '"' : worldMap.properties.mapTag[1];
	if (tag.length) { query.push(tag + ' IS ' + point.id.toString().toLowerCase()); }
	// What about JSON data? -> List of artists with same value
	let jsonQuery = [];
	worldMap.getData().forEach((item) => {
		if (item.val[item.val.length - 1] === point.id) { jsonQuery.push(item[dataId]); }
	});
	if (jsonQuery.length) { query.push(queryCombinations(jsonQuery, _t(dataIdTag), 'OR')); }
	// What about current tracks (from selected point)? -> Always a match
	const selPointData = worldMap.getLastPoint().find((last) => { return (last.id === point.id); }); // Has list of artist on every paint
	if (selPointData.jsonId.size) { // Data is a set, so no duplicates
		const currentMatchData = [...selPointData.jsonId];
		query.push(queryCombinations(currentMatchData, dataIdTag, 'OR'));
	}
	// Merges all queries with OR
	query = [queryJoin(query, 'OR')];
	// Add query with keyboard modifiers
	const currentModifier = modifiers.find((mod) => mod.mask === mask);
	if (currentModifier) { // When using ctrl + click, Shift, ...
		const sel = (worldMap.properties.selection[1] === selMode[1] ? (fb.IsPlaying ? new FbMetadbHandleList(fb.GetNowPlaying()) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist)) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist));
		if (sel && sel.Count) {
			if (selPointData.jsonId.size) { // Data is a set, so no duplicates
				let selPoint = new FbMetadbHandleList();
				const selJsonId = getHandleListTags(sel, [dataIdTag], { bMerged: true }).filter(Boolean);
				selJsonId.forEach((jsonId, index) => {
					if (selPointData.jsonId.intersectionSize(new Set(jsonId))) { selPoint.Add(sel[index]); }
				});
				if (selPoint.Count) {
					const modifierTags = worldMap.properties[currentModifier.tag][1].split(',').filter(Boolean);
					let modifierQuery = [];
					modifierTags.forEach((modTag) => {
						const tagFilter = worldMap.properties.tagFilter[1].length ? new Set(worldMap.properties.tagFilter[1].split(',').concat('')) : null;
						const tagValues = getHandleListTags(selPoint, [modTag], { bMerged: true }).filter(Boolean);
						let valSet = new Set(); // Don't add the same thing multiple times to the query, just for readability
						if (tagValues.length) {
							for (let i = 0; i < selPoint.Count; i++) {
								const tag_i = tagValues[i].filter((tag) => { return !tagFilter.has(tag); });
								const tagId_i = tag_i.join(',');
								if (tag_i.length && !valSet.has(tagId_i)) {
									modifierQuery.push(queryCombinations(tag_i, [modTag], 'AND'));
									valSet.add(tagId_i);
								}
							}
						}
					});
					if (modifierQuery.length > 1) { modifierQuery = queryJoin(modifierQuery, 'AND'); }
					if (modifierQuery.length) { query.push(modifierQuery); }
				}
			}
		}
	}
	// Add forced query
	const forcedQuery = worldMap.properties.forcedQuery[1];
	if (forcedQuery.length) { query.push(forcedQuery); }
	// Merge all with AND
	query = queryJoin(query, 'AND');
	// Create AutoPlaylist
	if (checkQuery(query)) {
		console.log('World Map: playlist created ' + (query.length > 300 ? query.slice(0, 300) + '...' : query));
		const name = capitalize(dataId) + ' from ' + point.id + (currentModifier ? ' (+' + capitalizeAll(currentModifier.val.split(',').filter(Boolean).join('/'), '/') + ')' : '');
		const duplicatePls = getPlaylistIndexArray(name);
		if (duplicatePls.length === 1) {
			plman.ActivePlaylist = duplicatePls[0];
		} else {
			if (duplicatePls.length > 1) { removePlaylistByName(name); }
			plman.ActivePlaylist = plman.CreateAutoPlaylist(plman.PlaylistCount, name, query);
		}
		bDone = true;
		return bDone;
	} else { fb.ShowPopupMessage('Query not valid: ' + query, window.FullPanelName); }
	return bDone;
}

// When clicking on a the map with tracks without tags
function selFindPoint(foundPoints, mask, x, y, bForce = false) {
	let bDone = false;
	// The entire function is tag agnostic, it may be used for anything.
	// When jsonId is set as 'artist' so it looks for artists with same map value
	// The ctrl modifier is set to force 'genre' and 'style' tags but can be used with anything
	if (!foundPoints.length) { return bDone; }
	if (!worldMap.jsonId.length) { return bDone; }
	// Any track with same locale tag
	const tagName = worldMap.properties.writeToTag[1] || globTags.locale;
	if (tagName.length) {
		const sel = worldMap.getSelection();
		if (!sel && !sel.Count) { return bDone; }
		const jsonId = getHandleListTagsV2(sel, [worldMap.jsonId], { bMerged: true, splitBy: worldMap.bSplitIds ? ', ' : null, splitExclude: worldMap.splitExcludeId });
		const jsonIdFlat = new Set(jsonId.flat(Infinity));
		const countries = jsonId.map((idArr, i) => idArr.map((val) => this.findTag(sel[i], val).split(this.bSplitTags ? '|' : void (0))));
		let locale = [];
		let tagId = '';
		// Menu to select country from list
		const menu = new _menu();
		if (jsonIdFlat.size > 1) {
			menu.newEntry({ entryText: 'Select a country: Multiple artists', func: null, flags: MF_GRAYED });
			menu.newSeparator();
			let menuName;
			foundPoints.forEach((point) => {
				let country = formatCountry(point.key);
				menuName = menu.newMenu(country);
				jsonId.forEach((idArr, i) => idArr.forEach((id, j) => {
					let visited = new Set(jsonIdFlat);
					if (visited.has(id)) {
						menu.newEntry({
							menuName, entryText: id + (countries[i][j].filter(Boolean).length ? '\t[-tagged-] ' : ''), func: () => {
								locale = [country];
								tagId = id;
							}
						});
						menu.newCheckMenuLast(() => countries[i][j].includes(country));
						visited.delete(id);
					}
				}));
			});
		} else {
			menu.newEntry({ entryText: 'Select a country: ' + jsonId, func: null, flags: MF_GRAYED });
			menu.newSeparator();
			foundPoints.forEach((point) => {
				let country = formatCountry(point.key);
				menu.newEntry({
					entryText: country, func: () => {
						locale = [country];
						tagId = [...jsonIdFlat][0];
					}
				});
				menu.newCheckMenuLast(() => countries[0][0].includes(country));
			});
		}
		worldMap.tooltip.SetValue(null);
		menu.btn_up(x, y);
		if (!locale.length || !tagId.length) { return bDone; }
		// Set tag on map for drawing
		worldMap.setTag(locale[locale.length - 1], tagId);
		window.Repaint();
		// Find all handles with selected artist
		if (worldMap.properties.iWriteTags[1] > 0) {
			if (worldMap.properties.iWriteTags[1] === 1) {
				const toTag = new FbMetadbHandleList();
				const tfo = fb.TitleFormat(_bt(tagName));
				const answer = WshShell.Popup('Do you want to tag all tracks from selected artist?\nArtist: ' + tagId + '\n\nClicking "No" will only use the current selection.', 0, 'World Map: tag ' + tagId, popup.question + popup.yes_no);
				if (answer === popup.no) {
					jsonId.forEach((idArr, idx) => {
						if (idArr.includes(tagId) && (!tfo.EvalWithMetadb(sel[idx]).length || bForce)) { // Check if tag already exists
							toTag.Add(sel[idx]);
						}
					});
				} else {
					console.log(worldMap.jsonId + ' IS ' + tagId);
					const query = worldMap.jsonId.toUpperCase() === 'ALBUM ARTIST'
						? queryJoin([
							'ARTIST IS ' + tagId.toLowerCase(),
							'%ALBUM ARTIST% IS ' + tagId.toLowerCase(),
						], 'OR')
						: _qCond(worldMap.jsonId) + ' IS ' + tagId.toString().toLowerCase();
					toTag.AddRange(fb.GetQueryItems(fb.GetLibraryItems(), query));
				}
				if (toTag.Count) { toTag.UpdateFileInfoFromJSON(JSON.stringify({ [tagName]: locale })); }
			} else {
				const newData = { [worldMap.jsonId]: tagId, val: locale };
				if (!worldMap.hasDataById(tagId)) { worldMap.saveData(newData); } // use path at properties
				else if (bForce) { // Force rewrite
					worldMap.deleteDataById(tagId);
					worldMap.saveData(newData);
				}
			}
		}
		bDone = true;
	}
	return bDone;
}

// When mouse is over point
function tooltipPoint(point) {
	const count = worldMap.lastPoint.find((last) => { return last.id === point.id; }).val;
	const region = music_graph_descriptors_countries.getFirstNodeRegion(getCountryISO(point.id));
	const continent = music_graph_descriptors_countries.getMainRegion(region);
	let text = 'From: ' + point.id + ' (' + count + ')' + '\t - ' + region + ' ' + _p(continent) + ' - ';
	text += '\n(L. Click to create AutoPlaylist from same country)\n';
	if (!worldMap.properties.panelMode[1]) {
		modifiers.forEach((mod) => {
			const tags = capitalizeAll(mod.val.split(',').filter(Boolean).join('/'), '/');
			text += _p(mod.description + ' + L. Click forces same ' + tags + ' too') + '\n';
		});
		text += '-'.repeat(60);
		text += '\n(Shift + L. Click on map rewrites locale tag)\n';
	}
	return (point && Object.hasOwn(point, 'id') ? text : null);
}

// When mouse is over point on tagging mode
function tooltipFindPoint(foundPoints) {
	const sel = (worldMap.properties.selection[1] === selMode[1] ? (fb.IsPlaying ? new FbMetadbHandleList(fb.GetNowPlaying()) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist)) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist));
	if (!sel || !sel.Count) { return; }
	let text = foundPoints.map((point) => { return formatCountry(point.key) + ' ' + _p(point.prox + '%'); }).join(', ');
	text += '\n(L. Click to add locale tag to current track(s))';
	return text;
}

// When mouse is over panel
function tooltipPanel() {
	return 'Move over a point to see playlist creation options.' +
		'\n(R. Click to open settings menu)' +
		'\n(Shift + L. Click on map rewrites locale tag)' +
		'\n' + '-'.repeat(60) +
		'\n(Shift + Win + R. Click for SMP panel menu)' +
		'\n(Ctrl + Win + R. Click for script panel menu)';
}

// Property check
function biographyCheck() {
	return !(worldMap.properties['bEnabledBiography'][1] && !worldMap.properties['bInstalledBiography'][1]);
}

// Capitalize names
function formatCountry(country) {
	return capitalizeAll(country, /([-(),/: .])/g, false).replace(' And ', ' and ').replace(' Of ', ' of ').replace(' Of', ' of').replace(' Da ', ' da ').replace(' The ', ' the ').replace(' The', ' the').replace(', the', ', The');
}

// Retrieve all tags from database for current library
function getLibraryTags(jsonId, dataObj) { // worldMap.jsonId = artist
	const handleList = fb.GetLibraryItems();
	const jsonIdList = [...new Set(fb.TitleFormat(_bt(jsonId)).EvalWithMetadbs(handleList))]; // Removes duplicates
	const libraryTags = [];
	let tag;
	jsonIdList.forEach((jsonId) => {
		tag = dataObj.getDataById(jsonId);
		if (tag) {
			let tagVal = '';
			if (tag.val && tag.val.length) { tagVal = tag.val[tag.val.length - 1]; }
			if (tagVal) {
				const idx = libraryTags.findIndex((libTag) => { return libTag.id === tagVal; });
				if (idx === -1) {
					libraryTags.push({ id: tagVal, val: 1, jsonId: [jsonId] });
				} else {
					libraryTags[idx].val++;
					if (!libraryTags[idx].jsonId.includes(jsonId)) { libraryTags[idx].jsonId.push(jsonId); }
				}
			}
		}
	});
	return libraryTags;
}

function saveLibraryTags(dataPath, jsonId, dataObj) { // dataPath = worldMap.properties.fileNameLibrary[1], jsonId = worldMap.jsonId, dataObj = worldMap
	const libraryTags = getLibraryTags(jsonId, dataObj);
	if (libraryTags && libraryTags.length) {
		_save(dataPath, JSON.stringify(libraryTags, null, '\t').replace(/\n/g, '\r\n'));
	}
}

function wheelResize(s) {
	if (worldMap.mX !== -1 && worldMap.mY !== -1) {
		const traceHeader = (x, y) => {
			const { posX, posY, w, textH } = headerCoords(headerCountryName());
			const offset = worldMap.properties.bFullHeader[1] ? 0.1 : 0;
			const hx = posX - w * (offset / 2);
			const hw = w * (1 + offset);
			const hh = textH * (3 / 4 + (worldMap.properties.bFullHeader[1] ? 1 / 2 : (posY === 0 ? 1 / 2 : 1)));
			return x >= hx && x <= hx + hw && y >= posY && y <= posY + hh;
		};
		let key;
		switch (true) {
			case traceHeader(worldMap.mX, worldMap.mY): key = 'fontSize'; break;
			case worldMap.idSelected.length !== 0: key = 'pointSize'; break;
		}
		if (key) {
			worldMap[key] += Math.sign(s);
			worldMap[key] = Math.max(5, worldMap[key]);
			worldMap.properties[key][1] = worldMap[key];
			worldMap.pointLineSize = worldMap.properties.bPointFill[1] ? worldMap.pointSize : worldMap.pointSize * 2 + 5;
			worldMap.calcScale(window.Width, window.Height);
		} else { return; }
		if (key === 'fontSize') { window.Repaint(); } else { repaint(void (0), true, true); }
		overwriteProperties(worldMap.properties);
	}
}

function headerCountryName() {
	return worldMap.lastPoint.map((point) => {
		let id = point.id;
		if (id) {
			const idLen = id.length;
			if ((idLen === 3 && getCountryISO(id) === id) || (idLen === 2 && getCountryISO(id, true) === id)) { // Tag has ISO codes instead of country names
				id = formatCountry(getCountryName(id));
			}
			return nameShortRev.has(id.toLowerCase())
				? formatCountry(nameShortRev.get(id.toLowerCase()))
				: id; // Prefer replacement since its usually shorter...
		}
	}).joinUpToChars(', ').cut(30) || '- none -';
}

function headerCoords(countryName) {
	const textW = _textWidth(countryName, worldMap.gFont);
	const textH = _textHeight(countryName, worldMap.gFont);
	const infoX = worldMap.posX;
	const infoW = worldMap.imageMap.Width * worldMap.scale;
	const posX = worldMap.properties.bFullHeader[1]
		? 0
		: infoX;
	let posY;
	switch (worldMap.properties.headerPosition[1]) {
		case 'bottom': posY = window.Height - textH; break;
		case 'bottom-map': posY = Math.min(worldMap.posY + worldMap.imageMap.Height * worldMap.scale, window.Height) - textH; break;
		case 'below-map': posY = Math.min(worldMap.posY + worldMap.imageMap.Height * worldMap.scale, window.Height - textH); break;
		case 'top-map': posY = worldMap.posY; break;
		case 'over-map': posY = Math.max(worldMap.posY - textH, 0); break;
		case 'top':
		default: posY = 0; break;
	}
	const w = worldMap.properties.bFullHeader[1]
		? window.Width
		: infoW;
	const h = worldMap.imageMap.Height * worldMap.scale;
	return { infoX, infoW, posX, posY, w, h, textW, textH };
}

function drawHeader(gr) {
	const countryName = worldMap.properties.bShowLocale[1] ? headerCountryName() : '- none -';
	const { infoX, infoW, posX, posY, w, h, textW, textH } = headerCoords(countryName);
	// Header
	switch (worldMap.properties.headerStyle[1]) {
		case 0: {
			const headerColor = worldMap.properties.headerColor[1] === -1
				? RGBA(...toRGB(worldMap.panelColor), 150)
				: RGBA(...toRGB(worldMap.properties.headerColor[1]), 150);
			if (worldMap.properties.bFullHeader[1]) {
				if (posY === window.Height - textH) {
					gr.FillSolidRect(posX, posY, w, textH, headerColor);
				} else {
					gr.FillSolidRect(posX, posY, w, textH * 3 / 4, headerColor);
					gr.FillGradRect(posX, posY + textH * 3 / 4, w, textH / 2, 90.1, headerColor, RGBA(0, 0, 0, 0));
				}
			} else {
				const offset = 0.1;
				const img = gdi.CreateImage(w * (1 + offset), textH * (3 / 4 + (posY === 0 ? 1 / 2 : 1)));
				let imgGr = img.GetGraphics();
				if (posY === 0) {
					imgGr.FillSolidRect(0, 0, img.Width, textH * 3 / 4, headerColor);
					imgGr.FillGradRect(0, 0 + textH * 3 / 4, img.Width, textH / 2, 90.1, headerColor, RGBA(0, 0, 0, 0));
				} else {
					imgGr.FillGradRect(0, 0, img.Width, textH / 2, 270.5, headerColor, RGBA(0, 0, 0, 0));
					if (posY === window.Height - textH) {
						imgGr.FillSolidRect(0, textH / 2, img.Width, textH * 3 / 4 + textH / 2, headerColor);
					}
					else {
						imgGr.FillSolidRect(0, textH / 2, img.Width, textH * 3 / 4, headerColor);
						imgGr.FillGradRect(0, textH / 2 + textH * 3 / 4, img.Width, textH / 2, 90.1, headerColor, RGBA(0, 0, 0, 0));
					}
				}
				img.ReleaseGraphics(imgGr);
				const mask = gdi.CreateImage(img.Width, img.Height);
				imgGr = mask.GetGraphics();
				imgGr.FillGradRect(0, 0, w * offset / 2, img.Height, 180.1, RGB(0, 0, 0), RGB(255, 255, 255));
				imgGr.FillGradRect(img.Width - w * (offset / 2), 0, w * (offset / 2), img.Height, 0.1, RGB(0, 0, 0), RGB(255, 255, 255));
				mask.ReleaseGraphics(imgGr);
				img.ApplyMask(mask);
				if (posY === 0) {
					gr.DrawImage(img, posX - w * (offset / 4), posY, w + w * (offset / 2), img.Height, 0, 0, img.Width, img.Height);
				} else {
					gr.DrawImage(img, posX - w * (offset / 4), posY - textH * 2 / 5, w + w * (offset / 2), img.Height, 0, 0, img.Width, img.Height);
				}
			}
			break;
		}
		case 1:
		default: {
			if (worldMap.properties.bFullHeader[1]) {
				if (posY === window.Height - textH) {
					gr.FillSolidRect(posX, posY, w, _scale(1), worldMap.textColor);
				} else {
					gr.FillSolidRect(posX, posY + textH, w, _scale(1), worldMap.textColor);
				}
			} else {
				if (posY === window.Height - textH) {
					gr.FillSolidRect(posX, posY, w, _scale(1), worldMap.textColor);
				} else {
					gr.FillSolidRect(posX, posY + textH, w, _scale(1), worldMap.textColor);
				}
			}
		}
	}
	// Flag
	if (worldMap.properties.bShowFlag[1] && worldMap.lastPoint.length >= 1) {
		const flagPos = worldMap.properties.flagPosition[1].toLowerCase() || 'center';
		const loadFlag = (idx) => {
			const id = worldMap.lastPoint[idx].id;
			const flag = loadFlagImage(id);
			const flagScale = flag.Height / (textH || 1);
			return flag.Resize(Math.max(flag.Width / flagScale, 1), Math.max(textH, 1), flagScale > 1.5 ? InterpolationMode.HighQualityBicubic : InterpolationMode.NearestNeighbor);
		};
		const paintFlag = (img, align) => {
			switch (align) {
				case 'right':
				case 'both':
				case 'left':
				case 'center': {
					gr.DrawImage(img, worldMap.properties.bShowLocale[1] ? infoX + (infoW - textW) / 2 - img.Width - _scale(10) : infoX + (infoW - img.Width) / 2, posY, img.Width, img.Height, 0, 0, img.Width, img.Height);
					break;
				}
				default: {
					if (align !== 'right') { gr.DrawImage(img, infoX + _scale(10), posY, img.Width, img.Height, 0, 0, img.Width, img.Height); }
					if (align !== 'left') { gr.DrawImage(img, infoX + infoW - _scale(10) - img.Width, posY, img.Width, img.Height, 0, 0, img.Width, img.Height); }
					break;
				}
			}
		};
		const paintText = (flagsWidth) => {
			gr.SetTextRenderingHint(TextRenderingHint.AntiAliasGridFit);
			gr.GdiDrawText(countryName, worldMap.gFont, worldMap.textColor, infoX + flagsWidth, posY, infoW - flagsWidth * 2, h, DT_CENTER | DT_NOPREFIX | DT_WORD_ELLIPSIS);
			gr.SetTextRenderingHint();
		};
		if (flagPos === 'both' && worldMap.lastPoint.length > 1) {
			let flag;
			for (let i = 0; i < 2; i++) {
				flag = loadFlag(i);
				paintFlag(flag, ['left', 'right'][i]);
			}
			// Text
			if (worldMap.properties.bShowLocale[1]) { paintText(_scale(10) + flag.Width * 10 / 9); }
		} else {
			const flag = loadFlag(0);
			paintFlag(flag, flagPos);
			// Text
			if (worldMap.properties.bShowLocale[1]) { paintText(_scale(10) + flag.Width * 10 / 9); }
		}
	} else if (worldMap.properties.bShowLocale[1]) {
		gr.SetTextRenderingHint(TextRenderingHint.AntiAliasGridFit);
		if (textW < w) { gr.GdiDrawText(countryName, worldMap.gFont, worldMap.textColor, infoX, posY, infoW, h, DT_CENTER | DT_NOPREFIX); }
		else { gr.GdiDrawText(countryName.slice(0, Math.floor(25 * 35 / worldMap.gFont.Size)) + '...', worldMap.gFont, worldMap.textColor, infoX, posY, infoW, h, DT_CENTER | DT_NOPREFIX); }
		gr.SetTextRenderingHint();
	}
}

function drawTaggingPoint(gr) {
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
}

const debouncedRepaint = {
	'60': debounce(window.RepaintRect, 60, false, window),
};
function repaint(bPlayback = false, bImmediate = false, bForce = false) {
	if (!worldMap.properties.bEnabled[1]) { return false; }
	if (worldMap.properties.panelMode[1] >= 1 && !bForce) { return false; }
	if (!bPlayback && worldMap.properties.selection[1] === selMode[1] && fb.IsPlaying && !bForce) { return false; }
	if (bPlayback && worldMap.properties.selection[1] === selMode[0] && fb.IsPlaying && !bForce) { return false; }
	const sel = worldMap.getSelection();
	const jsonId = getHandleListTagsV2(sel, [worldMap.jsonId], { bMerged: true, splitBy: worldMap.bSplitIds ? ', ' : null, splitExclude: worldMap.splitExcludeId });
	const countries = jsonId.map((idArr, i) => idArr.map((val) => worldMap.findTag(sel[i], val).split(worldMap.bSplitTags ? '|' : void (0))))
		.flat(Infinity).filter(Boolean);
	if (new Set(countries).isEqual(new Set(worldMap.lastPoint.map((p) => p.id)))) { return false; }
	imgAsync.fullImg = null;
	imgAsync.layers.imgs.length = 0;
	imgAsync.layers.id.length = 0;
	imgAsync.layers.iso.clear();
	imgAsync.layers.processedIso.clear();
	imgAsync.layers.bPaint = false;
	imgAsync.layers.bStop = true;
	imgAsync.layers.bCreated = false;
	if (!window.IsVisible) { return false; }
	const delay = bImmediate ? 0 : worldMap.properties.iRepaintDelay[1];
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

const imgAsync = {
	layers: { bPaint: false, bStop: false, imgs: [], id: [], iso: new Set(), processedIso: new Set() },
	masks: { sel: null, std: null },
	lowMemMode: { maxSize: 1000 },
	fullImg: null
};
/**
 * Paint country layers
 *
 * @function
 * @name fillSubLayer
 * @kind variable
 * @param {GdiBitmap} subLayer
 * @param {string} id
 * @param {string} mode
 * @param {number} scale
 * @returns {void}
 */
const fillSubLayer = (subLayer, id, mode, scale = Math.min(imgAsync.layers.w / worldMap.imageMap.Width, imgAsync.layers.h / worldMap.imageMap.Height)) => {
	if (!mode || !mode.length) { return; }
	const flagSize = 64; const w = 40; const h = 30;
	const flag = mode === 'flag'
		? loadFlagImage(id)
		: loadFlagImage(id).Clone((flagSize - w) / 2, (flagSize - h) / 2, (flagSize + w) / 2, (flagSize + h) / 2); // Extract center of flag
	const layerGr = subLayer.GetGraphics();
	const point = worldMap.point[id];
	switch (mode) {
		case 'flag': {
			const w = imgAsync.layers.w / 2; const h = imgAsync.layers.h / 2;
			const x = point.xCorr * scale - w / 2; const y = point.yCorr * scale - h / 2;
			layerGr.SetInterpolationMode(InterpolationMode.NearestNeighbor);
			layerGr.DrawImage(flag, x, y, w, h, 0, 0, flagSize, flagSize);
			break;
		}
		case 'blurflag': {
			const w = imgAsync.layers.w / 2; const h = imgAsync.layers.h / 2;
			const x = point.x * scale - w / 2; const y = point.y * scale - h / 2;
			const blend = flag.Resize(Math.max(Math.round(flag.Width / 10), 6), Math.max(Math.round(flag.Height / 10), 6), InterpolationMode.HighQuality)
				.Resize(flagSize, flagSize, InterpolationMode.HighQuality);
			layerGr.DrawImage(blend, x, y, w, h, 0, 0, flagSize, flagSize);
			break;
		}
		case 'gradient': {
			const flagColors = JSON.parse(flag.GetColourSchemeJSONV2 ? flag.GetColourSchemeJSONV2(4) : flag.GetColourSchemeJSON(4))
				.sort((a, b) => a.freq - b.freq)
				.map((o) => o.col)
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
		case 'color':
		default: {
			const flagColors = JSON.parse(flag.GetColourSchemeJSONV2 ? flag.GetColourSchemeJSONV2(4) : flag.GetColourSchemeJSON(4))
				.sort((a, b) => a.freq - b.freq)
				.map((o) => o.col)
				.filter((color) => {
					return Chroma.deltaE('#000000', color) > 20 && Chroma.deltaE('#ffffff', color) > 20;
				});
			const flagColor = flagColors[0] || RGB(255, 255, 255);
			layerGr.FillSolidRect(0, 0, imgAsync.layers.w, imgAsync.layers.h, flagColor);
			break;
		}
	}
	subLayer.ReleaseGraphics(layerGr);
};

/**
 * Paint country layers
 *
 * @function
 * @name paintLayers
 * @kind variable
 * @param {{ gr: GdiGraphics, color?: number, gradient?: number[] bProfile?: boolean }} { gr, color, gradient, bProfile }?
 * @returns {void}
 */
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
			const offsetYAntarctic = bLowMemMode ? 310 : 620;
			const bAntarctic = /(?:^|.*_)no_ant(?:_.*|\..*$)/i.test(worldMap.imageMapPath);
			const w = (worldMap.imageMap.Width + offsetX * 2) * worldMap.scale;
			const h = (worldMap.imageMap.Height + offsetY * 2 + (bAntarctic ? offsetYAntarctic : 0)) * worldMap.scale;
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
				const bAntarctic = /(?:^|.*_)no_ant(?:_.*|\..*$)/i.test(worldMap.imageMapPath);
				const offsetX = bLowMemMode ? 50 : 100;
				const offsetY = bLowMemMode ? 50 : 100;
				const offsetYAntarctic = bLowMemMode ? 310 : 620;
				const w = grFullImg
					? layerW
					: (worldMap.imageMap.Width + offsetX * 2) * worldMap.scale;
				const h = grFullImg
					? layerH
					: (worldMap.imageMap.Height + offsetY * 2 + (bAntarctic ? offsetYAntarctic : 0)) * worldMap.scale;
				const x = grFullImg
					? 0
					: worldMap.posX - offsetX * worldMap.scale;
				const y = grFullImg
					? 0
					: worldMap.posY - offsetY * worldMap.scale;
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
					if (window.IsVisible) { window.RepaintRect(worldMap.posX, worldMap.posY, worldMap.imageMap.Width * worldMap.scale, worldMap.imageMap.Height * worldMap.scale); }
				}
				if (bProfile) { profile.Print('Layers'); }
			} else {
				const grFullImg = worldMap.properties.panelMode[1] === 1 && !bFullImg ? imgAsync.fullImg.GetGraphics() : null;
				const bAntarctic = /(?:^|.*_)no_ant(?:_.*|\..*$)/i.test(worldMap.imageMapPath);
				const offsetX = bLowMemMode ? 50 : 100;
				const offsetY = bLowMemMode ? 50 : 100;
				const offsetYAntarcTic = bLowMemMode ? 310 : 620;
				const w = grFullImg
					? layerW
					: (worldMap.imageMap.Width + offsetX * 2) * worldMap.scale;
				const h = grFullImg
					? layerH
					: (worldMap.imageMap.Height + offsetY * 2 + (bAntarctic ? offsetYAntarcTic : 0)) * worldMap.scale;
				const x = grFullImg
					? 0
					: worldMap.posX - offsetX * worldMap.scale;
				const y = grFullImg
					? 0
					: worldMap.posY - offsetY * worldMap.scale;
				let i = 0;
				for (const imgObj of imgAsync.layers.imgs) {
					const id = imgAsync.layers.id[i++];
					const bSel = idSel === id;
					if (!bSel && bFullImg) { continue; }
					const img = imgObj.img;
					if (grFullImg) {
						grFullImg.DrawImage(img, x, y, w, h, 0, 0, imgAsync.layers.w, imgAsync.layers.h);
					} else {
						// Without masks, only opacity can be changed. It works fine except on library mode,
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
					if (bLowMemMode) {
						imgAsync.fullImg = imgAsync.fullImg.Resize(Math.max(worldMap.imageMap.Width * worldMap.scale, 1), Math.max(worldMap.imageMap.Height * worldMap.scale, 1), InterpolationMode.HighQualityBicubic);
					}
					imgAsync.fullImg.ReleaseGraphics(grFullImg);
					imgAsync.layers.bCreated = true;
					if (window.IsVisible) { window.RepaintRect(worldMap.posX, worldMap.posY, worldMap.imageMap.Width * worldMap.scale, worldMap.imageMap.Height * worldMap.scale); }
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
											img = img.Resize(Math.max(img.Width * lowScale, 1), Math.max(img.Height * lowScale, 1), InterpolationMode.HighQualityBicubic);
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
			if (window.IsVisible) { window.RepaintRect(worldMap.posX, worldMap.posY, worldMap.imageMap.Width * worldMap.scale, worldMap.imageMap.Height * worldMap.scale); }
		});
	} else if (bProfile) { profile.Print('End'); }
};