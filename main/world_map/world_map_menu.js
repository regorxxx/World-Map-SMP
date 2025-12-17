'use strict';
//14/12/25

/* exported settingsMenu, importSettingsMenu */

/* global worldMap:readable, selMode:readable, modifiers:readable, repaint:readable, popup:readable, saveLibraryTags:readable, overwriteProperties:readable, getPropertiesPairs:readable, background:readable, Chroma:readable, RGB:readable, colorBlind:readable, colorbrewer:readable, imgAsync:readable, stats:readable , worldMapImages:readable */
include('..\\..\\helpers\\menu_xxx.js');
/* global _menu:readable, MF_STRING:readable, MF_GRAYED:readable, MF_MENUBARBREAK:readable */
include('..\\..\\helpers\\helpers_xxx.js');
/* global folders:readable, globSettings:readable, checkUpdate:readable, globTags:readable, VK_CONTROL:readable, saveUserDefFile:readable, globNoSplitArtist:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global _isFile:readable, _jsonParseFileCheck:readable, utf8:readable, _save:readable, _open:readable, WshShell:readable, _explorer:readable, _recycleFile:readable, _renameFile:readable, _copyFile:readable, findRecursiveFile:readable, _copyFile:readable, _resolvePath:readable, _moveFile:readable, getFiles:readable */
include('..\\..\\helpers\\helpers_xxx_tags.js');
/* global getHandleListTags:readable, getHandleListTagsV2:readable */
include('..\\..\\helpers\\helpers_xxx_playlists.js');
/* global sendToPlaylist:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global _bt:readable, _b:readable, _p:readable, isArrayEqual:readable */
include('..\\..\\helpers\\helpers_xxx_input.js');
/* global Input:readable */
include('..\\..\\helpers\\helpers_xxx_export.js');
/* global exportSettings:readable, importSettings:readable */
include('..\\window\\window_xxx_background_menu.js');
include('..\\..\\helpers-external\\namethatcolor\\ntc.js');
/* global ntc:readable */

const menu = new _menu();

