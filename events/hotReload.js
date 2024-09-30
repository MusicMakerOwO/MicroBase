const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

const RegisterCommands = require('../utils/RegisterCommands.js');
const ComponentLoader = require('../utils/ComponentLoader.js');
const EventLoader = require('../utils/EventLoader.js');

const FILE_TEMPLATE = {
	folder: 'myFolder',
	eventType: 'change',
	filename: 'myFile.js'
}

module.exports = {
	name: 'hotReload',
	execute: async function (client, file = FILE_TEMPLATE) {

		if (!file.folder || !file.eventType || !file.filename) {
			client.logs.warn(`[RELOAD] Invalid file event detected - Ignoring...`);
			client.logs.warn(file);
			return;
		}

		if (!file.filename.endsWith('.js')) return;

		const fullPath = path.resolve(`${__dirname}/../${file.folder}/${file.filename}`);
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

		const cache = client[file.folder];

		if (typeof newFile.execute !== 'function') {
			client.logs.warn(`[RELOAD] Execute is not a function - Ignoring...`);
			return;
		}

		const oldData = cache?.get(newFile.customID ?? newFile.name ?? newFile.data?.name);
		if (!oldData && file.folder !== 'events') {
			// changed the customID, need a full reload of that folder
			ComponentLoader(client, file.folder);
			return;
		}

		let needsRegister = false;

		switch (file.folder) {
			case 'buttons':
			case 'menus':
			case 'modals':
			case 'messages':
				cache.set(newFile.customID ?? newFile.name, newFile);
				break;
			case 'commands':
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

		if (!needsRegister) return client.logs.debug(`[RELOAD] Successfully reloaded ${file.folder}/${file.filename}`);

		RegisterCommands(client);

		client.logs.debug(`[RELOAD] Successfully reloaded ${file.folder}/${file.filename}`);
		client.logs.debug(`[RELOAD] If the new command is not showing up restart your discord client!`);
	}
}