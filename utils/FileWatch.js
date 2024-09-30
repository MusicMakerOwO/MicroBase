const fs = require('node:fs');
const Debounce = require('./Debounce.js');

const FOLDERS = [
	'commands',
	'buttons',
	'modals',
	'menus',
	'messages',
	'events' // this is a special case and will be handled separately
]

module.exports = function (client) {
	for (const folder of FOLDERS) {
		if (!fs.existsSync(`${__dirname}/../${folder}`)) {
			client.logs.warn(`[RELOAD] No ${folder} folder found - Skipping...`);
			continue;
		}

		async function callBack (eventType, filename) {
			if (!filename) return;
			client.emit('hotReload', { folder, eventType, filename });
		}

		fs.watch(`${__dirname}/../${folder}`, { recursive: true }, Debounce(callBack, 100));
	}
}