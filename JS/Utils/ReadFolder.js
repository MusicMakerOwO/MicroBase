//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _nodefs = require('node:fs'); var _nodefs2 = _interopRequireDefault(_nodefs);
var _Logs = require('./Logs'); var _Logs2 = _interopRequireDefault(_Logs);
const files = [];

exports. default = function (path, depth = 3) {
	if (!path.startsWith('/')) throw new Error(`Path must be absolute - Received ${path}`);
	if (path.endsWith('/')) path = path.slice(0, -1);
	files.length = 0;
	ReadFolder(path, depth);
	return files;
}

function ReadFolder(path, depth = 3) {
	const folderEntries = _nodefs2.default.readdirSync(path, { withFileTypes: true });

	for (let i = 0; i < folderEntries.length; i++) {
		const entry = folderEntries[i];
		const fullPath = `${path}/${entry.name}`;

		if (entry.isDirectory()) {
			if (depth <= 0) return _Logs2.default.warn(`Maximum depth reached - Skipping ${fullPath}`);
			ReadFolder(fullPath, depth - 1);
			continue;
		}

		try {
			const data = require(fullPath) || {};
			files.push({ path: fullPath, depth, data });
		} catch (error) {
			_Logs2.default.error(`Failed to load ${fullPath} - ${error}`);
		}
	}
}
module.exports = exports.default;