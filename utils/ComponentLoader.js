const ReadFolder = require('./ReadFolder.js');
const { existsSync } = require('node:fs');
const path = require('node:path');

const { PermissionsBitField: { Flags: Permissions } } = require('discord.js');

const modules = [
	'commands',
	'buttons',
	'menus',
	'modals',
	'messages',
];

module.exports = function (client, folder = null) {
	for (const module of modules) {
		if (typeof folder === 'string' && folder !== module) continue;

		client[module] = new Map();

		if (!existsSync(`${__dirname}/../${module}`)) {
			client.logs.warn(`No ${module} folder found - Skipping...`);
			continue;
		}

		const files = ReadFolder(module);
		for (const { path: filePath, data } of files) {
			try {
				if (!data.execute) throw `No execute function found`;
				if (typeof data.execute !== 'function') throw `Execute is not a function`;
				
				if (data.roles) {
					if (!Array.isArray(data.roles)) throw `Invalid roles type - Must be an array`;
					if (data.roles.every(role => typeof role !== 'string')) throw `Invalid roles type - Must be an array of strings`;
				}

				if (data.users) {
					if (!Array.isArray(data.users)) throw `Invalid users type - Must be an array`;
					if (data.users.every(user => typeof user !== 'string')) throw `Invalid users type - Must be an array of strings`;
				}

				if (data.botPerms) {
					if (!Array.isArray(data.botPerms)) throw `Invalid bot permissions type - Must be an array`;
					if (data.botPerms.every(perm => typeof perm !== 'string')) throw `Invalid bot permissions type - Must be an array of strings`;
					CheckPerms(data.botPerms, 'bot');
				}

				if (data.userPerms) {
					if (!Array.isArray(data.userPerms)) throw `Invalid user permissions type - Must be an array`;
					if (data.userPerms.every(perm => typeof perm !== 'string')) throw `Invalid user permissions type - Must be an array of strings`;
					CheckPerms(data.userPerms, 'user');
				}

				if (data.guilds) {
					if (!Array.isArray(data.guilds)) throw `Invalid guilds type - Must be an array`;
					if (data.guilds.every(guild => typeof guild !== 'string')) throw `Invalid guilds type - Must be an array of strings`;
				}

				if (data.dev && typeof data.dev !== 'boolean') throw 'Invalid dev type - Must be a boolean';
				if (data.cooldown && typeof data.cooldown !== 'number') throw 'Invalid cooldown type - Must be a number (seconds)';

				switch (module) {
					case 'messages':
						if (!data.name) throw 'No name property found';
						if (!data.description) throw 'No description property found';
						addComponent(client[module], data.name, data);
						break;
					case 'commands':
						if (!data.data) throw 'No data property found';
						addComponent(client[module], data.data.name, data);
						break;
					case 'buttons':
					case 'menus':
					case 'modals':
						if (!data.customID) throw 'No custom ID has been set';
						if (!Array.isArray(data.customID) && typeof data.customID !== 'string') throw 'Invalid custom ID type - Must be string';
						addComponent(client[module], data.customID, data);
						break;
				}
			} catch (error) {
				client.logs.error(`[${module.toUpperCase()}] Failed to load ./${filePath}: ${error.stack || error}`);
			}

		}
		client.logs.debug(`Loaded ${files.length} ${module}`)
	}
};

function CheckPerms(perms, type) {
	if (!Array.isArray(perms)) return;
	const invalidPerms = [];
	for (let i = 0; i < perms.length; i++) {
		if (Permissions[perms[i]]) continue;
		invalidPerms.push(perms[i]);
	}
	if (invalidPerms.length > 0) throw `Invalid ${type} permissions found: ${invalidPerms.join(', ')}`;
}

function addComponent(map, id, data) {
	const duplicateIDs = [];

	if (typeof id === 'string') {
		if (map.has(id)) duplicateIDs.push(id);
		map.set(id, Object.assign(data, { customID: id }));
	}

	if (duplicateIDs.length > 0) throw `Duplicate IDs found: ${duplicateIDs.join(', ')}`;
}