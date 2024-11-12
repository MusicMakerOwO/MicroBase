import fs from 'node:fs';
import path from 'node:path';
import { MicroClient } from '../typings';
import Debounce from './Debounce';
const { HOT_RELOAD } = require('../config.json') as { HOT_RELOAD: boolean };

const FOLDERS = [
	'context',
	'commands',
	'buttons',
	'modals',
	'menus',
	'messages',
	'events' // this is a special case and will be handled separately
]

const watchers = new Map<string, fs.FSWatcher>();

function ListenerCallback(client: MicroClient, folder: string, filePath: string, eventName: string, fileName: string) {
	const fullPath = path.join(filePath, fileName);
	
	try {
		const stat = fs.statSync(fullPath);
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

function DeleteListener (path: string) {
	for (const [fullPath, watcher] of watchers.entries()) {
		if (fullPath.startsWith(path)) {
			watcher.close();
			watchers.delete(fullPath);
		}
	}
}

function WatchFolder (client: MicroClient, folder: string, filePath: string) {
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

export default function (client: MicroClient) {
	if (!HOT_RELOAD) return;
	for (const folder of FOLDERS) {
		const filePath = path.join(__dirname, '..', folder);
		WatchFolder(client, folder, filePath);
	}
}
module.exports = exports.default;