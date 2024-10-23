const fs = require("node:fs");
const { execSync } = require("node:child_process");

const IGNORED_FOLDERS = ['node_modules', '.git', '.npm', '.cache']

/* {
	path: string
	depth: number
	data: any
} */
const files = [];

function ReadFolder(path = '', depth = 5) {
	const folderFiles = fs.readdirSync(`${__dirname}/${path}`, { withFileTypes: true });

	for (const file of folderFiles) {
		if (file.isDirectory()) {
			if (IGNORED_FOLDERS.includes(file.name)) continue;
			if (depth === 0) return console.error(`Maximum depth reached - Skipping ${file.parentPath}`);
			ReadFolder(`${path}/${file.name}`, depth - 1);
			continue;
		}

		if (!file.name.endsWith('.js')) continue;

		try {
			const data = fs.readFileSync(`${__dirname}/${path}/${file.name}`, 'utf-8');
			files.push({ path: `${__dirname}/${path}/${file.name}`, depth, data });
			continue;
		} catch (error) {
			console.error(`Failed to load ./${path}/${file.name}: ${error.stack || error}`);
		}
	}

	return files;
}

const builtInModules = [
	'assert', 'async_hooks', 'buffer', 'child_process', 'cluster', 'console',
	'constants', 'crypto', 'dgram', 'dns', 'domain', 'events', 'fs', 'http',
	'http2', 'https', 'inspector', 'module', 'net', 'os', 'path', 'perf_hooks',
	'process', 'punycode', 'querystring', 'readline', 'repl', 'stream',
	'string_decoder', 'timers', 'tls', 'trace_events', 'tty', 'url', 'util',
	'v8', 'vm', 'wasi', 'worker_threads', 'zlib'
];


function getPackages(file) {
	const content = fs.readFileSync(file, "utf-8");
	const requires = content.match(/require\(['"`]([^'"`{}$]+)['"`]\)/g) || [];
	return requires.map(dependency => dependency.match(/['"`]([^'"`{}$]+)['"`]/)[1]).filter(filterPackages);
}

function npmCommand(command) {
	try {
		execSync(command, { stdio: 'inherit' });
		console.log();
	} catch (error) {
		console.error(error.message);
		console.warn("One or more packages could not be found in the npm registry");
		console.warn("Please check the package name and try again");
		process.exit(1);
	}
}

function filterPackages(package) {
	return !builtInModules.includes(package) && !package.startsWith("node:") && !package.startsWith(".");
}

function managePackages() {
	const files = ReadFolder('..', 3).map(file => file.path);
	const packageJSON = require(`${__dirname}/../package.json`);
	if (!packageJSON) throw new Error("No package.json found");

	const installedPackages = Array.from(new Set(Object.keys(packageJSON.dependencies ?? {})));
	const requiredPackages = Array.from(new Set(files.map(getPackages).flat()));
	
	const filteredRequiredPackages = requiredPackages.filter(filterPackages);

	const unusedPackages = installedPackages.filter(pkg => !filteredRequiredPackages.includes(pkg));
	const missingPackages = [];
	for (const pkg of filteredRequiredPackages) {
		const cleanName = pkg.startsWith('@') ? pkg.split('/').map((p, i) => i === 0 || i === 1 ? p : null).filter(Boolean).join('/') : pkg.split('/')[0];
		if (fs.existsSync(`${__dirname}/../node_modules/${cleanName}`)) {
			continue;
		}

		if (!installedPackages.includes(pkg)) {
			missingPackages.push(pkg);
		}
	}

	if (unusedPackages.length) {
		console.warn('Unused packages found package.json : ' + unusedPackages.join(", "))
		npmCommand(`npm uninstall ${unusedPackages.join(" ")}`)
	}

	if (missingPackages.length) {
		console.error('Found missing packages : ' + missingPackages.join(", "))
		npmCommand(`npm install ${missingPackages.join(" ")}`)
	}
}

module.exports = managePackages;