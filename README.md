# World-Map-SMP
[![version][version_badge]][changelog]
[![CodeFactor][codefactor_badge]](https://www.codefactor.io/repository/github/regorxxx/world-map-smp/overview/main)
[![Codacy Badge][codacy_badge]](https://www.codacy.com/gh/regorxxx/World-Map-SMP/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=regorxxx/World-Map-SMP&amp;utm_campaign=Badge_Grade)
![GitHub](https://img.shields.io/github/license/regorxxx/World-Map-SMP)  
A [foobar2000](https://www.foobar2000.org) UI [Spider Monkey Panel](https://theqwertiest.github.io/foo_spider_monkey_panel) which displays current artist's country on the world map and lets you generate autoplaylists based on selection and locale tag saving when integrated along [WilB's Biography Script](https://hydrogenaud.io/index.php?topic=112913.0). 

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

# Installation
See [_TIPS and INSTALLATION (txt)](https://github.com/regorxxx/Playlist-Manager-SMP/blob/main/_TIPS%20and%20INSTALLATION.txt) and the [Wiki](https://github.com/regorxxx/Playlist-Manager-SMP/wiki/Installation).
Not properly following the installation instructions will result in scripts not working as intended. Please don't report errors before checking this.

[changelog]: CHANGELOG.md
[version_badge]: https://img.shields.io/github/release/regorxxx/World-Map-SMP.svg
[codacy_badge]: https://api.codacy.com/project/badge/Grade/d68ef528f77646bca546fd206d28e8a1
[codefactor_badge]: https://www.codefactor.io/repository/github/regorxxx/world-map-smp/badge/main