function settingsMenu() {
	const properties = worldMap.properties;
	menu.clear(true); // Reset on every call
	const selLimitLow = 5;
	const sel = worldMap.getSelection();
	const selJsonId = sel
		? new Set(getHandleListTagsV2(sel, [worldMap.jsonId], { bMerged: true, splitBy: null }).flat(Infinity))
		: new Set();
	{ // NOSONAR
		menu.newEntry({
			entryText: 'Enable panel', func: () => {
				properties.bEnabled[1] = !properties.bEnabled[1];
				overwriteProperties(properties);
				repaint(false, true, true) || window.Repaint();
			}
		});
		menu.newCheckMenuLast(() => properties.bEnabled[1]);
		menu.newSeparator();
		{
			const menuName = menu.newMenu('Panel settings');
			menu.newSeparator(menuName);
			menu.newEntry({
				menuName, entryText: 'Refresh changes after... (ms)\t' + _b(properties.iRepaintDelay[1]), func: () => {
					let input = Input.number('int positive', Number(properties.iRepaintDelay[1]), 'Enter ms to refresh panel on track changes:', window.ScriptInfo.Name  + ': Refresh rate', 1000);
					if (input === null) { return; }
					if (!Number.isFinite(input)) { input = 0; }
					properties.iRepaintDelay[1] = input;
					overwriteProperties(properties);
				}
			});
			menu.newSeparator(menuName);
			{
				const subMenuName = menu.newMenu('Memory mode', menuName);
				menu.newEntry({
					menuName: subMenuName, entryText: 'High', func: () => {
						if (properties.memMode[1] !== 0) {
							properties.memMode[1] = 0;
							if (properties.pointMode[1] < 1) { properties.pointMode[1] = 1; }
							properties.iLimitSelection[1] = 500;
							overwriteProperties(properties);
							window.Reload();
						}
					}
				});
				menu.newEntry({
					menuName: subMenuName, entryText: 'Standard', func: () => {
						fb.ShowPopupMessage('Country layer images are internally resized to ' + imgAsync.lowMemMode.maxSize + ' px before drawing to minimize memory usage in library and statistics (gradient map) modes.\n\nWithout it, big libraries may crash the JS engine while using country layers. As downside, it may affect quality in really high resolutions and big panel sizes.', window.ScriptInfo.Name + ': Standard memory mode');
						if (properties.memMode[1] !== 1) {
							properties.memMode[1] = 1;
							if (properties.pointMode[1] < 1) { properties.pointMode[1] = 1; }
							properties.iLimitSelection[1] = 5;
							overwriteProperties(properties);
							window.Reload();
						}
					}
				});
				menu.newEntry({
					menuName: subMenuName, entryText: 'Low', func: () => {
						fb.ShowPopupMessage('Country layers are disabled and only points are used.\n\nThe background will only use colors and all album art options are disabled.', window.ScriptInfo.Name + ': Low memory mode');
						if (properties.memMode[1] !== 2) {
							properties.memMode[1] = 2;
							properties.pointMode[1] = 0;
							properties.iLimitSelection[1] = 2;
							background.changeConfig({ config: { coverMode: 'none', transparency: 100 }, callbackArgs: { bSaveProperties: true } });
							overwriteProperties(properties);
							window.Reload();
						}
					}
				});
				menu.newCheckMenuLast(() => properties.memMode[1], 3);
			}
		}
		{	// Panel mode
			const menuName = menu.newMenu('Display mode');
			const options = ['Standard mode (selection & playback)', 'Library mode (all artist on library)', 'Statistics mode (chart)', 'Statistics mode (gradient map)'];
			menu.newEntry({ menuName, entryText: 'Switch panel mode:', func: null, flags: MF_GRAYED });
			menu.newSeparator(menuName);
			options.forEach((mode, idx) => {
				menu.newEntry({
					menuName, entryText: mode, func: () => {
						if (properties.panelMode[1] === idx) { return; }
						properties.panelMode[1] = idx;
						overwriteProperties(properties);
						switch (properties.panelMode[1]) {
							case 1:
								fb.ShowPopupMessage('This mode shows all countries with at least an artist found on the library, instead of following the selected or playing track(s).\n\nEvery point will show number of artists per country via tooltips and they can be clicked to create regional playlists.\n\nStatistics data is not calculated on real time but uses a cached database which may be updated on demand (\'Database\\Update library database...\')', window.ScriptInfo.Name + ': ' + mode);
								if (!_isFile(properties.fileNameLibrary[1])) { menu.btn_up(void (0), void (0), void (0), 'Database\\Update library database...'); }
								stats.bEnabled = false;
								break;
							case 2:
								fb.ShowPopupMessage('This mode displays regional statistics from your library using highly customizable and interactive charts.\n\nDisplay and data settings can be changed using the right buttons (which are hidden when mouse is not over). To exit this mode, just click on the close button. \n\nStatistics data is not calculated on real time but uses a cached database which may be updated on demand (\'Database\\Update library database...\')', window.ScriptInfo.Name + ': ' + mode);
								imgAsync.layers.bStop = true;
								if (!_isFile(properties.fileNameLibrary[1])) { menu.btn_up(void (0), void (0), void (0), 'Database\\Update library database...'); }
								stats.bEnabled = true;
								stats.init();
								break;
							case 3:
								fb.ShowPopupMessage('This mode displays a gradient map of the artists per country on your library.\n\nStatistics data is not calculated on real time but uses a cached database which may be updated on demand (\'Database\\Update library database...\')', window.ScriptInfo.Name + ': ' + mode);
								if (!_isFile(properties.fileNameLibrary[1])) { menu.btn_up(void (0), void (0), void (0), 'Database\\Update library database...'); }
								stats.bEnabled = false;
								break;
							case 0:
							default:
								fb.ShowPopupMessage('Standard mode, showing the country of the currently selected or playing track(s), the same than Bio panel would do.\n\nSelection mode may be switched via menus.\n\nWhen using "Follow selected track(s)" mode, this script may display multiple selections too, but there is a limit setting available to not display too many points at once while processing large selections.', window.ScriptInfo.Name + ': ' + mode);
								imgAsync.layers.bStop = true;
								stats.bEnabled = false;
								break;
						}
						worldMap.clearIdSelected();
						worldMap.clearLastPoint();
						repaint(void (0), true, true);
					}
				});
			});
			menu.newCheckMenuLast(() => properties.panelMode[1], options);
		}
		{	// Enabled Biography?
			const menuName = menu.newMenu('Biography integration', void (0), properties.panelMode[1] ? MF_GRAYED : MF_STRING);
			const options = [{ text: 'Enabled', val: true }, { text: 'Disabled', val: false }];
			menu.newEntry({ menuName, entryText: 'WilB\'s Biography functionality:', func: null, flags: MF_GRAYED });
			menu.newSeparator(menuName);
			options.forEach((mode) => {
				menu.newEntry({
					menuName, entryText: mode.text, func: () => {
						if (properties.bEnabledBiography[1] === mode.val) { return; }
						if (mode.val) { // Warning check
							let answer = WshShell.Popup('Warning: Enabling WilB\'s Biography integration requires selection mode to be set the same on both panels. Every time a tag is not found locally, the online tag will be used instead.\n\nSelection mode will be synchronized automatically whenever one of the panels change it.\nDo you want to continue?', 0, window.ScriptInfo.Name + ': Biography integration', popup.question + popup.yes_no);
							if (answer === popup.no) { return; }
						}
						properties.bEnabledBiography[1] = mode.val;
						overwriteProperties(properties);
						syncBio(true); // Sync selection and enable notify tags
						repaint(void (0), true);
					}, flags: () => { return (properties.bInstalledBiography[1] ? MF_STRING : MF_GRAYED); }
				});
			});
			menu.newCheckMenuLast(() => properties.bEnabledBiography[1] ? 0 : 1, options);
			menu.newSeparator(menuName);
			menu.newEntry({
				menuName, entryText: () => { return (properties.bInstalledBiography[1] ? 'Uninstall (revert changes)' : 'Check installation (required to enable)'); }, func: () => {
					let foundArr = [];
					// Biography 1.2.X
					// There are 2 paths here: beta versions require some file changes, while the 1.2.0+ releases work as is
					let packageFile = '';
					const file1_2_0_beta = 'biography_mod_1_2_0_beta_xxx.js';
					const modPackageTextV12 = '\ninclude(\'' + file1_2_0_beta + '\');';
					{
						const idFolder = '{BA9557CE-7B4B-4E0E-9373-99F511E81252}';
						let packagePath;
						try { packagePath = utils.GetPackagePath(idFolder); } // Exception when not found
						catch (e) { packagePath = ''; } // eslint-disable-line no-unused-vars
						packageFile = packagePath.length ? packagePath + '\\scripts\\callbacks.js' : '';
						if (_isFile(packageFile)) {
							const packageText = _jsonParseFileCheck(packagePath + '\\package.json', 'Package json', window.ScriptInfo.Name + ': Biography integration');
							if (packageText) {
								if (packageText.version === '1.2.0-Beta.1' || packageText.version === '1.2.0-Beta.2') {
									const fileText = _open(packageFile);
									if (!fileText.length) { return; }
									if (!properties.bInstalledBiography[1]) {
										if (!fileText.includes(modPackageTextV12)) { foundArr.push({ path: packageFile, ver: packageText.version }); } // When installing, look for not modified script
									} else if (fileText.includes(modPackageTextV12)) { foundArr.push({ path: packageFile, ver: packageText.version }); } // Otherwise, look for the mod string
								} else { // 1.2.0+: requires no further changes
									let answer = WshShell.Popup('Found WilB\'s Biography greater than 1.2.0 which works \'as is\' without file modifications.\nIntegration will continue to work even in future updates without further action.\n' + (properties.bInstalledBiography[1] ? 'Disable installation?' : 'Enable installation?'), 0, window.ScriptInfo.Name + ': Biography integration', popup.question + popup.yes_no);
									if (answer === popup.yes) {
										// Change config
										properties.bInstalledBiography[1] = !properties.bInstalledBiography[1];
										properties.bEnabledBiography[1] = properties.bInstalledBiography[1];
										overwriteProperties(properties);
										syncBio(false); // Sync selection and enable notify tags
										window.NotifyOthers('bio_refresh', null);  // Reload panel  Biography 1.2.0+
										return;
									}
								}
							}
						}
					}
					// Biography 1.1.X
					const file1_1_X = 'biography_mod_1_1_X_xxx.js';
					const modText = '\ninclude(\'' + file1_1_X + '\');';
					{
						const fileArr = findRecursiveFile('*.js', [fb.ProfilePath, fb.ComponentPath]); // All possible paths for the scripts
						const idText = 'window.DefinePanel(\'Biography\', {author:\'WilB\', version: \'1.1.'; // 1.1.3 or 1.1.2
						fileArr.forEach((file) => {
							const fileText = _open(file);
							if (!fileText.length) { return; }
							if (fileText.includes(idText) && !fileText.includes('omit this same script')) { // Omit this one from the list!
								if (!properties.bInstalledBiography[1]) {
									if (!fileText.includes(modText)) { foundArr.push({ path: file, ver: '1.1.X' }); } // When installing, look for not modified script
								} else if (fileText.includes(modText)) { foundArr.push({ path: file, ver: '1.1.X' }); } // Otherwise, look for the mod string
							}
						});
					}
					// Select files to edit
					let input = '';
					if (foundArr.length) { fb.ShowPopupMessage('Found these files:\n' + foundArr.map((script, idx) => { return '\n' + (idx + 1) + ': ' + script.path + '  (' + script.ver + ')'; }).join(''), window.ScriptInfo.Name + ': Biography integration'); }
					else { fb.ShowPopupMessage('WilB\'s ' + (properties.bInstalledBiography[1] ? 'modified ' : '') + 'Biography script not found neither in the profile nor in the component folder.\nIf you are doing a manual install, edit or replace the files and change the property on this panel manually:\n\'' + properties.bInstalledBiography[0] + '\'', window.ScriptInfo.Name + ': Biography integration'); return; }
					try { input = utils.InputBox(window.ID, 'Select by number the files to edit (sep by comma).\nCheck new window for paths' + '\nNumber of files: ' + foundArr.length, window.ScriptInfo.Name + ': Biography integration'); }
					catch (e) { return; } // eslint-disable-line no-unused-vars
					if (!input.trim().length) { return; }
					input = input.trim().split(',');
					if (input.some((idx) => { return idx > foundArr.length; })) { return; }
					let selectFound = [];
					input.forEach((idx) => { selectFound.push(foundArr[idx - 1]); });
					// Install
					let bDone = true;
					const backupExt = '.back';
					selectFound.forEach((selected) => {
						if (!bDone) { return; }
						const file = selected.path;
						const folderPath = utils.SplitFilePath(file)[0];
						console.log(window.ScriptInfo.Name + ': Editing file\n\t ' + file);
						if (selected.ver === '1.1.X') { // Biography 1.1.X
							if (!properties.bInstalledBiography[1]) {
								if (!_isFile(file + backupExt)) {
									bDone = _copyFile(file, file + backupExt);
								} else { bDone = false; fb.ShowPopupMessage('Selected file already has a backup. Edit aborted.\n' + file, window.ScriptInfo.Name + ': Biography integration'); return; }
								if (bDone) {
									bDone = _copyFile(folders.xxx + 'main\\world_map\\' + file1_1_X, folderPath + file1_1_X);
								} else { fb.ShowPopupMessage('Error creating a backup.\n' + file, window.ScriptInfo.Name + ': Biography integration'); return; }
								if (bDone) {
									let fileText = _open(file);
									fileText += modText;
									bDone = fileText.length && _save(file, fileText);
								} else { fb.ShowPopupMessage('Error copying mod file.\n' + folderPath + file1_1_X, window.ScriptInfo.Name + ': Biography integration'); return; }
								if (!bDone) { fb.ShowPopupMessage('Error editing the file.\n' + file, window.ScriptInfo.Name + ': Biography integration'); return; }
							} else {
								let bDone = false;
								if (_isFile(file + backupExt)) {
									bDone = _recycleFile(file, true);
								} else { fb.ShowPopupMessage('Selected file does not have a backup. Edit aborted.\n' + file, window.ScriptInfo.Name + ': Biography integration'); return; }
								if (bDone) {
									bDone = _renameFile(file + backupExt, file);
								} else { fb.ShowPopupMessage('Error deleting the modified file.\n' + file, window.ScriptInfo.Name + ': Biography integration'); return; }
								if (!bDone) { fb.ShowPopupMessage('Error renaming the backup.\n' + file, window.ScriptInfo.Name + ': Biography integration'); return; }
							}
						} else { // Biography 1.2.0 Beta 1 & 2
							if (!properties.bInstalledBiography[1]) { // NOSONAR
								if (!_isFile(file + backupExt)) {
									bDone = _copyFile(file, file + backupExt);
								} else { bDone = false; fb.ShowPopupMessage('Selected file already has a backup. Edit aborted.\n' + file, window.ScriptInfo.Name + ': Biography integration'); return; }
								if (bDone) {
									bDone = _copyFile(folders.xxx + 'main\\world_map\\' + file1_2_0_beta, folderPath + file1_2_0_beta);
								} else { fb.ShowPopupMessage('Error creating a backup.\n' + packageFile, window.ScriptInfo.Name + ': Biography integration'); return; }
								if (bDone) {
									let fileText = _open(packageFile);
									fileText += modPackageTextV12;
									bDone = fileText.length && _save(packageFile, fileText);
								} else { fb.ShowPopupMessage('Error copying mod file.\n' + folderPath + file1_2_0_beta, window.ScriptInfo.Name + ': Biography integration'); return; }
							} else {
								if (_isFile(packageFile + backupExt)) {
									bDone = _recycleFile(packageFile, true);
								} else { bDone = false; fb.ShowPopupMessage('Selected file does not have a backup. Edit aborted.\n' + packageFile, window.ScriptInfo.Name + ': Biography integration'); return; }
								if (bDone) {
									bDone = _renameFile(packageFile + backupExt, packageFile);
								} else { fb.ShowPopupMessage('Error deleting the modified file.\n' + packageFile, window.ScriptInfo.Name + ': Biography integration'); return; }
								if (!bDone) { fb.ShowPopupMessage('Error renaming the backup.\n' + packageFile, window.ScriptInfo.Name + ': Biography integration'); return; }
							}
						}
					});
					// Report
					if (bDone) { fb.ShowPopupMessage('Script(s) modified successfully:\n' + selectFound.map((script) => { return script.path + '  (' + script.ver + ')'; }).join('\n') + '\nBiography panel will be automatically reloaded.', window.ScriptInfo.Name + ': Biography integration'); }
					else { fb.ShowPopupMessage('There were some errors during script modification. Check the other windows.', window.ScriptInfo.Name + ': Biography integration'); return; }
					// Change config
					properties.bInstalledBiography[1] = !properties.bInstalledBiography[1];
					properties.bEnabledBiography[1] = properties.bInstalledBiography[1];
					overwriteProperties(properties);
					syncBio(false); // Sync selection and enable notify tags
					window.NotifyOthers('refresh_bio', null);  // Reload panel Biography 1.1.X
					window.NotifyOthers('bio_refresh', null);  // Reload panel Biography 1.2.0+
				}
			});
		}
		menu.newSeparator();
		{	// Selection mode
			const menuName = menu.newMenu('Selection mode', void (0), properties.panelMode[1] ? MF_GRAYED : MF_STRING);
			const options = selMode;
			options.forEach((mode) => {
				menu.newEntry({
					menuName, entryText: mode, func: () => {
						if (properties.selection[1] === mode) { return; }
						if (properties.bInstalledBiography[1] && properties.bEnabledBiography[1] && properties.bShowSelModePopup[1]) { // Warning check
							let answer = WshShell.Popup('Warning: WilB\'s Biography integration is enabled. This setting will be applied on both panels!\n\nDo you want to continue?', 0, window.ScriptInfo.Name + ': Biography integration', popup.question + popup.yes_no);
							if (answer === popup.no) { return; }
						}
						properties.selection[1] = mode;
						overwriteProperties(properties);
						// When ppt.focus is true, then selMode is selMode[0]
						if (properties.bEnabledBiography[1]) { // synchronize selection property
							syncBio(true); // Sync selection and enable notify tags
						}
						repaint(void (0), true);
					}
				});
			});
			menu.newCheckMenuLast(() => options.indexOf(properties.selection[1]), options);
			menu.newSeparator(menuName);
			menu.newEntry({
				menuName, entryText: 'Selection limit ' + _p(worldMap.jsonId.toUpperCase()) + '\t' + _b(properties.iLimitSelection[1]), func: () => {
					let input;
					try { input = Number(utils.InputBox(window.ID, 'Enter max number of different \'' + worldMap.jsonId.toUpperCase + '\' to display:\n(the rest is skipped for drawing purposes)', window.ScriptInfo.Name + ': Selection limit', properties.iLimitSelection[1], true)); }
					catch (e) { return; } // eslint-disable-line no-unused-vars
					if (!Number.isSafeInteger(input)) { return; }
					if (properties.iLimitSelection[1] === input) { return; }
					properties.iLimitSelection[1] = input;
					overwriteProperties(properties);
					if (properties.pointMode[1] >= 1 && properties.iLimitSelection[1] > selLimitLow) { fb.ShowPopupMessage('It\'s strongly recommended to use a low value when using country layers (\'UI\\Country highlighting\'), since they have high processing and memory requirements.\n\nIf you experience slowdowns, reduce it (recommended <= ' + selLimitLow + ').', window.ScriptInfo.Name + ': Selection limit'); }
				}, flags: properties.selection[1] === selMode[0] ? MF_STRING : MF_GRAYED
			});
			menu.newEntry({
				menuName, entryText: 'Warning on external changes', func: () => {
					properties.bShowSelModePopup[1] = !properties.bShowSelModePopup[1];
					overwriteProperties(properties);
				}
			});
			menu.newCheckMenuLast(() => properties.bShowSelModePopup[1]);
		}
		menu.newSeparator();
		{	// UI
			const menuUI = menu.newMenu('UI');
			{	// Map image
				const menuName = menu.newMenu('Map image', menuUI);
				menu.newEntry({ menuName, entryText: 'Image used as background:', func: null, flags: MF_GRAYED });
				menu.newSeparator(menuName);
				const options = [...worldMapImages, { text: 'sep' }, { text: 'Custom...' }];
				options.forEach((map, index) => {
					map.entryText = map.text; // For menu compatibility later
					menu.newEntry({
						menuName, entryText: map.text, func: () => {
							if (index === options.length - 1) {
								let input = '';
								const defPath = worldMap.imageMapPath.replace('hires\\', '');
								try { input = utils.InputBox(window.ID, 'Input path to file:\n\nPaths starting with \'.\\profile\\\' are relative to foobar profile folder.\nPaths starting with \'' + folders.xxxRootName + '\' are relative to this script\'s folder.', window.ScriptInfo.Name + ': Map image', defPath, true); }
								catch (e) { return; } // eslint-disable-line no-unused-vars
								if (!input.length) { return; }
								worldMap.imageMapPath = input.replace(folders.xxx, folders.xxxRootName);
								properties.imageMapPath[1] = input;
								overwriteProperties(properties);
								menu.btn_up(void (0), void (0), void (0), 'Coordinates transformation\\X factor'); // Call factor input
								menu.btn_up(void (0), void (0), void (0), 'Coordinates transformation\\Y factor');
							} else {
								worldMap.imageMapPath = map.path.replace(folders.xxx, folders.xxxRootName);
								worldMap.factorX = map.factorX;
								worldMap.factorY = map.factorY;
								properties.imageMapPath[1] = map.path;
								properties.factorX[1] = map.factorX;
								properties.factorY[1] = map.factorY;
								overwriteProperties(properties);
							}
							worldMap.init();
							window.Repaint();
						}
					});
				});
				menu.newCheckMenuLast((o, len) => {
					const idx = o.findIndex((opt) => _resolvePath(opt.path || '').toLowerCase() === _resolvePath(worldMap.imageMapPath).toLowerCase());
					return idx !== -1 ? idx : len - 1;
				}, options);
				menu.newSeparator(menuName);
				menu.newEntry({
					menuName, entryText: 'Set transparency...' + '\t[' + Math.round(properties.imageMapAlpha[1] * 100 / 255) + ']', func: () => {
						const input = Input.number('int positive', Math.round(properties.imageMapAlpha[1] * 100 / 255), 'Enter value:\n(0 to 100)', 'Buttons bar', 50, [n => n <= 100]);
						if (input === null) { return; }
						properties.imageMapAlpha[1] = Math.round(input * 255 / 100);
						worldMap.imageMapAlpha = properties.imageMapAlpha[1];
						overwriteProperties(properties);
						repaint(void (0), true);
					}
				});
				menu.newEntry({
					menuName, entryText: 'Apply gradient mask at borders', func: () => {
						properties.bImageMapMask[1] = !properties.bImageMapMask[1];
						worldMap.bImageMapMask = properties.bImageMapMask[1];
						worldMap.init();
						window.Repaint();
						overwriteProperties(properties);
					}
				});
				menu.newCheckMenuLast(() => worldMap.bImageMapMask);
			}
			{	// Coordinates factor
				const menuName = menu.newMenu('Coordinates transformation', menuUI);
				menu.newEntry({ menuName, entryText: 'Apply a factor to any axis:', func: null, flags: MF_GRAYED });
				menu.newSeparator(menuName);
				const options = [{ text: 'X factor', val: 'factorX' }, { text: 'Y factor', val: 'factorY' }];
				if (worldMap.factorX !== 100) { options[0].text += '\t ' + _b(worldMap.factorX); }
				if (worldMap.factorY !== 100) { options[1].text += '\t ' + _b(worldMap.factorY); }
				options.forEach((coord) => {
					menu.newEntry({
						menuName, entryText: coord.text, func: () => {
							let input = -1;
							try { input = Number(utils.InputBox(window.ID, coord.text[0] + ' axis scale. Input a number (percentage):', window.ScriptInfo.Name + ': ' + coord.text[0] + '-axis scaling', properties[coord.val][1], true)); }
							catch (e) { return; } // eslint-disable-line no-unused-vars
							if (!Number.isSafeInteger(input)) { return; }
							worldMap[coord.val] = input;
							properties[coord.val][1] = input;
							overwriteProperties(properties);
							worldMap.clearPointCache();
							repaint(void (0), true);
						}
					});
				});
			}
			menu.newSeparator(menuUI);
			{
				const getColorName = (val) => val !== -1 && val !== null && typeof val !== 'undefined'
					? (ntc.name(Chroma(val).hex())[1] || '').toString() || 'unknown'
					: '-none-';
				const menuName = menu.newMenu('Colors', menuUI);
				menu.newEntry({ menuName, entryText: 'UI colors: (Ctrl + Click to reset)', flags: MF_GRAYED });
				menu.newSeparator(menuName);
				{	// Point color
					const subMenuName = menu.newMenu('Points', menuName);
					const options = ['Default', 'Custom...'];
					options.forEach((item, i) => {
						menu.newEntry({
							menuName: subMenuName, entryText: item + ('\t' + _b(getColorName(worldMap.defaultColor))), func: () => {
								worldMap.defaultColor = i === 1 ? properties.customPointColor[1] : worldMap.defaultColor;
								// Update property to save between reloads
								properties.customPointColorMode[1] = i;
								if (i === 1) {
									properties.customPointColor[1] = worldMap.defaultColor = utils.IsKeyPressed(VK_CONTROL)
										? properties.customPointColor[3]
										: utils.ColourPicker(window.ID, worldMap.defaultColor);
									console.log(window.ScriptInfo.Name + ': Selected color ->\n\t Android: ' + properties.customPointColor[1] + ' - RGB: ' + Chroma(properties.customPointColor[1]).rgb());
								}
								overwriteProperties(properties);
								repaint(void (0), true);
							}
						});
					});
					menu.newCheckMenuLast(() => properties.customPointColorMode[1], options);
				}
				{	// Country color
					const subMenuName = menu.newMenu('Country layers', menuName, properties.pointMode[1] > 0 ? MF_STRING : MF_GRAYED);
					{
						const options = ['Default', 'Custom...'];
						options.forEach((item, i) => {
							const tip = i === 1 && properties.layerFillMode[1].length
								? '(Only None fill)'
								: _b(getColorName(i === 1 ? properties.customShapeColor[1] : properties.customShapeColor[3]));
							menu.newEntry({
								menuName: subMenuName, entryText: item + '\t' + tip, func: () => {
									properties.customShapeColor[1] = i === 0
										? -1
										: utils.IsKeyPressed(VK_CONTROL)
											? properties.customShapeColor[3]
											: utils.ColourPicker(window.ID, properties.customShapeColor[1]);
									if (i !== 0) { console.log(window.ScriptInfo.Name + ': Selected color ->\n\t Android: ' + properties.customShapeColor[1] + ' - RGB: ' + Chroma(properties.customShapeColor[1]).rgb()); }
									overwriteProperties(properties);
									repaint(void (0), true, true);
								}, flags: i === 1 && properties.layerFillMode[1].length ? MF_GRAYED : MF_STRING
							});
						});
						menu.newCheckMenuLast(() => properties.customShapeColor[1] === -1 ? 0 : 1, options);
					}
					menu.newSeparator(subMenuName);
					{
						const subMenuNameTwo = menu.newMenu('Layer fill' + (properties.customShapeColor[1] === -1 ? '\t(Only custom color)' : ''), subMenuName, properties.customShapeColor[1] !== -1 ? MF_STRING : MF_GRAYED);
						const options = [
							{ name: 'None', val: '' },
							{ name: 'Flag color', val: 'color' },
							{ name: 'Flag gradient', val: 'gradient' },
							{ name: 'Flag', val: 'flag' },
						];
						options.forEach((item) => {
							menu.newEntry({
								menuName: subMenuNameTwo, entryText: item.name, func: () => {
									properties.layerFillMode[1] = item.val;
									overwriteProperties(properties);
									repaint(void (0), true, true);
								}
							});
						});
						menu.newCheckMenuLast(() => options.findIndex((o) => o.val === properties.layerFillMode[1]), options);
					}
					menu.newSeparator(subMenuName);
					{
						const subMenuNameTwo = menu.newMenu('Statistics mode', subMenuName, worldMap.properties.panelMode[1] === 3 ? MF_STRING : MF_GRAYED);
						menu.newEntry({
							menuName: subMenuNameTwo, entryText: 'Gradient from color', func: () => {
								properties.customGradientColor[1] = '';
								overwriteProperties(properties);
								repaint(void (0), true, true);
							}, flags: worldMap.properties.panelMode[1] === 3 ? MF_STRING : MF_GRAYED
						});
						menu.newCheckMenuLast(() => properties.customGradientColor[1].length === 0);
						{
							const subMenuNameThree = menu.newMenu('Gradient from scheme', subMenuNameTwo);
							let j = 0;
							for (let key in colorbrewer) {
								if (key === 'colorBlind') { continue; }
								colorbrewer[key].forEach((scheme, i) => {
									if (i === 0) {
										menu.newEntry({ menuName: subMenuNameThree, entryText: key.charAt(0).toUpperCase() + key.slice(1), flags: (j === 0 ? MF_GRAYED : MF_GRAYED | MF_MENUBARBREAK) });
										menu.newSeparator(subMenuNameThree);
									}
									menu.newEntry({
										menuName: subMenuNameThree, entryText: scheme, func: () => {
											properties.customGradientColor[1] = scheme;
											overwriteProperties(properties);
											repaint(void (0), true, true);
										}, flags: worldMap.properties.panelMode[1] === 3 ? MF_STRING : MF_GRAYED
									});
								});
								j++;
							}
						}
					}
					menu.newSeparator(subMenuName);
					menu.newEntry({
						menuName: subMenuName, entryText: 'Set transparency...' + '\t[' + Math.round(properties.customShapeAlpha[1] * 100 / 255) + ']', func: () => {
							const input = Input.number('int positive', Math.round(properties.customShapeAlpha[1] * 100 / 255), 'Enter value:\n(0 to 100)', 'Buttons bar', 50, [n => n <= 100]);
							if (input === null) { return; }
							properties.customShapeAlpha[1] = Math.round(input * 255 / 100);
							overwriteProperties(properties);
							window.Repaint();
						}
					});
				}
				{	// NOSONAR Text color
					menu.newEntry({
						menuName, entryText: 'Text...' + '\t' + _b(getColorName(worldMap.textColor)), func: () => {
							worldMap.textColor = utils.IsKeyPressed(VK_CONTROL)
								? properties.customLocaleColor[3]
								: utils.ColourPicker(window.ID, worldMap.defaultColor);
							console.log(window.ScriptInfo.Name + ': Selected color ->\n\t Android: ' + worldMap.textColor + ' - RGB: ' + Chroma(worldMap.textColor).rgb());
							// Update property to save between reloads
							properties.customLocaleColor[1] = worldMap.textColor;
							overwriteProperties(properties);
							repaint(void (0), true);
						}
					});
				}
				{
					menu.newEntry({
						menuName, entryText: 'Header...' + '\t' + _b(getColorName(worldMap.properties.headerColor[1])), func: () => {
							worldMap.properties.headerColor[1] = utils.IsKeyPressed(VK_CONTROL)
								? -1
								: utils.ColourPicker(window.ID, worldMap.properties.headerColor[1]);
							if (properties.headerColor[1] !== -1) { console.log(window.ScriptInfo.Name + ': Selected color ->\n\t Android: ' + properties.headerColor[1] + ' - RGB: ' + Chroma(properties.headerColor[1]).rgb()); }
							// Update property to save between reloads
							overwriteProperties(properties);
							repaint(void (0), true);
						}
					});
				}
				menu.newSeparator(menuName);
				{	// Presets
					const subMenuName = menu.newMenu('Presets', menuName);
					const presets = [ /*[text, points, background ]*/
						{ name: 'Color Blindness (light)', colors: [colorBlind.black[2], colorBlind.yellow[1], colorBlind.white[0]] },
						{ name: 'Color Blindness (dark)', colors: [colorBlind.white[0], colorBlind.yellow[1], colorBlind.black[2]] },
						{ name: 'sep' },
						{ name: 'Gray Scale (dark)', colors: [colorBlind.white[0], colorBlind.black[2], colorBlind.black[0]] },
						{ name: 'sep' },
						{ name: 'Dark theme (red)', colors: [RGB(255, 255, 255), RGB(236, 47, 47), RGB(98, 9, 9)] },
						{ name: 'sep' },
						{ name: 'Default', colors: [RGB(255, 255, 255)] }
					];
					presets.forEach((preset) => {
						if (menu.isSeparator(preset)) { menu.newSeparator(subMenuName); return; }
						menu.newEntry({
							menuName: subMenuName, entryText: preset.name, func: () => {
								if (preset.name.toLowerCase() === 'default') {
									worldMap.textColor = preset.colors[0];
									properties.customPointColorMode[1] = 0;
									background.changeConfig({ config: JSON.parse(properties.background[3]), callbackArgs: { bSaveProperties: true } });
								}
								else {
									let bgColor;
									[worldMap.textColor, worldMap.defaultColor, bgColor] = preset.colors;
									properties.customPointColorMode[1] = 1;
									properties.customPointColor[1] = worldMap.defaultColor;
									if (background.colorMode !== 'none') {
										const gradient = [Chroma(bgColor).saturate(2).luminance(0.005).android(), bgColor];
										bgColor = Chroma.scale(gradient).mode('lrgb').colors(background.colorModeOptions.color.length, 'android');
										background.changeConfig({ config: { colorModeOptions: { color: bgColor } }, callbackArgs: { bSaveProperties: true } });
									}
								}
								properties.customLocaleColor[1] = worldMap.textColor;
								overwriteProperties(properties);
								worldMap.colorsChanged();
								repaint(void (0), true);
							}
						});
					});
				}
				menu.newSeparator(menuName);
				{
					const subMenu = menu.newMenu('Dynamic colors', menuName);
					menu.newEntry({
						menuName: subMenu, entryText: 'Dynamic (background cover mode)', func: () => {
							properties.bDynamicColors[1] = !properties.bDynamicColors[1];
							overwriteProperties(properties);
							if (properties.bDynamicColors[1]) {
								// Ensure it's applied with compatible settings
								background.coverModeOptions.bProcessColors = true;
								background.changeConfig({ config: { coverModeOptions: { bProcessColors: true } }, callbackArgs: { bSaveProperties: true } });
								if (background.coverMode === 'none') {
									background.changeConfig({ config: { coverMode: 'front', coverModeOptions: { alpha: 0 } }, callbackArgs: { bSaveProperties: true } });
								}
								background.updateImageBg(true);
							} else {
								worldMap.properties = getPropertiesPairs(properties, '', 0);
								worldMap.textColor = worldMap.properties.customLocaleColor[1];
								worldMap.defaultColor = worldMap.properties.customPointColor[1];
								background.changeConfig({ config: { colorModeOptions: { color: JSON.parse(worldMap.properties.background[1]).colorModeOptions.color } }, callbackArgs: { bSaveProperties: false } });
							}
							worldMap.colorsChanged();
							repaint(void (0), true);
						}
					});
					menu.newCheckMenuLast(() => properties.bDynamicColors[1]);
					menu.newEntry({
						menuName: subMenu, entryText: 'Also apply to background color', func: () => {
							properties.bDynamicColorsBg[1] = !properties.bDynamicColorsBg[1];
							if (!properties.bDynamicColorsBg[1]) {
								background.changeConfig({ config: { colorModeOptions: { color: JSON.parse(worldMap.properties.background[1]).colorModeOptions.color } }, callbackArgs: { bSaveProperties: false } });
							}
							overwriteProperties(properties);
							background.updateImageBg(true);
							worldMap.colorsChanged();
							repaint(void (0), true);
						}, flags: properties.bDynamicColors[1] ? MF_STRING : MF_GRAYED
					});
					menu.newCheckMenuLast(() => properties.bDynamicColorsBg[1]);
					menu.newSeparator(subMenu);
					menu.newEntry({
						menuName: subMenu, entryText: 'Listen to color-servers', func: () => {
							properties.bOnNotifyColors[1] = !properties.bOnNotifyColors[1];
							overwriteProperties(properties);
							if (properties.bOnNotifyColors[1]) {
								window.NotifyOthers('Colors: ask color scheme', window.ScriptInfo.Name + ': set color scheme');
								window.NotifyOthers('Colors: ask color', window.ScriptInfo.Name + ': set colors');
							}
						}
					});
					menu.newCheckMenuLast(() => properties.bOnNotifyColors[1]);
					menu.newEntry({
						menuName: subMenu, entryText: 'Act as color-server', func: () => {
							properties.bNotifyColors[1] = !properties.bNotifyColors[1];
							overwriteProperties(properties);
							if (properties.bNotifyColors[1] && background.scheme) {
								window.NotifyOthers('Colors: set color scheme', background.scheme);
							}
						}
					});
					menu.newCheckMenuLast(() => properties.bNotifyColors[1]);
				}
			}
			{ // NOSONAR
				{	// Point size
					const menuName = menu.newMenu('Points size', menuUI, properties.pointMode[1] === 1 && !worldMap.properties.panelMode[1] ? MF_GRAYED : MF_STRING);
					const options = [7, 10, 12, 14, 16, 20, 30, 'sep', 'Custom...\t' + _b(properties.pointSize[1])];
					const optionsLength = options.length;
					options.forEach((item, i) => {
						menu.newEntry({
							menuName, entryText: item, func: () => {
								if (i === optionsLength - 1) {
									let input = '';
									try { input = Number(utils.InputBox(window.ID, 'Input size:', window.ScriptInfo.Name + ': Country points size', properties.pointSize[1], true)); }
									catch (e) { return; } // eslint-disable-line no-unused-vars
									if (Number.isNaN(input)) { return; }
									properties.pointSize[1] = input;
								} else { properties.pointSize[1] = item; }
								if (properties.pointSize[1] === worldMap.pointSize) { return; }
								worldMap.pointSize = properties.pointSize[1];
								worldMap.pointLineSize = properties.bPointFill[1] ? worldMap.pointSize : worldMap.pointSize * 2 + 5;
								repaint(void (0), true);
								overwriteProperties(properties);
							}
						});
					});
					menu.newCheckMenuLast((o, len) => {
						const idx = o.indexOf(worldMap.pointSize);
						return (idx !== -1 ? idx : len - 1);
					}, options);
				}
				{	// Text size
					const menuName = menu.newMenu('Text size', menuUI);
					const options = [7, 8, 9, 10, 11, 12, 'sep', 'Custom...\t' + _b(properties.fontSize[1])];
					const optionsLength = options.length;
					options.forEach((item, i) => {
						menu.newEntry({
							menuName, entryText: item, func: () => {
								if (i === optionsLength - 1) {
									let input = '';
									try { input = Number(utils.InputBox(window.ID, 'Input size:', window.ScriptInfo.Name + ': Text size', properties.pointSize[1], true)); }
									catch (e) { return; } // eslint-disable-line no-unused-vars
									if (Number.isNaN(input)) { return; }
									properties.fontSize[1] = input;
								} else { properties.fontSize[1] = item; }
								if (properties.fontSize[1] === worldMap.fontSize) { return; }
								worldMap.fontSize = properties.fontSize[1];
								worldMap.calcScale(window.Width, window.Height);
								repaint(void (0), true);
								overwriteProperties(properties);
							}
						});
					});
					menu.newCheckMenuLast((o, len) => {
						const idx = o.indexOf(properties.fontSize[1]);
						return (idx !== -1 ? idx : len - 1);
					}, options);
				}
			}
			menu.newSeparator(menuUI);
			menu.newMenu('Background', menuUI);
			menu.newSeparator(menuUI);
			{	// Header
				const menuName = menu.newMenu('Header', menuUI);
				menu.newEntry({
					menuName, entryText: 'Show header', func: () => {
						properties.bShowHeader[1] = !properties.bShowHeader[1];
						repaint(fb.IsPlaying, true);
						overwriteProperties(properties);
					}
				});
				menu.newCheckMenuLast(() => properties.bShowHeader[1]);
				menu.newSeparator(menuName);
				menu.newEntry({
					menuName, entryText: 'Show current country', func: () => {
						properties.bShowLocale[1] = !properties.bShowLocale[1];
						repaint(fb.IsPlaying, true);
						overwriteProperties(properties);
					}, flags: properties.bShowHeader[1] ? MF_STRING : MF_GRAYED
				});
				menu.newCheckMenuLast(() => properties.bShowLocale[1]);
				menu.newEntry({
					menuName, entryText: 'Show flag', func: () => {
						properties.bShowFlag[1] = !properties.bShowFlag[1];
						repaint(fb.IsPlaying, true);
						overwriteProperties(properties);
					}, flags: properties.bShowHeader[1] ? MF_STRING : MF_GRAYED
				});
				menu.newCheckMenuLast(() => properties.bShowFlag[1]);
				menu.newEntry({
					menuName, entryText: 'Header full panel size', func: () => {
						properties.bFullHeader[1] = !properties.bFullHeader[1];
						window.Repaint();
						overwriteProperties(properties);
					}, flags: properties.bShowHeader[1] ? MF_STRING : MF_GRAYED
				});
				menu.newCheckMenuLast(() => properties.bFullHeader[1]);
				menu.newSeparator(menuName);
				{
					const subMenuName = menu.newMenu('Header position', menuName, properties.bShowHeader[1] ? MF_STRING: MF_GRAYED);
					const options = [
						{ val: 'top', entryText: 'Top (panel)'},
						{ val: 'top-map', entryText: 'Top (map)'},
						{ val: 'over-map', entryText: 'Over map'},
						{ val: 'bottom', entryText: 'Bottom (panel)'},
						{ val: 'bottom-map', entryText: 'Bottom (map)'},
						{ val: 'below-map', entryText: 'Below map'},
					];
					options.forEach((opt) => {
						menu.newEntry({
							menuName: subMenuName, entryText: opt.entryText, func: () => {
								properties.headerPosition[1] = opt.val;
								window.Repaint();
								overwriteProperties(properties);
							}, flags: properties.bShowHeader[1] ? MF_STRING : MF_GRAYED
						});
					});
					menu.newCheckMenuLast(() => options.findIndex((opt) => opt.val === properties.headerPosition[1]), options);
				}
				{
					const subMenuName = menu.newMenu('Flag position', menuName, properties.bShowHeader[1] && properties.bShowFlag[1] ? MF_STRING: MF_GRAYED);
					const options = [
						{ val: 'left', entryText: 'Left'},
						{ val: 'center', entryText: 'Center'},
						{ val: 'right', entryText: 'Right'},
						{ val: 'both', entryText: 'Both sides'}
					];
					options.forEach((opt) => {
						menu.newEntry({
							menuName: subMenuName, entryText: opt.entryText, func: () => {
								properties.flagPosition[1] = opt.val;
								repaint(fb.IsPlaying, true);
								overwriteProperties(properties);
							}, flags: properties.bShowHeader[1] && properties.bShowFlag[1] ? MF_STRING : MF_GRAYED
						});
					});
					menu.newCheckMenuLast(() => options.findIndex((opt) => opt.val === properties.flagPosition[1]), options);
				}
			}
			{	// Layers
				const menuName = menu.newMenu('Country highlighting', menuUI);
				const options = ['Use points', 'Use country layers', 'Use both'];
				options.forEach((option, i) => {
					menu.newEntry({
						menuName, entryText: option, func: () => {
							if (i >= 1 && properties.iLimitSelection[1] > selLimitLow) { fb.ShowPopupMessage('It\'s strongly recommended to use a selection limit low value when using country layers (\'UI\\Country highlighting\'), since they have high processing and memory requirements.\n\nIf you experience slowdowns, reduce it (recommended <= ' + selLimitLow + ').', window.ScriptInfo.Name + ': Selection limit'); }
							properties.pointMode[1] = i;
							repaint(void (0), true);
							overwriteProperties(properties);
						},
						flags: properties.memMode[1] >= 2 ? MF_GRAYED : MF_STRING
					});
				});
				menu.newCheckMenuLast(() => { return properties.pointMode[1]; }, options);
				menu.newSeparator(menuName);
				menu.newEntry({
					menuName, entryText: 'Fill the point', func: () => {
						properties.bPointFill[1] = !properties.bPointFill[1];
						worldMap.pointLineSize = properties.bPointFill[1] ? worldMap.pointSize : worldMap.pointSize * 2 + 5;
						repaint(void (0), true);
						overwriteProperties(properties);
					}, flags: properties.pointMode[1] === 0 || properties.pointMode[1] === 2 ? MF_STRING : MF_GRAYED
				});
				menu.newCheckMenuLast(() => properties.bPointFill[1]);
			}
			menu.newSeparator(menuUI);
			menu.newEntry({
				menuName: menuUI, entryText: 'Share UI settings...', func: () => {
					worldMap.shareUiSettings('popup');
				}
			});
		}
		menu.newSeparator();
		{	// Tags
			const menuName = menu.newMenu('Tags');
			menu.newEntry({
				menuName, entryText: 'Read country\'s data from...' + '\t' + _b(properties.mapTag[1].cut(10)), func: () => {
					let input = Input.string('string', properties.mapTag[1], 'Enter Tag name or TF expression:', window.ScriptInfo.Name + ': Locale tag reading', '$meta(' + globTags.locale + ',$sub($meta_num(' + globTags.locale + '),1))');
					if (input === null) { return; }
					properties.mapTag[1] = input;
					overwriteProperties(properties);
				}
			});
			menu.newEntry({
				menuName, entryText: 'Write country\'s data to...' + '\t' + _b(properties.writeToTag[1]), func: () => {
					let input = Input.string('string', properties.writeToTag[1], 'Enter Tag name:', window.ScriptInfo.Name + ': Locale tag writing', globTags.locale);
					if (input === null) { return; }
					properties.writeToTag[1] = input;
					overwriteProperties(properties);
				}
			});
			menu.newEntry({
				menuName, entryText: 'Split multi-value country tag by \'|\'', func: () => {
					properties.bSplitTags[1] = !properties.bSplitTags[1];
					overwriteProperties(properties);
					worldMap.bSplitTags = properties.bSplitTags[1];
					repaint(void (0), true);
				}
			});
			menu.newCheckMenuLast(() => properties.bSplitTags[1]);
			menu.newSeparator(menuName);
			menu.newEntry({
				menuName, entryText: 'Split multi-value artist tag by \', \'', func: () => {
					properties.bSplitIds[1] = !properties.bSplitIds[1];
					overwriteProperties(properties);
					worldMap.bSplitIds = properties.bSplitIds[1];
					repaint(void (0), true);
				}
			});
			menu.newCheckMenuLast(() => properties.bSplitIds[1]);
			menu.newEntry({
				menuName, entryText: 'Don\'t split currently displayed artist', func: () => {
					if (worldMap.splitExcludeId.isSuperset(selJsonId)) {
						selJsonId.forEach((id) => worldMap.splitExcludeId.delete(id));
					} else {
						selJsonId.forEach((id) => worldMap.splitExcludeId.add(id));
					}
					saveUserDefFile(globNoSplitArtist);
				}, flags: worldMap.lastPoint.length === 1 && selJsonId.size === 1 ? MF_STRING : MF_GRAYED
			});
			menu.newCheckMenuLast(() => selJsonId.size === 1 && worldMap.splitExcludeId.isSuperset(selJsonId));
			menu.newSeparator(menuName);
			{	// Modifier tags
				const subMenuName = menu.newMenu('Modifier tags for playlists', menuName);
				menu.newEntry({ menuName: subMenuName, entryText: 'Used with (Key) + L. Click:', func: null, flags: MF_GRAYED });
				menu.newSeparator(subMenuName);
				modifiers.forEach((mod) => {
					menu.newEntry({
						menuName: subMenuName, entryText: _p(mod.description) + ' tag(s)' + '\t' + _b(properties[mod.tag][1]), func: () => {
							let input = '';
							try { input = utils.InputBox(window.ID, 'Input tag name(s) (sep by \',\')', window.ScriptInfo.Name + ': Playlist tags', properties[mod.tag][1], true); }
							catch (e) { return; } // eslint-disable-line no-unused-vars
							if (!input.length) { return; }
							properties[mod.tag][1] = input;
							overwriteProperties(properties);
						}
					});
				});
			}
			menu.newSeparator(menuName);
			{	// Write tags?
				const subMenuName = menu.newMenu('Write tags on playback', menuName, properties.panelMode[1] ? MF_GRAYED : MF_STRING);
				menu.newEntry({ menuName: subMenuName, entryText: 'Used along WilB\'s Biography script:', func: null, flags: MF_GRAYED });
				menu.newSeparator(subMenuName);
				const options = [
					{ text: 'No (read only from tags, Biography or JSON)', val: 0 },
					{ text: 'Yes, to track files if tag is missing', val: 1 },
					{ text: 'Yes, use JSON database (for internal use)', val: 2 }
				];
				options.forEach((mode) => {
					menu.newEntry({
						menuName: subMenuName, entryText: mode.text, func: () => {
							if (properties.iWriteTags[1] === mode.val) { return; }
							if (mode.val) { // Warning check
								let answer = WshShell.Popup('Warning: Writing tags on playback has 2 requirements:\n- WilB\'s Biography mod installed (loaded on another panel).\n- Both configured with the same selection mode (done automatically when mod is installed).\n\nNot following these requisites will make the feature to not work or work unexpectedly.\nDo you want to continue?', 0, window.ScriptInfo.Name + ': Biography integration', popup.question + popup.yes_no);
								if (answer === popup.no) { return; }
							}
							properties.iWriteTags[1] = mode.val;
							overwriteProperties(properties);
						}
					});
				});
				menu.newCheckMenuLast(() => { return properties.iWriteTags[1]; }, options);
				menu.newSeparator(subMenuName);
				menu.newEntry({
					menuName: subMenuName, entryText: 'Show data folder', func: () => {
						_explorer(properties.fileName[1]);
					}, flags: () => { return _isFile(properties.fileName[1]) ? MF_STRING : MF_GRAYED; }
				});
			}
		}
		{	// Database
			const menuDatabase = menu.newMenu(
				'Database'
			);
			{ // NOSONAR
				const sources = properties.iWriteTags[1] === 2
					? 'Tags (read) + JSON (write)'
					: properties.iWriteTags[1] === 1
						? 'Tags (write) + JSON (read)'
						: 'Tags (read) + JSON (read)';
				menu.newEntry({ menuName: menuDatabase, entryText: 'Sources: ' + sources, flags: MF_GRAYED });
				menu.newSeparator(menuDatabase);
				menu.newEntry({
					menuName: menuDatabase, entryText: 'Find artists without locale tags...', func: () => {
						const notFoundList = new FbMetadbHandleList();
						const jsonIdList = new Set(); // only one track per artist
						const handleList = fb.GetLibraryItems();
						handleList.Convert().forEach((handle) => {
							// worldMap.jsonId = artist
							const jsonId = getHandleListTagsV2(new FbMetadbHandleList(handle), [worldMap.jsonId], { bMerged: true, splitBy: worldMap.bSplitIds ? ', ' : null }).flat(Infinity);
							let bAdded = false;
							jsonId.forEach((id) => {
								if (!jsonIdList.has(id)) {
									if (properties.iWriteTags[1] === 0) {
										if (worldMap.hasDataById(id)) { return; }
										else {
											const tagName = properties.mapTag[1];
											const tfo = _bt(tagName);
											if (!fb.TitleFormat(tfo).EvalWithMetadb(handle).length) {
												if (!bAdded) { notFoundList.Add(handle); bAdded = true; }
												jsonIdList.add(id);
											}
										}
									} else if (properties.iWriteTags[1] === 2 && !worldMap.hasDataById(id)) { // Check if tag exists on json
										if (!bAdded) { notFoundList.Add(handle); bAdded = true; }
										jsonIdList.add(id);
									} else if (properties.iWriteTags[1] === 1) { // Check if tag exists on file
										const tagName = properties.mapTag[1];
										const tfo = _bt(tagName);
										if (!fb.TitleFormat(tfo).EvalWithMetadb(handle).length) {
											if (!bAdded) { notFoundList.Add(handle); bAdded = true; }
											jsonIdList.add(id);
										}
									}
								}
							});
						});
						if (notFoundList.Count) {
							sendToPlaylist(notFoundList, window.ScriptInfo.Name  + ' missing tags');
						} else {
							fb.ShowPopupMessage('All artists on library have a locale tag associated.', window.ScriptInfo.Name + ': Database update');
						}
					}
				});
				menu.newSeparator(menuDatabase);
				menu.newEntry({
					menuName: menuDatabase, entryText: 'Merge JSON databases...', func: () => {
						let input = '';
						try { input = utils.InputBox(window.ID, 'Enter path to JSON file:', window.ScriptInfo.Name + ': Merge JSON database', folders.data + 'worldMap.json', true); }
						catch (e) { return; } // eslint-disable-line no-unused-vars
						if (!input.length) { return; }
						let answer = WshShell.Popup('Do you want to overwrite duplicated entries?', 0, window.ScriptInfo.Name + ': Merge JSON database', popup.question + popup.yes_no);
						let countN = 0;
						let countO = 0;
						const newData = _jsonParseFileCheck(input, 'Database json', window.ScriptInfo.Name + ': Merge JSON database', utf8);
						if (newData) {
							newData.forEach((data) => {
								if (!worldMap.hasDataById(data[worldMap.jsonId])) {
									worldMap.saveData(data);
									countN++;
								} else if (answer === popup.yes && !isArrayEqual(worldMap.getDataById(data[worldMap.jsonId]).val, data.val)) {
									worldMap.deleteDataById(data[worldMap.jsonId]);
									worldMap.saveData(data);
									countO++;
								}
							});
						}
						if (countN || countO) {
							saveLibraryTags(properties.fileNameLibrary[1], worldMap.jsonId, worldMap); // Also update library mode
							repaint(void (0), true);
						}
						console.log(window.ScriptInfo.Name + ': merging database done (' + countN + ' new entries - ' + countO + ' overwritten entries)');
					}
				});
				menu.newEntry({
					menuName: menuDatabase, entryText: 'Merge file tags with JSON...', func: () => {
						let answer = WshShell.Popup('Do you want to overwrite duplicated entries?', 0, window.ScriptInfo.Name + ': Merge tags into database', popup.question + popup.yes_no);
						let countN = 0;
						let countO = 0;
						const handleList = fb.GetLibraryItems();
						const jsonId = getHandleListTagsV2(handleList, [worldMap.jsonId], { bMerged: true, splitBy: worldMap.bSplitIds ? ', ' : null });
						const tag = getHandleListTags(handleList, [properties.writeToTag[1]], { bMerged: true }); // locale
						handleList.Convert().forEach((handle, i) => {
							if (jsonId[i].length) {
								jsonId[i].forEach((id) => {
									if (tag[i] && tag[i].length && tag[i].filter(Boolean).length) { // Only merge if not empty
										const data = { [worldMap.jsonId]: id, val: tag[i] };
										if (!worldMap.hasDataById(id)) {
											worldMap.saveData(data);
											countN++;
										} else if (answer === popup.yes && !isArrayEqual(worldMap.getDataById(jsonId[i]).val, tag[i])) {
											worldMap.deleteDataById(id);
											worldMap.saveData(data);
											countO++;
										}
									}
								});
							}
						});
						if (countN || countO) {
							saveLibraryTags(properties.fileNameLibrary[1], worldMap.jsonId, worldMap); // Also update library mode
							repaint(void (0), true);
						}
						console.log(window.ScriptInfo.Name + ': writing file tags to database done (' + countN + ' new entries - ' + countO + ' overwritten entries)');
					}
				});
				menu.newEntry({
					menuName: menuDatabase, entryText: 'Write JSON tags to tracks...', func: () => {
						let answer = WshShell.Popup('Do you want to overwrite duplicated entries?', 0, window.ScriptInfo.Name + ': Write tags to tracks', popup.question + popup.yes_no);
						let countN = 0;
						let countO = 0;
						const handleList = fb.GetLibraryItems();
						const toTagList = new FbMetadbHandleList();
						const toTagValues = [];
						// worldMap.jsonId = artist
						const jsonId = getHandleListTagsV2(handleList, [worldMap.jsonId], { bMerged: true, splitBy: worldMap.bSplitIds ? ', ' : null });
						const tag = getHandleListTags(handleList, [properties.writeToTag[1]], { bMerged: true }); // locale
						const newData = worldMap.getData();
						if (newData && newData.length) {
							handleList.Convert().forEach((handle, i) => {
								if (jsonId[i].length) {
									jsonId[i].forEach((id) => {
										newData.forEach((data) => {
											if (data[worldMap.jsonId] === id && data.val && data.val.length && data.val.filter(Boolean).length) {
												const iTag = tag[i];
												let bDone;
												if (!iTag || !iTag.length || !iTag.filter(Boolean).length) {
													bDone = true;
													countN++;
												} else if (answer === popup.yes && !isArrayEqual(data.val, iTag)) {
													bDone = true;
													countO++;
												}
												if (bDone) {
													toTagList.Add(handle);
													toTagValues.push({ [properties.writeToTag[1]]: data.val });
												}
											}
										});
									});
								}
							});
						}
						if (toTagList.Count) { toTagList.UpdateFileInfoFromJSON(JSON.stringify(toTagValues)); }
						if (countN || countO) { repaint(void (0), true); }
						console.log(window.ScriptInfo.Name + ': writing back database tags to files done (' + countN + ' new entries - ' + countO + ' overwritten entries)');
					}
				});
				menu.newSeparator(menuDatabase);
				menu.newEntry({
					menuName: menuDatabase, entryText: 'Update library database...', func: () => {
						fb.ShowPopupMessage('The statistics of artists per country from your tracked library have been updated (see console log for more info).\n\nThis data is then used on \'Library\' and \'Statistics\' display modes.' + (properties.iWriteTags[1] === 0 ? '\n\nWarning: when using tags/JSON sources on read-only mode, any artist with missing data will be indefinitely skipped unless you manually tag such tracks.' : ''), window.ScriptInfo.Name + ': Update JSON library database');
						saveLibraryTags(properties.fileNameLibrary[1], worldMap.jsonId, worldMap);
						console.log(window.ScriptInfo.Name + ': saving library database done. Switch panel mode to \'Library mode\' to use it.');
						if (worldMap.properties.panelMode[1] == 1 || worldMap.properties.panelMode[1] === 3) { repaint(void (0), true, true); }
					}
				});
				menu.newSeparator();
			}
		}
		{ // NOSONAR
			const menuName = menu.newMenu('Updates');
			menu.newEntry({
				menuName, entryText: 'Automatically check for updates', func: () => {
					properties.bAutoUpdateCheck[1] = !properties.bAutoUpdateCheck[1];
					overwriteProperties(properties);
					if (properties.bAutoUpdateCheck[1]) {
						if (typeof checkUpdate === 'undefined') { include('..\\..\\helpers\\helpers_xxx_web_update.js'); }
						setTimeout(checkUpdate, 1000, { bDownload: globSettings.bAutoUpdateDownload, bOpenWeb: globSettings.bAutoUpdateOpenWeb, bDisableWarning: false });
					}
				}
			});
			menu.newCheckMenuLast(() => properties.bAutoUpdateCheck[1]);
			menu.newSeparator(menuName);
			menu.newEntry({
				menuName, entryText: 'Check for updates...', func: () => {
					if (typeof checkUpdate === 'undefined') { include('..\\..\\helpers\\helpers_xxx_web_update.js'); }
					checkUpdate({ bDownload: globSettings.bAutoUpdateDownload, bOpenWeb: globSettings.bAutoUpdateOpenWeb, bDisableWarning: false })
						.then((bFound) => !bFound && fb.ShowPopupMessage('No updates found.', window.FullPanelName + ': Update check'));
				}
			});
		}
		menu.newSeparator();
		{	// Readmes
			const readmePath = folders.xxx + 'helpers\\readme\\world_map.txt';
			menu.newEntry({
				entryText: 'Open readme...', func: () => {
					const readme = _open(readmePath, utf8); // Executed on script load
					if (readme.length) { fb.ShowPopupMessage(readme, window.ScriptInfo.Name); }
					else { console.log(window.ScriptInfo.Name + ': Readme not found\n\t ' + readmePath); }
				}
			});
		}
	}
	return menu;
}

