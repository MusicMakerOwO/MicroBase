const fs = require('node:fs');
const { Events } = require('discord.js');
const ReadFolder = require('./ReadFolder.js');
const Logs = require('./Logs.js');

const { CHECK_EVENT_NAMES } = require('../config.json');

const IGNORED_EVENTS = [
	'hotReload',
	'shutdown'
]

module.exports = function (client, folderPath) {
	if (!fs.existsSync(`${__dirname}/../${folderPath}`)) {
		Logs.warn('Events folder not found, skipping...');
		return;
	}

	const filePaths = ReadFolder(`${__dirname}/../${folderPath}`);

	for (let i = 0; i < filePaths.length; i++) {
		const path = filePaths[i];
		if (!path.endsWith('.js')) continue;

		const data = require(path);

		try {
			if (!data.name) throw `Event is missing a name!`;
			if (typeof data.name !== 'string') throw `Event name must be a string!`;

			const eventRegex_v13 = /^[A-Z_]+$/;
			if (eventRegex_v13.test(data.name)) {
				// convert to v14
				// MESSAGE_CREATE -> messageCreate
				data.name = String(data.name).toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
			}

			if (Events[data.name]) data.name = Events[data.name];

			if (CHECK_EVENT_NAMES && !IGNORED_EVENTS.includes(data.name) && !Object.values(Events).includes(data.name)) {
				Logs.warn(`Possibly invalid event name "${data.name}" - Unless it is a custom event this will never be called!`);
			}
			
			if (typeof data.execute !== 'function') throw `Event is missing an execute function!`;

			const callback = data.execute.bind(null, client);
			if (data.once) client.once(data.name, callback);
			else client.on(data.name, callback);
		} catch (error) {
			Logs.error(`Failed to load event ${path}`);
			Logs.error(error);
		}
	}
};