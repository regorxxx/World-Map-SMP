'use strict';
//09/06/22

/* 
	Map v 0.2 04/02/22
	Helper to create arbitrary map objects. Defaults to world map if no properties or argument is given.
	imageMap.findCoordinates must be specified using 'findCoordinatesFunc' if creating the map with any argument.
	TODO:
		- Create arbitrary map images using a graph or tag cloud? 
		- Allow multiple tags to paint multiple points
			- Merge near enough locations into 'zones', to draw the points for multiple artists.
 */

include('helpers_xxx.js');
include('helpers_xxx_file.js');
include('helpers_xxx_prototypes.js');
include('helpers_xxx_UI.js');

// Map object
function imageMap({
	imagePath = '', mapTag = '', properties = {}, 
	findCoordinatesFunc = null, selPointFunc = null, findPointFunc = null, selFindPointFunc = null, tooltipFunc = null, tooltipFindPointFunc = null,
	jsonPath = '', jsonId = '', 
	bStaticCoord = true,
	pointShape = 'circle', // string, circle
	pointSize = 10,
	pointLineSize = 25
	} = {}) {
	// Constants
	const bShowSize = false;
	// Global tooltip
	this.tooltip = new _tt(null);
	
	// Paint
	this.paintBg = (gr) => {
		if (this.customPanelColorMode !== 1 && this.panelColor) {gr.FillSolidRect(0, 0, window.Width, window.Height, this.panelColor);}
		if (this.imageMapPath === 'background') {
			gr.FillSolidRect(this.posX, this.posY, this.imageMap.Width * this.scale, this.imageMap.Height * this.scale, this.backgroundColor);
			// fillWithPattern(gr, this.posX, this.posY, this.posX + this.imageMap.Width * this.scale, this.posY + this.imageMap.Height * this.scale, this.defaultColor, 2, this.imageMap.Width / 5, 'verticalDotted');
		} else {
			gr.DrawImage(this.imageMap, this.posX, this.posY, this.imageMap.Width * this.scale, this.imageMap.Height * this.scale, 0, 0, this.imageMap.Width, this.imageMap.Height);
		}
	}
	this.paint = ({gr, sel, selMulti, color = this.defaultColor, selectionColor = this.selectionColor, bOverridePaintSel = false}) => { // on_paint
		this.paintBg(gr);
		var toPaintArr = [];
		// When moving mouse, retrieve last points
		if (this.idSelected.length) {
			this.lastPoint.forEach( (point) => {
				toPaintArr.push({...point});
			});
		// Otherwise, use selection
		} else if (selMulti) { // multiple points per handle id and tag value are the same... just enumerate them: handle -> [...id] -> [...id]
			// Handle list
			if (selMulti.Count >= 0) {
				if (selMulti.Count === 0) {return;}
				let added = new Set();
				const currentMatch = getTagsValuesV3(selMulti, [this.jsonId], true);
				currentMatch.forEach( (tagArr, idx) => {
					tagArr.forEach( (tag) => {
						const id = tag;
						if (id.length) {
							if (added.has(id)) {
								const idx = toPaintArr.findIndex((point) => {return (point.id === id);});
								toPaintArr[idx].val++;
							} else {
								added.add(id);
								toPaintArr.push({id, val: 1, jsonId: id});
							}
						}
					});
				});
			// Handle
			} else {
				const currentMatch = selMulti ? fb.TitleFormat(_bt(this.jsonId)).EvalWithMetadb(selMulti) : '';
				const id = this.idSelected.length ? this.lastPoint[0] : (selMulti ? this.findTag(selMulti, currentMatch) : '');
				if (id.length) {toPaintArr.push({id, val: 1, jsonId: new Set([currentMatch])});}
			}
		} else if (sel) { // 1 point per handle, id and tag value are different: handle -> id -> tag Value
			// Handle list
			if (sel.Count >= 0) {
				if (sel.Count === 0) {return;}
				else if (sel.Count === 1) {
					const currentMatch =  sel[0] ? fb.TitleFormat(_bt(this.jsonId)).EvalWithMetadb(sel[0]) : '';
					const id = sel[0] ? this.findTag(sel[0], currentMatch) : '';
					if (id.length) {toPaintArr.push({id, val: 1, jsonId: new Set([currentMatch])});}
				} else {
					sel.Convert().forEach( (handle, index) => {
						const currentMatch = handle ? fb.TitleFormat(_bt(this.jsonId)).EvalWithMetadb(handle) : '';
						const id = handle ? this.findTag(handle, currentMatch) : '';
						if (id.length) {
							const idx = toPaintArr.findIndex((point) => {return (point.id === id);});
							if (idx === -1) {
								toPaintArr.push({id, val: 1, jsonId: new Set([currentMatch])});
							}
							else {
								toPaintArr[idx].val++;
								toPaintArr[idx].jsonId.add(currentMatch);
							}
						}
					}); 
				}
			// Handle
			} else {
				const currentMatch = sel ? fb.TitleFormat(_bt(this.jsonId)).EvalWithMetadb(sel) : '';
				const id = this.idSelected.length ? this.lastPoint[0] : (sel ? this.findTag(sel, currentMatch) : '');
				if (id.length) {toPaintArr.push({id, val: 1, jsonId: new Set([currentMatch])});}
			}
		}
		// Clear the lists
		this.clearLastPoint();
		this.clearTagValue();
		// Paint
		toPaintArr.forEach( (toPaint) => {
			const id = toPaint.id;
			if (id.length) {
				// Is a new point? Calculate it
				if (!this.bStaticCoord || !this.point.hasOwnProperty(id)) {
					let [xPos , yPos] = this.findCoordinates(id, this.imageMap.Width, this.imageMap.Height, this.factorX, this.factorY);
					if (xPos !== -1 && yPos !== -1) {
						// Cache all points (position doesn't change), scaling is recalculated later if needed
						this.point[id] = {x: xPos, y: yPos, xScaled: xPos * this.scale + this.posX, yScaled: yPos * this.scale + this.posY, id}; 
					}
				}
				// Draw points
				const point = this.point[id];
				if (point) {
					if (!bOverridePaintSel) {
						switch (this.pointShape) {
							case 'string' : {
								const textW = gr.CalcTextWidth(toPaint.id, this.gFont);
								const textH = gr.CalcTextHeight(toPaint.id, this.gFont);
								const offsetX = 7 * this.scale;
								const offsetY = 7 * this.scale;
								gr.FillGradRect(point.xScaled - offsetX, point.yScaled + offsetY, textW + offsetX * 2, textH, 90, this.backgroundTagColor1, this.backgroundTagColor2);
								gr.DrawRoundRect(point.xScaled - offsetX, point.yScaled + offsetY, textW + offsetX * 2, textH, 2 * this.scale, 2 * this.scale, 2, 0xAAA9A9A9);
								gr.GdiDrawText(toPaint.id, this.gFont, this.idSelected === id ? selectionColor : color, point.xScaled, point.yScaled + offsetY, textW, textH, DT_NOPREFIX);
								break;
							}
							case 'circle':
							default : {
								gr.DrawEllipse(point.xScaled, point.yScaled, this.pointSize * this.scale, this.pointSize * this.scale, this.pointLineSize * this.scale, (this.idSelected === id ? selectionColor : color));
								if (bShowSize && toPaint.val > 1) { // Show count on map?
									gr.GdiDrawText(toPaint.val, this.gFont, this.textColor, point.xScaled - this.pointSize * this.scale, point.yScaled + this.pointLineSize * this.scale / 2, 40, 40);
								}
								break;
							}
						}
					}
					this.lastPoint.push({...toPaint}); // Add to list
				}
			}
		});
		return toPaintArr;
	}
	// Tags and coordinates
	this.calcScale = (ww = window.Width, wh = window.Height) => { // on_size
		this.scaleW = ww / this.imageMap.Width;
		this.scaleH = wh / this.imageMap.Height;
		if (this.pointShape === 'string') { // maintains proportions
			const maxSize = Math.min(window.Width, window.Height);
			const maxWidth = Math.floor(maxSize * 1.25);
			this.imageMap = {Width: maxWidth, Height: maxSize};
			this.scale = 1;
		} else { // Scale window
			this.scale = Math.min(this.scaleW, this.scaleH);
		}
		this.posX = 0, this.posY = 0;
		if (this.scaleW < this.scaleH) {
			this.posY = (wh - this.imageMap.Height * this.scale) / 2;
		}
		else if (this.scaleW > this.scaleH) {
			this.posX = (ww - this.imageMap.Width * this.scale) / 2;
		}
		// Scale font
		if (this.scale !== 0 && this.scale !== 1) {
			this.gFont = _gdiFont('Segoe UI', Math.ceil(this.fontSize * ww / 300)); // TODO
		} // When = 0, crashes
		// Scale points
		Object.keys(this.point).forEach( (id) => {
			const point = this.point[id];
			point.xScaled = point.x * this.scale + this.posX;
			point.yScaled = point.y * this.scale + this.posY;
		});
	}
	this.findTag = (sel, byKey = '') => {
		var mapTagValue = '';
		if (sel) {
			// Get from tags
			const tfo = (this.mapTag.indexOf('$') === -1) ? _bt(this.mapTag) : _b(this.mapTag); // It's a function?
			mapTagValue = fb.TitleFormat(tfo).EvalWithMetadb(sel);
			// Or Json
			if (!mapTagValue.length && this.jsonData.length && this.jsonId.length) {
				const id =  fb.TitleFormat(_bt(this.jsonId)).EvalWithMetadb(sel);
				const data = this.getDataById(id);
				if (data && data.val && data.val.length) {
					mapTagValue = data.val[data.val.length - 1];
				}
			}
			// Or external
			if (byKey.length && this.tagValue.hasOwnProperty(byKey)) {
				// Set by other script or forced by other panel
				if (!mapTagValue.length || this.mapTag === 'External Script') {mapTagValue = this.tagValue[byKey];}
			}
		}
		return mapTagValue;
	}
	this.setTag = (tagValue, byKey) => {if (byKey.length && typeof tagValue !== 'undefined') {this.tagValue[byKey] = tagValue;}};
	this.findCoordinates = (value, mapWidth, mapHeight, factorX, factorY) => {fb.ShowPopupMessage('map_xxx.js: imageMap.findCoordinates() has not been set', window.Name); return [-1, -1];}; // Must be overwritten
	this.findPointFunc = (x, y, mapWidth, mapHeight, factorX, factorY) => {return [];}; // [{key, simil}] Could be overwritten
	// Selection
	this.selPoint = (point, mask, x, y) => {return null;}; // Could be overwritten, arbitrary return
	this.selFindPoint = (foundPoints, mask, x, y) => {return null;}; // Could be overwritten, arbitrary return
	this.getLastPoint = () => {return this.lastPoint;}; 
	// Move and click
	this.trace = (x, y) => {
		return x > this.posX && x < this.posX + this.imageMap.Width * this.scale && y > this.posY && y < this.posY + this.imageMap.Height * this.scale;
	}
	this.tracePoint = (x, y) => {
		let foundId = '';
		switch (this.pointShape) {
			case 'string': {
				this.lastPoint.forEach( (last) => {
					if (foundId.length) {return;}
					const point = this.point[last.id];
					if (!point || point.xScaled === -1 || point.yScaled === -1) {return;}
					const xMax = point.xScaled + _gr.CalcTextWidth(point.id, this.gFont), xMin = point.xScaled;
					const yMax = point.yScaled + _gr.CalcTextHeight(point.id, this.gFont), yMin = point.yScaled;
					if (x >= xMin && x <= xMax && y >= yMin && y <= yMax) {foundId = last.id;}  // On circle?
				});
				break;
			}
			case 'circle':
			default : {
				this.lastPoint.forEach( (last) => {
					if (foundId.length) {return;}
					const point = this.point[last.id];
					if (!point || point.xScaled === -1 || point.yScaled === -1) {return;}
					const o = Math.abs(y - point.yScaled), h = (o**2 + (x - point.xScaled)**2)**(1/2), tetha = Math.asin(o/h);
					const rx = this.pointSize * this.scale * Math.cos(tetha), ry = this.pointSize * this.scale * Math.sin(tetha);
					const xMax = point.xScaled + rx + this.pointLineSize * this.scale, xMin = point.xScaled - rx - this.pointLineSize * this.scale;
					const yMax = point.yScaled + rx + this.pointLineSize * this.scale, yMin = point.yScaled - ry - this.pointLineSize * this.scale;
					if (x >= xMin && x <= xMax && y >= yMin && y <= yMax) {foundId = last.id;}  // On circle?
				});
				break;
			}
		}
		return foundId;
	}
	this.move = (x, y, mask) => { // on_mouse_move & on_mouse_leave
		if (this.mX === x && this.mY === y) {return;}
		this.mX = x;
		this.mY = y;
		window.SetCursor(IDC_ARROW);
		if (this.trace(x, y)) { // Over the map
			const foundId = this.tracePoint(x,y);
			if (foundId && foundId.length) { // Over a point
				this.idSelected = foundId;
				window.Repaint();
				const ttText = this.tooltipText(this.point[foundId]);
				if (ttText && ttText.length) {
					this.tooltip.SetValue(ttText, true);
				}
			} else {  // No point
				if (this.idSelected.length) {
					this.idSelected = 'none';
					window.Repaint();
					this.tooltip.SetValue(null);
				}
				if (!this.lastPoint.length || mask === MK_SHIFT) {  // Add tag selecting directly from map (can be forced with shift)
					const found = this.findPointFunc(x - this.posX, y - this.posY, this.imageMap.Width * this.scale, this.imageMap.Height * this.scale, this.factorX, this.factorY);
					if (found && found.length) {
						this.foundPoints  = found;
						const ttText = this.tooltipFindPointText(found);
						if (ttText && ttText.length) {
							this.tooltip.SetValue(ttText, true);
						}
					} else {this.tooltip.SetValue(null); this.foundPoints = [];}
				}
			}
		} 
		else if (this.idSelected.length && this.idSelected !== 'none') {this.idSelected = 'none'; window.Repaint(); this.tooltip.SetValue(null);}
		else {this.clearIdSelected(); this.tooltip.SetValue(null);}
	}
	this.btn_up = (x, y, mask) => { // on_mouse_lbtn_up
		this.mX = x;
		this.mY = y;
		const foundPoint = this.point[this.tracePoint(x,y)];
		if (foundPoint) { // Over a point
			return this.selPoint(foundPoint, mask, x, y);
		} else if (this.trace(x, y) && (!this.lastPoint.length || mask === MK_SHIFT)) {  // Add tag selecting directly from map (can be forced with shift)
			const found = this.findPointFunc(x - this.posX, y - this.posY, this.imageMap.Width * this.scale, this.imageMap.Height * this.scale, this.factorX, this.factorY);
			if (found && found.length) {
				return this.selFindPoint(found, mask, x, y, mask === MK_SHIFT);
			}
		}
	}
	this.tooltipText = (point) => {return '';}; // Could be overwritten, return a string
	this.tooltipFindPointText = (foundPoints) => {return '';}; // Could be overwritten, return a string
	// Clear
	this.clearPointCache = () => {this.point = {};};
	this.clearLastPoint = () => {this.lastPoint = [];};
	this.clearIdSelected = () => {this.idSelected = '';};
	this.clearTagValue = () => {this.tagValue = {};};
	// Reload data saved as json
	this.loadData = (path = this.jsonPath) => {
		if (_isFile(path)) {
			this.jsonData = [];
			const data = _jsonParseFileCheck(path, 'Tags json', window.Name, convertCharsetToCodepage('UTF-8'));
			if (!data) {return;}
			data.forEach((item) => {this.jsonData.push(item);});
		}
	}
	this.saveData = (data, path = this.jsonPath) => { // Does not check for duplication!
		if (isArray(data)) {
			data.forEach( (val) => {this.jsonData.push(val);});
		} else {
			this.jsonData.push(data);
		}
		this.save(path);
	}
	this.save = (path = this.jsonPath) => {
		_save(path, JSON.stringify(this.jsonData, null, '\t'));
	}
	this.hasData = (data, byKey = this.jsonId) => { // Duplicates by key
		return (this.jsonData.length ? this.jsonData.some((obj) => {return (obj[byKey] === data[byKey]);}) : false);
	}
	this.hasDataById = (id, byKey = this.jsonId) => { // Duplicates by key
		return (this.jsonData.length ? this.jsonData.some((obj) => {return (obj[byKey] === id);}) : false);
	}
	this.getData = () => {
		return (this.jsonData.length ? [...this.jsonData] : []);
	}
	this.getDataById = (id) => {
		return 	id.length ? this.jsonData.find((obj) => {return (obj[this.jsonId] === id);}) : null;
	}
	this.deleteDataById = (id, byKey = this.jsonId) => { // Delete by key
		const idx = this.jsonData.findIndex((obj) => {return (obj[byKey] === id);});
		if (idx !== -1) {
			this.jsonData.splice(idx, 1);
			this.save();
			return true;
		}
		return false;
	}
	this.getDataKeys = (byKey = this.jsonId) => {
		let keysArr = [];
		if (this.jsonData.length) {
			this.jsonData.forEach( (data) => {keysArr.push(data[byKey]);});
		}
		return keysArr;
	}
	
	this.coloursChanged = () => {
		this.panelColor = this.customPanelColorMode === 2 ? this.properties.customPanelColor[1] : (window.InstanceType ? window.GetColourDUI(1): window.GetColourCUI(3));
	}
	// Init
	this.init = () => {
		let bfuncSet = false;
		// When no properties are given and no args, then use a world map as default
		if (!Object.keys(this.properties).length && !imagePath.length && !findCoordinatesFunc && !mapTag.length ) {
			include(folders.xxx + 'helpers\\world_map_tables.js');
			this.imageMapPath = folders.xxx + 'images\\MC_WorldMap_B.jpg'; // Default is world map
			this.mapTag = '$meta(locale last.fm,$sub($meta_num(locale last.fm),1))'; // Default is country tag from last.fm tags (WilB's Biography script)
			this.findCoordinates = findCountryCoords; // Default is country coordinates
			bfuncSet = true;
		} else {
			// Or use arguments
			if (typeof findCoordinatesFunc !== 'undefined' && findCoordinatesFunc) {
				this.findCoordinates = findCoordinatesFunc;
				bfuncSet = true;
			}
			if (typeof findPointFunc !== 'undefined' && findPointFunc) { // Not always required
				this.findPointFunc = findPointFunc;
			}
			if (typeof selPointFunc !== 'undefined' && selPointFunc) { // Not always required
				this.selPoint = selPointFunc;
			}
			if (typeof selFindPointFunc !== 'undefined' && selFindPointFunc) { // Not always required
				this.selFindPoint = selFindPointFunc;
			}
			if (typeof tooltipFunc !== 'undefined' && tooltipFunc) { // Not always required
				this.tooltipText = tooltipFunc;
			}
			if (typeof tooltipFindPointFunc !== 'undefined' && tooltipFindPointFunc) { // Not always required
				this.tooltipFindPointText = tooltipFindPointFunc;
			}
			if (imagePath.length) {
				this.imageMapPath = imagePath;
			}
			if (mapTag.length) {
				this.mapTag = mapTag;
			}
			if (jsonPath.length) {
				this.jsonPath = jsonPath;
			}			
			if (jsonId.length) {
				this.jsonId = jsonId;
			}
			// Or overwrite args if properties are not empty
			if (Object.keys(this.properties).length) {
				if (this.properties.hasOwnProperty('imageMapPath') && this.properties['imageMapPath'][1].length) {
					this.imageMapPath = this.properties['imageMapPath'][1];
				}
				if (this.properties.hasOwnProperty('mapTag') && this.properties['mapTag'][1].length) {
					this.mapTag = this.properties['mapTag'][1];
				}
				if (this.properties.hasOwnProperty('fileName') && this.properties['fileName'][1].length) {
					this.jsonPath = this.properties['fileName'][1];
				}
				if (this.properties.hasOwnProperty('factorX') && this.properties['factorX'][1] !== 100) {
					this.factorX = this.properties['factorX'][1];
				}
				if (this.properties.hasOwnProperty('factorY') && this.properties['factorY'][1] !== 100) {
					this.factorY = this.properties['factorY'][1];
				}
			}
		}
		// Sanity checks
		if (typeof this.findCoordinates === 'undefined' || !this.findCoordinates || !bfuncSet || JSON.stringify(this.findCoordinates()) !== JSON.stringify([-1,-1])) {
			// function must exist, had been set and return [-1,-1] for arbitrary or null input to be considered valid
			fb.ShowPopupMessage('map_xxx.js: imageMap was created without \'findCoordinatesFunc\' set. Map will not be updated on playback!', window.Name);
		}
		if (!this.mapTag.length) {
			fb.ShowPopupMessage('map_xxx.js: imageMap was created without \'mapTag\' set. Map will not be updated on playback!', window.Name);
		}
		if (!this.imageMapPath.length) {
			fb.ShowPopupMessage('map_xxx.js: imageMap was created without \'imageMapPath\' set. Map will not be displayed!', window.Name);
			this.trace = (x, y) => {};
			this.calcScale = () => {};
			this.paint = () => {};
			this.paintBg = () => {};
		} else { // Avoids crash
			const maxSize = Math.min(window.Width, window.Height);
			const maxWidth = Math.floor(maxSize * 1.25);
			if (this.imageMapPath === 'background') {
				this.imageMap = {Width: maxWidth, Height: maxSize};
			} else if (!_isFile(this.imageMapPath)) {
				fb.ShowPopupMessage('map_xxx.js: map was created without an image. \'imageMapPath\' file does not exists:\n' + this.imageMapPath, window.Name);
				this.imageMapPath = 'background';
				this.imageMap = {Width: maxWidth, Height: maxSize};
			} else {
				try {
					this.imageMap = gdi.Image(this.imageMapPath);
				} catch (e) {
					fb.ShowPopupMessage('map_xxx.js: map was created without an image. \'imageMapPath\' does not point to a valid file:\n' + this.imageMapPath, window.Name);
					this.imageMapPath = 'background';
					this.imageMap = {Width: maxWidth, Height: maxSize};
				}
			}
			this.calcScale(window.Width, window.Height);
		}
		const jsonFolder = utils.SplitFilePath(this.jsonPath)[0];
		_createFolder(jsonFolder);
		this.loadData();
		this.clearPointCache();
		this.coloursChanged();
	}
	
	this.properties = properties; // Load once! [0] = descriptions, [1] = values set by user (not defaults!)
	this.tagValue = {};
	this.mapTag = '';
	this.imageMap = null;
	this.imageMapPath = '';
	this.jsonData = [];
	this.jsonId = ''; // UUID key for the data
	this.jsonPath = '';
	this.scaleW = 0;
	this.scaleH = 0;
	this.scale = 0;
	this.posX = 0;
	this.posY = 0;
	this.factorX = 100;
	this.factorY = 100;
	this.point = {}; // {id: {x: -1, y: -1, id: id}};
	this.lastPoint = []; // [{id: id, val: 1, jsonId: jsonId}]
	this.foundPoints = []; // [{id: id, val: 1, jsonId: jsonId}]
	this.fontSize = typeof this.properties.fontSize !== 'undefined' ? this.properties.fontSize[1] : 10;
	this.gFont = _gdiFont('Segoe UI', _scale(this.fontSize));
	this.defaultColor = 0xFF00FFFF;
	this.selectionColor = 0xFFFAEBD7;
	this.backgroundColor = 0xFFF0F8FF;
	this.backgroundTagColor1 = 0xFFF5F5F5;
	this.backgroundTagColor2 = 0xFFA9A9A9;
	this.textColor = 0xFF000000;
	this.customPanelColorMode = typeof this.properties.customPanelColorMode !== 'undefined' ? this.properties.customPanelColorMode[1] : 1;
	this.panelColor = null;
	this.idSelected = '';
	this.mX = -1;
	this.mY = -1;
	this.bStaticCoord = bStaticCoord;
	this.pointShape = pointShape;
	this.pointSize = pointSize;
	this.pointLineSize = pointLineSize;
	this.init();
}