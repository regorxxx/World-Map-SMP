'use strict';
//12/05/22

include('menu_xxx.js');
include('helpers_xxx.js');
include('helpers_xxx_tags.js');
include('helpers_xxx_playlists.js');

const menu = new _menu();

function createMenu() {
	menu.clear(true); // Reset on every call
	{	
		{	// Enabled?
			const menuName = menu.newMenu('Map panel functionality');
			const options = [{text: 'Enabled' + nextId('invisible', true, false), val: true}, {text: 'Disabled' + nextId('invisible', true, false), val: false}];
			menu.newEntry({menuName, entryText: 'Switch all functionality:', func: null, flags: MF_GRAYED});
			menu.newEntry({menuName, entryText: 'sep'});
			options.forEach( (mode) => {
				menu.newEntry({menuName, entryText: mode.text, func: () => {
					if (worldMap.properties['bEnabled'][1] === mode.val) {return;}
					worldMap.properties['bEnabled'][1] = mode.val; // And update property with new value
					overwriteProperties(worldMap.properties); // Updates panel
					window.Repaint();
				}});
			});
			menu.newCheckMenu(menuName, options[0].text, options[options.length - 1].text,  () => {return (worldMap.properties['bEnabled'][1] ? 0 : 1);});
		}
		{	// Panel mode
			const menuName = menu.newMenu('Map panel mode');
			const options = ['Standard mode (selection & playback)' , 'Library mode (all artist on library)'];
			menu.newEntry({menuName, entryText: 'Switch panel mode:', func: null, flags: MF_GRAYED});
			menu.newEntry({menuName, entryText: 'sep'});
			options.forEach( (mode, idx) => {
				menu.newEntry({menuName, entryText: mode, func: () => {
					if (worldMap.properties['panelMode'][1] === idx) {return;}
					worldMap.properties['panelMode'][1] = idx; // And update property with new value
					overwriteProperties(worldMap.properties); // Updates panel
					if (worldMap.properties['panelMode'][1]) {
						fb.ShowPopupMessage('Instead of showing the country of the currently selected or playing track(s), shows all countries found on the library.\n\nEvery point will show num of artists per country (and points are clickable to creat playlists the same than standard mode).\n\nStatisttics data is not calculated on real time but uses a cached database which may be updated on demand (\'Database\\Update library database...\')', window.Name);
					} else {
						fb.ShowPopupMessage('Standard mode, showing the country of the currently selected or playing track(s), the same than Bio panel would do.\n\nSelection mode may be switched at menus. Following selected tracks has a selection limit set at properties to not display too many points at once while processing large lists.', window.Name);
					}
					worldMap.clearIdSelected();
					worldMap.clearLastPoint(); 
					window.Repaint();
				}});
			});
			menu.newCheckMenu(menuName, options[0], options[options.length - 1],  () => {return worldMap.properties['panelMode'][1];});
		}
		{	// Enabled Biography?
			const menuName = menu.newMenu('WilB\'s Biography integration', void(0), worldMap.properties['panelMode'][1] ? MF_GRAYED : MF_STRING);
			const options = [{text: 'Enabled' + nextId('invisible', true, false), val: true}, {text: 'Disabled' + nextId('invisible', true, false), val: false}];
			menu.newEntry({menuName, entryText: 'Switch Biography functionality:', func: null, flags: MF_GRAYED});
			menu.newEntry({menuName, entryText: 'sep'});
			options.forEach( (mode) => {
				menu.newEntry({menuName, entryText: mode.text, func: () => {
					if (worldMap.properties['bEnabledBiography'][1] === mode.val) {return;}
					if (mode.val) { // Warning check
						let answer = WshShell.Popup('Warning! Enabling WilB\'s Biography integration requires selection mode to be set the same on both panels. So everytime a tag is not found locally, the online tag is used instead.\n\nSelection mode will be synchronized automatically whenever one of the panels change it.\nDo you want to continue?', 0, window.Name, popup.question + popup.yes_no);
						if (answer === popup.no) {return;}
					}
					worldMap.properties['bEnabledBiography'][1] = mode.val; // And update property with new value
					overwriteProperties(worldMap.properties); // Updates panel
					syncBio(true); // Sync selection and enable notify tags
					window.Repaint();
				}, flags: () => {return (worldMap.properties.bInstalledBiography[1] ? MF_STRING : MF_GRAYED);}});
			});
			menu.newCheckMenu(menuName, options[0].text, options[options.length - 1].text,  () => {return (worldMap.properties['bEnabledBiography'][1] ? 0 : 1);});
			menu.newEntry({menuName, entryText: 'sep'});
			menu.newEntry({menuName, entryText: () => {return (worldMap.properties.bInstalledBiography[1] ? 'Uninstall (revert changes)' : 'Check installation (required to enable)');}, func: () => {
				let  foundArr = [];
				// Biography 1.2.X
				// There are 2 paths here: beta versions require some file changes, while the 1.2.0+ releases work as is
				let packageFile = '';
				const file1_2_0_beta = 'biography_mod_1_2_0_beta_xxx.js';
				{
					const idFolder = '{BA9557CE-7B4B-4E0E-9373-99F511E81252}';
					let packagePath;
					try {packagePath = utils.GetPackagePath(idFolder);} // Exception when not found
					catch(e) {packagePath = '';}
					packageFile = packagePath.length ? packagePath + '\\scripts\\callbacks.js' : '';
					const modPackageText = '\ninclude(\'' + file1_2_0_beta + '\');';
					if (_isFile(packageFile)) {
						const packageText = _jsonParseFileCheck(packagePath + '\\package.json', 'Package json', window.Name);
						if (packageText) {
							if (packageText.version === '1.2.0-Beta.1' || packageText.version === '1.2.0-Beta.2') {
								const fileText = _open(packageFile);
								if (!fileText.length) {return;}
								if (!worldMap.properties.bInstalledBiography[1]) {
									if (fileText.indexOf(modPackageText) === -1) {foundArr.push({path: packageFile, ver: packageText.version});} // When installing, look for not modified script
								} else {
									if (fileText.indexOf(modPackageText) !== -1) {foundArr.push({path: packageFile, ver: packageText.version});} // Otherwise, look for the mod string
								}
							} else { // 1.2.0+: requires no further changes
								let answer = WshShell.Popup('Found WilB\'s Biography greater than 1.2.0 which works \'as is\' without file modifications.\nIntegration will continue to work even in future updates without further action.\n' + (worldMap.properties.bInstalledBiography[1] ? 'Disable installation?' : 'Enable installation?'), 0, window.Name, popup.question + popup.yes_no);
								if (answer === popup.yes) {
									// Change config
									worldMap.properties.bInstalledBiography[1] = !worldMap.properties.bInstalledBiography[1];
									worldMap.properties.bEnabledBiography[1] = worldMap.properties.bInstalledBiography[1];
									overwriteProperties(worldMap.properties); // Updates panel
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
					const fileArr = findRecursivefile('*.js', [fb.ProfilePath, fb.ComponentPath]); // All possible paths for the scripts
					const idText = 'window.DefinePanel(\'Biography\', {author:\'WilB\', version: \'1.1.'; // 1.1.3 or 1.1.2
					fileArr.forEach( (file) => {
						const fileText = _open(file);
						if (!fileText.length) {return;}
						if (fileText.indexOf(idText) !== -1 && fileText.indexOf('omit this same script') === -1) { // Omit this one from the list!
							if (!worldMap.properties.bInstalledBiography[1]) {
								if (fileText.indexOf(modText) === -1) {foundArr.push({path: file, ver: '1.1.X'});} // When installing, look for not modified script
							} else {
								if (fileText.indexOf(modText) !== -1) {foundArr.push({path: file, ver: '1.1.X'});} // Otherwise, look for the mod string
							}
						}
					});
				}
				// Select files to edit
				let input = '';
				if (foundArr.length) {fb.ShowPopupMessage('Found these files:\n' + foundArr.map((_, idx) => {return '\n' + (idx + 1) + ': ' + _.path + '  (' + _.ver + ')';}).join(''), window.Name);}
				else {fb.ShowPopupMessage('WilB\'s ' + (worldMap.properties.bInstalledBiography[1] ? 'modified ' : '') +'Biography script not found neither in the profile nor in the component folder.\nIf you are doing a manual install, edit or replace the files and change the property on this panel manually:\n\'' + worldMap.properties.bInstalledBiography[0] + '\'', window.Name); return;}
				try {input = utils.InputBox(window.ID, 'Select by number the files to edit (sep by comma).\nCheck new window for paths' + '\nNumber of files: ' + foundArr.length, window.Name);}
				catch (e) {return;}
				if (!input.trim().length) {return;}
				input = input.trim().split(',');
				if (input.some((idx) => {return idx > foundArr.length;})) {return;}
				let selectFound = [];
				input.forEach( (idx) => {selectFound.push(foundArr[idx - 1]);});
				// Install
				let bDone = true;
				const backupExt = '.back';
				selectFound.forEach( (selected) => {
					if (!bDone) {return;}
					const file = selected.path;
					const folderPath = utils.SplitFilePath(file)[0];
					console.log('World Map: Editing file ' + file);
					if (selected.ver  === '1.1.X') { // Biography 1.1.X
						if (!worldMap.properties.bInstalledBiography[1]) {
							if (!_isFile(file + backupExt)) {
								bDone = _copyFile(file, file + backupExt);
							} else {bDone = false; fb.ShowPopupMessage('Selected file already has a backup. Edit aborted.\n' + file, window.Name); return;}
							if (bDone) {
								bDone = _copyFile(folders.xxx + 'helpers\\' + file1_1_X, folderPath + file1_1_X);
							} else {fb.ShowPopupMessage('Error creating a backup.\n' + file, window.Name); return;}
							if (bDone) {
								let fileText = _open(file);
								fileText += modText;
								bDone = fileText.length && _save(file, fileText);
							} else {fb.ShowPopupMessage('Error copying mod file.\n' + folderPath + file1_1_X, window.Name); return;}
							if (!bDone) {fb.ShowPopupMessage('Error editing the file.\n' + file, window.Name); return;}
						} else {
							let bDone = false;
							if (_isFile(file + backupExt)) {
								bDone = _recycleFile(file, true);
							} else {bDone = false; fb.ShowPopupMessage('Selected file does not have a backup. Edit aborted.\n' + file, window.Name); return;}
							if (bDone) {
								bDone = _renameFile(file + backupExt, file);
							} else {fb.ShowPopupMessage('Error deleting the modified file.\n' + file, window.Name); return;}
							if (!bDone) {fb.ShowPopupMessage('Error renaming the backup.\n' + file, window.Name); return;}
						}
					} else { // Biography 1.2.0 Beta 1 & 2
						if (!worldMap.properties.bInstalledBiography[1]) {
							if (!_isFile(file + backupExt)) {
								bDone = _copyFile(file, file + backupExt);
							} else {bDone = false; fb.ShowPopupMessage('Selected file already has a backup. Edit aborted.\n' + file, window.Name); return;}
							if (bDone) {
								bDone = _copyFile(folders.xxx + 'helpers\\' + file1_2_0_beta, folderPath + file1_2_0_beta);
							} else {fb.ShowPopupMessage('Error creating a backup.\n' + packageFile, window.Name); return;}
							if (bDone) {
								let fileText = _open(packageFile);
								fileText += modPackageText;
								bDone = fileText.length && _save(packageFile, fileText);
							} else {fb.ShowPopupMessage('Error copying mod file.\n' + folderPath + file1_2_0_beta, window.Name); return;}
						} else {
							if (_isFile(packageFile + backupExt)) {
								bDone = _recycleFile(packageFile);
							} else {bDone = false; fb.ShowPopupMessage('Selected file does not have a backup. Edit aborted.\n' + packageFile, window.Name); return;}
							if (bDone) {
								bDone = _renameFile(packageFile + backupExt, packageFile);
							} else {fb.ShowPopupMessage('Error deleting the modified file.\n' + packageFile, window.Name); return;}
							if (!bDone) {fb.ShowPopupMessage('Error renaming the backup.\n' + packageFilez, window.Name); return;}
						}
					}
				});
				// Report
				if (bDone) {fb.ShowPopupMessage('Script(s) modified sucessfully:\n' + selectFound.map((_) => {return _.path + '  (' + _.ver + ')';}).join('\n') + '\nBiography panel will be automatically reloaded.', window.Name);}
				else {fb.ShowPopupMessage('There were some errors during script modification. Check the other windows.', window.Name); return;}
				// Change config
				worldMap.properties.bInstalledBiography[1] = !worldMap.properties.bInstalledBiography[1];
				worldMap.properties.bEnabledBiography[1] = worldMap.properties.bInstalledBiography[1];
				overwriteProperties(worldMap.properties); // Updates panel
				syncBio(false); // Sync selection and enable notify tags
				window.NotifyOthers('refresh_bio', null);  // Reload panel Biography 1.1.X
				window.NotifyOthers('bio_refresh', null);  // Reload panel Biography 1.2.0+
			}});
		}
		menu.newEntry({entryText: 'sep'});
		{	// Selection mode
			const menuName = menu.newMenu('Selection mode', void(0), worldMap.properties['panelMode'][1] ? MF_GRAYED : MF_STRING);
			const options = selMode;
			options.forEach( (mode) => {
				menu.newEntry({menuName, entryText: mode, func: () => {
					if (worldMap.properties['selection'][1] === mode) {return;}
					if (worldMap.properties['bInstalledBiography'][1] && worldMap.properties['bEnabledBiography'][1]) { // Warning check
						let answer = WshShell.Popup('Warning! WilB\'s Biography integration is enabled. This setting will be applied on both panels!\n\nDo you want to continue?', 0, window.Name, popup.question + popup.yes_no);
						if (answer === popup.no) {return;}
					}
					worldMap.properties['selection'][1] = mode; // And update property with new value
					overwriteProperties(worldMap.properties); // Updates panel
					// When ppt.focus is true, then selmode is selMode[0]
					if (worldMap.properties.bEnabledBiography[1]) { // synchronize selection property
						syncBio(true); // Sync selection and enable notify tags
					}
					window.Repaint();
				}});
			});
			menu.newCheckMenu(menuName, options[0], options[options.length - 1],  (args = worldMap.properties) => {return options.indexOf(worldMap.properties['selection'][1]);});
		}
		menu.newEntry({entryText: 'sep'});
		{	// Modifier tags
			const menuName = menu.newMenu('Modifier tags for playlists');
			menu.newEntry({menuName, entryText: 'Used with (Key) + L. Click:', func: null, flags: MF_GRAYED});
			menu.newEntry({menuName, entryText: 'sep'});
			modifiers.forEach( (mod, index) => {
				menu.newEntry({menuName, entryText: _p(mod.description) + ' tag(s)' + '\t' + worldMap.properties[mod.tag][1], func: () => {
					let input = '';
					try {input = utils.InputBox(window.ID, 'Input tag name(s) (sep by \',\')', window.Name, worldMap.properties[mod.tag][1], true);} 
					catch(e) {return;}
					if (!input.length) {return;}
					worldMap.properties[mod.tag][1] = input; // And update property with new value
					overwriteProperties(worldMap.properties); // Updates panel
				}});
			});
		}
		menu.newEntry({entryText: 'sep'});
		{	// UI
			const menuUI = menu.newMenu('UI');
			{	// Map image
				const menuName = menu.newMenu('Map image', menuUI);
				menu.newEntry({menuName, entryText: 'Image used as background:', func: null, flags: MF_GRAYED});
				menu.newEntry({menuName, entryText: 'sep'});
				const options = [
					{text: 'Full', path: folders.xxx + 'images\\MC_WorldMap_B.jpg', factorX: 100, factorY: 100}, 
					{text: 'No Antarctica', path: folders.xxx + 'images\\MC_WorldMap_Y133_B.jpg', factorX: 100, factorY: 133},
					{text: 'Custom...'}
				];
				options.forEach( (map, index) => {
					menu.newEntry({menuName, entryText: map.text,  func: () => {
						if (index === options.length - 1) {
							let input = '';
							try {input = utils.InputBox(window.ID, 'Input a number (percentage)', window.Name, worldMap.imageMapPath, true);} 
							catch (e) {return;}
							if (!input.length) {return;}
							worldMap.imageMapPath = input;
							worldMap.properties.imageMapPath[1] = input; // And update property with new value
							overwriteProperties(worldMap.properties); // Updates panel
							menu.btn_up(void(0), void(0), void(0), 'Coordinates transformation\\X factor'); // Call factor input
							menu.btn_up(void(0), void(0), void(0), 'Coordinates transformation\\Y factor');
							worldMap.init();
							window.Repaint();
						} else {
							worldMap.imageMapPath = map.path;
							worldMap.factorX = map.factorX;
							worldMap.factorY = map.factorY;
							worldMap.properties.imageMapPath[1] = map.path; // And update property with new value
							worldMap.properties.factorX[1] = map.factorX;
							worldMap.properties.factorY[1] = map.factorY;
							overwriteProperties(worldMap.properties); // Updates panel
							worldMap.init();
							window.Repaint();
						}
					}});
				});
				menu.newCheckMenu(menuName, options[0].text, options[options.length - 1].text,  () => {
					let idx = options.findIndex((opt) => {return opt.path === worldMap.imageMapPath;});
					return (idx !== -1) ? idx : options.length - 1;
				});
			}
			{	// Coordinates factor
				const menuName = menu.newMenu('Coordinates transformation', menuUI);
				menu.newEntry({menuName, entryText: 'Apply a factor to any axis:', func: null, flags: MF_GRAYED});
				menu.newEntry({menuName, entryText: 'sep'});
				const options = [{text: 'X factor', val: 'factorX'}, {text: 'Y factor', val: 'factorY'}];
				if (worldMap.factorX !== 100) {options[0].text += '\t (not 100)';}
				if (worldMap.factorY !== 100) {options[1].text += '\t (not 100)';}
				options.forEach( (coord) => {
					menu.newEntry({menuName, entryText: coord.text,  func: () => {
						let input = -1;
						try {input = Number(utils.InputBox(window.ID, 'Input a number (percentage)', window.Name, worldMap.properties[coord.val][1], true));} 
						catch (e) {return;}
						if (!Number.isSafeInteger(input)) {return;}
						worldMap[coord.val] = input;
						worldMap.properties[coord.val][1] = input; // And update property with new value
						overwriteProperties(worldMap.properties); // Updates panel
						worldMap.clearPointCache();
						window.Repaint();
					}});
				});
			}
			menu.newEntry({menuName: menuUI, entryText: 'sep'});
			{
				const menuName = menu.newMenu('Colours...', menuUI);
				{	// Background color
					const subMenuName = menu.newMenu('Panel background', menuName);
					const options = [(window.InstanceType ? 'Use default UI setting' : 'Use columns UI setting'), 'No background', 'Custom'];
					const optionsLength = options.length;
					options.forEach((item, i) => {
						menu.newEntry({menuName: subMenuName, entryText: item, func: () => {
							worldMap.customPanelColorMode = i;
							// Update property to save between reloads
							worldMap.properties['customPanelColorMode'][1] = worldMap.customPanelColorMode;
							overwriteProperties(worldMap.properties);
							worldMap.coloursChanged();
							window.Repaint();
						}});
					});
					menu.newCheckMenu(subMenuName, options[0], options[optionsLength - 1], () => {return worldMap.customPanelColorMode;});
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					menu.newEntry({menuName: subMenuName, entryText: 'Set custom colour...', func: () => {
						worldMap.panelColor = utils.ColourPicker(window.ID, worldMap.panelColor);
						// Update property to save between reloads
						worldMap.properties['customPanelColor'][1] = worldMap.panelColor;
						overwriteProperties(worldMap.properties);
						worldMap.coloursChanged();
						window.Repaint();
					}, flags: worldMap.properties['customPanelColorMode'][1] === 2 ? MF_STRING : MF_GRAYED,});
				}
				{	// Point color
					const subMenuName = menu.newMenu('Points', menuName);
					const options = ['Default', 'Custom'];
					const optionsLength = options.length;
					options.forEach((item, i) => {
						menu.newEntry({menuName: subMenuName, entryText: item, func: () => {
							worldMap.defaultColor = i === 1 ? worldMap.properties.customPointColor[1] : 0xFF00FFFF;
							// Update property to save between reloads
							worldMap.properties.customPointColorMode[1] = i;
							overwriteProperties(worldMap.properties);
							window.Repaint();
						}});
					});
					menu.newCheckMenu(subMenuName, options[0], options[optionsLength - 1], () => {return worldMap.properties.customPointColorMode[1];});
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					menu.newEntry({menuName: subMenuName, entryText: 'Set custom colour...', func: () => {
						worldMap.defaultColor = utils.ColourPicker(window.ID, worldMap.defaultColor);
						// Update property to save between reloads
						worldMap.properties['customPointColor'][1] = worldMap.defaultColor;
						overwriteProperties(worldMap.properties);
						window.Repaint();
					}, flags: worldMap.properties['customPointColorMode'][1] === 1 ? MF_STRING : MF_GRAYED,});
				}
				{	// Text color
					menu.newEntry({menuName, entryText: 'Text...', func: () => {
						worldMap.textColor = utils.ColourPicker(window.ID, worldMap.defaultColor);
						// Update property to save between reloads
						worldMap.properties.customLocaleColor[1] = worldMap.textColor;
						overwriteProperties(worldMap.properties);
						window.Repaint();
					}});
				}
			}
			{
				{	// Point size
					const menuName = menu.newMenu('Points size...', menuUI);
					const options = [7, 10, 12, 14, 16, 20, 30, 'Custom...'];
					const optionsLength = options.length;
					options.forEach((item, i) => {
						menu.newEntry({menuName, entryText: item, func: () => {
							if (i === optionsLength - 1) {
								let input = '';
								try {input = Number(utils.InputBox(window.ID, 'Input size:', window.Name, worldMap.properties.customPointSize[1], true));} 
								catch(e) {return;}
								if (Number.isNaN(input)) {return;}
								worldMap.properties.customPointSize[1] = input;
							} else {worldMap.properties.customPointSize[1] = item;}
							if (worldMap.properties.customPointSize[1] === worldMap.pointSize) {return;}
							worldMap.pointSize = worldMap.properties.customPointSize[1];
							worldMap.pointLineSize = worldMap.properties.bPointFill[1] ? worldMap.pointSize : worldMap.pointSize * 2 + 5;
							window.Repaint();
							overwriteProperties(worldMap.properties);
						}});
					});
					menu.newCheckMenu(menuName, options[0], options[optionsLength - 1], () => {
						const idx = options.indexOf(worldMap.pointSize);
						return (idx !== -1 ? idx : optionsLength - 1);
					});
					menu.newEntry({menuName, entryText: 'sep'});
					menu.newEntry({menuName, entryText: 'Fill the circle? (point shape)', func: () => {
						worldMap.properties.bPointFill[1] = !worldMap.properties.bPointFill[1];
						worldMap.pointLineSize = worldMap.properties.bPointFill[1] ? worldMap.pointSize : worldMap.pointSize * 2 + 5;
						window.Repaint();
						overwriteProperties(worldMap.properties);
					}});
					menu.newCheckMenu(menuName, 'Fill the circle? (point shape)', void(0), () => {return worldMap.properties.bPointFill[1];});
				}
				
				{	// Text size
					const menuName = menu.newMenu('Text size...', menuUI);
					const options = [7, 8, 9, 10, 11, 12, 'Custom...'];
					const optionsLength = options.length;
					options.forEach((item, i) => {
						menu.newEntry({menuName, entryText: item, func: () => {
							if (i === optionsLength - 1) {
								let input = '';
								try {input = Number(utils.InputBox(window.ID, 'Input size:', window.Name, worldMap.properties.customPointSize[1], true));} 
								catch(e) {return;}
								if (Number.isNaN(input)) {return;}
								worldMap.properties.fontSize[1] = input;
							} else {worldMap.properties.fontSize[1] = item;}
							if (worldMap.properties.fontSize[1] === worldMap.fontSize) {return;}
							worldMap.fontSize = worldMap.properties.fontSize[1];
							worldMap.calcScale(window.Width, window.Height);
							window.Repaint();
							overwriteProperties(worldMap.properties);
						}});
					});
					menu.newCheckMenu(menuName, options[0], options[optionsLength - 1], () => {
						const idx = options.indexOf(worldMap.properties.fontSize[1]);
						return (idx !== -1 ? idx : optionsLength - 1);
					});
				}
			}
			menu.newEntry({menuName: menuUI, entryText: 'sep'});
			menu.newEntry({menuName: menuUI, entryText: 'Show current country header?', func: () => {
				worldMap.properties.bShowLocale[1] = !worldMap.properties.bShowLocale[1];
				window.Repaint();
				overwriteProperties(worldMap.properties);
			}});
			menu.newCheckMenu(menuUI, 'Show current country header?', void(0), () => {return worldMap.properties.bShowLocale[1];});
			menu.newEntry({menuName: menuUI, entryText: 'Show flag on header?', func: () => {
				worldMap.properties.bShowFlag[1] = !worldMap.properties.bShowFlag[1];
				window.Repaint();
				overwriteProperties(worldMap.properties);
			}, flags: worldMap.properties.bShowLocale[1] ? MF_STRING : MF_GRAYED});
			menu.newCheckMenu(menuUI, 'Show flag on header?', void(0), () => {return worldMap.properties.bShowFlag[1];});
		}
		menu.newEntry({entryText: 'sep'});
		{	// Write tags?
			const menuName = menu.newMenu('Write tags on playback', void(0), worldMap.properties['panelMode'][1] ? MF_GRAYED : MF_STRING);
			menu.newEntry({menuName, entryText: 'Used along WilB\'s Biography script:', func: null, flags: MF_GRAYED});
			menu.newEntry({menuName, entryText: 'sep'});
			const options = [{text: 'No (read only from tags, online or json)', val: 0}, {text: 'Yes, when tag has not been already set on track', val: 1}, {text: 'Yes, as json (for internal use on the script)', val: 2}];
			options.forEach( (mode) => {
				menu.newEntry({menuName, entryText: mode.text, func: () => {
					if (worldMap.properties['iWriteTags'][1] === mode.val) {return;}
					if (mode.val) { // Warning check
						let answer = WshShell.Popup('Warning! Writing tags on playback has 2 requirements:\n- WilB\'s Biography mod installed (and script loaded on another panel).\n- Both configured with the same selection mode (done automatically when mod is installed).\n\nNot following these requisites will make the feature to not work or work unexpectedly.\nDo you want to continue?', 0, window.Name, popup.question + popup.yes_no);
						if (answer === popup.no) {return;}
					}
					worldMap.properties['iWriteTags'][1] = mode.val; // And update property with new value
					overwriteProperties(worldMap.properties); // Updates panel
				}});
			});
			menu.newCheckMenu(menuName, options[0].text, options[options.length - 1].text, () => {return worldMap.properties['iWriteTags'][1];});
			menu.newEntry({menuName, entryText: 'sep', func: null});
			menu.newEntry({menuName, entryText: 'Show data folder', func: () => {
				_explorer(worldMap.properties.fileName[1]);
			}, flags: () => {return _isFile(worldMap.properties.fileName[1]) ? MF_STRING : MF_GRAYED;}});
		}
		{	// Database
			const menuDatabase = menu.newMenu('Database', void(0), () => {return (worldMap.properties['iWriteTags'][1] >= 1 ? MF_STRING : MF_GRAYED)});
			{
				menu.newEntry({menuName: menuDatabase, entryText: 'Current database: ' + (worldMap.properties['iWriteTags'][1] === 2 ? 'JSON' : 'Tags'), flags: MF_GRAYED});
				menu.newEntry({menuName: menuDatabase, entryText: 'sep'});
				menu.newEntry({menuName: menuDatabase, entryText: 'Find artists without locale tags...', func: () => {
					const notFoundList = new FbMetadbHandleList();
					const jsonIdList = new Set(); // only one track per artist
					const handleList = fb.GetLibraryItems();
					handleList.Convert().forEach((handle) => {
						const jsonId =  fb.TitleFormat(_bt(worldMap.jsonId)).EvalWithMetadb(handle); // worldMap.jsonId = artist
						if (jsonId.length && !jsonIdList.has(jsonId)) {
							if (worldMap.properties['iWriteTags'][1] === 2 && !worldMap.hasDataById(jsonId)) { // Check if tag exists on json
								notFoundList.Add(handle);
								jsonIdList.add(jsonId);
							} else if (worldMap.properties['iWriteTags'][1] === 1) { // Check if tag exists on file
								const tagName = worldMap.properties.writeToTag[1];
								const tfo = _bt(tagName);
								if (!fb.TitleFormat(tfo).EvalWithMetadb(handle).length) {
									notFoundList.Add(handle);
									jsonIdList.add(jsonId);
								}
							}
						}
					});
					if (notFoundList.Count) {
						sendToPlaylist(notFoundList, 'World Map missing tags');
					}
				}});
				menu.newEntry({menuName: menuDatabase, entryText: 'sep'});
				menu.newEntry({menuName: menuDatabase, entryText: 'Merge JSON databases...', func: () => {
					let input = '';
					try {input = utils.InputBox(window.ID, 'Enter path to JSON file:', window.Name, folders.data + 'worldMap.json', true);} 
					catch(e) {return;}
					if (!input.length) {return;}
					let answer = WshShell.Popup('Do you want to overwrite duplicated entries?', 0, window.Name, popup.question + popup.yes_no);
					let countN = 0;
					let countO = 0;
					const newData = _jsonParseFileCheck(input, 'Database json', window.Name, convertCharsetToCodepage('UTF-8'));
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
						saveLibraryTags(worldMap.properties.fileNameLibrary[1], worldMap.jsonId, worldMap); // Also update library mode
						window.Repaint();
					}
					console.log('World Map: merging database done (' + countN + ' new entries - ' + countO + ' overwritten entries)');
				}, flags: () => {return (worldMap.properties['iWriteTags'][1] === 2 ? MF_STRING : MF_GRAYED);}});
				menu.newEntry({menuName: menuDatabase, entryText: 'Merge file tags with JSON...', func: () => {
					let answer = WshShell.Popup('Do you want to overwrite duplicated entries?', 0, window.Name, popup.question + popup.yes_no);
					let countN = 0;
					let countO = 0;
					const handleList = fb.GetLibraryItems();
					const jsonId =  fb.TitleFormat(_bt(worldMap.jsonId)).EvalWithMetadbs(handleList); // worldMap.jsonId = artist
					const tag = getTagsValuesV3(handleList, [worldMap.properties.writeToTag[1]], true); // locale
					handleList.Convert().forEach((handle, i) => {
						if (jsonId[i] && jsonId[i].length) {
							if (tag[i] && tag[i].length && tag[i].filter(Boolean).length) { // Only merge if not empty
								const data = {[worldMap.jsonId]: jsonId[i], val: tag[i]};
								if (!worldMap.hasDataById(jsonId[i])) {
									worldMap.saveData(data);
									countN++;
								} else if (answer === popup.yes && !isArrayEqual(worldMap.getDataById(jsonId[i]).val, tag[i])) {
									worldMap.deleteDataById(jsonId[i]);
									worldMap.saveData(data);
									countO++;
								}
							}
						}
					});
					if (countN || countO) {
						saveLibraryTags(worldMap.properties.fileNameLibrary[1], worldMap.jsonId, worldMap); // Also update library mode
						window.Repaint();
					}
					console.log('World Map: writing file tags to database done (' + countN + ' new entries - ' + countO + ' overwritten entries)');
				}});
				menu.newEntry({menuName: menuDatabase, entryText: 'Write JSON tags to files...', func: () => {
					let answer = WshShell.Popup('Do you want to overwrite duplicated entries?', 0, window.Name, popup.question + popup.yes_no);
					let countN = 0;
					let countO = 0;
					const handleList = fb.GetLibraryItems();
					const jsonId =  fb.TitleFormat(_bt(worldMap.jsonId)).EvalWithMetadbs(handleList); // worldMap.jsonId = artist
					const tag = getTagsValuesV3(handleList, [worldMap.properties.writeToTag[1]], true); // locale
					const newData = worldMap.getData();
					if (newData && newData.length) {
						handleList.Convert().forEach((handle, i) => {
							if (jsonId[i] && jsonId[i].length) {
								newData.forEach((data) => {
									if (data[worldMap.jsonId] === jsonId[i] && data.val && data.val.length && data.val.filter(Boolean).length) {
										if (!tag[i] || !tag[i].length || !tag[i].filter(Boolean).length) {
											new FbMetadbHandleList(handle).UpdateFileInfoFromJSON(JSON.stringify([{[worldMap.properties.writeToTag[1]]: data.val}]));
											countN++;
										} else if (answer === popup.yes && !isArrayEqual(data.val, tag[i])) {
											new FbMetadbHandleList(handle).UpdateFileInfoFromJSON(JSON.stringify([{[worldMap.properties.writeToTag[1]]: data.val}]));
											countO++;
										}
									}
								});
							}
						});
					}
					if (countN || countO) {repaint();}
					console.log('World Map: writing back database tags to files done (' + countN + ' new entries - ' + countO + ' overwritten entries)');
				}});
				menu.newEntry({menuName: menuDatabase, entryText: 'sep'});
				menu.newEntry({menuName: menuDatabase, entryText: 'Update library database...', func: () => {
					fb.ShowPopupMessage('Updates the statistics of artists per country according to the current library.\nMeant to be used on \'Library mode\'.', window.Name);
					saveLibraryTags(worldMap.properties.fileNameLibrary[1], worldMap.jsonId, worldMap);
					console.log('World Map: saving library database done. Switch panel mode to \'Library mode\' to use it.');
				}, flags: () => {return (worldMap.properties['iWriteTags'][1] === 2 ? MF_STRING : MF_GRAYED)}});
				menu.newEntry({entryText: 'sep'});
			}
		}
		{	// Readmes
			const readmePath = folders.xxx + 'helpers\\readme\\world_map.txt';
			menu.newEntry({entryText: 'Open readme...', func: () => {
				const readme = _open(readmePath, convertCharsetToCodepage('UTF-8')); // Executed on script load
				if (readme.length) {fb.ShowPopupMessage(readme, window.Name);}
				else {console.log('Readme not found: ' + value);}
			}});
		}	
	}
	return menu;
}

function syncBio (bReload = false) {
	// Biograpy 1.1.X
	window.NotifyOthers(window.Name + ' notifySelectionProperty', worldMap.properties['selection'][1] === selMode[0] ? true : false); // synchronize selection property
	// Biograpy 1.2.X
	window.NotifyOthers('bio_focusPpt', worldMap.properties['selection'][1] === selMode[0] ? true : false);  // synchronize selection property 1.2.0 Beta
	window.NotifyOthers('bio_followSelectedTrack', worldMap.properties['selection'][1] === selMode[0] ? true : false);  // synchronize selection property 1.2.X
	const configPath = fb.ProfilePath + '\\yttm\\biography.cfg';
	if (_isFile(configPath)) { // activate notify tags
		const config = _jsonParseFileCheck(configPath, 'Configuration json', window.Name);
		if (config && config.hasOwnProperty('notifyTags') && !config.notifyTags) {
			config.notifyTags = true;
			_save(configPath, JSON.stringify(config, null, '\t'));
			if (bReload) {window.NotifyOthers('bio_refresh', null);}  // Reload Biograpy panel
		}
	}
	// window.NotifyOthers('bio_newCfg', {notifyTags_internal: true}); // notify tags
}