function importSettingsMenu() {
	const menu = new _menu();
	menu.newEntry({ entryText: 'Panel menu: ' + window.PanelName, flags: MF_GRAYED });
	menu.newSeparator();
	menu.newEntry({
		entryText: 'Export panel settings...', func: () => {
			const bData = WshShell.Popup('Also export database files?', 0, window.ScriptInfo.Name + ': Export panel settings', popup.question + popup.yes_no);
			exportSettings(
				worldMap.properties,
				bData
					? [worldMap.properties.fileName[1], worldMap.properties.fileNameLibrary[1]]
					: [],
				window.ScriptInfo.Name
			);
		}
	});
	menu.newEntry({
		entryText: 'Import panel settings...', func: () => {
			const dataPaths = new Set();
			importSettings(
				{
					onLoadSettings: (settings, bFound, panelName) => { // eslint-disable-line no-unused-vars
						if (settings) {
							dataPaths.add(settings.fileName[1]).add(settings.fileNameLibrary[1]);
							console.log(panelName + ': importing data files\n\t ' + [...dataPaths].join('\n\t '));
							return true;
						}
						return false;
					},
					onUnzipData: (importPath, panelName) => { // eslint-disable-line no-unused-vars
						const bDone = getFiles(importPath, new Set(['.json']))
							.map((file) => {
								const newFile = [...dataPaths].find((path) => path.endsWith(file.replace(importPath, '')));
								if (newFile) {
									dataPaths.delete(newFile);
									return _moveFile(file, newFile);
								}
								return false;
							})
							.every((done) => {
								if (!done) {
									console.popup(panelName + ': failed importing database files.', window.FullPanelName);
									return false;
								}
								return true;
							});
						if (bDone) { console.log(panelName + ': imported database files'); }
						return bDone;
					}
				},
				worldMap.properties,
				window.ScriptInfo.Name
			);
		}
	});
	menu.newSeparator();
	menu.newEntry({
		entryText: 'Share UI settings...', func: () => {
			worldMap.shareUiSettings('popup');
		}
	});
	menu.newSeparator();
	menu.newEntry({
		entryText: 'Configure panel...', func: () => window.ShowConfigureV2()
	});
	menu.newEntry({
		entryText: 'Panel properties...', func: () => window.ShowProperties()
	});
	menu.newSeparator();
	menu.newEntry({
		entryText: 'Reload panel', func: () => window.Reload()
	});
	return menu;
}

function syncBio(bReload = false) {
	const properties = worldMap.properties;
	// Biography 1.1.X
	window.NotifyOthers(window.ScriptInfo.Name  + ' notifySelectionProperty', properties.selection[1] === selMode[0]); // synchronize selection property
	// Biography 1.2.X
	window.NotifyOthers('bio_focusPpt', properties.selection[1] === selMode[0]);  // synchronize selection property 1.2.0 Beta
	window.NotifyOthers('bio_followSelectedTrack', properties.selection[1] === selMode[0]);  // synchronize selection property
	window.NotifyOthers('bio_newCfg', { notifyTags_internal: true }); // notify tags
	// Biography 2.X.X
	const configPath = fb.ProfilePath + '\\yttm\\biography.cfg';
	if (_isFile(configPath)) { // activate notify tags
		const config = _jsonParseFileCheck(configPath, 'Configuration json', window.ScriptInfo.Name  + ': Biography integration');
		if (config && Object.hasOwn(config, 'notifyTags') && !config.notifyTags) {
			config.notifyTags = true;
			_save(configPath, JSON.stringify(config, null, '\t'));
			if (bReload) { window.NotifyOthers('bio_refresh', null); }  // Reload Biography panel
		}
	}
}