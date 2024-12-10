//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _nodehttps = require('node:https'); var _nodehttps2 = _interopRequireDefault(_nodehttps);
const config = require('../../config.json') ;
var _Logs = require('./Logs'); var _Logs2 = _interopRequireDefault(_Logs);

exports. default = async function (client) {
	if (!config.REGISTER_COMMANDS) return;
	
	const commands = [];
	const devCommands = [];
	const commandNames = [];
	for (const command of [...client.commands.values(), ...client.context.values()] ) {
		const commandData = ('toJSON' in command.data && typeof command.data.toJSON === 'function') ? command.data.toJSON() : command.data ;
		try {
			if (!commandData) throw `No command.data found - Did you forget to save the file?`;
			if (commandNames.includes(commandData.name)) continue;
			commandNames.push(commandData.name);
			if (command.dev) {
				devCommands.push(commandData);
			} else {
				commands.push(commandData);
			}
		} catch(error) {
			_Logs2.default.error(`[REGISTER] Failed to register ${command.data.name}: ${error}`);
		}
	}

	if (devCommands.length > 0 && !config.DEV_GUILD_ID) {
		_Logs2.default.warn(`You have dev commands but no DEV_GUILD_ID in config.json - These will not be registered!`);
	}

	// This is all that the Routes.applicationCommands() method does, but we don't need the extra dependency if it's literally just a string lmao
	// https://discord.com/developers/docs/tutorials/upgrading-to-application-commands#registering-commands
	const route = `https://discord.com/api/v10/applications/${config.APP_ID}/commands`;
	const devRoute = `https://discord.com/api/v10/applications/${config.APP_ID}/guilds/${config.DEV_GUILD_ID}/commands`;
	try {
		// public commands
		await MakeRequest('PUT', route, commands, config.TOKEN);

		if (typeof config.DEV_GUILD_ID === 'string' && devCommands.length > 1) {
			// dev commands
			await MakeRequest('PUT', devRoute, devCommands, config.TOKEN);
		}
	} catch (error) {
		_Logs2.default.error(error);
	}
}

async function MakeRequest(method, route, body, token) {
	return new Promise((resolve, reject) => {
		const req = _nodehttps2.default.request(route, {
			method,
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bot ${token}`
			}
		});
		req.on('error', error => reject(error));
		req.on('timeout', () => reject(new Error('Request timed out')));
		req.on('response', res => {
			const data = [];
			res.on('data', data.push.bind(data));
			res.on('end', () => {
				try {
					if (!res.statusCode) throw new Error('No status code returned - This is likely a network error');
					if (res.statusCode < 200 || res.statusCode >= 300) {
						const response = JSON.parse(data.join(''));
						throw new Error(`[ Discord API : ${res.statusCode}] ${response.message}`);
					}
					resolve(JSON.parse(data.join('')));
				} catch(error) {
					reject(error);
				}
			});
		});
		if (body) req.write(JSON.stringify(body));
		req.end();
	});
}
module.exports = exports.default;