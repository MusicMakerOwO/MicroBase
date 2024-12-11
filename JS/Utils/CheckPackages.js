//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _nodefs = require('node:fs'); var _nodefs2 = _interopRequireDefault(_nodefs);
var _nodemodule = require('node:module');
var _nodechild_process = require('node:child_process');

const { CHECK_PACKAGES } = require('../../config.json') ;

// This entire file is a wrapped in a self-executing function
// This is only so we can use an early exit
( () => {
	if (!CHECK_PACKAGES) return; // don't run anything in here

	const IGNORED_FOLDERS = ['node_modules'];
	const files = [];

	function ReadFolder (path, depth = 3) {
		if (depth === 0) return console.warn(`Max depth reached - ${path}`);

		const items = _nodefs2.default.readdirSync(path, { withFileTypes: true });
		for (const item of items) {
			if (item.name.startsWith('.')) continue;
			if (IGNORED_FOLDERS.includes(item.name)) continue;
			const fullPath = `${path}/${item.name}`;
			if (item.isDirectory()) {
				ReadFolder(fullPath);
			} else {
				files.push({ path: fullPath, name: item.name });
			}
		}
	}

	// read the parent folder and all subfolders
	// Files is now initialized with every file in the project
	ReadFolder(`${__dirname}/../..`);

	// import something from 'package'
	// import 'package'
	// require('package')
	const IMPORT_REGEX = /import\s+(?:.*\s+from\s+)?['"](.*)['"]/gi;
	const REQUIRE_REGEX = /require\(['"]([^\)]+)['"]\)/gi;

	const installedPackages = new Set(); // Installed packages in the project
	const usedPackages = new Set(); // Used packages in the code

	// Unused = installed but not used
	// Missing = used but not installed
	const missingPackages = [];
	const unusedPackages = [];

	// node:fs -> fs
	// @package/something -> @package/something
	// package/subfolder -> package
	function CleanPackageName (name) {
		if (name.startsWith('/') || name.startsWith('.')) return null; // Ignore local files
		if (name.startsWith('node:')) return name.slice(5); // built-in node modules
		if (name.startsWith('@')) return name.split('/').slice(0, 3).join('/'); // Scoped packages
		return name.split('/')[0]; // Normal packages
	}

	// Check all files for imports and requires
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const content = _nodefs2.default.readFileSync(file.path, 'utf-8');
		const noComments = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ''); // Remove comments
		const importMatches = Array.from( noComments.matchAll(IMPORT_REGEX) );
		for (let i = 0; i < importMatches.length; i++) {
			const match = importMatches[i][1];
			const cleaned = CleanPackageName(match);
			if (!cleaned) continue;
			if (_nodemodule.builtinModules.includes(cleaned)) continue;
			usedPackages.add(cleaned);
		}
		// matches = content.matchAll(REQUIRE_REGEX);
		const requireMatches = Array.from( noComments.matchAll(REQUIRE_REGEX) );
		for (let i = 0; i < requireMatches.length; i++) {
			const match = requireMatches[i][1];
			const cleaned = CleanPackageName(match);
			if (!cleaned) continue;
			if (_nodemodule.builtinModules.includes(cleaned)) continue;
			usedPackages.add(cleaned);
		}
	}

	for (const pkg of usedPackages) {
		// check node_modules in case it is a dependency
		if (_nodefs2.default.existsSync(`node_modules/${pkg}`)) {
			installedPackages.add(pkg);
		}
	}

	for (const pkg of installedPackages) {
		if (!usedPackages.has(pkg)) {
			unusedPackages.push(pkg);
		}
	}

	// Fetch install packages from package.json
	const packageJson = require('../../package.json') ;
	const dependencies = packageJson.dependencies || {};
	const dev_dependencies = packageJson.devDependencies || {};
	for (const dep in dependencies) {
		installedPackages.add(dep);
	}
	for (const dep in dev_dependencies) {
		installedPackages.add(dep);
	}

	// Check if the package is installed
	for (const pkg of usedPackages) {
		if (!installedPackages.has(pkg)) {
			// it could be a dependency of something else
			if (!_nodefs2.default.existsSync(`${__dirname}/../../node_modules/${pkg}`)) {
				missingPackages.push(pkg);
			}
		}
	}

	// Check if the package is used
	for (const pkg of installedPackages) {
		if (!usedPackages.has(pkg)) {
			unusedPackages.push(pkg);
		}
	}

	if (missingPackages.length > 0) console.log('Missing packages:', missingPackages.join(', '));
	if (unusedPackages.length > 0) console.log('Unused packages:',  unusedPackages.join(', '));

	try {
		if (missingPackages.length > 0) _nodechild_process.execSync.call(void 0, `npm install ${missingPackages.join(' ')}`, { stdio: 'inherit' });
		if (unusedPackages.length > 0) _nodechild_process.execSync.call(void 0, `npm uninstall ${unusedPackages.join(' ')}`, { stdio: 'inherit' });
	} catch (e) {
		console.error(e);
	}
})();