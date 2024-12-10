import fs from 'node:fs';
import Log from './Logs';

interface File {
	path: string;
	depth: number;
	data: any;
}
const files: File[] = [];

export default function (path: string, depth = 3) {
	if (!path.startsWith('/') && !path.startsWith('C:/')) throw new Error(`Path must be absolute - Received ${path}`);
	if (path.endsWith('/')) path = path.slice(0, -1);
	files.length = 0;
	ReadFolder(path, depth);
	return files;
}

function ReadFolder(path: string, depth = 3) {
	const folderEntries = fs.readdirSync(path, { withFileTypes: true });

	for (let i = 0; i < folderEntries.length; i++) {
		const entry = folderEntries[i];
		const fullPath = `${path}/${entry.name}`;

		if (entry.isDirectory()) {
			if (depth <= 0) return Log.warn(`Maximum depth reached - Skipping ${fullPath}`);
			ReadFolder(fullPath, depth - 1);
			continue;
		}

		try {
			const data = require(fullPath) || {};
			files.push({ path: fullPath, depth, data });
		} catch (error) {
			Log.error(`Failed to load ${fullPath} - ${error}`);
		}
	}
}
module.exports = exports.default;