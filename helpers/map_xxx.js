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
function imageMap({imagePath = '', mapTag = '', properties = {}, findCoordinatesFunc = null, selPointFunc = null, tooltipFunc = null, jsonPath = '', jsonId = ''} = {}) {
	// Constants
	const pointSize = 10;
	const pointLineSize = 25;
	const bShowSize = false;
	// Global tooltip
	this.tooltip = new _tt(null);  
	// Paint
	this.paintBg = (gr) => {
		gr.DrawImage(this.imageMap, this.pos_x, this.pos_y, this.imageMap.Width * this.scale, this.imageMap.Height * this.scale, 0, 0, this.imageMap.Width, this.imageMap.Height);
	}
	this.paint = (gr, sel, color = this.defaultColor, selectionColor = this.selectionColor) => { // on_paint
		this.paintBg(gr);
		var toPaintArr = [];
		// When moving mouse, retrieve last points
		if (this.idSelected.length) {
			this.lastPoint.forEach( (point) => {
				toPaintArr.push({...point})
			});
		// Otherwise, use selection
		} else {
			// Handle list
			if (sel && sel.Count >= 0) {
				if (sel.Count == 0) {return;}
				else if (sel.Count == 1) {
					const currentMatch =  sel[0] ? fb.TitleFormat('[%' + this.jsonId + '%]').EvalWithMetadb(sel[0]) : '';
					const id = sel[0] ? this.findTag(sel[0], currentMatch) : '';
					if (id.length) {toPaintArr.push({id, val: 1, jsonId: new Set([currentMatch])});}
				} else {
					sel.Convert().forEach( (handle, index) => {
						const currentMatch = handle ? fb.TitleFormat('[%' + this.jsonId + '%]').EvalWithMetadb(handle) : '';
						const id = handle ? this.findTag(handle, currentMatch) : '';
						if (id.length) {
							const idx = toPaintArr.findIndex((point) => {return point.id === id});
							if (idx == -1) {
								toPaintArr.push({id: id, val: 1, jsonId: new Set([currentMatch])});
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
				const currentMatch =  sel ? fb.TitleFormat('[%' + this.jsonId + '%]').EvalWithMetadb(sel) : '';
				const id = this.idSelected.length ? this.lastPoint[0] : (sel ? this.findTag(sel, currentMatch) : '');
				if (id.length) {toPaintArr.push({id: id, val: 1, jsonId: new Set([currentMatch])});}
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
				if (!this.point.hasOwnProperty(id)) {
					let [xPos , yPos] = this.findCoordinates(id, this.imageMap.Width, this.imageMap.Height);
					if (xPos != -1 && yPos != -1) {
						// Cache all points (position doesn't change), scaling is recalculated later if needed
						this.point[id] = {x: xPos, y: yPos, xScaled: xPos * this.scale + this.pos_x, yScaled: yPos * this.scale + this.pos_y, id}; 
					}
				}
				// Draw points
				const point = this.point[id];
				if (point) {
					gr.DrawEllipse(point.xScaled, point.yScaled, pointSize * this.scale, pointSize * this.scale, pointLineSize * this.scale, (this.idSelected == id ? selectionColor : color));
					if (bShowSize && toPaint.val > 1) { // Show count on map?
						gr.GdiDrawText(toPaint.val, this.gFont, 0xFF000000, point.xScaled - pointSize * this.scale, point.yScaled + pointLineSize * this.scale / 2, 40, 40)
					}
					this.lastPoint.push({...toPaint}) // Add to list
				}
			}
		});
		return toPaintArr;
	}
	// Tags and coordinates
	this.calcScale = (ww = window.Width, wh = window.Height) => { // on_size
		// Scale window
		this.scale_w = ww / this.imageMap.Width;
		this.scale_h = wh / this.imageMap.Height;
		this.scale = Math.min(this.scale_w, this.scale_h);
		this.pos_x = 0, this.pos_y = 0;
		if (this.scale_w < this.scale_h) {
			this.pos_y = (wh - this.imageMap.Height * this.scale) / 2;
		}
		else if (this.scale_w > this.scale_h) {
			this.pos_x = (ww - this.imageMap.Width * this.scale) / 2;
		}
		// Scale font
		if (this.scale) {this.gFont = _gdiFont('Segoe UI', 60 * this.scale);} // When = 0, crashes
		// Scale points
		Object.keys(this.point).forEach( (id) => {
			const point = this.point[id];
			point.xScaled = point.x * this.scale + this.pos_x;
			point.yScaled = point.y * this.scale + this.pos_y;
		});
	}
	this.findTag = (sel, byKey = '') => {
		var mapTagValue = '';
		if (sel) {
			// Get from tags
			const tfo = (this.mapTag.indexOf('$') == -1) ? '[%' + this.mapTag + '%]' : '[' + this.mapTag + ']'; // It's a function?
			mapTagValue = fb.TitleFormat(tfo).EvalWithMetadb(sel);
			// Or Json
			if (!mapTagValue.length && this.jsonData.length && this.jsonId.length) {
				const id =  fb.TitleFormat('[%' + this.jsonId + '%]').EvalWithMetadb(sel);
				const data = id.length ? this.jsonData.find((obj) => {return obj[this.jsonId] == id}) : null;
				if (data && data.val && data.val.length) {
					mapTagValue = data.val[data.val.length - 1];
				}
			}
			// Or external
			if (byKey.length && this.tagValue.hasOwnProperty(byKey)) {
				// Set by other script or forced by other panel
				if (!mapTagValue.length || this.mapTag == 'External Script') {mapTagValue = this.tagValue[byKey];}
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
		return x > this.pos_x && x < this.pos_x + this.imageMap.Width * this.scale && y > this.pos_y && y < this.pos_y + this.imageMap.Height * this.scale;
	}
	this.tracePoint = (x, y) => {
		let foundId = '';
		this.lastPoint.forEach( (last) => {
			if (foundId.length) {return;}
			const point = this.point[last.id];
			if (point.xScaled == -1 || point.yScaled == -1) {return;}
			const o = Math.abs(y - point.yScaled), h = (o**2 + (x - point.xScaled)**2)**(1/2), tetha = Math.asin(o/h)
			const rx = pointSize * this.scale * Math.cos(tetha), ry = pointSize * this.scale * Math.sin(tetha);
			const xMax = point.xScaled + rx + pointLineSize * this.scale, xMin = point.xScaled - rx - pointLineSize * this.scale;
			const yMax = point.yScaled + rx + pointLineSize * this.scale, yMin = point.yScaled - ry - pointLineSize * this.scale;
			if (x >= xMin && x <= xMax && y >= yMin && y <= yMax) {foundId = last.id;}  // On circle?
		});
		return foundId;
	}
	this.move = (x, y) => { // on_mouse_move & on_mouse_leave
		if (this.mx == x && this.my == y) {return;}
		this.mx = x;
		this.my = y;
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
		else if (this.idSelected.length && this.idSelected != 'none') {this.idSelected = 'none'; window.Repaint(); this.tooltip.SetValue(null);}
		else {this.clearIdSelected(); this.tooltip.SetValue(null);}
	}
	this.btn_up = (x, y, mask) => { // on_mouse_lbtn_up
		this.mx = x;
		this.my = y;
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
		return (this.jsonData.length ? this.jsonData.some((obj) => {return obj[byKey] == data[byKey]}) : false);
	}
	this.getData = () => {
		return (this.jsonData.length ? [...this.jsonData] : []);
	}
	this.getDataKeys = (byKey = this.jsonId) => {
		let keysArr = [];
		if (this.jsonData.length) {
			this.jsonData.forEach( (data) => {keysArr.push(data[byKey])});
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
			fb.ShowPopupMessage('map_xxx.js: imageMap was created without \'mapTag\' set. Map will not be updated on playback!', window.Name)
		}
		if (!this.imageMapPath.length) {
			fb.ShowPopupMessage('map_xxx.js: imageMap was created without \'imageMapPath\' set. Map will not be displayed!', window.Name);
			this.calcScale = () => {};
			this.paint = () => {};
			this.paintBg = () => {};
		} else { // Avoids crash
			this.imageMap = gdi.Image(this.imageMapPath);
			// this.calcScale(0, 0);
			this.calcScale(window.Width, window.Height);
		}
		this.loadData();
	}
	
	this.properties = properties; // Load once! [0] = descriptions, [1] = values set by user (not defaults!)
	this.tagValue = {};
	this.mapTag = ''
	this.imageMap = null;
	this.imageMapPath = '';
	this.jsonData = [];
	this.jsonId = ''; // UUID key for the data
	this.jsonPath = '';
	this.scale_w = 0;
	this.scale_h = 0;
	this.scale = 0;
	this.pos_x = 0;
	this.pos_y = 0;
	this.point = {}; // {id: {x: -1, y: -1, id: id}};
	this.lastPoint = []; // [{id: id, val: 1, jsonId: jsonId}]
	this.gFont = _gdiFont('Segoe UI', 12);
	this.defaultColor = 0xFF00FFFF;
	this.selectionColor = 0xFFFAEBD7;
	this.idSelected = '';
	this.mx = -1;
	this.my = -1;
	this.init();
}