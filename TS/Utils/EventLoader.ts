import fs from 'node:fs';
import { Events } from 'discord.js';
import ReadFolder from './ReadFolder.js';
import Logs from './Logs.js';
import { MicroClient, EventFile } from '../typings';

const IGNORED_EVENTS = [
	'hotReload',
	'shutdown'
]

export default function (client: MicroClient) {
	if (!fs.existsSync(`${__dirname}/../events/`)) {
		Logs.warn('Events folder not found, skipping...');
		return;
	}

	const files = ReadFolder('events');
	for (const { path, data } of files as Array<{ path: string, data: EventFile }>) {
		try {
			if (!data.name) throw `Event is missing a name!`;
			if (typeof data.name !== 'string') throw `Event name must be a string!`;

			const eventRegex_v13 = /^[A-Z_]+$/;
			if (eventRegex_v13.test(data.name)) {
				// convert to v14
				// MESSAGE_CREATE -> messageCreate
				data.name = String(data.name).toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
			}

			// @ts-ignore
			if (Events[data.name]) data.name = Events[data.name];

			// @ts-ignore
			if (!Events[data.name] && !Object.values(Events).includes(data.name) && !IGNORED_EVENTS.includes(data.name)) {
				Logs.warn(`Possibly invalid event name "${data.name}" - Unless it is a custom event this will never be called!`);
			}
			
			if (typeof data.execute !== 'function') throw `Event is missing an execute function!`;

			client[data.once ? 'once' : 'on'](data.name, data.execute.bind(null, client));
		} catch (error) {
			Logs.error(`Failed to load event ${path}`);
			Logs.error(error);
		}
	}
}
module.exports = exports.default;