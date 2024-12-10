//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }var _nodefs = require('node:fs'); var _nodefs2 = _interopRequireDefault(_nodefs);
var _nodepath = require('node:path'); var _nodepath2 = _interopRequireDefault(_nodepath);

var _RegisterCommands = require('../Utils/RegisterCommands'); var _RegisterCommands2 = _interopRequireDefault(_RegisterCommands);
var _ComponentLoader = require('../Utils/ComponentLoader'); var _ComponentLoader2 = _interopRequireDefault(_ComponentLoader);
var _EventLoader = require('../Utils/EventLoader'); var _EventLoader2 = _interopRequireDefault(_EventLoader);
exports. default ={
	name: 'hotReload',
	execute: async function (client, file) {

		if (!file.folder || !file.eventName || !file.fileName) {
			client.logs.warn(`[RELOAD] Invalid file event detected - Ignoring...`);
			client.logs.warn(file);
			return;
		}

		if (!file.fileName.endsWith('.js')) return;

		const fullPath = _nodepath2.default.resolve(`${__dirname}/../${file.folder}/${file.fileName}`);
		if (fullPath === __filename) return; // ignore this file
		if (!_nodefs2.default.existsSync(fullPath)) {
			client.logs.warn(`[RELOAD] File does not exist - Was it deleted or renamed?`);
			return;
		}

		const newFileData = _nodefs2.default.readFileSync(fullPath, 'utf8');
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
		
		let needsRegister = false;

		const ID = _nullishCoalesce(_nullishCoalesce(newFile.customID, () => ( newFile.name)), () => ( _optionalChain([newFile, 'access', _ => _.data, 'optionalAccess', _2 => _2.name])));

		const oldData = _optionalChain([cache, 'optionalAccess', _3 => _3.get, 'call', _4 => _4(ID)]);
		client.responseCache.delete(ID);
		if (!oldData && file.folder !== 'events') {
			// changed the customID, need a full reload of that folder
			_ComponentLoader2.default.call(void 0, client, file.folder);
			needsRegister = file.folder === 'commands' || file.folder === 'context';
		}

		if (!needsRegister) {
			switch (file.folder) {
				case 'buttons':
				case 'menus':
				case 'modals':
				case 'messages':
					cache.set(_nullishCoalesce(newFile.customID, () => ( newFile.name)), newFile);
					break;
				case 'commands':
				case 'context':
					const oldData = cache.get(newFile.data.name);
					// only register commands if fileData.data has changed in any way
					const oldDataJSON = JSON.stringify( typeof _optionalChain([oldData, 'optionalAccess', _5 => _5.data, 'optionalAccess', _6 => _6.toJSON]) === 'function' ? _optionalChain([oldData, 'optionalAccess', _7 => _7.data, 'optionalAccess', _8 => _8.toJSON, 'call', _9 => _9()]) : _optionalChain([oldData, 'optionalAccess', _10 => _10.data]));
					const newFileJSON = JSON.stringify( typeof _optionalChain([newFile, 'access', _11 => _11.data, 'optionalAccess', _12 => _12.toJSON]) === 'function' ? _optionalChain([newFile, 'access', _13 => _13.data, 'optionalAccess', _14 => _14.toJSON, 'call', _15 => _15()]) : newFile.data);
					if (!oldData || oldDataJSON !== newFileJSON) needsRegister = true;
					cache.set(newFile.data.name, newFile);
					break;
				case 'events':
					client.removeAllListeners();
					_EventLoader2.default.call(void 0, client);
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
			_RegisterCommands2.default.call(void 0, client);
			client.logs.info('Successfully reloaded application (/) commands');
		}

		client.logs.debug(`[RELOAD] Successfully reloaded ${file.folder}/${file.fileName}`);
		// client.logs.debug(`[RELOAD] If the new command is not showing up restart your discord client!`);
	}
}
module.exports = exports.default;