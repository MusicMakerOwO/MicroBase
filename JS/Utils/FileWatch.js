//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _nodefs = require('node:fs'); var _nodefs2 = _interopRequireDefault(_nodefs);
var _nodepath = require('node:path'); var _nodepath2 = _interopRequireDefault(_nodepath);

var _Debounce = require('./Debounce'); var _Debounce2 = _interopRequireDefault(_Debounce);
const { HOT_RELOAD } = require('../../config.json') ;

const FOLDERS = [
	'context',
	'commands',
	'buttons',
	'modals',
	'menus',
	'messages',
	'events' // this is a special case and will be handled separately
]

const watchers = new Map();

function ListenerCallback(client, folder, filePath, eventName, fileName) {
	const fullPath = _nodepath2.default.join(filePath, fileName);
	
	try {
		const stat = _nodefs2.default.statSync(fullPath);
		// All of this because I can't use { recursive: true } in fs.watch sob
		// https://nodejs.org/docs/latest/api/fs.html#caveats
		if (stat.isDirectory() && !watchers.has(fullPath)) {
			WatchFolder(client, folder, fullPath);
		} else if (fileName.endsWith('.js')) {
			client.emit('hotReload', { folder, eventName, fileName });
		}
	} catch (error) {
		if (fileName.endsWith('.js')) client.emit('hotReload', { folder, eventName: 'deleted', fileName });
		DeleteListener(fullPath);
	}
}

function DeleteListener (path) {
	for (const [fullPath, watcher] of watchers.entries()) {
		if (fullPath.startsWith(path)) {
			watcher.close();
			watchers.delete(fullPath);
		}
	}
}

function WatchFolder (client, folder, filePath) {
	// It's only moved here to look pretty lol
	const callback = ListenerCallback.bind(null, client, folder, filePath);

	const baseWatcher = _nodefs2.default.watch(filePath, { recursive: true }, _Debounce2.default.call(void 0, callback, 1000));
	watchers.set(filePath, baseWatcher);

	const folderFiles = _nodefs2.default.readdirSync(filePath, { withFileTypes: true });
	for (const file of folderFiles) {
		if (file.isDirectory()) {
			const fullPath = _nodepath2.default.join(filePath, file.name);
			WatchFolder(client, folder, fullPath);
		}
	}
}

exports. default = function (client) {
	if (!HOT_RELOAD) return;
	for (const folder of FOLDERS) {
		const filePath = _nodepath2.default.join(__dirname, '..', folder);
		WatchFolder(client, folder, filePath);
	}
}
module.exports = exports.default;