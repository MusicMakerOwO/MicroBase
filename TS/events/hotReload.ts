import fs from 'node:fs';
import path from 'node:path';

import RegisterCommands from '../Utils/RegisterCommands';
import ComponentLoader from '../Utils/ComponentLoader';
import EventLoader from '../Utils/EventLoader';

import { MicroClient } from '../typings';

interface File {
	folder: 'commands' | 'context' | 'buttons' | 'menus' | 'modals' | 'messages' | 'events';
	eventName: string;
	fileName: string;
}

export default{
	name: 'hotReload',
	execute: async function (client: MicroClient, file: File) {

		if (!file.folder || !file.eventName || !file.fileName) {
			client.logs.warn(`[RELOAD] Invalid file event detected - Ignoring...`);
			client.logs.warn(file);
			return;
		}

		if (!file.fileName.endsWith('.js')) return;

		const fullPath = path.resolve(`${__dirname}/../${file.folder}/${file.fileName}`);
		if (fullPath === __filename) return; // ignore this file
		if (!fs.existsSync(fullPath)) {
			client.logs.warn(`[RELOAD] File does not exist - Was it deleted or renamed?`);
			return;
		}

		const newFileData = fs.readFileSync(fullPath, 'utf8');
		if (!newFileData) {
			client.logs.warn(`[RELOAD] Failed to load new file data - Was it just created?`);
			return;
		}

		// this can lead to potential memory leaks
		// It will be fine assuming the developer uses the cache properly instead of require() for components
		try {
			delete require.cache[require.resolve(fullPath)];
			var newFile = require(fullPath);
		} catch (error) {
			client.logs.warn(`[RELOAD] Failed to load new file data`);
			client.logs.error(error);
			return;
		}

		// @ts-ignore
		const cache = client[file.folder];

		if (typeof newFile.execute !== 'function') {
			client.logs.warn(`[RELOAD] Execute is not a function - Ignoring...`);
			return;
		}
		
		let needsRegister = false;

		const ID = newFile.customID ?? newFile.name ?? newFile.data?.name;

		const oldData = cache?.get(ID);
		client.responseCache.delete(ID);
		if (!oldData && file.folder !== 'events') {
			// changed the customID, need a full reload of that folder
			ComponentLoader(client, file.folder);
			needsRegister = file.folder === 'commands' || file.folder === 'context';
		}

		if (!needsRegister) {
			switch (file.folder) {
				case 'buttons':
				case 'menus':
				case 'modals':
				case 'messages':
					cache.set(newFile.customID ?? newFile.name, newFile);
					break;
				case 'commands':
				case 'context':
					const oldData = cache.get(newFile.data.name);
					// only register commands if fileData.data has changed in any way
					const oldDataJSON = JSON.stringify( typeof oldData?.data?.toJSON === 'function' ? oldData?.data?.toJSON() : oldData?.data);
					const newFileJSON = JSON.stringify( typeof newFile.data?.toJSON === 'function' ? newFile.data?.toJSON() : newFile.data);
					if (!oldData || oldDataJSON !== newFileJSON) needsRegister = true;
					cache.set(newFile.data.name, newFile);
					break;
				case 'events':
					client.removeAllListeners();
					EventLoader(client);
					break;
				default:
					client.logs.warn(`[RELOAD] Unsure how to interact with folder : ${file.folder}`);
					break;
			}
		}

		if (!needsRegister) return client.logs.debug(`[RELOAD] Successfully reloaded ${file.folder}/${file.fileName}`);

		if (process.send) {
			client.shards.broadcastRegister();
		} else {
			client.logs.info('Started refreshing application (/) commands');
			RegisterCommands(client);
			client.logs.info('Successfully reloaded application (/) commands');
		}

		client.logs.debug(`[RELOAD] Successfully reloaded ${file.folder}/${file.fileName}`);
		// client.logs.debug(`[RELOAD] If the new command is not showing up restart your discord client!`);
	}
}
module.exports = exports.default;