'use strict';

/* 
	Map v 0.1 23/03/21
	Helper to create arbitrary map objects. Defaults to world map if no properties or argument is given.
	imageMap.findCoordinates must be specified using 'findCoordinatesFunc' if creating the map with any argument.
	TODO:
		- Create arbitrary map images using a graph or tag cloud? 
		- Allow multiple tags to paint multiple points
			- Merge near enough locations into "zones", to draw the points for multiple artists.
 */

include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\helpers_xxx.js');

// Map object
function imageMap({
	imagePath = '', mapTag = '', properties = {}, 
	findCoordinatesFunc = null, selPointFunc = null, tooltipFunc = null, 
	jsonPath = '', jsonId = '', 
	bStaticCoord = true,
	pointShape = 'circle' // string, circle
	} = {}) {
	// Constants
	const pointSize = 10;
	const pointLineSize = 25;
	const bShowSize = false;
	// Global tooltip
	this.tooltip = new _tt(null);  
	// Paint
	this.paintBg = (gr) => {
		if (this.imageMapPath === 'background') {
			gr.FillSolidRect(this.posX, this.posY, this.imageMap.Width * this.scale, this.imageMap.Height * this.scale, this.backgroundColor);
		} else {
			gr.DrawImage(this.imageMap, this.posX, this.posY, this.imageMap.Width * this.scale, this.imageMap.Height * this.scale, 0, 0, this.imageMap.Width, this.imageMap.Height);
		}
	}
	this.paint = ({gr, sel, selMulti, color = this.defaultColor, selectionColor = this.selectionColor}) => { // on_paint
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
				const currentMatch = selMulti ? fb.TitleFormat('[%' + this.jsonId + '%]').EvalWithMetadb(selMulti) : '';
				const id = this.idSelected.length ? this.lastPoint[0] : (selMulti ? this.findTag(selMulti, currentMatch) : '');
				if (id.length) {toPaintArr.push({id, val: 1, jsonId: new Set([currentMatch])});}
			}
		} else if (sel) { // 1 point per handle, id and tag value are different: handle -> id -> tag Value
			// Handle list
			if (sel.Count >= 0) {
				if (sel.Count === 0) {return;}
				else if (sel.Count === 1) {
					const currentMatch =  sel[0] ? fb.TitleFormat('[%' + this.jsonId + '%]').EvalWithMetadb(sel[0]) : '';
					const id = sel[0] ? this.findTag(sel[0], currentMatch) : '';
					if (id.length) {toPaintArr.push({id, val: 1, jsonId: new Set([currentMatch])});}
				} else {
					sel.Convert().forEach( (handle, index) => {
						const currentMatch = handle ? fb.TitleFormat('[%' + this.jsonId + '%]').EvalWithMetadb(handle) : '';
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
				const currentMatch = sel ? fb.TitleFormat('[%' + this.jsonId + '%]').EvalWithMetadb(sel) : '';
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
					let [xPos , yPos] = this.findCoordinates(id, this.imageMap.Width, this.imageMap.Height);
					if (xPos !== -1 && yPos !== -1) {
						// Cache all points (position doesn't change), scaling is recalculated later if needed
						this.point[id] = {x: xPos, y: yPos, xScaled: xPos * this.scale + this.posX, yScaled: yPos * this.scale + this.posY, id}; 
					}
				}
				// Draw points
				const point = this.point[id];
				if (point) {
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
							gr.DrawEllipse(point.xScaled, point.yScaled, pointSize * this.scale, pointSize * this.scale, pointLineSize * this.scale, (this.idSelected === id ? selectionColor : color));
							if (bShowSize && toPaint.val > 1) { // Show count on map?
								gr.GdiDrawText(toPaint.val, this.gFont, 0xFF000000, point.xScaled - pointSize * this.scale, point.yScaled + pointLineSize * this.scale / 2, 40, 40);
							}
							break;
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
		if (this.pointShape === 'string') { // maintains proportions
			const maxSize = Math.min(window.Width, window.Height);
			const maxWidth = Math.floor(maxSize * 1.25);
			this.imageMap = {Width: maxWidth, Height: maxSize};
		}
		// Scale window
		this.scaleW = ww / this.imageMap.Width;
		this.scaleH = wh / this.imageMap.Height;
		this.scale = Math.min(this.scaleW, this.scaleH);
		this.posX = 0, this.posY = 0;
		if (this.scaleW < this.scaleH) {
			this.posY = (wh - this.imageMap.Height * this.scale) / 2;
		}
		else if (this.scaleW > this.scaleH) {
			this.posX = (ww - this.imageMap.Width * this.scale) / 2;
		}
		// Scale font
		if (this.scale) {this.gFont = _gdiFont('Segoe UI', Math.floor(12 * this.scale));} // When = 0, crashes
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
			const tfo = (this.mapTag.indexOf('$') === -1) ? '[%' + this.mapTag + '%]' : '[' + this.mapTag + ']'; // It's a function?
			mapTagValue = fb.TitleFormat(tfo).EvalWithMetadb(sel);
			// Or Json
			if (!mapTagValue.length && this.jsonData.length && this.jsonId.length) {
				const id =  fb.TitleFormat('[%' + this.jsonId + '%]').EvalWithMetadb(sel);
				const data = id.length ? this.jsonData.find((obj) => {return (obj[this.jsonId] === id);}) : null;
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
	this.setTag = (tagValue, byKey) => {if (byKey.length && typeof tagValue !== 'undefined') {this.tagValue[byKey] = tagValue;}}
	this.findCoordinates = () => {fb.ShowPopupMessage('map_xxx.js: imageMap.findCoordinates() has not been set', window.Name); return [-1, -1];}; // Must be overwritten
	// Selection
	this.selPoint = (point, mask) => {return null;}; // Could be overwritten, arbitrary return
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
					if (point.xScaled === -1 || point.yScaled === -1) {return;}
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
					if (point.xScaled === -1 || point.yScaled === -1) {return;}
					const o = Math.abs(y - point.yScaled), h = (o**2 + (x - point.xScaled)**2)**(1/2), tetha = Math.asin(o/h);
					const rx = pointSize * this.scale * Math.cos(tetha), ry = pointSize * this.scale * Math.sin(tetha);
					const xMax = point.xScaled + rx + pointLineSize * this.scale, xMin = point.xScaled - rx - pointLineSize * this.scale;
					const yMax = point.yScaled + rx + pointLineSize * this.scale, yMin = point.yScaled - ry - pointLineSize * this.scale;
					if (x >= xMin && x <= xMax && y >= yMin && y <= yMax) {foundId = last.id;}  // On circle?
				});
				break;
			}
		}
		return foundId;
	}
	this.move = (x, y) => { // on_mouse_move & on_mouse_leave
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
			} else {
				if (this.idSelected.length) {
					this.idSelected = 'none';
					window.Repaint();
					this.tooltip.SetValue(null);
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
			return this.selPoint(foundPoint, mask);
		}
	}
	this.tooltipText = (point) => {return '';}; // Could be overwritten, return a string
	// Clear
	this.clearLastPoint = () => {this.lastPoint = [];};
	this.clearIdSelected = () => {this.idSelected = '';};
	this.clearTagValue = () => {this.tagValue = {};};
	// Reload data saved as json
	this.loadData = (path = this.jsonPath) => {
		if (utils.IsFile(path)) {
			this.jsonData = [];
			_jsonParseFile(path).forEach((item) => {this.jsonData.push(item);});
		}
	}
	this.saveData = (data, path = this.jsonPath) => { // Does not check for duplication!
		if (isArray(data)) {
			data.forEach( (val) => {this.jsonData.push(val);});
		} else {
			this.jsonData.push(data);
		}
		_save(path, JSON.stringify(this.jsonData));
	}
	this.hasData = (data, byKey = this.jsonId) => { // Duplicates by key
		return (this.jsonData.length ? this.jsonData.some((obj) => {return (obj[byKey] === data[byKey]);}) : false);
	}
	this.getData = () => {
		return (this.jsonData.length ? [...this.jsonData] : []);
	}
	this.getDataKeys = (byKey = this.jsonId) => {
		let keysArr = [];
		if (this.jsonData.length) {
			this.jsonData.forEach( (data) => {keysArr.push(data[byKey]);});
		}
		return keysArr;
	}
	// Init
	this.init = () => {
		let bfuncSet = false;
		// When no properties are given and no args, then use a world map as default
		if (!Object.keys(this.properties).length && !imagePath.length && !findCoordinatesFunc && !mapTag.length ) {
			include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\world_map_tables.js');
			this.imageMapPath = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\images\\MC_WorldMap.jpg'; // Default is world map
			this.mapTag = '$meta(locale last.fm,$sub($meta_num(locale last.fm),1))'; // Default is country tag from last.fm tags (WilB's Biography script)
			this.findCoordinates = findCountryCoords; // Default is country coordinates
			bfuncSet = true;
		} else {
			// Or use arguments
			if (typeof findCoordinatesFunc !== 'undefined' && findCoordinatesFunc) {
				this.findCoordinates = findCoordinatesFunc;
				bfuncSet = true;
			}
			if (typeof selPointFunc !== 'undefined' && selPointFunc) { // Not always required
				this.selPoint = selPointFunc;
			}
			if (typeof tooltipFunc !== 'undefined' && tooltipFunc) { // Not always required
				this.tooltipText = tooltipFunc;
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
		const jsonFolder = isCompatible('1.4.0') ? utils.SplitFilePath(jsonPath) : utils.FileTest(jsonPath, 'split'); //TODO: Deprecated
		_createFolder(jsonFolder);
		this.loadData();
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
	this.point = {}; // {id: {x: -1, y: -1, id: id}};
	this.lastPoint = []; // [{id: id, val: 1, jsonId: jsonId}]
	this.gFont = _gdiFont('Segoe UI', 12);
	this.defaultColor = 0xFF00FFFF;
	this.selectionColor = 0xFFFAEBD7;
	this.backgroundColor = 0xFFF0F8FF;
	this.backgroundTagColor1 = 0xFFF5F5F5;
	this.backgroundTagColor2 = 0xFFA9A9A9;
	this.idSelected = '';
	this.mX = -1;
	this.mY = -1;
	this.bStaticCoord = bStaticCoord;
	this.pointShape = pointShape;
	this.init();
}