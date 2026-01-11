# Changelog

## [Table of Contents]
- [Unreleased](#unreleased)
- [4.4.0](#440---2025-12-23)
- [4.3.1](#431---2025-12-12)
- [4.3.0](#430---2025-11-36)
- [4.2.1](#421---2025-11-19)
- [4.2.0](#420---2025-10-28)
- [4.1.0](#410---2025-09-29)
- [4.0.0](#400---2025-09-20)
- [3.15.0](#3150---2024-10-09)
- [3.14.1](#3141---2024-08-13)
- [3.14.0](#3140---2024-07-24)
- [3.13.0](#3130---2024-03-21)
- [3.12.0](#3120---2024-03-15)
- [3.11.0](#3110---2024-03-04)
- [3.10.0](#3100---2024-02-28)
- [3.9.0](#390---2023-12-17)
- [3.8.0](#380---2023-12-11)
- [3.7.0](#370---2023-12-08)
- [3.6.0](#360---2023-11-28)
- [3.5.0](#350---2023-11-24)
- [3.4.0](#340---2023-11-15)
- [3.3.0](#330---2023-10-15)
- [3.2.0](#320---2023-10-05)
- [3.1.0](#310---2023-09-25)
- [3.0.1](#301---2023-09-20)
- [3.0.0](#300---2023-09-13)
- [2.9.1](#291---2023-07-29)
- [2.9.0](#290---2023-07-28)
- [2.8.3](#283---2023-06-29)
- [2.8.2](#282---2023-06-27)
- [2.8.1](#281---2023-05-16)
- [2.8.0](#280---2023-05-08)
- [2.7.0](#270---2023-03-08)
- [2.6.0](#260---2023-03-04)
- [2.5.0](#250---2023-02-19)
- [2.4.0](#240---2023-02-15)
- [2.3.0](#230---2022-08-22)
- [2.2.1](#221---2022-08-21)
- [2.2.0](#220---2022-08-12)
- [2.1.1](#211---2022-08-09)
- [2.1.0](#210---2022-08-05)
- [2.0.4](#204---2022-06-07)
- [2.0.3](#203---2022-05-23)
- [2.0.2](#202---2022-05-04)
- [2.0.1](#201---2022-04-13)
- [2.0.0-beta.2](#200-beta2---2021-12-30)
- [2.0.0-beta.1](#200-beta1---2021-12-23)
- [1.2.2](#122---2021-06-21)
- [1.2.1](#121---2021-06-15)
- [1.2.0](#120---2021-06-07)
- [1.1.1](#111---2021-05-28)
- [1.1.0](#110---2021-05-26)
- [1.0.1](#101---2021-05-12)
- [1.0.0](#100---2021-05-01)

## [Unreleased][]
### Added
- UI: added background y-axis margin setting. It only applies when cropping is set to none. While using any other mode, it stretches the image instead. This setting can be directly changed using the mouse wheel + CTRL + ALT + SHIFT too. Note in all my scripts UI elements can be resized using the mouse wheel + CTRL + ALT. And background settings are always accessed also pressing SHIFT.
- UI: added background art mode cycling when using the mouse wheel + SHIFT. It will only cycle between art actually present for current track, omitting not found ones.
- UI: added new background setting for art crop: center (default), bottom, top.
- UI: added new background setting for art zoom, similar to the effect at Library-Tree-SMP (in that case is based on blur level).
- UI: added new background art mode 'Folder' which allows to display any image from a given folder path, like 'thumbs.js' SMP/JSplitter sample. Along this mode, added new cycle settings and file sorting (by name or date) to control how images are chosen. Images within folder can be cycled using the mouse wheel + SHIFT too. Note background settings are always accessed pressing SHIFT.
- UI: added new background setting to prefer placement of dark colors at the outer edge of the panel in bigradient color mode.
- UI: added new background setting for art reflection effects. Only available when crop setting is set to none.
- UI: added new background settings for basic art manipulation.
- UI: added DUI/CUI color settings for background, which are applied on the color mode used.
- UI: added blend color mode which mimics [Library-Tree-SMP](https://github.com/regorxxx/Library-Tree-SMP/), Biography blend theme. Requires art enabled.
- UI: added cursor effects over elements.
### Changed
- UI: all settings mentioning transparency have been changed to opacity, some properties will be lost on update as result.
- UI: cleanup and rework of background submenu and its integration with other settings.
- UI: 'Folder' and 'Path' art modes on background now support TF expressions.
- UI: improvements on dynamic colors handling related to background color identification (mixing the art, color settings, etc.).
- Code cleanup and performance improvements if panel is disabled or during startup.
- Code cleanup and performance improvements for background code. In particular when art has been set to be invisible for exclusive art colors processing or set to none.
### Removed
### Fixed
- UI: mouse cursor being shown as hand when over left/right buttons even if they were not shown while using statistics modes.
- UI: minor painting error with full header at bottom position.

## [4.4.0] - 2025-12-23
### Added
- UI: new header position options: top (panel), top (map), over map, bottom (panel), bottom (map), below map.
- UI: new flag position options: left, right, center, both sides. On both sides mode, it allows to display up to 2 different countries.
- UI: added new setting to background to skip following selection if follow now playing is active.
- UI: added new setting to background when using art to apply a special circular blur effect instead of an homogeneous blur.
### Changed
- UI: changed default background settings for a more cohesive experience along [Library-Tree-SMP](https://github.com/regorxxx/Library-Tree-SMP/), Biography and dark mode.
- UI: improvements on dynamic colors handling in some extreme cases with main and secondary colors being almost equal.
- UI: header text style is now italic.
- UI: improvements to dynamic colors handling for background and server-color sources. Added warning when trying to activate both at the same time.
### Removed
### Fixed
- UI: fixed SMP artifacts on header gradients at some sizes. 
- UI: fixed repainting artifacts while using the mouse wheel to resize the header.
- UI: fixed header position not being centered.
- UI: gradient mask at map borders setting not being saved between sessions.

## [4.3.1] - 2025-12-12
### Added
### Changed
### Removed
### Fixed
- JSplitter: fixed compatibility bug with JSplitter (any version) due to improper constructor used on JS Host as reported [here](https://github.com/regorxxx/Infinity-Tools-SMP/pull/6) and [here](https://hydrogenaudio.org/index.php/topic,126743.msg1073615.html#msg1073615).

## [4.3.0] - 2025-11-25
### Added
- UI: UI elements are now resizable using Alt + Ctrl + Mouse wheel. Equivalent to using text and points size submenus depending on the mouse position (over points or header).
- UI: added mouse wheel actions (data and resizing) to statistics mode.
### Changed
### Removed
### Fixed
- Statistics: minor fixes.

## [4.2.1] - 2025-11-19
### Added
### Changed
- Helpers: updated helpers.
### Removed
### Fixed
- UI: fixed handling of non string labels in some cases.

## [4.2.0] - 2025-28-10
### Added
### Changed
- Configuration: global support for %fb2k_component_path%, %fb2k_profile_path% and %fb2k_path% in any input asking for paths.
- Configuration: improved handling of user definition files found at '[FOOBAR PROFILE FOLDER]\js_data\presets\global\' in case they got corrupted. The corrupted file will be backed up at the same folder and a new one created. Popups will warn about it, no longer requiring user actions. See [here](https://hydrogenaudio.org/index.php/topic,120978.msg1071225.html#msg1071225).
- Export settings: now uses '[FOOBAR PROFILE FOLDER]\js_data\export' folder at exporting.
- UI: improved informative popup following selection mode by Biography. Disabling the popup now outputs the warning to the console log.
- UI: moved entry to disable panel processing to parent menu.
### Removed
### Fixed
- UI: repaint artifacts exiting statistics mode during playback.

## [4.1.0] - 2025-09-29
### Added
### Changed
- UI: header borders are now smooth using a transparency gradient.
- UI: color extraction from background art is now done before blur is applied. Done after blur returned gray tones in so many unintended cases.
### Removed
- Installation: fonts are no longer bundled at '_resources' folder, but found at: https://github.com/regorxxx/foobar2000-assets/tree/main/Fonts
### Fixed
- UI: repaint artifacts when switching header visibility during playback.
- Auto-update: fix error including a file when enabling auto-updates if it was previously disabled.

## [4.0.0] - 2025-09-20
### Added
- Data: added support for multi-value artist tags, now enabled by default. Can be tweaked at the 'Tags' submenu. If a track has multiple artists, the panel will try to draw a point per artist (similar to how multiple selection works). Biography integration remains the same, i.e. it will try to only match the first artist found. Note this change implies that some artists may now be missing a country (since they were previously merged into a single value); you may use the 'Find artists without locale tag...' entry to tag them.
- Data: added menu entry to add/remove an artist to a black list for splitting. So above functionality can be easily tweaked for specific artists which should never be split (like 'Crosby, Stills & Nash').
- Statistics: X-Axis shown values at display menu now allows any custom value.
- Statistics: Y-Axis filter at display menu now allows any custom value for 'greater than'/'lower than' filters.
- Statistics: option to filter data between 2 custom values on Y-Axis at display menu.
- Installation: new panel menu, accessed through 'Ctrl + Win + R. Click' (which works globally on any script and panel, at any position), used to export/import panel settings and any other associated data. These entries may be used to fully backup the panel data, help when moving between different JS components (JSplitter <-> SMP) or even foobar2000 installations, without needing to manually backup the panel properties or other external files (like .json, countries databases, etc.).
- UI: new menu entry to share current UI settings across all available World Map panels within foobar2000. It can be found at the settings menu 'UI' submenu (and also at the panel menu, see above). Every other panel will be highlighted and show a popup asking to import or ignore the new settings.
- UI: added dynamic colors support based on track's artwork. It follows the background cover mode settings and must be enabled on 'colors' submenu.
- UI: exposed background gradient focus setting, i.e. where the center color will be at its highest intensity.
- UI: added tooltip on blank panel.
- UI: toolbar tooltip now shows 'Ctrl + Win + R. Click' shortcut to script panel menu (see above at 'installation').
- UI: added option to apply a gradient mask at borders (so they mix better with the background). Enabled by default.
- UI: exposed color settings via window.NotifyOthers() method for themes/multi-panel support. You may pass a color scheme -size 6 recommended- (output from GetColourScheme()) at 'Colors: set color scheme' (applies to all compatible panels) or 'World Map: set color scheme' (applies only to this script), which will set appropriate colors following panel's color logic; alternatively you may set direct color settings at 'World Map: set colors' which needs an array of 4 colors or an object {background, text, default, shape}. Panel has also independent settings to listen to colors from other panels or sending colors (as a color-server) to others. Additionally, local color processing from art may be disabled (in case colors are meant to be set only by server). See [this](https://github.com/regorxxx/Not-A-Waveform-Seekbar-SMP/issues/4) and [this](https://hydrogenaudio.org/index.php/topic,120980.msg1069107.html#msg1069107).
- Configuration: added user configurable file at '[FOOBAR PROFILE FOLDER]\js_data\presets\global\globNoSplitArtist.json' with a list of artists which should not be split. This list can be modified by directly editing the file or using the menu entry (see above).
### Changed
- Tagging: Shift + R. Click on a country now always shows the tagging menu in case an artist from selection is not tagged, even if clicking on a currently displayed point. Previously it would create a playlist (since the click was over a point). This applies to both multiple selection and multi-valued artist tracks (if enabled). Note there is not any special handling of file tags for multi-value artists, i.e. if a track with 2 artists has 2 associated countries, they will be properly handled at the JSON database but if using the 'Write to track files' option, there is no way to know to which artist every country value is associated to. In such case it's assumed that all countries apply to all artists.
- Tagging: tagging menu will now show submenus per country in case of multiple artists being selected. Clicking on an artist will only tag tracks/database associated to it.
- Installation: added popup warnings when scripts are installed outside foobar2000 profile folder. These checks can be tweaked at globSettings.json.
- Installation: script may now be installed at any path within the foobar profile folder, no longer limited to '[FOOBAR PROFILE FOLDER]\scripts\SMP\xxx-scripts\' folder. Obviously it may still be installed at such place, which may be preferred if updating an older version.
- Installation: multiple improvements to path handling for portable and non-portable installations. By default scripts will always try to use only relative paths to the profile folder, so scripts will work without any change when exporting the profile to any other installation. This change obviously doesn't apply to already existing installations unless restoring defaults.
- [JSplitter (SMP)](https://foobar2000.ru/forum/viewtopic.php?t=6378&start=360) support for locked playlists.
- Statistics: scrolling cursor is displayed when scrolling using mouse + dragging.
- Statistics: added horizontal (x) scrolling using the mouse wheel (for mouses with horizontal moves).
- Statistics: 'fill' chart type.
- Statistics: settings button tooltip now shows 'Shift + Win + R. Click' shortcut to open SMP/JSpliter panel menu (which works globally on any script and panel, at any position).
- Statistics: settings button tooltip now shows 'Double Click' shortcut to force data update (see above).
- Statistics: general improvements and optimizations of point statistics. Now also show the total number of tracks before deduplication.
- Statistics: axis legend is now shown at tooltip and point statistics popup.
- Statistics: X-axis keys are now shown even when not all keys can be displayed, omitting some of the values. This ensures that charts displaying numbers at the axis at least show the initial and some middle values. This applies for bars, lines, scatter, fill and timeline charts.
- Statistics: left scrolling button position is now adjusted following Y-Axis display (except for doughnut and pie charts).
- Statistics: scrolling buttons are now shown only when the chart is not showing all data (no zoom).
- Statistics: multiple menu entries at 'Display settings' have been renamed for clarity's sake.
- Statistics: buttons are now smoothly hidden when panel is not on focus. Transparency may be adjusted from 0 to 255 by setting buttons.alpha, timer to hide them by setting buttons.timer.
- Data: it's now possible to use some of the database tools when using tags/JSON sources on read-only mode.
- Data: 'Find artists without locale tags' tool now checks both file tags and JSON database in case the tags/JSON sources are on read-only mode.
- UI: it's now possible to use the different statistics modes when using tags/JSON sources on read-only mode. Note some data may be missing since artists without country tags will never be automatically tagged. In case the library has never been analyzed, the panel will do it automatically on first run of any of those modes.
- UI: cleanup of menu entries and popups, settings should now be better explained.
- UI: unified script updates settings across all my scripts, look for 'Updates' submenu.
- UI: 'shapes' map images are inverted if the contrast is not great enough against the background color set.
- UI: header now shows the list of currently displayed countries instead of 'Multiple countries'. List is cut at 30 chars.
- Helpers: updated helpers.
- Helpers: general code cleanup on menus internal code. Please report any bug on extra separators or menu entries not working as expected.
### Removed
### Fixed
- Biography Integration: unnecessary panel and data update when the artist already had a country set. This change also ensures manually set countries (either by tag or JSON) are not overridden by the Biography tag.
- Data: 'Find artists without locale tags' tool was not checking the read tag TF setting but the write tag setting, which would lead to wrong results if the tag was sourced from Biography (since it writes multiple values).
- Statistics: minor fixes.
- Statistics: background not being updated on playback/selection change.
- Statistics: panel not being completely repainted when exiting statistics mode.
- UI: '&' being displayed as '_' on tooltips.
- UI: wrong position on second background gradient using bigradient mode.
- UI: workaround for DPI checking under multiple OSes, specially for Wine (Unix).
- Fixed some misspelled terms on UI and variables (which also lead to some minor bugs).

## [3.15.0] - 2024-10-09
### Added
### Changed
- Readme: updated readme with tip about 'Shift + Win + R. Click' shortcut to open SMP/JSpliter panel menu (which works globally on any script and panel, at any position).
- UI: minor adjustments to menu entries.
- Configuration: changed the remove duplicates bias to prefer tracks containing 'BEST' within a 'TRACKDSP' tag.
- [JSplitter (SMP)](https://foobar2000.ru/forum/viewtopic.php?t=6378&start=360) support and ES2021 compatibility.
- Helpers: in case saving a file throws an error due to long paths (+255 chars) a warning popup will be shown.
- Helpers: updated helpers.
### Removed
### Fixed

## [3.14.1] - 2024-08-13
### Added
### Changed
- Helpers: updated helpers.
### Removed
### Fixed
- Statistics: crash opening the point menu on libraries not fully tagged.

## [3.14.0] - 2024-07-24
### Added
- UI: header color is now configurable.
- UI: header size is now configurable (full panel/map size).
- UI: added album art caching for panel background whenever selecting/playing track changes but belongs to the same album. It checks for same album name and parent directory. 
### Changed
- UI: better compatibility when locale tag contains the ISO 3166 2-letter code, instead of a country name. Header now displays the country name associated instead of the ISO code or none.
- Helpers: improved performance of duplicates removal in multiple places.
- Helpers: json data files are now saved with Windows EOL for compatibility improvements with Windows text editors.
- Configuration: changed the remove duplicates bias to prefer lossless tracks with 16 bits per sample, 44.1 Khz sample rate and greater %DYNAMIC RANGE% values.
- Configuration: expanded user configurable file at '[FOOBAR PROFILE FOLDER]\js_data\presets\global\globSettings.json' with a new setting for console logging to file. Disabled by default. Now this is a change from the previous behavior, where console was always logged to 'console.log' file at the [FOOBAR PROFILE FOLDER]. It can now be switched, but since it's probably not useful for most users is disabled by default.
- Improved compatibility when running foobar2000 on drives without recycle bin.
### Removed
### Fixed
- UI: locale tag not retrieved in some cases from bio panel due to tag name case not matching.
- UI: minor UI refresh fixes.
- Configuration: .json files at 'foobar2000\js_data\presets\global' not being saved with the calculated properties based on user values from other files.
## [3.13.0] - 2024-03-21
### Added
### Changed
- Helpers: updated helpers.
### Removed
### Fixed

## [3.12.0] - 2024-03-15
### Added
- Configuration: expanded user configurable file at '[FOOBAR PROFILE FOLDER]\js_data\presets\global\globSettings.json' with a new setting to check OS features on every panel startup. Enabled by default. This has been the default behavior since OS' features check was implemented, but it can now be disabled to improve init performance a bit, specially at foobar2000 startup (since it seems to hang in some cases when running it on slow HDDs or systems).
### Changed
- Helpers: updated helpers.
### Removed
### Fixed
- Version number (for update checking).

## [3.11.0] - 2024-03-04
### Added
- Configuration: expanded user configurable file at '[FOOBAR PROFILE FOLDER]\js_data\presets\global\globSettings.json' with a new setting for panel repaint debugging purpose. Disabled by default.
### Changed
- UI: low memory mode is now integrated into a new 'Memory mode' submenu which contains multiple settings to further fine-tune RAM usage by the panel.
- Helpers: updated helpers.
### Removed
### Fixed

## [3.10.0] - 2024-02-28
### Added
- Configuration: added COMPOSER to the list of global tags.
- Configuration: added LOCALE LAST.FM to the list of global tags.
- Configuration: added integrity checks to global user settings files, found at '[FOOBAR PROFILE FOLDER]\js_data\presets\global\[...].json'. In particular queries are now check to ensure they are valid and will throw a popup at init otherwise. Other settings are check to ensure they contain valid values too.
- Configuration: expanded user configurable file at '[FOOBAR PROFILE FOLDER]\js_data\presets\global\globSettings.json' with a new setting to output to console profiling logs at script init. They work globally. Disabled by default.
### Changed
- Configuration: changed the remove duplicates bias to prefer tracks with higher play-counts and positive feedback tag (love/hate).
- UI: optimized repainting to use less resources on statistics mode.
- UI: highly optimized map images (which should now use less resources).
- Helpers: updated helpers.
- Console: improved log file formatting on windows text editors which parse new lines only with CR+LF instead of LF.
- Code cleanup.
### Removed
### Fixed
- Biography Integration: crash applying integration in some cases.
- Minor fixes.

## [3.9.0] - 2023-12-17
### Added
- UI: added color names to background color settings.
- UI: added transparency settings for map image.
### Changed
- UI: changed defaults settings on new installations for a more modern look.
- UI: improved path handling of map images on portable installations.
- UI: country highlighting on mouse over sensitivity has been increased, making it easier to select a country when there is only one country painted.
- UI: minor performance improvements.
- UI: reduced default image sizes to improve performance.
### Removed
### Fixed
- UI: low memory mode was always active despite disabling it.
- UI: fixed playlist creation when clicking on points if artist tag was set to ALBUM ARTIST.

## [3.8.0] - 2023-12-11
### Added
### Changed
- UI: replaced all background settings with a new implementation, equal to the one found at [Timeline-SMP](https://github.com/regorxxx/Timeline-SMP), which allows to use covers, colors, gradients, etc.
- Helpers: updated helpers.
### Removed
- UI: old background settings (no longer working).
### Fixed
- UI: panel not being refreshed when globally disabling/enabling the panel.
- Crash due to missing helpers.

## [3.7.0] - 2023-12-08
### Added
- Statistics Mode (gradient): added new mode which displays countries filled with a color scale according number of artists on library from that country. i.e. like Library mode but showing on the UI the count of artists.
- UI: added settings for gradient colors according to ColorBrewer schemes.
- UI: added settings to fill the country layers with a custom color (previous behavior), predominant country flag's color, gradient of the flag's color or the flag image.
- UI: added low memory mode to be used along country layers which should minimize memory usage on big libraries with minimal quality impact.
- UI: current country while moving the mouse is now highlighted when using country layers.
### Changed
- UI: greatly enhanced performance while using country layers, transparencies and other features.
- UI: color names are now shown for for default colors too.
- Helpers: updated helpers.
### Removed
### Fixed
- UI: panel not being repainted when changing from library to standard mode.
- UI: possible crash during layer creation if panel size changed in the process.

## [3.6.0] - 2023-11-28
### Added
- UI: added setting to disable tooltip on all scripts. Found at '[FOOBAR PROFILE FOLDER]\js_data\presets\global\globSettings.json', by changing 'bTooltip'. By default tooltip is always shown. This setting will never be exposed within foobar, only at this file.
### Changed
- Helpers: updated helpers.
- Improved error messages about features not working related to OS checks (at startup) with tips and warnings.
### Removed
### Fixed

## [3.5.0] - 2023-11-24
### Added
- Statistics: click on point to create playlists by selected key and data mode
- Statistics: added point statistics.
- Statistics: added buttons to statistics mode. Menus are now opened via buttons, no longer with R. click. There is also a button to directly exit statistics mode.
- Statistics: added sorting options according to Y axis.
- Statistics: colors are now forced with a scheme based on panel colors.
- UI: transparency input menu entries now have a hint about which value is opaque and which transparent.
### Changed
- Statistics: after changing data type, number of values shown is kept if possible.
- UI: Improved responsiveness of repaint in some instances after changing settings or exiting statistics mode.
- Helpers: updated helpers.
- Console: reduced max log file size to 1 MB.
### Removed
### Fixed
- Crash on some cases using country masks.

## [3.4.0] - 2023-11-15
### Added
- UI: country layers are now configurable; color and transparency. Setting a custom color uses masking under the hood, which may have a different performance impact than the 'default' mode (which just loads the country layers with a fixed color).
- UI: option to only show the flag at header (without requiring the country name).
- Tags: setting to enable multi-value tags support, when there are multiple ISO values within the same tag separated by '|'. For ex. 'FRA|GBR'.
- Auto-update: added -optional- automatic checks for updates on script load; enabled by default. Compares version of current file against GitHub repository. Manual checking can also be found at the settings menu. Setting may also be globally switched at '[FOOBAR PROFILE FOLDER]\js_data\presets\global\globSettings.json', by changing 'bAutoUpdateCheck'. It will apply by default to any new installed script (previous scripts will still need to be manually configured to change them).
- Added setting to disable popups related to features not being supported by the OS (at startup). Found at '[FOOBAR PROFILE FOLDER]\js_data\presets\global\globSettings.json', by changing 'bPopupOnCheckSOFeatures'. By default popups are always shown. This setting will never be exposed within foobar, only at this file.
### Changed
- UI: color menu entries now show the color name along the menu entry.
- Helpers: updated statistics mode with new graphs and features from the latest [Statistics-Framework-SMP](https://github.com/regorxxx/Statistics-Framework-SMP) version.
- Helpers: replaced library [chroma.js with own version](https://regorxxx.github.io/chroma.js/).
- Helpers: updated helpers.
### Removed
### Fixed
- UI: country layer not painted at right position after changing map type in some cases; it was only updated properly after playback/selection changed. Now is also reset after the setting is changed.

## [3.3.0] - 2023-10-15
### Added
- UI: menu entries to edit locale tags for writing and reading from files. Old properties will be lost on updating.
### Changed
- UI: better compatibility when locale tag contains the ISO 3166 3-letter code, instead of a country name. Header now displays the country name associated instead of the ISO code.
- UI: reworked menus associated to file tags, now merged on the same submenu.
### Removed
### Fixed

## [3.2.0] - 2023-10-05
### Added
### Changed
- Configuration: expanded user configurable files at '[FOOBAR PROFILE FOLDER]\js_data\presets\global' with new queries. File will be automatically updated with new values (maintaining the user settings).
- Configuration: improved the user configurable files update check for missing keys.
- Helpers: updated helpers.
### Removed
### Fixed

## [3.1.0] - 2023-09-25
### Added
### Changed
- UI: tooltip now shows region and continent for the selected country.
- Helpers: updated helpers.
### Removed
### Fixed

## [3.0.1] - 2023-09-20
### Added
### Changed
- Helpers: updated helpers
### Removed
### Fixed

## [3.0.0] - 2023-09-13
### Added
- Statistics: added statistics mode which can display multiple stats according to the library and database in charts. See [Statistics-Framework-SMP](https://github.com/regorxxx/Statistics-Framework-SMP).
### Changed
- Helpers: updated helpers
### Removed
### Fixed
- Name replacers not being used at some stages of the code (it probably did not affect anything though).

## [2.9.1] - 2023-07-29
### Added
### Changed
- Helpers: updated helpers.
### Removed
### Fixed

## [2.9.0] - 2023-07-28
### Added
### Changed
- Configuration: database now uses album artist by default instead of artist (file translation is done automatically).
- UI: improvements to panel updating when changing selection or updating tags, ensuring panel does not update unnecessarily.
- UI: locale values are cache during the session, to be reused in case tags, Bio or JSON don't have a match.
- Helpers: updated helpers.
### Removed
### Fixed
- Fix for non [standard hyphen chars](https://jakubmarian.com/hyphen-minus-en-dash-and-em-dash-difference-and-usage-in-english/) on path names.

## [2.8.3] - 2023-06-29
### Added
### Changed
### Removed
### Fixed
- Console: removed forgotten testing console logging.
- Helpers: fixed incorrect warning about missing font.

## [2.8.2] - 2023-06-27
### Added
### Changed
- Tags: improved country names display in some cases (with shorter names).
- Data: updated default database.
- Helpers: updated helpers.
### Removed
### Fixed
- Tags: fix alternate country names in some cases.
- Biography Integration: fix locale tag not updating properly in some cases since [2.8.1](#281---2023-05-16).
- UI: script version number.

## [2.8.1] - 2023-05-16
### Added
### Changed
- Biography Integration: optimized processing when Bio Panel notifies tags multiple times, updating just the first time per track.
### Removed
### Fixed

## [2.8.0] - 2023-05-08
### Added
- UI: new option to set the frequency at which the panel is refreshed after tracks change. Now set to 1000 ms by default. This avoids refreshing the panel when selection changes faster than such value (for ex. while scrolling the library), only updating the panel once afterwards.
- Package: new installation method as package.
### Changed
- Console: multiple improvements when logging to file for FbMetadbHandle, FbMetadbHandleList, Error and unknown instances (totally irrelevant except for debug purposes).
- Console: menu entries are no longer logged to console after clicking.
- Helpers: updated helpers.
### Removed
### Fixed

## [2.7.0] - 2023-03-08
### Added
### Changed
- Helpers: updated helpers.
### Removed
### Fixed

## [2.6.0] - 2023-03-04
### Added
### Changed
- UI: disabling the panel now shows the world map background (instead of just the filling color).
- Internal code cleanup of menus.
### Removed
### Fixed
- Console: logging of null value not working properly (totally irrelevant except for debug purposes).

## [2.5.0] - 2023-02-22
### Added
- UI: default fonts (header and tooltip) may now be changed at '[foobar profile]\js_data\presets\global\globFonts.json'.
### Changed
- UI: improved compatibility with some fonts under Unix systems (using Wine). Sometimes weird chars appeared on menu entries.
### Removed
### Fixed
- Helpers: fix path of helper (error introduced on  [2.4.0](#240---2023-02-15)).

## [2.4.1] - 2023-02-19
### Added
### Changed
- Helpers: updated helpers
### Removed
### Fixed

## [2.4.0] - 2023-02-15
### Added
- UI: allow multiple layers drawing when selecting different artists on selection mode.
### Changed
- UI: popups warning about selection mode changes can be hidden now (by using the appropriate setting).
- UI: antialiasing for point shape, should look much better now.
- UI: country layers loading is now asynchronous.
- UI: selection limit to refresh panel can now be configured via menus.
- UI: header now shows a predefined message when drawing multiple countries, instead of being hidden. Flag is still only showed when there is a single country drawn.
- UI: header now shows a -none- message when there is no locale tag found.
- Helpers: updated helpers.
- Data: updated default database.
- Properties: additional checks to properties.
- Properties: internal change to properties, all previous settings will be cleared. Make a backup if needed.
- Minor performance improvement (usually on subsequent calls) caching all TitleFormat expressions.
### Removed
### Fixed
- UI: (un)pressing shift to set the locale tag did not redraw the panel in some cases properly with the current country (on mouse leaving the panel, etc.).
- UI: pressing shift and Windows key at the same time no longer actives the tagging mode (since that's only used to open the SMP panel menu).

## [2.3.0] - 2022-08-22
### Added
### Changed
- Helpers: updated helpers.
### Removed
### Fixed

## [2.2.1] - 2022-08-21
### Added
### Changed
- Helpers: updated helpers.
### Removed
### Fixed
- Console: fixed console logging to file (lines were not being split properly).

## [2.2.0] - 2022-08-12
### Added
### Changed
- Helpers: switched all callbacks to [event listeners](https://github.com/regorxxx/Callbacks-Framework-SMP).
- Helpers: updated helpers.
### Removed
### Fixed
- Workaround for some instances where the scripts would warn about some feature not being supported by the OS (due to an OS or SMP bug).

## [2.1.1] - 2022-08-09
### Added
### Changed
- Helpers: updated helpers.
### Removed
### Fixed

## [2.1.0] - 2022-08-05
### Added
- UI: Configuration option to use country layers, points (old behaviour) or both. Country layers option highlights the entire country.
### Changed
- UI: changed all built-in map images by those provided by [Countries-Shapes-Generator](https://github.com/regorxxx/Countries-Shapes-Generator): natural and layers. Full/no Antarctica versions for both. layers files have transparent background.
- Tagging: On tagging mode (Shift + L. Click), country layer highlighting is used now instead of showing the point.
- Readmes: rewritten readmes to avoid line wrapping wen showing them within popup for a cleaner presentation.
- Helpers: temp files are now written at 'js_data\temp' instead of 'js_data'.
- Helpers: updated helpers.
### Removed
- UI: old mercator map images no longer provided.
### Fixed
- UI: Crash when image was not found on init.

## [2.0.4] - 2022-06-07
### Added
### Changed
- UI: enforced SMP version checking via popups.
- Helpers: updated helpers.
### Removed
### Fixed
- Fixed capitalization (bug introduced on 2.0.1).

## [2.0.3] - 2022-05-23
### Added
- UI: added presets to easily switch all the colors on the UI at the same time to pre-defined sets. Also added specific presets for Color Blindness (deuteranopia) and Grey Scale to improve accessibility.
### Changed
- Helpers: updated helpers.
### Removed
### Fixed

## [2.0.2] - 2022-05-04
### Added
### Changed
- Helpers: updated helpers.
### Removed
### Fixed

## [2.0.1] - 2022-04-13
### Added
### Changed
- Network: changed behavior of file recycling logic to check for network drives. Previously, when trying to delete a file on a network drive, a popup would appear asking to permanently delete the file. This is due to network drives not having a Recycle Bin by default on windows. In such case, now the file will be automatically deleted without popups.
- Console: playlist query is cut to 300 chars (to speed up UI responsiveness on console logging).
- Helpers: updated helpers.
- Helpers: improved sort and query expressions validity checks.
### Removed
### Fixed
- Tooltip: playlist modifiers being showed on library mode.
- Cultural Regions: improved capitalization logic.
- Helpers: avoid file reading crashing in any case (even if it's locked by another process).
- Helpers: fixed query checking not working due to upper/lower case mixing in some cases, should now be pretty robust with RegEx.
- Helpers: fixed UI slowdowns when required font is not found (due to excessive console logging). Now a warning popup is shown and logging is only done once per session.

## [2.0.0-beta.3] - 2022-03-02
### Added
- Cultural Regions: tooltip now shows the cultural region associated to the country point.
### Changed
- Tooltip: reworked text presentation.
- Menu: tag modifiers menu entries now show the current tag value.
- Helpers: updated helpers.
- Removed all code and compatibility checks for SMP <1.4.0.
### Removed
### Fixed
- Tooltip: tagging tip being showed on library mode instead of track mode.
- Helpers: file deletion failed when file was read-only.
- Helpers: file recycling has been overhauled to bypass Unix errors and shift pressing limitation (file was being deleted permanently). Now it tries 3 different methods, the last one requires an external executable and permissions may be asked by the SO.

## [2.0.0-beta.2] - 2021-12-30
### Added
- Data: database file from presets is now used as initial default file on first installation (or if the user's file gets deleted). This simplifies copying it manually on offline systems.
### Changed
- Biography Integration: updated Bio integration for 1.2.0 (requires no file mods now so it will work even after updating the Bio package on the future). In resume, works with 1.2.X branch (beta -with mods- or release versions) and 1.1.X -with mods-.
### Removed
### Fixed

## [2.0.0-beta.1] - 2021-12-23
### Added
- Library Mode: added a new mode which changes the behavior of the panel, displaying all the countries from the entire library artists database instead of following selection/playback. Clicking on a point creates playlists from that country (+genre, styles, etc.  according to keys pressed). Tooltip shows artist count from that country. The library database is cached and not updated on real time, so it works without performance penalties. (may be updated on demand)
- Tagging: locale tag (country) can be set for tracks missing the tag by clicking directly on the map. A menu will appear showing a list of countries near the clicked zone. Tags are saved directly to files or to the Json database according to the config. (It applies the same country to all selected tracks, don't use it for different artists unless all are from there!)
- Tagging: locale tag (country) may be rewritten by Shift + L. Clicking on the map (when a point is already being drawn). The old tag will be deleted and the new selected country will be used instead.
- Flags: Flags can be shown along the country name at the header. Configurable at UI menu.
- Data: added a new submenu named 'Database'.
- Data: added a new menu entry which finds all artists from the library without a locale tag (either on tags or on JSON). Meant to be used along some automation tool to preview all tracks (foo_scheduler, AutoHotkey, etc.) while using Biography script to automatically tag them or to do it manually. Obviously file tag checking can be done via queries, but not on JSON data... also this has the benefit of only listing 1 track per artist.
- Data: added new entries to merge database files (JSON), merge tags from current library tags with the JSON database or write tags from JSON database back to the files. i.e. all tags can be synchronized between tracks and JSON with just one click. Option to overwrite duplicates or only merge new tags in all cases.
- Data: the repository now also includes a JSON tag database which can be used as is or merged into the personal database (with the latest additions). It can be found at '_resources\worldMap.json'.
- UI: point's color and size can be customized on menus.
- UI: Configurable header with current country for selected tracks (only active if entire selection has the same country tag). Text color and zie is also configurable on menus.
- Presets: added a few AutoHotkey scripts meant to be used for automated locale tag scrapping along Bio script.
- Helpers: added full script console logging to file at foobar profile folder ('console.log'). File is reset when reaching 5 MB. Logging is also sent to foobar2000's console (along other components logging)
### Changed
- Biography integration: mod installation has changed. Mod is now copied to the root of the Biography script path, and loaded from there. Should now work with portable installations too even if the drive letter changes. Due to this change, it's recommended to uninstall integration before updating this update, and reinstall afterwards. Otherwise, automatic uninstall will fail on the future (since it will try to revert the new changes instead of the old ones).
- Installation: Installation path may now be changed by editing 'folders.xxxName' variable at '.\helpers\helpers_xxx.js'. This is a workaround for some SMP limitations when working with relative paths and text files, images or dynamic file loading.
- UI: All UI configuration moved to its own submenu.
- Header: Name is shortened if it's too long for the current width and font size combination. It also takes into account flag size if it's enabled.
- Tags: Added some common variations for a few country names to enhance matching (points and flags) even if they are not the standard ISO names or have swapped prefixes. Note this "expands" [Georgia theme's](https://kbuffington.github.io/Georgia/) flag feature since it should match better country names now (for ex. 'Tanzania', 'Tanzania, United Republic of' and 'United Republic of Tanzania'). This is also used for displaying the country name at header (shorter version is preferred) and for tagging files and json (the full iso standard name is preferred).
- Helpers: updated. Whenever a folder needs to be created to save a new file, the entire tree is now created if needed. Previously it would fail as soon as any folder did not exist. This greatly speeds up setting panels since now the final folder does not need to exists at all to work, since it will be created on the fly.
- Helpers: additional checks at json loading on all scripts. Warnings via popup when a corrupted file is found.
- All json files are now saved as UTF-8 without BOM. All json files are now read as UTF-8 (forced).
### Removed
### Fixed
- Biography Integration: Bio mods rewritten (less size) wrapping callbacks, instead of rewriting them entirely.
- Last selected point was redrawn when mouse moved over it, even if no selection was present at that point.
- Multiple minor improvements and fixes on path handling for portable installations.
- Multiple minor improvements and fixes when saving files on non existing folders.
- Map was not being redrawn automatically when locale tags changed.

## [1.2.2] - 2021-06-21
### Added
### Changed
### Removed
### Fixed
- Biography Integration: crash when trying to install mod and 1.2.X  package was not present.

## [1.2.1] - 2021-06-15
### Added
- Biography Integration: Now works with Biography 1.2.X version too. 'Notify tags' must be enabled on Bio's config panel, the script will do it automatically when installing the mod. Apart from that, installation and selection mode sync works the same than 1.1.X series.
- Image: Added 2 map versions with black border (now the default ones).
- Colors: Option to change background color.
### Changed
- Portable: When properties are set for the first time, now use relative paths on profile folder for portable installations (>= 1.6).
- Data: json file for tags is now formatted to be readable.
- Biography Integration: Manually reloading Biography panel after installing the mod is no longer required, since it's done automatically after installing the mod.
- Image: 'No Antarctica map' (black border) is now the default one.
### Removed
### Fixed
- Menu: After setting a custom map image, panel was not being redrawn (requiring a manual update).
- Avoid possible crashes when tags json file get corrupted. Warns about it with a popup.

## [1.2.0] - 2021-06-07
### Added
### Changed
- Helpers: Split 'helpers_xxx.js' file into multiple ones for easier future maintenance.
### Removed
### Fixed

## [1.1.1] - 2021-05-28
### Added
### Changed
- Menu framework: updated.
### Removed
### Fixed
- Changing image map did not ask automatically for X and Y coordinates factors.

## [1.1.0] - 2021-05-26
### Added
- Menu: Map image can be set via menus.
- Menu: 2 different map images are not offered by default, full and No Antarctica. Coordinates are re-scaled according to the crop when choosing the later.
- Map framework: Coordinates transformation has been added, allowing to use custom map images while using the default coordinates (plus a factor).
### Changed
- Map framework: updated with last changes.
- Menu framework: updated with last changes.
- Readme: updated some tips.
### Removed
### Fixed

## [1.0.1] - 2021-05-12
### Added
- Portable: Additional checks for portable installations.
- Additional check for biography enabled property to avoid conflicts when manually editing properties.
- Files: helpers\world_map_menu.js and helpers\world_map_helpers.js.
- 3 key modifiers for playlist creation supported.
### Changed
- Map framework: updated with last changes.
- Menu: moved all code to helpers\world_map_menu.js.
- Menu: added entries to edit tags related to playlist creation when using key modifiers + left click.
- Helpers: moved all code to helpers\world_map_helpers.js.
- UI: Modifier tags allow multiple tags set for the same key.
- UI: Some minor changes on tooltip.
- Properties. Breaks properties from previous versions!
### Removed
### Fixed
- UI: refresh points after showing the tooltip on one and changing the selected tracks.

## [1.0.0] - 2021-05-01
### Added
- First release.
### Changed
### Removed
### Fixed

[Unreleased]: ../../compare/v4.4.0...HEAD
[4.4.0]: ../../compare/v4.3.1...v4.4.0
[4.3.1]: ../../compare/v4.3.0...v4.3.1
[4.3.0]: ../../compare/v4.2.1...v4.3.0
[4.2.1]: ../../compare/v4.2.0...v4.2.1
[4.2.0]: ../../compare/v4.1.0...v4.2.0
[4.1.0]: ../../compare/v4.0.0...v4.1.0
[4.0.0]: ../../compare/v3.15.0...v4.0.0
[3.15.0]: ../../compare/v3.14.1...v3.15.0
[3.14.1]: ../../compare/v3.14.0...v3.14.1
[3.14.0]: ../../compare/v3.13.0...v3.14.0
[3.13.0]: ../../compare/v3.12.0...v3.13.0
[3.12.0]: ../../compare/v3.11.0...v3.12.0
[3.11.0]: ../../compare/v3.10.0...v3.11.0
[3.10.0]: ../../compare/v3.9.0...v3.10.0
[3.9.0]: ../../compare/v3.8.0...v3.9.0
[3.8.0]: ../../compare/v3.7.0...v3.8.0
[3.7.0]: ../../compare/v3.6.0...v3.7.0
[3.6.0]: ../../compare/v3.5.0...v3.6.0
[3.5.0]: ../../compare/v3.4.0...v3.5.0
[3.4.0]: ../../compare/v3.3.0...v3.4.0
[3.3.0]: ../../compare/v3.2.0...v3.3.0
[3.2.0]: ../../compare/v3.1.0...v3.2.0
[3.1.0]: ../../compare/v3.0.0...v3.1.0
[3.0.0]: ../../compare/v2.9.1...v3.0.0
[2.9.1]: ../../compare/v2.9.0...v2.9.1
[2.9.0]: ../../compare/v2.8.2...v2.9.0
[2.8.3]: ../../compare/v2.8.2...v2.8.3
[2.8.2]: ../../compare/v2.8.1...v2.8.2
[2.8.1]: ../../compare/v2.8.0...v2.8.1
[2.8.0]: ../../compare/v2.7.0...v2.8.0
[2.7.0]: ../../compare/v2.6.0...v2.7.0
[2.6.0]: ../../compare/v2.5.0...v2.6.0
[2.5.0]: ../../compare/v2.4.1...v2.5.0
[2.4.1]: ../../compare/v2.4.0...v2.4.1
[2.4.0]: ../../compare/v2.3.0...v2.4.0
[2.3.0]: ../../compare/v2.2.1...v2.3.0
[2.2.1]: ../../compare/v2.2.0...v2.2.1
[2.2.0]: ../../compare/v2.1.1...v2.2.0
[2.1.1]: ../../compare/v2.1.0...v2.1.1
[2.1.0]: ../../compare/v2.0.4...v2.1.0
[2.0.4]: ../../compare/v2.0.3...v2.0.4
[2.0.3]: ../../compare/v2.0.2...v2.0.3
[2.0.2]: ../../compare/v2.0.1...v2.0.2
[2.0.1]: ../../compare/v2.0.0-beta.3...v2.0.1
[2.0.0-beta.3]: ../../compare/v2.0.0-beta.2...v2.0.0-beta.3
[2.0.0-beta.2]: ../../compare/v2.0.0-beta.1...v2.0.0-beta.2
[2.0.0-beta.1]: ../../compare/v1.2.2...v2.0.0-beta.1
[1.2.2]: ../../compare/v1.2.1...v1.2.2
[1.2.1]: ../../compare/v1.2.0...v1.2.1
[1.2.0]: ../../compare/v1.1.1...v1.2.0
[1.1.1]: ../../compare/v1.1.0...v1.1.1
[1.1.0]: ../../compare/v1.0.1...v1.1.0
[1.0.1]: ../../compare/v1.0.0...v1.0.1
[1.0.0]: ../../compare/8df8206...v1.0.0