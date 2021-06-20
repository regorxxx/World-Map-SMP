'use strict';

include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\menu_xxx.js');

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
		{	// Map image
			const menuName = menu.newMenu('Map image');
			menu.newEntry({menuName, entryText: 'Image used as background:', func: null, flags: MF_GRAYED});
			menu.newEntry({menuName, entryText: 'sep'});
			const options = [
				{text: 'Full', path: fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\images\\MC_WorldMap_B.jpg', factorX: 100, factorY: 100}, 
				{text: 'No Antarctica', path: fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\images\\MC_WorldMap_Y133_B.jpg', factorX: 100, factorY: 133},
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
				return (idx != -1) ? idx : options.length - 1;
			});
		}
		{	// Coordinates factor
			const menuName = menu.newMenu('Coordinates transformation');
			menu.newEntry({menuName, entryText: 'Apply a factor to any axis:', func: null, flags: MF_GRAYED});
			menu.newEntry({menuName, entryText: 'sep'});
			const options = [{text: 'X factor', val: 'factorX'}, {text: 'Y factor', val: 'factorY'}];
			if (worldMap.factorX !== 100) {options[0].text += '\t (not 100)'}
			if (worldMap.factorY !== 100) {options[1].text += '\t (not 100)'}
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
		{	// Enabled Biography?
			const menuName = menu.newMenu('WilB\'s Biography integration');
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
			menu.newEntry({menuName, entryText: () => {return (worldMap.properties.bInstalledBiography[1] ? 'Uninstall mod (reverts changes)' : 'Install mod (required to enable)');}, func: () => {
				let  foundArr = [];
				// Biography 1.1.X
				const fileArr = findRecursivefile('*.js', [fb.ProfilePath, fb.ComponentPath]); // All possible paths for the scripts
				const modText = '\ninclude(fb.ProfilePath + \'scripts\\\\SMP\\\\xxx-scripts\\\\helpers\\\\biography_mod_1_1_X_xxx.js\');';
				const idText = 'window.DefinePanel(\'Biography\', {author:\'WilB\', version: \'1.1.'; // 1.1.3 or 1.1.2
				fileArr.forEach( (file) => {
					const fileText = utils.ReadTextFile(file);
					if (fileText.indexOf(idText) !== -1 && fileText.indexOf('omit this same script') === -1) { // Omit this one from the list!
						if (!worldMap.properties.bInstalledBiography[1]) {
							if (fileText.indexOf(modText) === -1) {foundArr.push({path: file, ver: '1.1.X'});} // When installing, look for not modified script
						} else {
							if (fileText.indexOf(modText) !== -1) {foundArr.push({path: file, ver: '1.1.X'});} // Otherwise, look for the mod string
						}
					}
				});
				// Biography 1.2.X
				const idFolder = '{BA9557CE-7B4B-4E0E-9373-99F511E81252}';
				let packagePath;
				try {packagePath = utils.GetPackagePath(idFolder);} // Exception when not found
				catch(e) {packagePath = '';}
				const packageFile = packagePath.length ? packagePath + '\\scripts\\callbacks.js' : '';
				const modPackageText = '\ninclude(fb.ProfilePath + \'scripts\\\\SMP\\\\xxx-scripts\\\\helpers\\\\biography_mod_1_2_X_xxx.js\');';
				if (_isFile(packageFile)) {
					const packageText = _jsonParseFile(packagePath + '\\package.json');
					const fileText = utils.ReadTextFile(packageFile);
					if (!worldMap.properties.bInstalledBiography[1]) {
						if (fileText.indexOf(modPackageText) === -1) {foundArr.push({path: packageFile, ver: packageText.version});} // When installing, look for not modified script
					} else {
						if (fileText.indexOf(modPackageText) !== -1) {foundArr.push({path: packageFile, ver: packageText.version});} // Otherwise, look for the mod string
					}
				}
				// Select files to edit
				let input = '';
				if (foundArr.length) {fb.ShowPopupMessage('Found these files:\n' + foundArr.map((_, idx) => {return '\n' + (idx + 1) + ': ' + _.path + '  (' + _.ver + ')';}).join(''), window.Name);}
				else {fb.ShowPopupMessage('WilB\'s ' + (worldMap.properties.bInstalledBiography[1] ? 'modified ' : '') +'Biography script not found neither in the profile nor in the component folder.\nIf you are doing a manual install, edit or replace the files and change the property on this panel manually:\n"' + worldMap.properties.bInstalledBiography[0] + '"', window.Name); return;}
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
					console.log('World Map: Editing file ' + file);
					if (selected.ver  === '1.1.X') { // Biography 1.1.X
						if (!worldMap.properties.bInstalledBiography[1]) {
							if (!_isFile(file + backupExt)) {
								bDone = _copyFile(file, file + backupExt);
							} else {bDone = false; fb.ShowPopupMessage('Selected file already has a backup. Edit aborted.\n' + file, window.Name); return;}
							if (bDone) {
								let fileText = utils.ReadTextFile(file);
								fileText += modText;
								bDone = _save(file, fileText);
							} else {fb.ShowPopupMessage('Error creating a backup.\n' + file, window.Name); return;}
							if (!bDone) {fb.ShowPopupMessage('Error editing the file.\n' + file, window.Name); return;}
						} else {
							let bDone = false;
							if (_isFile(file + backupExt)) {
								bDone = _recycleFile(file);
							} else {bDone = false; fb.ShowPopupMessage('Selected file does not have a backup. Edit aborted.\n' + file, window.Name); return;}
							if (bDone) {
								bDone = _renameFile(file + backupExt, file);
							} else {fb.ShowPopupMessage('Error deleting the modified file.\n' + file, window.Name); return;}
							if (!bDone) {fb.ShowPopupMessage('Error renaming the backup.\n' + file, window.Name); return;}
							// TODO: Revert changes editing file if not backup is found?
						}
					} else { // Biography 1.2.X
						if (!worldMap.properties.bInstalledBiography[1]) {
							if (!_isFile(packageFile + backupExt)) {
								bDone = _copyFile(packageFile, packageFile + backupExt);
							} else {bDone = false; fb.ShowPopupMessage('Selected file already has a backup. Edit aborted.\n' + packageFile, window.Name); return;}
							if (bDone) {
								let fileText = utils.ReadTextFile(packageFile);
								fileText += modPackageText;
								bDone = _save(packageFile, fileText);
							} else {fb.ShowPopupMessage('Error creating a backup.\n' + packageFile, window.Name); return;}
						} else {
							if (_isFile(packageFile + backupExt)) {
								bDone = _recycleFile(packageFile);
							} else {bDone = false; fb.ShowPopupMessage('Selected file does not have a backup. Edit aborted.\n' + packageFile, window.Name); return;}
							if (bDone) {
								bDone = _renameFile(packageFile + backupExt, packageFile);
							} else {fb.ShowPopupMessage('Error deleting the modified file.\n' + packageFile, window.Name); return;}
							if (!bDone) {fb.ShowPopupMessage('Error renaming the backup.\n' + packageFilez, window.Name); return;}
							// TODO: Revert changes editing file if not backup is found?
						}
					}
				});
				// Report
				if (bDone) {fb.ShowPopupMessage('Script(s) modified sucessfully:\n' + selectFound.map((_) => {return _.path + '  (' + _.ver + ')';}).join('\n') + '\nBiography panel will be automatically reloaded.', window.Name);}
				else {fb.ShowPopupMessage('There were some errors during script modification. Check the other windows.', window.Name); return;}
				// Change config
				worldMap.properties.bInstalledBiography[1] = !worldMap.properties.bInstalledBiography[1];
				if (!worldMap.properties.bInstalledBiography[1]) {worldMap.properties.bEnabledBiography[1] = false;}
				if (worldMap.properties.bInstalledBiography[1]) {worldMap.properties.bEnabledBiography[1] = true;}
				overwriteProperties(worldMap.properties); // Updates panel
				syncBio(false); // Sync selection and enable notify tags
				window.NotifyOthers('refresh_bio', null);  // Reload panel Biograpy 1.2.1
				window.NotifyOthers('bio_refresh', null);  // Reload panel  Biograpy 1.2.X
			}});
		}
		menu.newEntry({entryText: 'sep'});
		{	// Selection mode
			const menuName = menu.newMenu('Selection mode');
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
		{	// Write tags?
			const menuName = menu.newMenu('Write tags on playback');
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
		menu.newEntry({entryText: 'sep'});
		{	// Modifier tags
			const menuName = menu.newMenu('Modifier tags for playlists');
			menu.newEntry({menuName, entryText: 'Used with (Key) + L. Click:', func: null, flags: MF_GRAYED});
			modifiers.forEach( (mod, index) => {
				menu.newEntry({menuName, entryText: 'sep'});
				menu.newEntry({menuName, entryText: '(' + mod.description + ') tag(s)', func: () => {
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
		{
			const menuName = menu.newMenu('Colours...');
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
				menu.newCheckMenu(subMenuName, options[0], options[optionsLength - 1], () => {return worldMap.customPanelColorMode});
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
		}
		menu.newEntry({entryText: 'sep'});
		{	// Readmes
			const readmePath = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\readme\\world_map.txt';
			menu.newEntry({entryText: 'Open readme...', func: () => {
				if ((isCompatible('1.4.0') ? utils.IsFile(readmePath) : utils.FileTest(readmePath, 'e'))) { 
					const readme = utils.ReadTextFile(readmePath, 65001); // Executed on script load
					if (readme.length) {fb.ShowPopupMessage(readme, window.Name);}
					else {console.log('Readme not found: ' + value);}
				}
			}});
		}
		
	}
	return menu;
}

function syncBio (bReload = false) {
	console.log(worldMap.properties['selection'][1]);
	// Biograpy 1.1.X
	window.NotifyOthers(window.Name + ' notifySelectionProperty', worldMap.properties['selection'][1] === selMode[0] ? true : false); // synchronize selection property
	// Biograpy 1.2.X
	window.NotifyOthers('bio_focusPpt', worldMap.properties['selection'][1] === selMode[0] ? true : false);  // synchronize selection property
	const configPath = fb.ProfilePath + '\\yttm\\biography.cfg';
	if (_isFile(configPath)) { // activate notify tags
		const config = _jsonParseFile(configPath);
		if (!config.notifyTags) {
			config.notifyTags = true;
			_save(configPath, JSON.stringify(config, null, 3));
			if (bReload) {window.NotifyOthers('bio_refresh', null);}  // Reload Biograpy panel
		}
	}
	// window.NotifyOthers('bio_newCfg', {notifyTags_internal: true}); // notify tags
}