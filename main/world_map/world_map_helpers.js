'use strict';
//06/08/25

/* exported selPoint, tooltipPoint, tooltipPanel, selFindPoint, tooltipFindPoint, biographyCheck, saveLibraryTags */

/* global worldMap:readable, getCountryISO:readable, selMode:readable, modifiers:readable, music_graph_descriptors_countries:readable, _save:readable */
include('..\\..\\helpers\\helpers_xxx.js');
/* global MF_GRAYED:readable, WshShell:readable, popup:readable */
include('..\\..\\helpers\\helpers_xxx_playlists.js');
/* global removePlaylistByName:readable, getPlaylistIndexArray:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global _t:readable, capitalize:readable, capitalizeAll:readable, _bt:readable, _p:readable, _qCond:readable */
include('..\\..\\helpers\\helpers_xxx_tags.js');
/* global queryCombinations:readable, queryJoin:readable, checkQuery:readable, getHandleListTags:readable, getHandleListTagsV2:readable */
include('..\\..\\helpers\\menu_xxx.js');
/* global _menu:readable, */

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
	if (tag.length) { query.push(tag + ' IS ' + point.id); }
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
	} else { fb.ShowPopupMessage('Query not valid: ' + query, window.Name); }
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
	const tagName = worldMap.properties.writeToTag[1];
	if (tagName.length) {
		const sel = worldMap.properties.selection[1] === selMode[1]
			? (fb.IsPlaying
				? new FbMetadbHandleList(fb.GetNowPlaying())
				: plman.GetPlaylistSelectedItems(plman.ActivePlaylist)
			) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
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
							'ARTIST IS ' + tagId,
							'%ALBUM ARTIST% IS ' + tagId,
						], 'OR')
						: _qCond(worldMap.jsonId) + ' IS ' + tagId;
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
				if (idx !== -1) {
					libraryTags[idx].val++;
					if (!libraryTags[idx].jsonId.includes(jsonId)) { libraryTags[idx].jsonId.push(jsonId); }
				} else {
					libraryTags.push({ id: tagVal, val: 1, jsonId: [jsonId] });
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