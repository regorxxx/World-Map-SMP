'use strict';
//07/01/24

/* exported selPoint, tooltip, selFindPoint, tooltipFindPoint, biographyCheck, saveLibraryTags */

/* global worldMap:readable, getCountryISO:readable, selMode:readable, modifiers:readable, music_graph_descriptors_countries:readable, _save:readable */
include('..\\..\\helpers\\helpers_xxx.js');
/* global MF_GRAYED:readable */
include('..\\..\\helpers\\helpers_xxx_playlists.js');
/* global removePlaylistByName:readable, getPlaylistIndexArray:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global _t:readable, capitalize:readable, capitalizeAll:readable, _bt:readable, _p:readable */
include('..\\..\\helpers\\helpers_xxx_tags.js');
/* global queryCombinations:readable, queryJoin:readable, checkQuery:readable, getHandleListTags:readable */
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
	const tag = worldMap.properties.mapTag[1].indexOf('$') !== -1 ? '"' + worldMap.properties.mapTag[1] + '"' : worldMap.properties.mapTag[1];
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
	const currentModifier = modifiers.find((mod) => { return mod.mask === mask; });
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
	// Create autoplaylist
	if (checkQuery(query)) {
		console.log('World Map: playlist created ' + (query.length > 300 ? query.slice(0, 300) + '...' : query));
		const name = capitalize(dataId) + ' from ' + point.id + (currentModifier ? ' (+' + capitalizeAll(currentModifier.val.split(',').filter(Boolean).join('/'), '/') + ')' : '');
		const duplicPl = getPlaylistIndexArray(name);
		if (duplicPl.length === 1) {
			plman.ActivePlaylist = duplicPl[0];
		} else {
			if (duplicPl.length > 1) { removePlaylistByName(name); }
			plman.CreateAutoPlaylist(plman.PlaylistCount, name, query);
			plman.ActivePlaylist = plman.PlaylistCount - 1;
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
		let locale = [];
		// Menu to select country from list
		const menu = new _menu();
		menu.newEntry({ entryText: 'Countries near clicked point:', func: null, flags: MF_GRAYED });
		menu.newEntry({ entryText: 'sep' });
		foundPoints.forEach((point) => {
			let country = formatCountry(point.key);
			menu.newEntry({
				entryText: country, func: () => {
					locale = [country];
				}
			});
		});
		menu.btn_up(x, y);
		if (!locale.length) { return; }
		const sel = (worldMap.properties.selection[1] === selMode[1] ? (fb.IsPlaying ? new FbMetadbHandleList(fb.GetNowPlaying()) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist)) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist));
		if (sel && sel.Count) {
			const jsonIdDone = new Set();
			sel.Convert().forEach((handle) => {
				const jsonId = fb.TitleFormat(_bt(worldMap.jsonId)).EvalWithMetadb(handle); // worldMap.jsonId = artist
				if (jsonId && jsonId.length) {
					// Set tag on map for drawing
					worldMap.setTag(locale[locale.length - 1], jsonId);
					window.Repaint();
					// Update tags or json if needed (even if the handle was not within the selection)
					if (worldMap.properties.iWriteTags[1] > 0) {
						const tfo = _bt(tagName);
						if (!fb.TitleFormat(tfo).EvalWithMetadb(handle).length || bForce) { // Check if tag already exists
							if (worldMap.properties.iWriteTags[1] === 1) {
								new FbMetadbHandleList(handle).UpdateFileInfoFromJSON(JSON.stringify([{ [tagName]: locale }])); // Uses tagName var as key here
							} else if (worldMap.properties.iWriteTags[1] === 2) {
								if (!jsonIdDone.has(jsonId)) {
									jsonIdDone.add(jsonId);
									const newData = { [worldMap.jsonId]: jsonId, val: locale };
									if (!worldMap.hasDataById(jsonId)) { worldMap.saveData(newData); } // use path at properties
									else if (bForce) { // Force rewrite
										worldMap.deleteDataById(jsonId);
										worldMap.saveData(newData);
									}
								}
							}
						}
					}
				}
			});
		}
	}
	return bDone;
}

// When mouse is over point
function tooltip(point) {
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

// When mouse is over point
function tooltipFindPoint(foundPoints) {
	const sel = (worldMap.properties.selection[1] === selMode[1] ? (fb.IsPlaying ? new FbMetadbHandleList(fb.GetNowPlaying()) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist)) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist));
	if (!sel || !sel.Count) { return; }
	let text = foundPoints.map((point) => { return formatCountry(point.key) + ' ' + _p(point.prox + '%'); }).join(', ');
	text += '\n(L. Click to add locale tag to current track(s))';
	return text;
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
					if (libraryTags[idx].jsonId.indexOf(jsonId) === -1) { libraryTags[idx].jsonId.push(jsonId); }
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
		_save(dataPath, JSON.stringify(libraryTags, null, '\t'));
	}
}