const fs = require('node:fs');
const { Events } = require('discord.js');
const ReadFolder = require('./ReadFolder.js');

const IGNORED_EVENTS = [
	'hotReload'
]

module.exports = function (client) {
	if (!fs.existsSync(`${__dirname}/../events/`)) {
		client.logs.warn('Events folder not found, skipping...');
		return;
	}

	const files = ReadFolder('events');
	for (const { path, data } of files) {
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

			if (!Events[data.name] && !Object.values(Events).includes(data.name) && !IGNORED_EVENTS.includes(data.name)) {
				client.logs.warn(`Possibly invalid event name "${data.name}" - Unless it is a custom event this will never be called!`);
			}
			
			if (typeof data.execute !== 'function') throw `Event is missing an execute function!`;

			client[data.once ? 'once' : 'on'](data.name, data.execute.bind(null, client));
		} catch (error) {
			client.logs.error(`Failed to load event ${path}: ${error}`);
		}
	}
	
	client.logs.debug(`Loaded ${files.length} events!`);
}