//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _nodefs = require('node:fs'); var _nodefs2 = _interopRequireDefault(_nodefs);
var _discordjs = require('discord.js');
var _ReadFolderjs = require('./ReadFolder.js'); var _ReadFolderjs2 = _interopRequireDefault(_ReadFolderjs);
var _Logsjs = require('./Logs.js'); var _Logsjs2 = _interopRequireDefault(_Logsjs);

const { CHECK_EVENT_NAMES } = require('../../config.json') ;

const IGNORED_EVENTS = [
	'hotReload',
	'shutdown'
]

exports. default = function (client) {
	if (!_nodefs2.default.existsSync(`${__dirname}/../events/`)) {
		_Logsjs2.default.warn('Events folder not found, skipping...');
		return;
	}

	const files = _ReadFolderjs2.default.call(void 0, `${__dirname}/../events/`);
	for (const { path, data } of files ) {
		try {
			if (!data.name) throw `Event is missing a name!`;
			if (typeof data.name !== 'string') throw `Event name must be a string!`;

			const eventRegex_v13 = /^[A-Z_]+$/;
			if (eventRegex_v13.test(data.name)) {
				// convert to v14
				// MESSAGE_CREATE -> messageCreate
				data.name = String(data.name).toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
			}

			if (_discordjs.Events[data.name ]) data.name = _discordjs.Events[data.name ];

			if (CHECK_EVENT_NAMES && !IGNORED_EVENTS.includes(data.name) && !Object.values(_discordjs.Events).includes(data.name )) {
				_Logsjs2.default.warn(`Possibly invalid event name "${data.name}" - Unless it is a custom event this will never be called!`);
			}
			
			if (typeof data.execute !== 'function') throw `Event is missing an execute function!`;

			const callback = data.execute.bind(null, client);
			if (data.once) client.once(data.name, callback);
			else client.on(data.name, callback);
		} catch (error) {
			_Logsjs2.default.error(`Failed to load event ${path}`);
			_Logsjs2.default.error(error);
		}
	}
}
module.exports = exports.default;