# Changelog

## [Table of Contents]
- [Unreleased](#unreleased)
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
### Changed
### Removed
### Fixed

## [3.4.0] - 2023-11-15
### Added
- UI: country shapes are now configurable: color and transparency. Setting a custom color uses masking under the hood, which may have a different performance impact than the 'default' mode (which just loads the country shapes with a fixed color).
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
- Statistics: added statistics mode which can display multiple stats according to the library and database in charts. See [ Statistics-Framework-SMP](https://github.com/regorxxx/Statistics-Framework-SMP).
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
- UI: allow multiple shapes drawing when selecting different artists on selection mode.
### Changed
- UI: popups warning about selection mode changes can be hidden now (by using the appropriate setting).
- UI: antialiasing for point shape, should look much better now.
- UI: country shapes loading is now asynchronous.
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
- UI: Configuration option to use country shapes, points (old behaviour) or both. Country shapes option highlights the entire country.
### Changed
- UI: changed all built-in map images by those provided by [Countries-Shapes-Generator](https://github.com/regorxxx/Countries-Shapes-Generator): natural and shapes. Full/no Antarctica versions for both. Shapes files have transparent background.
- Tagging: On tagging mode (Shift + L. Click), country shape highlighting is used now instead of showing the point.
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
- Tags: Added some common variations for a few country names to enhance matching (points and flags) even if they are not the standard iso names or have swapped prefixes. Note this "expands" [Georgia theme's](https://kbuffington.github.io/Georgia/) flag feature since it should match better country names now (for ex. 'Tanzania', 'Tanzania, United Republic of' and 'United Republic of Tanzania'). This is also used for displaying the country name at header (shorter version is preferred) and for tagging files and json (the full iso standard name is preferred).
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

[Unreleased]: https://github.com/regorxxx/World-Map-SMP/compare/v3.4.0...HEAD
[3.4.0]: https://github.com/regorxxx/World-Map-SMP/compare/v3.3.0...v3.4.0
[3.3.0]: https://github.com/regorxxx/World-Map-SMP/compare/v3.2.0...v3.3.0
[3.2.0]: https://github.com/regorxxx/World-Map-SMP/compare/v3.1.0...v3.2.0
[3.1.0]: https://github.com/regorxxx/World-Map-SMP/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/regorxxx/World-Map-SMP/compare/v2.9.1...v3.0.0
[2.9.1]: https://github.com/regorxxx/World-Map-SMP/compare/v2.9.0...v2.9.1
[2.9.0]: https://github.com/regorxxx/World-Map-SMP/compare/v2.8.2...v2.9.0
[2.8.3]: https://github.com/regorxxx/World-Map-SMP/compare/v2.8.2...v2.8.3
[2.8.2]: https://github.com/regorxxx/World-Map-SMP/compare/v2.8.1...v2.8.2
[2.8.1]: https://github.com/regorxxx/World-Map-SMP/compare/v2.8.0...v2.8.1
[2.8.0]: https://github.com/regorxxx/World-Map-SMP/compare/v2.7.0...v2.8.0
[2.7.0]: https://github.com/regorxxx/World-Map-SMP/compare/v2.6.0...v2.7.0
[2.6.0]: https://github.com/regorxxx/World-Map-SMP/compare/v2.5.0...v2.6.0
[2.5.0]: https://github.com/regorxxx/World-Map-SMP/compare/v2.4.1...v2.5.0
[2.4.1]: https://github.com/regorxxx/World-Map-SMP/compare/v2.4.0...v2.4.1
[2.4.0]: https://github.com/regorxxx/World-Map-SMP/compare/v2.3.0...v2.4.0
[2.3.0]: https://github.com/regorxxx/World-Map-SMP/compare/v2.2.1...v2.3.0
[2.2.1]: https://github.com/regorxxx/World-Map-SMP/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/regorxxx/World-Map-SMP/compare/v2.1.1...v2.2.0
[2.1.1]: https://github.com/regorxxx/World-Map-SMP/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/regorxxx/World-Map-SMP/compare/v2.0.4...v2.1.0
[2.0.4]: https://github.com/regorxxx/World-Map-SMP/compare/v2.0.3...v2.0.4
[2.0.3]: https://github.com/regorxxx/World-Map-SMP/compare/v2.0.2...v2.0.3
[2.0.2]: https://github.com/regorxxx/World-Map-SMP/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/regorxxx/World-Map-SMP/compare/v2.0.0-beta.3...v2.0.1
[2.0.0-beta.3]: https://github.com/regorxxx/World-Map-SMP/compare/v2.0.0-beta.2...v2.0.0-beta.3
[2.0.0-beta.2]: https://github.com/regorxxx/World-Map-SMP/compare/v2.0.0-beta.1...v2.0.0-beta.2
[2.0.0-beta.1]: https://github.com/regorxxx/World-Map-SMP/compare/v1.2.2...v2.0.0-beta.1
[1.2.2]: https://github.com/regorxxx/World-Map-SMP/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/regorxxx/World-Map-SMP/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/regorxxx/World-Map-SMP/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/regorxxx/World-Map-SMP/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/regorxxx/World-Map-SMP/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/regorxxx/World-Map-SMP/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/regorxxx/World-Map-SMP/compare/8df8206...v1.0.0