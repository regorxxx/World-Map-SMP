# Changelog

## [Table of Contents]
- [Unreleased](#unreleased)
- [1.2.1](#130---2021-06-15)
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

## [1.2.1] - 2021-06-15
### Added
- Biography Integration: Now works with Biograpy 1.2.X version too. 'Notify tags' must be enabled on Bio's config panel, the script will do it automatically when installing the mod. Appart from that, installation and selection mode sync works the same than 1.1.X series.
- Image: Added 2 map versions with black border (now the default ones).
- Colors: Option to change background color.
### Changed
- Portable: When properties are set for the first time, now use relative paths on profile folder for portable installations (>= 1.6).
- Data: json file for tags is now formatted to be readable.
- Biography Integration: Manually reloading Biography panel after installing the mod is no longer required, since it's done auttomatically after installing the mod.
- Image: 'No Antarctica map' (black border) is now the default one.
### Removed
### Fixed
- Menu: After setting a custom map image, panel was not being redrawn (requiring a manual update).
- Avoid possible crashes when tags json file get corrupted. Warns about it whit a popup.

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
- Bug fix: refresh points after showing the tooltip on one and changing the selected tracks.
- Map framework: updated with last changes.
- Menu: moved all code to helpers\world_map_menu.js.
- Menu: added entries to edit tags related to playlist creation when using key modifiers + left click.
- Helpers: moved all code to helpers\world_map_helpers.js.
- Breaks properties from previous versions!
- Modifer tags allow multiple tags set for the same key.
- Some minor changes on tooltip.
### Removed
### Fixed

## [1.0.0] - 2021-05-01
### Added
- First release.
### Changed
### Removed
### Fixed

[Unreleased]: https://github.com/regorxxx/World-Map-SMP/compare/v1.2.1...HEAD
[1.2.1]: https://github.com/regorxxx/World-Map-SMP/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/regorxxx/World-Map-SMP/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/regorxxx/World-Map-SMP/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/regorxxx/World-Map-SMP/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/regorxxx/World-Map-SMP/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/regorxxx/World-Map-SMP/compare/8df8206...v1.0.0
