const ReadFolder = require('./ReadFolder.js');
const { existsSync } = require('node:fs');

const Permissions = require('./Permissions.js');

module.exports = function (client, folder = null) {
	if (typeof folder !== 'string') throw new TypeError(`Folder must be a string - Received ${typeof folder}`);

	client[folder] = new Map();

	if (!existsSync(`${__dirname}/../${folder}`)) {
		throw new Error(`No "${folder}" folder found`);
	}

	const files = ReadFolder(folder);
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
			if (data.cooldown && data.cooldown < 0) throw 'Invalid cooldown time - Must be greater than 0';

			// true: ephemeral, false: public, null: no defer
			if (data.defer && typeof data.defer !== 'boolean') throw 'Invalid defer type - Must be a boolean';

			const aliases = data.alias ?? data.aliases ?? [];
			if (aliases && (folder === 'commands' || folder === 'messages')) {
				if (!Array.isArray(aliases) && typeof aliases !== 'string') throw 'Invalid alias type - Must be a string or an array';
				data.aliases = Array.isArray(aliases) ? aliases : [aliases];
				for (const alias of aliases) {
					if (typeof alias !== 'string') throw 'Invalid alias - Must be a string';
					if (alias.length > 32) throw 'Alias is too long - Must be less than 32 characters';
					if (alias.includes(' ')) throw 'Alias cannot contain spaces';
				}
			}

			if (data.cache && typeof data.cache !== 'boolean') throw 'Invalid cache type - Must be a boolean';

			switch (folder) {
				case 'messages':
					if (!data.name) throw 'No name property found';
					if (!data.description) throw 'No description property found';
					addComponent(client[folder], data.name, data);
					for (const alias of data.aliases) {
						addComponent(client[folder], alias, data);
					}
					break;
				case 'commands':
					for (const alias of data.aliases) {
						addComponent(client[folder], alias, { ...data, data: { ...data.data, name: alias } });
					}
					// fallthrough to context since they share the same structure
				case 'context':
					if (!data.data) throw 'No data property found';
					addComponent(client[folder], data.data.name, data);
					break;
				case 'buttons':
				case 'menus':
				case 'modals':
					if (!data.customID) throw 'No custom ID has been set';
					if (typeof data.customID !== 'string') throw 'Invalid custom ID type - Must be string';
					addComponent(client[folder], data.customID, data);
					break;
			}
		} catch (error) {
			console.error(`[${folder.toUpperCase()}] Failed to load ./${filePath}: ${error.stack || error}`);
		}

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

	if (map.has(id)) duplicateIDs.push(id);
	map.set(id, data);

	if (duplicateIDs.length > 0) throw `Duplicate IDs found: ${duplicateIDs.join(', ')}`;
}