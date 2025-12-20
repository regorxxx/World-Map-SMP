# World-Map-SMP
[![version][version_badge]][changelog]
[![CodeFactor][codefactor_badge]](https://www.codefactor.io/repository/github/regorxxx/world-map-smp/overview/main)
[![Codacy Badge][codacy_badge]](https://www.codacy.com/gh/regorxxx/World-Map-SMP/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=regorxxx/World-Map-SMP&amp;utm_campaign=Badge_Grade)
![GitHub](https://img.shields.io/github/license/regorxxx/World-Map-SMP)  
A [foobar2000](https://www.foobar2000.org) UI [Spider Monkey Panel](https://theqwertiest.github.io/foo_spider_monkey_panel)/[JSplitter](https://foobar2000.ru/forum/viewtopic.php?t=6378) which displays current artist's country on the world map and lets you generate autoplaylists based on selection and locale tag saving when integrated along [WilB's Biography Script](https://github.com/Wil-B/Biography). 

![Animation4](https://user-images.githubusercontent.com/83307074/116752367-002d9100-a9f5-11eb-8a03-0ee323634742.gif)

# Features

![Animation5](https://user-images.githubusercontent.com/83307074/116752374-01f75480-a9f5-11eb-9d30-a9958079b1ee.gif)

* Map image configurable:
  * Full.
  * No Antarctica.
  * Custom. (coordinates may need a transformation to work)
* Configurable X and Y factors for transformation (along custom image maps).
* 2 modes:
  * Standard: Follow now playing track or selection.
  * Library: display statistics of entire library (independtly of the selection/playback).
* Works with multiple selected tracks (draws all points on the map), allowing to show statistics of an entire playlist or library.
* On playback the panel fetches tags from (by order of preference):
  * Track's tags.
  * Json database.
  * WilB's Biography panel.
* WilB's Biography integration (1.1.X or 1.2.0+):
  * [1.1.X](https://hydrogenaud.io/index.php?topic=112913.msg977224#msg977224): Done via script. There is a menu option to install the mod (it looks for the original file, edits the relevant lines and creates a backup). Is done step by step and can be reverted back.
  * [1.2.0+](https://hydrogenaud.io/index.php?topic=112913.msg1001097#msg1001097): Works automatically without requiring further action.
  * Selection mode changes automatically when changing it on Biography panel, therefore syncing the changes.
  * Biography lets you write tags on demand, this lets you write tags as soon as the panel gets refreshed with new data.
* Tool-tip shows multiple info about the points and tracks selected.
* AutoPlaylist creation:
   * On click over a point, an autoplaylist is created with any artist on your library from the selected country.
   * Ctrl modifier: forces an autoplaylist  with artist from selected country AND same tags (2 configurable). Currently set to style and genre.

![Animation6](https://user-images.githubusercontent.com/83307074/116752378-03c11800-a9f5-11eb-9971-b3eff6e8d0fa.gif)

## Requirements (only one host component required)
 1. [Spider Monkey Panel or JSplitter](../../wiki/SMP-vs-JSplitter-notes): JavaScript host component required to install this. Available in x86 and x64.
 4. [Required fonts](https://github.com/regorxxx/foobar2000-assets/tree/main/Fonts): FontAwesome, Segoe UI, Arial Unicode MS

# Installation
See [Wiki](../../wiki/Installation) or the [_INSTALLATION (txt)](../main/_INSTALLATION.txt).
Not properly following the installation instructions will result in scripts not working as intended. Please don't report errors before checking this.

## Support
 1. [Issues tracker](../../issues).
 2. [Hydrogenaudio forum](https://hydrogenaud.io/index.php/topic,120980.0.html).
 3. [Wiki](../../wiki).

## Nightly releases
Automatic package [built from GitHub](https://nightly.link/regorxxx/World-Map-SMP/workflows/build/main/file.zip) (using the latest commit). Unzip 'file.zip' downloaded and load the '\*-SMP-\*-\*-\*-package.zip' inside as package within your JS host component.

[changelog]: CHANGELOG.md
[version_badge]: https://img.shields.io/github/release/regorxxx/World-Map-SMP.svg
[codacy_badge]: https://api.codacy.com/project/badge/Grade/d68ef528f77646bca546fd206d28e8a1
[codefactor_badge]: https://www.codefactor.io/repository/github/regorxxx/world-map-smp/badge/main
