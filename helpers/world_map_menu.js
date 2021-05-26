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
				{text: 'Full', path: fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\images\\MC_WorldMap.jpg', factorX: 100, factorY: 100}, 
				{text: 'No Antarctica', path: fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\images\\MC_WorldMap_Y133.jpg', factorX: 100, factorY: 133},
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
						menu.btn_up(void(0), void(0), void(0), 'X factor'); // Call factor input
						menu.btn_up(void(0), void(0), void(0), 'Y factor');
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
					window.NotifyOthers(window.Name + ' notifySelectionProperty', mode === selMode[0] ? true : false); // synchronize selection property
					window.Repaint();
				}, flags: () => {return (worldMap.properties.bInstalledBiography[1] ? MF_STRING : MF_GRAYED);}});
			});
			menu.newCheckMenu(menuName, options[0].text, options[options.length - 1].text,  () => {return (worldMap.properties['bEnabledBiography'][1] ? 0 : 1);});
			menu.newEntry({menuName, entryText: 'sep'});
			menu.newEntry({menuName, entryText: () => {return (worldMap.properties.bInstalledBiography[1] ? 'Uninstall mod (reverts changes)' : 'Install mod (required to enable)');}, func: () => {
				let fileArr = findRecursivefile('*.js', [fb.ProfilePath, fb.ComponentPath]); // All possible paths for the scripts
				const modText = "\ninclude(fb.ProfilePath + 'scripts\\\\SMP\\\\xxx-scripts\\\\helpers\\\\biography_mod_xxx.js');";
				const idText = "window.DefinePanel('Biography', {author:'WilB'";
				const backupExt = '.back';
				let text = '', foundArr = [];
				fileArr.forEach( (file) => {
					text = utils.ReadTextFile(file);
					if (text.indexOf(idText) !== -1 && text.indexOf('omit this same script') === -1) { // Omit this one from the list!
						if (!worldMap.properties.bInstalledBiography[1]) {
							if (text.indexOf(modText) === -1) {foundArr.push(file);} // When installing, look for not modified script
						} else {
							if (text.indexOf(modText) !== -1) {foundArr.push(file);} // Otherwise, look for the mod string
						}
					}
				});
				let i = 1;
				let input = '';
				if (foundArr.length) {fb.ShowPopupMessage('Found these files:\n' + i + ': ' + foundArr.join('\n' + ++i + ': '), window.Name);}
				else {fb.ShowPopupMessage('WilB\'s ' + (worldMap.properties.bInstalledBiography[1] ? 'modified ' : '') +'Biography script not found neither in the profile nor in the component folder.\nIf you are doing a manual install, edit or replace the files and change the property on this panel manually:\n"' + worldMap.properties.bInstalledBiography[0] + '"', window.Name); return;}
				try {input = utils.InputBox(window.ID, 'Select by number the files to edit (sep by comma).\nCheck new window for paths' + '\nNumber of files: ' + foundArr.length, window.Name);}
				catch (e) {return;}
				if (!input.trim().length) {return;}
				input = input.trim().split(',');
				if (input.some((idx) => {return idx > foundArr.length;})) {return;}
				let selectFound = [];
				input.forEach( (idx) => {selectFound.push(foundArr[idx - 1]);});
				let bDone = true;
				selectFound.forEach( (file) => {
					if (!bDone) {return;}
					console.log('World Map: Editing file ' + file);
					text = utils.ReadTextFile(file);
					if (!worldMap.properties.bInstalledBiography[1]) {
						text += modText;
						if (!_isFile(file + backupExt)) {
							bDone = _copyFile(file, file + backupExt);
						} else {bDone = false; fb.ShowPopupMessage('Selected file already has a backup. Edit aborted.\n' + file, window.Name); return;}
						if (bDone) {
							bDone = utils.WriteTextFile(file, text);
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
				});
				if (bDone) {fb.ShowPopupMessage('Script(s) modified sucessfully:\n' + selectFound.join('\n') + '\nPlease reload the Biography panel.', window.Name);}
				else {fb.ShowPopupMessage('There were some errors during script modification. Check the other windows.', window.Name); return;}
				worldMap.properties.bInstalledBiography[1] = !worldMap.properties.bInstalledBiography[1];
				if (!worldMap.properties.bInstalledBiography[1]) {worldMap.properties.bEnabledBiography[1] = false;}
				overwriteProperties(worldMap.properties); // Updates panel
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
					if (worldMap.properties.bEnabledBiography[1]) {
						window.NotifyOthers(window.Name + ' notifySelectionProperty', mode === selMode[0] ? true : false); // synchronize selection property
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
	}
	return menu;
}