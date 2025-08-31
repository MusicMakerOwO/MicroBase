const fs = require('node:fs');
const Log = require('./Logs');
const nodePath = require('path');

const files = []; // string[] of paths

module.exports = function (path, depth = 3) {
	if (!nodePath.isAbsolute(path)) {
		throw new Error(`Path must be absolute - Received ${path}`);
	}
	if (path.endsWith('/')) path = path.slice(0, -1);
	files.length = 0;
	ReadFolder(path, depth);
	return files;
}

function ReadFolder(path, depth = 3) {
	const folderEntries = fs.readdirSync(path, { withFileTypes: true });

	for (let i = 0; i < folderEntries.length; i++) {
		const entry = folderEntries[i];
		const fullPath = `${path}/${entry.name}`;

		if (entry.isDirectory()) {
			if (depth <= 0) return Log.warn(`Maximum depth reached - Skipping ${fullPath}`);
			ReadFolder(fullPath, depth - 1);
			continue;
		}

		files.push(fullPath);
	}
};
