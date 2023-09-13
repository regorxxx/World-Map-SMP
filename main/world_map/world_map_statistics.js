'use strict';
//12/09/23

include('..\\statistics\\statistics_xxx.js');
include('..\\..\\helpers\\menu_xxx.js');

function _mapStatistics(x, y, w, h, bEnabled = false, config = {}) {
	const parent = this;
	let rows = 0;
	let columns = 0;
	let nCharts = [];
	let charts = [];
	
	this.attachCallbacks = () => {
		addEventListener('on_paint', (gr) => {
			if (!window.ID || !this.bEnabled) {return;}
			if (!window.Width || !window.Height) {return;}
			charts.forEach((chart) => {chart.paint(gr);});
		});

		addEventListener('on_size', () => {
			if (!window.ID  || !this.bEnabled) {return;}
			if (!window.Width || !window.Height) {return;}
			for (let i = 0; i < rows; i++) {
				for (let j = 0; j < columns; j++) {
					const w = window.Width / columns;
					const h = window.Height / rows * (i + 1);
					const x = w * j;
					const y = window.Height / rows * i;
					nCharts[i][j].changeConfig({x, y, w, h, bPaint: false});
				}
			}
			window.Repaint();
		});

		addEventListener('on_mouse_move', (x, y, mask) => {
			if (!window.ID || !this.bEnabled) {return;}
			const bFound = charts.some((chart) => {return chart.move(x,y);});
		});

		addEventListener('on_mouse_leave', (x, y, mask) => {
			if (!this.bEnabled) {return;}
			charts.forEach((chart) => {chart.leave();});
		});

		addEventListener('on_mouse_rbtn_up', (x, y) => {
			if (!this.bEnabled) {return true;}
			charts.some((chart) => {return chart.rbtn_up(x,y);});
			return true; // left shift + left windows key will bypass this callback and will open default context menu.
		});
	};
	
	// Generic statistics menu which should work on almost any chart...
	this.graphMenu = function graphMenu(bClear = true) {
		// Constants
		this.tooltip.SetValue(null);
		if (!this.menu) {
			this.menu = new _menu({
				onBtnUp: () => {
					const config = this.exportConfig();
					const keys = new Set(['graph', 'dataManipulation', 'grid', 'axis', 'margin', 'colors']);
					Object.keys(config).forEach((key) => {
						if (!keys.has(key)) {delete config[key];}
					});
					config.data = {source: parent.source, arg: parent.arg, bAsync: parent.bAsync};
					worldMap.properties['statsConfig'][1] = JSON.stringify(config);
					overwriteProperties(worldMap.properties);
				}
			});
		}
		const menu = this.menu;
		if (bClear) {menu.clear(true);} // Reset on every call
		// helper
		const createMenuOption = (key, subKey, menuName = menu.getMainMenuName(), bCheck = true, addFunc = null) => {
			return function (option) {
				if (option.entryText === 'sep' && menu.getEntries().pop().entryText !== 'sep') {menu.newEntry({menuName, entryText: 'sep'}); return;} // Add sep only if any entry has been added
				if (option.isEq && option.key === option.value || !option.isEq && option.key !== option.value || option.isEq === null) {
					menu.newEntry({menuName, entryText: option.entryText, func: () => {
						if (addFunc) {addFunc(option);}
						if (subKey) {
							if (Array.isArray(subKey)) {
								const len = subKey.length - 1;
								const obj = {[key]: {}};
								let prev = obj[key];
								subKey.forEach((curr, i) => {
									prev[curr] = i === len ? option.newValue : {};
									prev = prev[curr];
								});
								this.changeConfig(obj);
							} else {
								this.changeConfig({[key]: {[subKey]: option.newValue}});
							}
						}
						else {this.changeConfig({[key]: option.newValue});}
					}});
					if (bCheck) {
						menu.newCheckMenu(menuName, option.entryText, void(0), () => {
							const val = subKey 
								? Array.isArray(subKey)
									? subKey.reduce((acc, curr) => acc[curr], this[key])
									: this[key][subKey] 
								: this[key];
							if (option.newValue && typeof option.newValue === 'function') {return !!(val && val.name === option.newValue.name);}
							if (option.newValue && typeof option.newValue === 'object') {
								if (Array.isArray(val)) {
									return !!(val && val.toString() === option.newValue.toString());
								} else if (val) {
									const keys = Object.keys(option.newValue);
									return keys.every((key) => val[key] === option.newValue[key]);
								}
							} else {
								return option.isEq === null && option.value === null && (option.newValue === true || option.newValue === false)
									? !!val
									: (val === option.newValue);
							}
						});
					}
				}
			}.bind(this);
		}
		const sortInv = (a, b) => {return b.y - a.y;};
		const sortNat = (a, b) => {return a.y - b.y;};
		const filtGreat = (num) => {return (a) => {return a.y > num;}};
		const filtLow = (num) => {return (a) => {return a.y < num;}};
		const fineGraphs = new Set(['bars', 'doughnut', 'pie']);
		const sizeGraphs = new Set(['scatter', 'lines']);
		const colorGraphs = new Set(['scatter', 'bars', 'lines']);
		// Header
		menu.newEntry({entryText: this.title, flags: MF_GRAYED});
		menu.newEntry({entryText: 'sep'});
		{
			const subMenu = menu.newMenu('Data...');
			const key = parent.bAsync ? this.data : this.dataAsync;
			[
				{isEq: null, key, value: null, newValue: null,
					entryText: 'Artists per Country', args: {axis: 'Artists', data: {source: 'json', arg: 'artists'}}},
				{isEq: null, key, value: null, newValue: null,
					entryText: 'Artists per Region', args: {axis: 'Artists', data: {source: 'json', arg: 'artists region'}}},
				{isEq: null, key, value: null, newValue: null,
					entryText: 'Listens per Country', args: {axis: 'Listens', data: {source: 'library', arg: 'listens'}}},
				{isEq: null, key, value: null, newValue: null,
					entryText: 'Listens per Country (normalized)', args: {axis: 'Listens / track', data: {source: 'library', arg: 'listens normalized'}}},
				{isEq: null, key, value: null, newValue: null,
					entryText: 'Listens per Region', args: {axis: 'Listens', data: {source: 'library', arg: 'listens region'}}},
				{isEq: null, key, value: null, newValue: null,
					entryText: 'Listens per Region (normalized)', args: {axis: 'Listens / track', data: {source: 'library', arg: 'listens region normalized'}}},
			].forEach(createMenuOption(parent.bAsync ? 'dataAsync' : 'data', null, subMenu, false, (option) => {
				option.newValue = parent.bAsync
					? () => parent.getDataAsync(option.args.data.source, option.args.data.arg)
					: Array(1).fill(...parent.getData(option.args.data.source, option.args.data.arg));
				[parent.source, parent.arg] = [option.args.data.source, option.args.data.arg];
				this.changeConfig(
					{axis: {
							y: {key: option.args.axis},
							x: {key:  /\bregion\b/i.test(parent.arg) ? 'Region' : 'Country'}
						}
					}
				);
			}));
			menu.newEntry({entryText: 'sep'});
		}
		// Menus
		{
			const subMenu = menu.newMenu('Chart type...');
			[
				{isEq: null,	key: this.graph.type, value: null,				newValue: 'scatter',		entryText: 'Scatter'},
				{isEq: null,	key: this.graph.type, value: null,				newValue: 'bars',			entryText: 'Bars'},
				{isEq: null,	key: this.graph.type, value: null,				newValue: 'lines',			entryText: 'Lines'},
				{isEq: null,	key: this.graph.type, value: null,				newValue: 'doughnut',		entryText: 'Doughnut'},
				{isEq: null,	key: this.graph.type, value: null,				newValue: 'pie',			entryText: 'Pie'},
			].forEach(createMenuOption('graph', 'type', subMenu, void(0), (option) => {
				this.graph.borderWidth = fineGraphs.has(option.newValue) ? _scale(1) : _scale(4);
				if (colorGraphs.has(option.newValue)){
					this.colors = [opaqueColor(worldMap.properties.customPointColor[1], 50)];
				}
			}));
		}
		{
			const subMenu = menu.newMenu('Distribution...');
			[
				{isEq: null,	key: this.dataManipulation.distribution, value: null,				newValue: null,				entryText: 'Standard graph'},
				{isEq: null,	key: this.dataManipulation.distribution, value: null,				newValue: 'normal',			entryText: 'Normal distrib.'},
			].forEach(createMenuOption('dataManipulation', 'distribution', subMenu));
			menu.newEntry({entryText: 'sep'});
		}
		{
			const subMenu = menu.newMenu('Sorting...');
			if (this.dataManipulation.distribution === null) {
				[
					{isEq: null,	key: this.dataManipulation.sort, value: null,						newValue: sortNat,			entryText: 'Natural sorting'},
					{isEq: null,	key: this.dataManipulation.sort, value: null,						newValue: sortInv,			entryText: 'Inverse sorting'},
					{entryText: 'sep'},
					{isEq: null,	key: this.dataManipulation.sort, value: null,						newValue: null,				entryText: 'No sorting'}
				].forEach(createMenuOption('dataManipulation', 'sort', subMenu));
			} else {
				[
					{isEq: null,	key: this.dataManipulation.distribution, value: 'normal',			newValue:'normal inverse',	entryText: 'See tails'},
					{isEq: null,	key: this.dataManipulation.distribution, value: 'normal inverse',	newValue:'normal',			entryText: 'Mean centered'}
				].forEach(createMenuOption('dataManipulation', 'distribution', subMenu));
			}
			menu.newEntry({entryText: 'sep'});
		}
		{
			{
				const subMenu = menu.newMenu('Values shown...');
				[
					{isEq: false,	key: this.dataManipulation.slice, value: [0, 4],					newValue: [0, 4],			entryText: '4 values' + (this.dataManipulation.distribution ? ' per tail' : '')},
					{isEq: false,	key: this.dataManipulation.slice, value: [0, 10],					newValue: [0, 10],			entryText: '10 values' + (this.dataManipulation.distribution ? ' per tail' : '')},
					{isEq: false,	key: this.dataManipulation.slice, value: [0, 20],					newValue: [0, 20],			entryText: '20 values' + (this.dataManipulation.distribution ? ' per tail' : '')},
					{isEq: false,	key: this.dataManipulation.slice, value: [0, 50],					newValue: [0, 50],			entryText: '50 values' + (this.dataManipulation.distribution ? ' per tail' : '')},
					{entryText: 'sep'},
					{isEq: false,	key: this.dataManipulation.slice, value: [0, Infinity],				newValue: [0, Infinity],			entryText: 'Show all values'},
				].forEach(createMenuOption('dataManipulation', 'slice', subMenu));
			}
			{
				const subMenu = menu.newMenu('Filter...');
				const subMenuGreat = menu.newMenu('Greater than...', subMenu);
				const subMenuLow = menu.newMenu('Lower than...', subMenu);
				// Create a filter entry for each fraction of the max value (duplicates filtered)
				const parent = this;
				const options = [...new Set([this.stats.maxY, 1000, 100, 10, 10/2, 10/3, 10/5, 10/7].map((frac) => {
					return Math.round(this.stats.maxY / frac) || 1; // Don't allow zero
				}))];
				options.map((val) => {
					return {isEq: null, key: this.dataManipulation.filter, value: null, newValue: filtGreat(val), entryText: val};
				}).forEach(function (option, i){
					createMenuOption('dataManipulation', 'filter', subMenuGreat, false)(option);
					menu.newCheckMenu(subMenuGreat, option.entryText, void(0), () => {
						const filter = this.dataManipulation.filter;
						return !!(filter && filter({y: options[i] + 1}) && !filter({y: options[i]})); // Just a hack to check the current value is the filter
					});
				}.bind(parent));
				options.map((val) => {
					return {isEq: null, key: this.dataManipulation.filter, value: null, newValue: filtLow(val), entryText: val};
				}).forEach(function (option, i){
					createMenuOption('dataManipulation', 'filter', subMenuLow, false)(option);
					menu.newCheckMenu(subMenuLow, option.entryText, void(0), () => {
						const filter = this.dataManipulation.filter;
						return !!(filter && filter({y: options[i] + 1}) && !filter({y: options[i]})); // Just a hack to check the current value is the filter
					});
				}.bind(parent));
				[
					{entryText: 'sep'},
					{isEq: null,	key: this.dataManipulation.filter, value: null, newValue: null, entryText: 'No filter'},
				].forEach(createMenuOption('dataManipulation', 'filter', subMenu));
			}
			menu.newEntry({entryText: 'sep'});
		}
		{
			const subMenu = menu.newMenu('Axis...');
			[
				{isEq: null,	key: this.axis.x.labels, value: null,					newValue: {labels: !this.axis.x.labels},			entryText: (this.axis.x.labels ? 'Hide' : 'Show') + ' X labels'}
			].forEach(createMenuOption('axis', 'x', subMenu, false));
			[
				{isEq: null,	key: this.axis.y.labels, value: null,					newValue: {labels: !this.axis.y.labels},			entryText: (this.axis.y.labels ? 'Hide' : 'Show') + ' Y labels'}
			].forEach(createMenuOption('axis', 'y', subMenu, false));
			menu.newEntry({menuName: subMenu, entryText: 'sep'});
			[
				{isEq: null,	key: this.axis.x.bAltLabels, value: null,				newValue: !this.axis.x.bAltLabels,		entryText: 'Alt. X labels'},
			].forEach(createMenuOption('axis', ['x', 'bAltLabels'], subMenu, true));
		}
		const type = this.graph.type.toLowerCase();
		if (sizeGraphs.has(type)) {
			const subMenu = menu.newMenu('Other config...');
			const configSubMenu = menu.newMenu((type === 'lines' ? 'Line' : 'Point') + ' size...', subMenu);
			[1, 2, 3, 4].map((val) => {
				return {isEq: null,	key: this.graph.borderWidth, value: null, newValue: _scale(val), entryText: val.toString()};
			}).forEach(createMenuOption('graph', 'borderWidth', configSubMenu));
			if (type === 'scatter') {
				const configSubMenu = menu.newMenu('Point type...', subMenu);
				['circle', 'circumference', 'cross', 'triangle', 'plus'].map((val) => {
					return {isEq: null, key: this.graph.point, value: null, newValue: val, entryText: val};
				}).forEach(createMenuOption('graph', 'point', configSubMenu));
			}
		}
		menu.newEntry({entryText: 'sep'});
		menu.newEntry({entryText: 'Exit statistics mode', func: () => {
			parent.bEnabled = !parent.bEnabled;
			worldMap.properties['panelMode'][1] = 0;
			overwriteProperties(worldMap.properties);
			window.Repaint();
		}});
		return menu;
	}
	
	this.getData = (source = 'json', arg = 'artists') => {
		let data = [];
		switch (source) {
			case 'json': {
				switch (arg) {
					case 'artists' : {
						if (libraryPoints) {
							data = [libraryPoints.map((country, i) => {
								return {x: country.id, y: country.val};
							})];
						}
						break;
					}
					case 'artists region' : {
						if (libraryPoints) {
							const tagCount = new Map();
							libraryPoints.map((point, i) => {
								const country = country.id;
								const isoCode = getCountryISO(country);
								if (isoCode) {
									const id = music_graph_descriptors_countries.getFirstNodeRegion(isoCode);
									if (!id) {return;}
									if (!tagCount.has(id)) {tagCount.set(id, point.val);}
									else {tagCount.set(id, tagCount.get(id) + point.val);};
								}
							});
							data = [[...tagCount].map((point) => {return {x: point[0], y: point[1]};})];
						}
						break;
					}
				}
				break;
			}
			case 'library' : {
				switch (arg) {
					case 'listens region':
					case 'listens' : {
						const handleList = fb.GetLibraryItems();
						const libraryTags = fb.TitleFormat(_bt(worldMap.jsonId)).EvalWithMetadbs(handleList);
						const playCount = fb.TitleFormat(globTags.playCount).EvalWithMetadbs(handleList);
						const tagCount = new Map();
						libraryTags.forEach((tag, i) => {
							const idData = worldMap.getDataById(tag);
							if (idData) {
								const country = idData.val[idData.val.length - 1];
								const isoCode = getCountryISO(country);
								if (isoCode) {
									const id = idData 
										? arg === 'listens region' 
											? music_graph_descriptors_countries.getFirstNodeRegion(isoCode)
											: idData.val[idData.val.length - 1]
										: null;
									if (!id) {return;}
									if (!tagCount.has(id)) {tagCount.set(id, Number(playCount[i]));}
									else {tagCount.set(id, tagCount.get(id) + Number(playCount[i]));}
								}
							}
						});
						data = [[...tagCount].map((point) => {return {x: point[0], y: point[1]};})];
						break;
					}
					case 'listens region normalized':
					case 'listens normalized': {
						const handleList = fb.GetLibraryItems();
						const libraryTags = fb.TitleFormat(_bt(worldMap.jsonId)).EvalWithMetadbs(handleList);
						const playCount = fb.TitleFormat(globTags.playCount).EvalWithMetadbs(handleList);
						const tagCount = new Map();
						const keyCount = new Map();
						libraryTags.forEach((tag, i) => {
							const idData = worldMap.getDataById(tag);
							if (idData) {
								const country = idData.val[idData.val.length - 1];
								const isoCode = getCountryISO(country);
								if (isoCode) {
									const id = idData 
										? arg === 'listens region normalized' 
											? music_graph_descriptors_countries.getFirstNodeRegion(isoCode)
											: idData.val[idData.val.length - 1]
										: null;
									if (!id) {return;}
									if (!tagCount.has(id)) {tagCount.set(id, Number(playCount[i]));}
									else {tagCount.set(id, tagCount.get(id) + Number(playCount[i]));}
									if (!keyCount.has(id)) {keyCount.set(id, 1);}
									else {keyCount.set(id, keyCount.get(id) + 1);}
								}
							}
						});
						keyCount.forEach((value, key) => {
							if (tagCount.has(key)) {tagCount.set(key, Math.round(tagCount.get(key) / keyCount.get(key)));}
						});
						data = [[...tagCount].map((point) => {return {x: point[0], y: point[1]};})];
						break;
					}
				}
				break;
			}
		}
		return data;
	}
	
	this.getDataAsync = async (source = 'json', arg = 'artists') => {
		let data = [];
		switch (source) {
			case 'json': {
				switch (arg) {
					case 'artists' : {
						if (libraryPoints) {
							data = [libraryPoints.map((country, i) => {
								return {x: country.id, y: country.val};
							})];
						}
						break;
					}
					case 'artists region' : {
						if (libraryPoints) {
							const tagCount = new Map();
							libraryPoints.map((point, i) => {
								const country = point.id;
								const isoCode = getCountryISO(country);
								if (isoCode) {
									const id = music_graph_descriptors_countries.getFirstNodeRegion(isoCode);
									if (!id) {return;}
									if (!tagCount.has(id)) {tagCount.set(id, point.val);}
									else {tagCount.set(id, tagCount.get(id) + point.val);};
								}
							});
							data = [[...tagCount].map((point) => {return {x: point[0], y: point[1]};})];
						}
						break;
					}
				}
				break;
			}
			case 'library' : {
				switch (arg) {
					case 'listens region':
					case 'listens' : {
						const handleList = fb.GetLibraryItems();
						const libraryTags = await fb.TitleFormat(_bt(worldMap.jsonId)).EvalWithMetadbsAsync(handleList);
						const playCount = await fb.TitleFormat(globTags.playCount).EvalWithMetadbsAsync(handleList);
						const tagCount = new Map();
						return Promise.serial(libraryTags.chunk(1000), async (tags) => {
							return tags.forEach((tag, i) => {
								const idData = worldMap.getDataById(tag);
								if (idData) {
									const country = idData.val[idData.val.length - 1];
									const isoCode = getCountryISO(country);
									if (isoCode) {
										const id = arg === 'listens region' 
												? music_graph_descriptors_countries.getFirstNodeRegion(isoCode)
												: country;
										if (!id) {return;}
										if (!tagCount.has(id)) {tagCount.set(id, Number(playCount[i]));}
										else {tagCount.set(id, tagCount.get(id) + Number(playCount[i]));}
									}
								}
							});
						}, 10).then(() => {
							return [[...tagCount].map((point) => {return {x: point[0], y: point[1]};})];
						});
					}
					case 'listens region normalized':
					case 'listens normalized': {
					const handleList = fb.GetLibraryItems();
						const libraryTags = await fb.TitleFormat(_bt(worldMap.jsonId)).EvalWithMetadbsAsync(handleList);
						const playCount = await fb.TitleFormat(globTags.playCount).EvalWithMetadbsAsync(handleList);
						const tagCount = new Map();
						const keyCount = new Map();
						return Promise.serial(libraryTags.chunk(1000), async (tags) => {
							return tags.forEach((tag, i) => {
								const idData = worldMap.getDataById(tag);
								if (idData) {
									const country = idData.val[idData.val.length - 1];
									const isoCode = getCountryISO(country);
									if (isoCode) {
										const id = arg === 'listens region normalized' 
												? music_graph_descriptors_countries.getFirstNodeRegion(isoCode)
												: country;
										if (!id) {console.log(isoCode, id); return;}
										if (!tagCount.has(id)) {tagCount.set(id, Number(playCount[i]));}
										else {tagCount.set(id, tagCount.get(id) + Number(playCount[i]));}
										if (!keyCount.has(id)) {keyCount.set(id, 1);}
										else {keyCount.set(id, keyCount.get(id) + 1);}
									}
								}
							});
						}, 10).then(() => {
							keyCount.forEach((value, key) => {
								if (tagCount.has(key)) {tagCount.set(key, Math.round(tagCount.get(key) / keyCount.get(key)));}
							});
							return [[...tagCount].map((point) => {return {x: point[0], y: point[1]};})];
						});
						break;
					}
				}
				break;
			}
		}
		return Promise.resolve(data);
	}
	
	this.defaultConfig = () => {
		return {
			data: [], // No data is added by default to set no colors on first init
			graph: {type: 'doughnut'},
			dataManipulation: {sort: (a, b) => {return b.y - a.y;}, slice: [0, 4], filter: null, distribution: null},
			background: {color: null},
			colors: [opaqueColor(worldMap.properties.customPointColor[1], 50)],
			margin: {left: _scale(20), right: _scale(20), top: _scale(10), bottom: _scale(15)},
			axis: {
				x: {show: true, color: blendColors(invert(worldMap.panelColor, true), worldMap.panelColor, 0.1), width: _scale(2), ticks: 'auto', labels: true, key: 'Countries', bAltLabels: true}, 
				y: {show: true, color: blendColors(invert(worldMap.panelColor, true), worldMap.panelColor, 0.1), width: _scale(2), ticks: 'auto', labels: true, key: 'Artists'}
			},
			x: 0,
			w: 0,
			y: 0,
			h: 0,
			tooltipText: '\n\n(Right click to configure chart)',
			configuration: {bPopupBackground: true}
		};
	}
	
	/* 
		Automatically draw new graphs using table above
	*/
	this.init = () => {
		const newConfig = [
			[ // Row
				{...this.config, ...(this.bAsync 
					? {dataAsync: () => this.getDataAsync(this.source, this.arg)}
					: {data: Array(1).fill(...this.getData(this.source, this.arg))}
				)}
			]
		];
		rows = newConfig.length;
		columns = newConfig[0].length;
		nCharts = new Array(rows).fill(1).map((row) => {return new Array(columns).fill(1);}).map((row, i) => {
			return row.map((cell, j) => {
				const w = window.Width / columns;
				const h = window.Height / rows * (i + 1);
				const x = w * j;
				const y = window.Height / rows * i;
				const defaultConfig = this.defaultConfig();
				const axis = (newConfig[i][j].axis || defaultConfig.axis);
				const title = window.Name + ' - ' + axis.y.key + ' per ' + axis.x.key;
				return new _chart({...defaultConfig, x, y, w, h}).changeConfig({...newConfig[i][j], bPaint: false, title});
			});
		});
		charts = nCharts.flat(Infinity);
		charts.forEach((chart) => { _attachedMenu.call(chart, {rMenu: this.graphMenu.bind(chart), popup: chart.pop});}); // Binds the generic right click menu to every chart
	};
	
	this.bEnabled = bEnabled;
	this.source = config && config.data ? config.data.source : 'json';
	this.arg = config && config.data ? config.data.arg : 'artists';
	this.bAsync = config && config.data && config.data.hasOwnProperty('bAsync') ? !!config.data.bAsync : true;
	this.config = config ? config : {};
	delete this.config.data;
	if (this.bEnabled) {this.init();}
}