'use strict';
//15/11/24

/* exported _mapStatistics */

/* global worldMap:readable, overwriteProperties:readable, MF_GRAYED:readable, _t:readable, _q:readable, getCountryISO:readable, _p:readable, queryCombinations:readable, music_graph_descriptors_countries:readable, globTags:readable, checkQuery:readable, globQuery:readable, round:readable, _bt:readable, libraryPoints:readable, repaint:readable */
include('..\\statistics\\statistics_xxx.js');
/* global _scale:readable, opaqueColor:readable, blendColors:readable, invert:readable, _chart:readable */
include('..\\..\\helpers\\menu_xxx.js');
/* global _menu:readable */
include('..\\..\\helpers\\helpers_xxx_playlists.js');
/* global sendToPlaylist:readable */
include('..\\filter_and_query\\remove_duplicates.js');
/* global removeDuplicates:readable */


function _mapStatistics(x, y, w, h, bEnabled = false, config = {}) {
	const parent = this;
	let rows = 0;
	let columns = 0;
	let nCharts = [];
	let charts = [];

	this.attachCallbacks = () => {
		addEventListener('on_paint', (gr) => {
			if (!window.ID || !this.bEnabled) { return; }
			if (!window.Width || !window.Height) { return; }
			charts.forEach((chart) => { chart.paint(gr); });
		});

		addEventListener('on_size', () => {
			if (!window.ID || !this.bEnabled) { return; }
			if (!window.Width || !window.Height) { return; }
			for (let i = 0; i < rows; i++) {
				for (let j = 0; j < columns; j++) {
					const w = window.Width / columns;
					const h = window.Height / rows * (i + 1);
					const x = w * j;
					const y = window.Height / rows * i;
					nCharts[i][j].changeConfig({ x, y, w, h, bPaint: false });
				}
			}
			window.Repaint();
		});

		addEventListener('on_mouse_move', (x, y, mask) => {
			if (!window.ID || !this.bEnabled) { return; }
			return charts.some((chart) => { return chart.move(x, y, mask); });
		});

		addEventListener('on_mouse_leave', () => {
			if (!this.bEnabled) { return; }
			charts.forEach((chart) => { chart.leave(); });
		});

		addEventListener('on_mouse_lbtn_up', (x, y, mask) => {
			if (!this.bEnabled) { return true; }
			charts.some((chart) => { return chart.lbtnUp(x, y, mask); });
		});

		addEventListener('on_mouse_lbtn_dblclk', (x, y, mask) => {
			if (!window.ID || !this.bEnabled) { return; }
			charts.some((chart) => { return chart.lbtnDblClk(x, y, mask); });
		});
	};

	const createMenuOptionParent = function createMenuOptionParent(menu, key, subKey, menuName = menu.getMainMenuName(), bCheck = true, addFunc = null, postFunc = null) {
		return function (option) {
			if (menu.isSeparator(option) && !menu.isSeparator(menu.getEntries().pop())) { menu.newSeparator(menuName); return; } // Add sep only if any entry has been added
			if (option.isEq && option.key === option.value || !option.isEq && option.key !== option.value || option.isEq === null) {
				menu.newEntry({
					menuName, entryText: option.entryText, func: () => {
						if (addFunc) { addFunc(option); }
						if (subKey) {
							if (Array.isArray(subKey)) {
								const len = subKey.length - 1;
								const obj = { [key]: {} };
								let prev = obj[key];
								subKey.forEach((curr, i) => {
									prev[curr] = i === len ? option.newValue : {};
									prev = prev[curr];
								});
								this.changeConfig(obj);
							} else {
								this.changeConfig({ [key]: { [subKey]: option.newValue } });
							}
						}
						else { this.changeConfig({ [key]: option.newValue }); }
						if (postFunc) { postFunc(option); }
					}
				});
				if (bCheck) {
					menu.newCheckMenuLast(() => {
						const val = subKey
							? Array.isArray(subKey)
								? subKey.reduce((acc, curr) => acc[curr], this[key])
								: this[key][subKey]
							: this[key];
						if (key === 'dataManipulation' && subKey === 'sort' && option.newValue === this.convertSortLabel(this.sortKey)) { return true; }
						if ((key === 'data' || key === 'dataAsync') && option.args.data.source === parent.source && option.args.data.arg === parent.arg) { return true; }
						if (option.newValue && typeof option.newValue === 'function') { return !!(val && val.name === option.newValue.name); }
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
	};

	// Generic statistics menu which should work on almost any chart...
	this.onLbtnUpSettings = function onLbtnUpSettings(bClear = true) {
		// Constants
		this.tooltip.SetValue(null);
		if (!this.settingsMenu) {
			this.settingsMenu = new _menu({
				onBtnUp: () => {
					const config = this.exportConfig();
					const keys = new Set(['graph', 'dataManipulation', 'grid', 'axis', 'margin']);
					Object.keys(config).forEach((key) => {
						if (!keys.has(key)) { delete config[key]; }
					});
					config.dataManipulation.sort = this.exportSortLabel();
					config.data = { source: parent.source.toLowerCase(), arg: parent.arg.toLowerCase(), bAsync: parent.bAsync }; // Similar to this.exportDataLabels()
					worldMap.properties['statsConfig'][1] = JSON.stringify(config);
					overwriteProperties(worldMap.properties);
				}
			});
		}
		const menu = this.settingsMenu;
		if (bClear) { menu.clear(true); } // Reset on every call
		// helper
		const createMenuOption = createMenuOptionParent.bind(this, menu);
		// Header
		menu.newEntry({ entryText: this.title, flags: MF_GRAYED });
		menu.newSeparator();
		{	// Data
			const subMenu = menu.newMenu('Data...');
			const data = parent.bAsync ? this.data : this.dataAsync;
			const slice = this.dataManipulation.slice;
			[
				{
					isEq: null, key: data, value: null, newValue: null,
					entryText: 'Artists per Country', args: { axis: 'Artists', data: { source: 'json', arg: 'artists' } }
				},
				{
					isEq: null, key: data, value: null, newValue: null,
					entryText: 'Artists per Region', args: { axis: 'Artists', data: { source: 'json', arg: 'artists region' } }
				},
				{
					isEq: null, key: data, value: null, newValue: null,
					entryText: 'Listens per Country', args: { axis: 'Listens', data: { source: 'library', arg: 'listens' } }
				},
				{
					isEq: null, key: data, value: null, newValue: null,
					entryText: 'Listens per Country (normalized)', args: { axis: 'Listens / track', data: { source: 'library', arg: 'listens normalized' } }
				},
				{
					isEq: null, key: data, value: null, newValue: null,
					entryText: 'Listens per Region', args: { axis: 'Listens', data: { source: 'library', arg: 'listens region' } }
				},
				{
					isEq: null, key: data, value: null, newValue: null,
					entryText: 'Listens per Region (normalized)', args: { axis: 'Listens / track', data: { source: 'library', arg: 'listens region normalized' } }
				},
			].forEach(createMenuOption(parent.bAsync ? 'dataAsync' : 'data', null, subMenu, true, (option) => {
				option.newValue = parent.bAsync
					? () => parent.getDataAsync(option.args.data.source, option.args.data.arg)
					: Array(1).fill(...parent.getData(option.args.data.source, option.args.data.arg));
				[parent.source, parent.arg] = [option.args.data.source, option.args.data.arg];
				this.changeConfig(
					{
						axis: {
							y: { key: option.args.axis },
							x: { key: /\bregion\b/i.test(parent.arg) ? 'Region' : 'Country' }
						},
						title: window.Name + ' - ' + option.entryText
					}
				);
			}, (option) => { // eslint-disable-line no-unused-vars
				this.changeConfig({ dataManipulation: { slice } });
			}));
		}
		menu.newSeparator();
		menu.newEntry({ entryText: 'Exit statistics mode', func: parent.exit });
		return menu;
	};

	this.onLbtnUpDisplay = function onLbtnUpDisplay(bClear = true) {
		// Constants
		this.tooltip.SetValue(null);
		if (!this.displayMenu) {
			this.displayMenu = new _menu({
				onBtnUp: () => {
					const config = this.exportConfig();
					const keys = new Set(['graph', 'dataManipulation', 'grid', 'axis', 'margin']);
					Object.keys(config).forEach((key) => {
						if (!keys.has(key)) { delete config[key]; }
					});
					config.dataManipulation.sort = this.exportSortLabel();
					config.data = { source: parent.source.toLowerCase(), arg: parent.arg.toLowerCase(), bAsync: parent.bAsync }; // Similar to this.exportDataLabels()
					worldMap.properties['statsConfig'][1] = JSON.stringify(config);
					overwriteProperties(worldMap.properties);
				}
			});
		}
		const menu = this.displayMenu;
		if (bClear) { menu.clear(true); } // Reset on every call
		// helper
		const createMenuOption = createMenuOptionParent.bind(this, menu);
		const filtGreat = (num) => { return (a) => { return a.y > num; }; };
		const filtLow = (num) => { return (a) => { return a.y < num; }; };
		const fineGraphs = new Set(['bars', 'doughnut', 'pie']);
		const sizeGraphs = new Set(['scatter', 'lines']);
		const type = this.graph.type.toLowerCase();
		// Header
		menu.newEntry({ entryText: this.title, flags: MF_GRAYED });
		menu.newSeparator();
		// Menus
		{
			const subMenu = menu.newMenu('Chart type...');
			[
				{ isEq: null, key: this.graph.type, value: null, newValue: 'scatter', entryText: 'Scatter' },
				{ isEq: null, key: this.graph.type, value: null, newValue: 'bars', entryText: 'Bars' },
				{ isEq: null, key: this.graph.type, value: null, newValue: 'lines', entryText: 'Lines' },
				{ isEq: null, key: this.graph.type, value: null, newValue: 'doughnut', entryText: 'Doughnut' },
				{ isEq: null, key: this.graph.type, value: null, newValue: 'pie', entryText: 'Pie' },
			].forEach(createMenuOption('graph', 'type', subMenu, void (0), (option) => {
				this.graph.borderWidth = fineGraphs.has(option.newValue) ? _scale(1) : _scale(4);
			}, (option) => {
				if (['doughnut', 'pie'].includes(type) && type !== option.newValue) {
					this.colors = [worldMap.defaultColor];
					this.checkColors();
				}
			}));
		}
		{
			const subMenu = menu.newMenu('Distribution...');
			[
				{ isEq: null, key: this.dataManipulation.distribution, value: null, newValue: null, entryText: 'Standard graph' },
				{ isEq: null, key: this.dataManipulation.distribution, value: null, newValue: 'normal', entryText: 'Normal distrib.' },
			].forEach(createMenuOption('dataManipulation', 'distribution', subMenu));
			menu.newSeparator();
		}
		{
			const subMenu = menu.newMenu('Sorting...');
			if (this.dataManipulation.distribution === null) {
				[
					{ isEq: null, key: this.dataManipulation.sort, value: null, newValue: 'natural|x', entryText: 'Natural sorting (x)' },
					{ isEq: null, key: this.dataManipulation.sort, value: null, newValue: 'reverse|x', entryText: 'Inverse sorting (x)' },
					{ entryText: 'sep' },
					{ isEq: null, key: this.dataManipulation.sort, value: null, newValue: 'natural|y', entryText: 'Natural sorting (Y)' },
					{ isEq: null, key: this.dataManipulation.sort, value: null, newValue: 'reverse|y', entryText: 'Reverse sorting (Y)' },
					{ entryText: 'sep' },
					{ isEq: null, key: this.dataManipulation.sort, value: null, newValue: null, entryText: 'No sorting' }
				].forEach(createMenuOption('dataManipulation', 'sort', subMenu));
			} else {
				[
					{ isEq: null, key: this.dataManipulation.distribution, value: 'normal', newValue: 'normal inverse', entryText: 'See tails' },
					{ isEq: null, key: this.dataManipulation.distribution, value: 'normal inverse', newValue: 'normal', entryText: 'Mean centered' }
				].forEach(createMenuOption('dataManipulation', 'distribution', subMenu));
			}
			menu.newSeparator();
		}
		{ // NOSONAR
			{
				const subMenu = menu.newMenu('Values shown...');
				[
					{ isEq: false, key: this.dataManipulation.slice, value: [0, 3], newValue: [0, 3], entryText: '3 values' + (this.dataManipulation.distribution ? ' per tail' : '') },
					{ isEq: false, key: this.dataManipulation.slice, value: [0, 4], newValue: [0, 4], entryText: '4 values' + (this.dataManipulation.distribution ? ' per tail' : '') },
					{ isEq: false, key: this.dataManipulation.slice, value: [0, 6], newValue: [0, 6], entryText: '6 values' + (this.dataManipulation.distribution ? ' per tail' : '') },
					{ isEq: false, key: this.dataManipulation.slice, value: [0, 10], newValue: [0, 10], entryText: '10 values' + (this.dataManipulation.distribution ? ' per tail' : '') },
					{ entryText: 'sep' },
					{ isEq: false, key: this.dataManipulation.slice, value: [0, Infinity], newValue: [0, Infinity], entryText: 'Show all values' },
				].forEach(createMenuOption('dataManipulation', 'slice', subMenu));
			}
			{
				const subMenu = menu.newMenu('Filter...');
				const subMenuGreat = menu.newMenu('Greater than...', subMenu);
				const subMenuLow = menu.newMenu('Lower than...', subMenu);
				// Create a filter entry for each fraction of the max value (duplicates filtered)
				const parent = this;
				const options = [...new Set([this.stats.maxY, 1000, 100, 10, 10 / 2, 10 / 3, 10 / 5, 10 / 7].map((frac) => {
					return Math.round(this.stats.maxY / frac) || 1; // Don't allow zero
				}))];
				options.map((val) => {
					return { isEq: null, key: this.dataManipulation.filter, value: null, newValue: filtGreat(val), entryText: val };
				}).forEach(function (option, i) {
					createMenuOption('dataManipulation', 'filter', subMenuGreat, false)(option);
					menu.newCheckMenuLast(() => {
						const filter = this.dataManipulation.filter;
						return !!(filter && filter({ y: options[i] + 1 }) && !filter({ y: options[i] })); // Just a hack to check the current value is the filter
					});
				}.bind(parent));
				options.map((val) => {
					return { isEq: null, key: this.dataManipulation.filter, value: null, newValue: filtLow(val), entryText: val };
				}).forEach(function (option, i) {
					createMenuOption('dataManipulation', 'filter', subMenuLow, false)(option);
					menu.newCheckMenuLast(() => {
						const filter = this.dataManipulation.filter;
						return !!(filter && filter({ y: options[i] + 1 }) && !filter({ y: options[i] })); // Just a hack to check the current value is the filter
					});
				}.bind(parent));
				[
					{ entryText: 'sep' },
					{ isEq: null, key: this.dataManipulation.filter, value: null, newValue: null, entryText: 'No filter' },
				].forEach(createMenuOption('dataManipulation', 'filter', subMenu));
			}
			menu.newSeparator();
		}
		{
			const subMenu = menu.newMenu('Axis & labels...');
			{
				const subMenuTwo = menu.newMenu('Axis...', subMenu);
				[
					{ isEq: null, key: this.axis.x.show, value: null, newValue: { show: !this.axis.x.show }, entryText: (this.axis.x.show ? 'Hide' : 'Show') + ' X axis' }
				].forEach(createMenuOption('axis', 'x', subMenuTwo, false));
				[
					{ isEq: null, key: this.axis.y.show, value: null, newValue: { show: !this.axis.y.show }, entryText: (this.axis.y.show ? 'Hide' : 'Show') + ' Y axis' }
				].forEach(createMenuOption('axis', 'y', subMenuTwo, false));
			}
			{
				const subMenuTwo = menu.newMenu('Labels...', subMenu);
				[
					{ isEq: null, key: this.axis.x.labels, value: null, newValue: { labels: !this.axis.x.labels }, entryText: (this.axis.x.labels ? 'Hide' : 'Show') + ' X labels' }
				].forEach(createMenuOption('axis', 'x', subMenuTwo, false));
				[
					{ isEq: null, key: this.axis.y.labels, value: null, newValue: { labels: !this.axis.y.labels }, entryText: (this.axis.y.labels ? 'Hide' : 'Show') + ' Y labels' }
				].forEach(createMenuOption('axis', 'y', subMenuTwo, false));
				menu.newSeparator(subMenuTwo);
				[
					{ isEq: null, key: this.axis.x.bAltLabels, value: null, newValue: !this.axis.x.bAltLabels, entryText: 'Alt. X labels' },
				].forEach(createMenuOption('axis', ['x', 'bAltLabels'], subMenuTwo, true));
			}
			{
				const subMenuTwo = menu.newMenu('Titles...', subMenu);
				[
					{ isEq: null, key: this.axis.x.showKey, value: null, newValue: { showKey: !this.axis.x.showKey }, entryText: (this.axis.x.showKey ? 'Hide' : 'Show') + ' X title' }
				].forEach(createMenuOption('axis', 'x', subMenuTwo, false));
				[
					{ isEq: null, key: this.axis.y.showKey, value: null, newValue: { showKey: !this.axis.y.showKey }, entryText: (this.axis.y.showKey ? 'Hide' : 'Show') + ' Y title' }
				].forEach(createMenuOption('axis', 'y', subMenuTwo, false));
			}
		}
		{
			const subMenu = menu.newMenu('Other config...');
			if (sizeGraphs.has(type)) {
				{
					const configSubMenu = menu.newMenu((type === 'lines' ? 'Line' : 'Point') + ' size...', subMenu);
					[1, 2, 3, 4].map((val) => {
						return { isEq: null, key: this.graph.borderWidth, value: null, newValue: _scale(val), entryText: val.toString() };
					}).forEach(createMenuOption('graph', 'borderWidth', configSubMenu));
				}
				if (type === 'scatter') {
					const configSubMenu = menu.newMenu('Point type...', subMenu);
					['circle', 'circumference', 'cross', 'triangle', 'plus'].map((val) => {
						return { isEq: null, key: this.graph.point, value: null, newValue: val, entryText: val };
					}).forEach(createMenuOption('graph', 'point', configSubMenu));
				}
			}
			{
				const configSubMenu = menu.newMenu('Point transparency...', subMenu);
				[0, 20, 40, 60, 80, 100].map((val) => {
					return { isEq: null, key: this.graph.pointAlpha, value: null, newValue: Math.round(val * 255 / 100), entryText: val.toString() + (val === 0 ? '\t(transparent)' : val === 100 ? '\t(opaque)' : '') };
				}).forEach(createMenuOption('graph', 'pointAlpha', configSubMenu));
			}
		}
		return menu;
	};

	this.onLbtnUpPoint = function onLbtnUpPoint(point, x, y, mask) { // eslint-disable-line no-unused-vars
		const dataId = worldMap.jsonId; // The tag used to match data
		const dataIdTag = _t(dataId.toUpperCase()); // for readability
		const mapTag = worldMap.properties.mapTag[1];
		const queryNapTag = (mapTag.includes('$') ? _q(mapTag) : mapTag);
		const queryByCountry = (countryName) => {
			let query = '';
			query = queryNapTag + ' IS ' + countryName + ' OR ' + queryNapTag + ' IS ' + getCountryISO(countryName);
			const jsonQuery = [];
			worldMap.getData().forEach((item) => {
				if (item.val[item.val.length - 1] === countryName) { jsonQuery.push(item[dataId]); }
			});
			if (jsonQuery.length) { query = _p(query) + ' OR ' + _p(queryCombinations(jsonQuery, dataIdTag, 'OR')); }
			return query;
		};
		const queryByRegion = (regionName) => {
			let query = '';
			const isoArr = music_graph_descriptors_countries.getNodesFromRegion(regionName);
			const isoSet = new Set(isoArr);
			query = _p(queryCombinations(isoArr, queryNapTag, 'OR'));
			const jsonQuery = [];
			worldMap.getData().forEach((item) => {
				const dataIso = getCountryISO(item.val[item.val.length - 1]);
				if (isoSet.has(dataIso)) { jsonQuery.push(item[dataId]); }
			});
			if (jsonQuery.length) { query = _p(query) + ' OR ' + _p(queryCombinations(jsonQuery, dataIdTag, 'OR')); }
			return query;
		};
		let query = '';
		switch (parent.source) {
			case 'json': {
				switch (parent.arg) {
					case 'artists': {
						query = queryByCountry(point.x);
						break;
					}
					case 'artists region': {
						query = queryByRegion(point.x);
						break;
					}
				}
				break;
			}
			case 'library': {
				switch (parent.arg) {
					case 'listens region normalized':
					case 'listens region':
						query = _q(globTags.playCount) + ' GREATER 0 AND ' + _p(queryByRegion(point.x));
						break;
					case 'listens normalized':
					case 'listens':
						query = _q(globTags.playCount) + ' GREATER 0 AND ' + _p(queryByCountry(point.x));
						break;
				}
				break;
			}
		}
		// Constants
		const menu = new _menu();
		// Header
		menu.newEntry({ entryText: this.title, flags: MF_GRAYED });
		menu.newSeparator();
		// Menus
		menu.newEntry({
			entryText: 'Create playlist...', func: () => {
				if (checkQuery(query)) {
					let handleList = fb.GetQueryItems(fb.GetLibraryItems(), query);
					handleList = removeDuplicates({ handleList, sortOutput: '', checkKeys: globTags.remDupl, sortBias: globQuery.remDuplBias, bAdvTitle: true, bMultiple: true, bPreserveSort: false });
					sendToPlaylist(handleList, 'World Map: ' + point.x);
				}
			}
		});
		menu.newEntry({
			entryText: 'Create AutoPlaylist...', func: () => {
				if (checkQuery(query)) {
					plman.ActivePlaylist = plman.CreateAutoPlaylist(plman.PlaylistCount, 'World Map: ' + point.x, query);
				}
			}
		});
		menu.newSeparator();
		menu.newEntry({
			entryText: 'Point statistics', func: () => {
				const avg = this.data[0]
					.reduce((acc, curr, i) => acc + (curr.y - acc) / (i + 1), 0);
				const total = this.data[0]
					.reduce((acc, curr) => acc + curr.y, 0);
				fb.ShowPopupMessage(
					this.axis.x.key + ':\t' + point.x +
					'\n' +
					this.axis.y.key + ':\t' + point.y + ' ' + _p(round(point.y / total * 100, 2) + '%') +
					'\n' +
					'-'.repeat(40) +
					'\n' +
					'Average ' + this.axis.y.key + ' (any ' + this.axis.x.key + '): ' + Math.round(avg) + ' ' + _p(round(avg / total * 100, 2) + '%') +
					'\n' +
					'Global total ' + this.axis.y.key + ': ' + total
					, window.Name + ': Point statistics'
				);
			}
		});
		return menu.btn_up(x, y);
	};

	this.getData = (source = 'json', arg = 'artists') => {
		let data = [];
		switch (source) {
			case 'json': {
				switch (arg) {
					case 'artists': {
						if (libraryPoints) {
							data = [libraryPoints.map((country) => {
								return { x: country.id, y: country.val };
							})];
						}
						break;
					}
					case 'artists region': {
						if (libraryPoints) {
							const tagCount = new Map();
							libraryPoints.map((point) => {
								const country = country.id;
								const isoCode = getCountryISO(country);
								if (isoCode) {
									const id = music_graph_descriptors_countries.getFirstNodeRegion(isoCode);
									if (!id) { return; }
									if (!tagCount.has(id)) { tagCount.set(id, point.val); }
									else { tagCount.set(id, tagCount.get(id) + point.val); }
								}
							});
							data = [Array.from(tagCount, (point) => { return { x: point[0], y: point[1] }; })];
						}
						break;
					}
				}
				break;
			}
			case 'library': {
				switch (arg) {
					case 'listens region':
					case 'listens': {
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
									if (!id) { return; }
									if (!tagCount.has(id)) { tagCount.set(id, Number(playCount[i])); }
									else { tagCount.set(id, tagCount.get(id) + Number(playCount[i])); }
								}
							}
						});
						data = [Array.from(tagCount, (point) => { return { x: point[0], y: point[1] }; })];
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
									if (!id) { return; }
									if (!tagCount.has(id)) { tagCount.set(id, Number(playCount[i])); }
									else { tagCount.set(id, tagCount.get(id) + Number(playCount[i])); }
									if (!keyCount.has(id)) { keyCount.set(id, 1); }
									else { keyCount.set(id, keyCount.get(id) + 1); }
								}
							}
						});
						keyCount.forEach((value, key) => {
							if (tagCount.has(key)) { tagCount.set(key, Math.round(tagCount.get(key) / keyCount.get(key))); }
						});
						data = [Array.from(tagCount, (point) => { return { x: point[0], y: point[1] }; })];
						break;
					}
				}
				break;
			}
		}
		return data;
	};

	this.getDataAsync = async (source = 'json', arg = 'artists') => {
		let data = [];
		switch (source) {
			case 'json': {
				switch (arg) {
					case 'artists': {
						if (libraryPoints) {
							data = [libraryPoints.map((country) => {
								return { x: country.id, y: country.val };
							})];
						}
						break;
					}
					case 'artists region': {
						if (libraryPoints) {
							const tagCount = new Map();
							libraryPoints.map((point) => {
								const country = point.id;
								const isoCode = getCountryISO(country);
								if (isoCode) {
									const id = music_graph_descriptors_countries.getFirstNodeRegion(isoCode);
									if (!id) { return; }
									if (!tagCount.has(id)) { tagCount.set(id, point.val); }
									else { tagCount.set(id, tagCount.get(id) + point.val); }
								}
							});
							data = [Array.from(tagCount, (point) => { return { x: point[0], y: point[1] }; })];
						}
						break;
					}
				}
				break;
			}
			case 'library': {
				switch (arg) {
					case 'listens region':
					case 'listens': {
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
										if (!id) { return; }
										if (!tagCount.has(id)) { tagCount.set(id, Number(playCount[i])); }
										else { tagCount.set(id, tagCount.get(id) + Number(playCount[i])); }
									}
								}
							});
						}, 10).then(() => {
							return [Array.from(tagCount, (point) => { return { x: point[0], y: point[1] }; })];
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
										if (!id) { console.log(isoCode, id); return; }
										if (!tagCount.has(id)) { tagCount.set(id, Number(playCount[i])); }
										else { tagCount.set(id, tagCount.get(id) + Number(playCount[i])); }
										if (!keyCount.has(id)) { keyCount.set(id, 1); }
										else { keyCount.set(id, keyCount.get(id) + 1); }
									}
								}
							});
						}, 10).then(() => {
							keyCount.forEach((value, key) => {
								if (tagCount.has(key)) { tagCount.set(key, Math.round(tagCount.get(key) / keyCount.get(key))); }
							});
							return [Array.from(tagCount, (point) => { return { x: point[0], y: point[1] }; })];
						});
					}
				}
				break;
			}
		}
		return Promise.resolve(data);
	};

	this.defaultConfig = () => {
		const onLbtnUpSettings = this.onLbtnUpSettings;
		const onLbtnUpDisplay = this.onLbtnUpDisplay;
		return {
			data: [], // No data is added by default to set no colors on first init
			graph: { type: 'doughnut', pointAlpha: Math.round(40 * 255 / 100) },
			chroma: {
				scheme: [
					opaqueColor(worldMap.defaultColor, 100),
					opaqueColor(invert(worldMap.panelColor), 100)
				]
			},
			dataManipulation: { sort: 'reverse|y', slice: [0, 4], filter: null, distribution: null },
			background: { color: null },
			colors: [worldMap.defaultColor],
			margin: { left: _scale(20), right: _scale(20), top: _scale(10), bottom: _scale(15) },
			axis: {
				x: { show: true, color: blendColors(invert(worldMap.panelColor, true), worldMap.panelColor, 0.1), width: _scale(2), ticks: 'auto', labels: true, key: 'Countries', bAltLabels: true },
				y: { show: true, color: blendColors(invert(worldMap.panelColor, true), worldMap.panelColor, 0.1), width: _scale(2), ticks: 'auto', labels: true, key: 'Artists' }
			},
			x: 0,
			w: 0,
			y: 0,
			h: 0,
			tooltipText: function (point, serie, mask) { return '\n\n(L. click to create playlist by ' + this.axis.x.key + ')'; }, // eslint-disable-line no-unused-vars
			configuration: { bPopupBackground: true },
			callbacks: {
				point: { onLbtnUp: parent.onLbtnUpPoint },
				settings: { onLbtnUp: function (x, y, mask) { onLbtnUpSettings.call(this).btn_up(x, y); } }, // eslint-disable-line no-unused-vars
				display: { onLbtnUp: function (x, y, mask) { onLbtnUpDisplay.call(this).btn_up(x, y); } }, // eslint-disable-line no-unused-vars
				custom: { onLbtnUp: parent.exit, tooltip: 'Exit statistics mode...' },
				config: {
					backgroundColor: () => [worldMap.panelColor]
				},
			},
			buttons: { settings: true, display: true, custom: true }
		};
	};

	/*
		Automatically draw new graphs using table above
	*/
	this.init = () => {
		const newConfig = [
			[ // Row
				{
					...this.config, ...(this.bAsync
						? { dataAsync: () => this.getDataAsync(this.source, this.arg) }
						: { data: Array(1).fill(...this.getData(this.source, this.arg)) }
					)
				}
			]
		];
		rows = newConfig.length;
		columns = newConfig[0].length;

		nCharts = Array.from({length: rows}, (row, i) => {
			return Array.from({length: columns}, (cell, j) => {
				const w = window.Width / columns;
				const h = window.Height / rows * (i + 1);
				const x = w * j;
				const y = window.Height / rows * i;
				const defaultConfig = this.defaultConfig();
				const axis = (newConfig[i][j].axis || defaultConfig.axis);
				const title = window.Name + ' - ' + axis.y.key + ' per ' + axis.x.key;
				return new _chart({ ...defaultConfig, x, y, w, h }).changeConfig({ ...newConfig[i][j], bPaint: false, title });
			});
		});
		charts = nCharts.flat(Infinity);
	};

	this.exit = () => {
		parent.bEnabled = !parent.bEnabled;
		worldMap.properties['panelMode'][1] = 0;
		overwriteProperties(worldMap.properties);
		repaint(void (0), true);
	};

	this.bEnabled = bEnabled;
	this.source = config && config.data ? config.data.source.toLowerCase() : 'json';
	this.arg = config && config.data ? config.data.arg.toLowerCase() : 'artists';
	this.bAsync = config && config.data && Object.hasOwn(config.data, 'bAsync') ? !!config.data.bAsync : true;
	this.config = config || {};
	delete this.config.data;
	if (this.bEnabled) { this.init(); }
}