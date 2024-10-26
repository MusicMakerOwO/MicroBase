const fs = require('node:fs');
const path = require('node:path');
const Debounce = require('./Debounce.js');

const FOLDERS = [
	'context',
	'commands',
	'buttons',
	'modals',
	'menus',
	'messages',
	'events' // this is a special case and will be handled separately
]

const watchers = new Map(); // <fullPath, watcher>

function ListenerCallback(client, folder, filePath, eventName, fileName) {
	const fullPath = path.join(filePath, fileName);
	
	try {
		const stat = fs.statSync(fullPath);
		// All of this because I can't use { recursive: true } in fs.watch sob
		// https://nodejs.org/docs/latest/api/fs.html#caveats
		if (stat.isDirectory() && !watchers.has(fullPath)) {
			WatchFolder(client, fullPath);
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

	const baseWatcher = fs.watch(filePath, { recursive: true }, Debounce(callback, 1000));
	watchers.set(filePath, baseWatcher);

	const folderFiles = fs.readdirSync(filePath, { withFileTypes: true });
	for (const file of folderFiles) {
		if (file.isDirectory()) {
			const fullPath = path.join(filePath, file.name);
			WatchFolder(client, folder, fullPath);
		}
	}
}

module.exports = function (client) {
	for (const folder of FOLDERS) {
		const filePath = path.join(__dirname, '..', folder);
		WatchFolder(client, folder, filePath);
	}
}