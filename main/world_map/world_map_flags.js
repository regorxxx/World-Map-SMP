'use strict';
//09/06/24

/* exported loadFlagImage */

/* global folders:readable */
include('world_map_tables.js');
/* global getCountryName:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global _isFile:readable */

function loadFlagImage(country) {
	const countryName = getCountryName(country); // in case we have a 3-digit country code or a variation of a name
	const path = folders.xxx + 'images\\flags\\64\\' + countryName.trim().replace(/[ ,.]/g, '-').toLowerCase() + '.png';
	return (_isFile(path) ? gdi.Image(path) : gdi.Image(folders.xxx + 'images\\flags\\64\\not_found.png')); // use standard image as fallback
}