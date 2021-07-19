'use strict';

include('helpers_xxx.js');
include('helpers_xxx_playlists.js');
include('helpers_xxx_prototypes.js');
include('menu_xxx.js');

/* 
	Map helpers
*/

// When clicking on a point
function selPoint(point, mask) {
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
	// Add query with keyboard modifiers
	const currentModifier = modifiers.find( (mod) => {return mod.mask === mask;});
	if (currentModifier) { // When using ctrl + click, Shift, ...
		const sel = (worldMap.properties.selection[1] === selMode[1] ? (fb.IsPlaying ? new FbMetadbHandleList(fb.GetNowPlaying()) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist)) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist));
		if (sel && sel.Count) { 
			if (selPointData.jsonId.size) { // Data is a set, so no duplicates
				let selPoint = new FbMetadbHandleList();
				const selJsonId = getTagsValuesV3(sel, [dataId], true).filter(Boolean);
				selJsonId.forEach( (jsonId, index) => {
					if (selPointData.jsonId.intersectionSize(new Set(jsonId))) {selPoint.Add(sel[index]);}
				});
				if (selPoint.Count) {
					const modifierTags = worldMap.properties[currentModifier.tag][1].split(',').filter(Boolean);
					let modifierQuery = [];
					modifierTags.forEach( (modTag) => {
						const tagFilter = worldMap.properties.tagFilter[1].length ? new Set(worldMap.properties.tagFilter[1].split(',').concat('')) : null;
						const tagValues = getTagsValuesV3(selPoint, [modTag], true).filter(Boolean);
						let valSet = new Set(); // Don't add the same thing multiple times to the query, just for readability
						if (tagValues.length) {
							for (let i = 0; i < selPoint.Count; i++) {
								const tag_i = tagValues[i].filter((tag) => {return !tagFilter.has(tag);});
								const tagId_i = tag_i.join(',');
								if (tag_i.length && !valSet.has(tagId_i)) {
									modifierQuery.push(query_combinations(tag_i, [modTag], "AND"));
									valSet.add(tagId_i);
								}
							}
						}
					});
					if (modifierQuery.length > 1) {modifierQuery = query_join(modifierQuery,'AND');}
					if (modifierQuery.length) {query.push(modifierQuery);}
				}
			}
		}
	}
	// Add forced query
	const forcedQuery = worldMap.properties.forcedQuery[1];
	if (forcedQuery.length) {query.push(forcedQuery);}
	// Merge all with AND
	query = query_join(query,'AND');
	// Create autoplaylist
	if (checkQuery(query)) {
		console.log('World Map: playlist created '+ query);
		const name = capitalize(dataId) + ' from '+ point.id + (currentModifier ? ' (+' + capitalizeAll(currentModifier.val.split(',').filter(Boolean).join('/'),'/') + ')' : '');
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

// When clicking on a the map with tracks without tags
function selFindPoint(foundPoints, mask, x, y, bForce = false) {
	let bDone = false;
	// The entire function is tag agnostic, it may be used for anything. 
	// When jsonId is set as 'artist' so it looks for artists with same map value
	// The ctrl modifier is set to force 'genre' and 'style' tags but can be used with anything
	if (!foundPoints.length) {return bDone;}
	if (!worldMap.jsonId.length) {return bDone;}
	// Any track with same locale tag
	const tagName = worldMap.properties.writeToTag[1];
	if (tagName.length) {
		let locale = [];
		// Menu to select country from list
		const menu = new _menu();
		menu.newEntry({entryText: 'Countries near clicked point:', func: null, flags: MF_GRAYED});
		menu.newEntry({entryText: 'sep'});
		foundPoints.forEach((point) => {
			let country = formatCountry(point.key);
			menu.newEntry({entryText: country, func: () => {
				locale = [country];
			}});
		});
		menu.btn_up(x, y);
		if (!locale.length) {return;}
		const sel = (worldMap.properties.selection[1] === selMode[1] ? (fb.IsPlaying ? new FbMetadbHandleList(fb.GetNowPlaying()) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist)) : plman.GetPlaylistSelectedItems(plman.ActivePlaylist));
		if (sel && sel.Count) {
			const jsonIdDone = new Set();
			sel.Convert().forEach( (handle) => {
				const jsonId =  fb.TitleFormat('[%' + worldMap.jsonId + '%]').EvalWithMetadb(handle); // worldMap.jsonId = artist
				if (jsonId && jsonId.length) {
					// Set tag on map for drawing
					worldMap.setTag(locale[locale.length - 1], jsonId);
					window.Repaint();
					// Update tags or json if needed (even if the handle was not within the selection)
					if (worldMap.properties.iWriteTags[1] > 0){
						const tfo = '[%' + tagName + '%]';
						if (!fb.TitleFormat(tfo).EvalWithMetadb(handle).length || bForce) { // Check if tag already exists
							if (worldMap.properties.iWriteTags[1] === 1) {
								new FbMetadbHandleList(handle).UpdateFileInfoFromJSON(JSON.stringify([{[tagName]: locale}])); // Uses tagName var as key here
							} else if (worldMap.properties.iWriteTags[1] === 2) {
								if (!jsonIdDone.has(jsonId)) {
									jsonIdDone.add(jsonId);
									const newData = {[worldMap.jsonId]: jsonId, val: locale};
									if (!worldMap.hasDataById(jsonId)) {worldMap.saveData(newData);} // use path at properties
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
	const count = worldMap.lastPoint.find( (last) => {return last.id === point.id;}).val;
	let text = 'From: ' + point.id + ' (' + count + ')' + '\n(L. Click to create Autoplaylist from same zone)\n';
	modifiers.forEach( (mod) => {
		const tags = capitalizeAll(mod.val.split(',').filter(Boolean).join('/'),'/');
		text += '(' + mod.description + ' + L. Click forces same ' + tags + ' too)\n';
	});
	text += '(Shift + L. Click on map rewrites locale tag)\n';
	return (point && point.hasOwnProperty('id') ? text : null);
}

// When mouse is over point
function tooltipFindPoint(foundPoints) { 
	let text = foundPoints.map((_) => {return  formatCountry(_.key) + '(' + _.prox + '%)';}).join(', ');
	text += '\n(L. Click to add locale tag to current track(s))'
	return text;
}

// Property check
function biographyCheck(prop) {
	if (worldMap.properties['bEnabledBiography'][1] && !worldMap.properties['bInstalledBiography'][1]) {return false;}
	else {return true;}
}	

function formatCountry(country) {
return capitalizeAll(country, ' ').replace(' And ', ' and ').replace(' Of ', ' of ');
}