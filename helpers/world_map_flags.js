'use strict';
//07/10/21

include('world_map_tables.js');
include('helpers_xxx_file.js');

function loadFlagImage(country) {
	
	const countryName = isoMapRev.get(country) || nameReplacers.get(country) || country; // in case we have a 3-digit country code or a variation of a name
	const path = folders.xxx + 'images\\flags\\64\\' + countryName.trim().replace(/[ ,.]/g, '-').toLowerCase() + '.png';
	return (_isFile(path) ? gdi.Image(path) : gdi.Image(folders.xxx + 'images\\flags\\64\\not_found.png')); // use standard image as fallback
}