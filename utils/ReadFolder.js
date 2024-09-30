const fs = require('node:fs');
const log = require('./Logs.js');

/* {
	path: string
	depth: number
	data: any
} */
const files = [];

module.exports = function (path = '', depth = 3) {
	files.length = 0;
	ReadFolder(path, depth);
	return files;
}

function ReadFolder(path = '', depth = 3) {
	const folderFiles = fs.readdirSync(`${__dirname}/../${path}`, { withFileTypes: true });

	for (const file of folderFiles) {
		if (file.isDirectory()) {
			if (depth === 0) return log.warn(`Maximum depth reached - Skipping ${file.name}`);
			ReadFolder(`${path}/${file.name}`, depth - 1);
			continue;
		}

		if (!file.name.endsWith('.js')) continue;

		try {
			const data = require(`${__dirname}/../${path}/${file.name}`) || {};
			files.push({ path: `${path}/${file.name}`, depth, data });
		} catch (error) {
			log.error(`Failed to load ./${path}/${file.name}: ${error.stack || error}`);
		}
	}
}