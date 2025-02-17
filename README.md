# Micro Base
Discord bots just got easier 

 - [About](#about)
 - [Our Goals](#our-goals)
 - [Spotlight](#spotlight)
 - [Installation](#installation)
 - [Configuration](#configuration)
 - [Usage](#usage)
	- [Slash Commands](#slash-commands)
	- [Prefix Commands](#prefix-commands)
	- [Buttons](#buttons)
	- [Select Menus](#select-menus)
	- [Modals](#modals)
	- [Context Menus](#context-menus)
	- [Events](#events)
 - [Hot Reload](#hot-reload)
 - [File Presets](#file-presets)
 - [Advanced Components](#advanced-components)
	- [Aliases](#aliases)
	- [Component Args](#button-args)
	- [Component Restrictions](#component-restrictions)
	- [Linking Components](#linking-components)
	- [Caching](#caching)
 - [Contributing](#contributing)
 - [License](#license)
 
## About
Micro Base is a pre-built bot base for [Discord.js](https://github.com/discordjs/discord.js) that makes creating Discord bots easier. We provide all the essentials a bot needs (handlers, logging, hot reload) so you can focus on the fun stuff. We also provide a variety of features that make creating bots more fun and interactive, taking inspiration from react and developer advice.

## Our Goals
Discord bot are in an ever changing landscape of standards and features, no two bots are the same and often most of your time is spent simply debugging broken code. Our goal is to provide a stable and feature rich base that you can build off of, setting you off on the right foot with something you can trust - battle tested, active development, and plenty of features to stand out of the crowd - Micro is among the best for you. We make it a point to give the developer full control over what their bot does and how.

## Spotlight
Check out some other great bases!
 - [Synapse](https://github.com/mar-codes/Synapse-Base)
 - [Mid Base](https://github.com/s3dking/Mid-Base)
 - [Disco Base](https://github.com/ethical-programmer/create-discobase)

## Installation
Micro Base is a standalone project meaning that you control every aspect of it. There are no dependencies to install besides Discord.js, everything else is on you. To get started, simply clone the repository and run `npm install` to get started.
```
git clone https://github.com/MusicMakerOwO/MicroBase
cd MicroBase
npm install
```

Next you should go check out the [config.json](config.json), this is where all your configurations will go. You can set your token, prefix, and other settings here. If you need to abtain your bot token head over to the [Discord Developer Portal](https://discord.com/developers/applications). Do the same for the application ID as well while you are at it. You are now ready to start your bot!
```
npm run start
```

## Configuration
> **This section covers the different features in config.json - If you are looking for setup direction see the [Installation](#installation) section.**

A lot of features in Micro Base can see confusing or may not even work in all enviorments such as dockers. This is where the config.json comes in, here you can disable certain features of the base with ease. Here is a list of all the features you can disable in the config.json. 
| Option | Description | Default |
| --- | --- | --- |
| HOT_RELOAD | Enables hot reload for the bot, this uses fs.watch() and may not be supported in all enviorments | true |
| PROCESS_HANDLERS | Enables the anti-crash system for the bot, this will not automatically restart but any errors will be ignored | true |
| CHECK_INTENTS | This is only a partial safety net, it checks what events you have added and takes a good guess | true |
| CHECK_EVENT_NAMES | Just a quick check that all of your event names are correct, can be annoying if you have lots of custom events | true |
| REGISTER_COMMANDS | Registers all the commands in the commands folder, this can be disabled if you want to manually register commands | true |
| FANCY_ERRORS | Errors will be displayed in a more readable format on discord. Will show a snippet of code - not recommended for production | true |

## Usage
Being flexible brings a lot of power to the table, and Micro Base is no exception, however with it comes a lot of complexity. Many new users get confused on this part who aren't used to seeing this method of bot creation. We will go over the different parts of the bot and how to use them.

### Slash Commands
Slash commands are the key point of most all bots after the lockdown of the MessageCreate intent. They are not to be trifled with however as the various options bring plenty of versaility for both users and devs, some of which were never possible for prefix commands. With slash commands the only thing to worry about is the `data` property, this is a `SlashCommandBuilder` that you can use to define your command. The `execute` function is the same as prefix commands, this is where you put your code.
```js
module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		await interaction.reply('Pong!');
	},
};
```
> NOTE:<br />
> Slash commands are global by default, this means that they will be available in all guilds. If you want to make a command guild only you can use the `dev` property, see the [Component Restrictions](#component-restrictions) section for more information. **If the command does not show up after registering you may need to restart your discord client.**

### Prefix Commands
Prefix commands are of the old world how bots used to be created. They used to rule the entire industry and in hindsight there is a certain level of simplicity and ease of use to them. They are definitely easier then slash however they are not as flexible when it comes to options. Here there are a couple fields to consider: `name`, `description`, and `aliases` are all self explanatory. The `execute` function is where you put your code.
```js
module.exports = {
	name: 'rank',
	description: 'Shows your rank',
	aliases: ['level', 'xp'], //optional
	async execute(message, args, client) {
		const user = message.mentions.users.first() || message.author;
		const rank = await client.levels.getRank(user.id); // or however you get your rank lol
		await message.channel.send(`${user.tag} is rank #${rank}`);
	}
};
```

### Buttons
Buttons are probably the easiest component to wrap your head around. There is only one property you need to worry about: `customID`. This is the ID that Discord will send when the button is clicked, you can use this to determine what action to take.
```js
module.exports = {
	customID: 'myButton',
	async execute(interaction) {
		await interaction.reply('Button clicked!');
	}
};
```
> HINT: <br />
> Buttons are extremely versatile when you can link them together, we will go into more detail about that in a later section however, see [Advanced Components](#advanced-components).

### Select Menus
Slightly less powerful than buttons but still very useful, select menus allow you to create dropdowns for your users to select from. The `customID` is the same as buttons, this is the ID that Discord will send when the select menu is used. All of your options are contained within the `interaction.values` as per usual.
```js
module.exports = {
	customID: 'mySelectMenu',
	async execute(interaction) {
		const selection = interaction.values[0];
		await interaction.reply(`You selected ${selection}`);
	}
};
```

### Modals
Finally we have modals which are the most complex of the components but for all the wrong reasons. Again the `customID` is the only property you need to worry about. **This is the ID of the Modal itself - Not the text input ID**.
```js
module.exports = {
	customID: 'myModal',
	async execute(interaction) {
		const firstAnswer = interaction.fields.getTextInputValue('questionID');
		const secondAnswer = interaction.fields.getTextInputValue('another_question');
		await interaction.reply(`You answered "${firstAnswer}" and "${secondAnswer}"`);
	}
};
```

### Context Menus
Context menus are often the odd one out, they are not as powerful as the other components but they are still very useful, they pick up where the others fall short like fetching stickers from a message. Here they are built similar to the [Slash Commands](#slash-commands) but with a few key differences, namely being the `data` is a `ContextMenuCommandBuilder` instead of a `SlashCommandBuilder`. The rest is the same as slash commands however.
```js
module.exports = {
	data: new ContextMenuCommandBuilder()
		.setName('stealsticker')
		.setType(ApplicationCommandType.Message),
	async execute(interaction, client) {
		const message = interaction.targetMessage;
		const sticker = message.stickers.first();
		if (!sticker) return interaction.reply({ content: 'This message does not have any stickers.', ephemeral: true });

		await interaction.reply({ content: sticker.url, ephemeral: true });
	}
}
```


### Events
Events are fairly straight forward, but are also the most unique of the components. They are standard JS events that are emitted by the client, however they differ in that they are bound functions and the hot reload has to do some funny trickery to handle them. Here you have 2 different properties to worry about: `name` and `execute`. The `name` is the name of the event you want to listen for, things like `ready`, `guildMemberAdd`, `interactionCreate`, etc. The `execute` function on the other hand is a bound function, this means the `client` is always the first argument passed in, no matter what. This is to make sure you have access to the client at all times but can also trick some people up if not used to it.
```js
module.exports = {
	name: 'guildMemberUpdate',
	execute(client, oldMember, newMember) {
		const oldRoles = oldMember.roles.cache;
		const newRoles = newMember.roles.cache;
		const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
		const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));

		// do something with the roles lol
	}
};
```

## Hot Reload
Initially inspired by [NextJS](https://nextjs.org/), Micro Base has a hot reload feature that allows you to make changes to your bot without having to restart it. This is great for testing new features or debugging on the fly, but can be a bottleneck for static hosting, to disable it see the [Configuration](#configuration) section.

> NOTE:<br />
> Not all systems support `fs.watch()` so things may not work as expected. Please [submit an issue](https://github.com/MusicMakerOwO/MicroBase/issues) if you have any problems.

**So how does it work?**<br />
Micro Base uses `fs.watch()` to watch for changes in the files, when a change is detected it will reload the bot. When a change is detected a bunch of things all fire off at once. At it's core we only have to update the appropriate client cache, sounds easy, but we have to fight against JS itself to make this work. Unfortunately the `require()` cache is not updated when a file is changed, so we have to purge it and force JS to recompile our new file.
> **WARNING:**<br />
> This can lead to memory leaks in some cases so it is advised to not directly `require()` components, go through the client cache whenever possible.

**Why not use nodemon?**<br />
[Nodemon](https://npmjs.org/nodemon) is a great tool for hot reloading, but it is not perfect. Nodemon is a bit overkill and has some other more subtle issues. It's less commonly known but Discord enforces a limit on the number of times you can log in per day. This can be a problem if you are constantly restarting your bot, reaching that limit is not too hard if you are grinding for a few hours and constantly making edits, reaching that limit will lock you out of your bot for the rest of the day. Micro Base is a little more complex but overall safeter and more reliable, no restart is needed as it only modifies the cache, so thus faster results and less risk.

**Why don't my commands show up?**<br />
This is a common issue with Discord and not necessarily Micro Base. Discord is a little lazy on their clients and tries to avoid loading new commands when possible. The only way to fix this is to restart your Discord client (or refresh if you are using the web client). If the command still doesn't show up you probably missed an error in the console.


## File Presets
Inspired by [Mid Base](https://github.com/s3dking/Mid-Base), Micro Base has a file preset system that pre-fills a file when created, this is a great time saver and lowers the learning curve for new users who may not be familiar with the idea of components. These are all blank templates to autofill the most basic stuff and just hop right into writing the actual code. Below is an example of the command preset, this is the most common one you will use.
```js
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Pong!'),
	autocomplete: async function(interaction, client) {
		// this is optional, called on any autocomplete stuff
	},
	execute: async function(interaction, client) {
		
	}
}
```
Alongside the command preset there are also presets for buttons, select menus, modals, context menus, and events. Each has their own unique setup but share the same general format. These are all configurable within the `Presets` folder, find the file for the desired component and edit it to your liking. __These are not connecte to Hot Reload so you will have to restart your bot for changes to take affect.__


## Advanced Components
This is where Micro Base really shines from the rest of the pack, using handlers unlocks some performance gains that you can't really find anywhere else. Component args, linking, restrictions, and caching are only a few ways that help bring the most out of your production code. The entire goal of this is to reuse as much code as possible, this is not only efficient for the compiler but also saves you time debugging.

### Aliases
Most wouldn't count this as a performance gain but in Micro it is. Aliases are a way to reuse the same component in multiple places, Micro Base takes this a step further in that aliases can be used not only in prefix but also slash commands. Why is this useful? Say you have a leveling system, you might want to add `/rank` and `/level` an alias, however you would have to duplicate the code in some compacity. With aliases you can simply duplicate the component data with a new name.
> Caveats: Aliases are only supported in prefix and slash commands. **They count as a separate commands** so be mindful with bots that have a lot of commands. **Aliases are full duplicates internally**, they are only here to make things easier for you.

<br/>

**Prefix**
```js
module.exports = {
	name: 'rank',
	description: 'Shows your rank',
	aliases: ['level', 'xp'], //optional
	async execute(message, client, args) {
		// your code here
	}
};
```

**Slash**
```js
module.exports = {
	aliases: ['level', 'xp'], //optional
	data: new SlashCommandBuilder()
		.setName('rank')
		.setDescription('Shows your rank')
		.addStringOption(option => option.setName('user').setDescription('The user to get the rank of')),
	async execute(interaction, client) {
		// your code here
	}
};
```
> HINT: This will register 3 commands: `/rank`, `/level`, and `/xp`. Be mindful of your command count!

### Component Args
The roots of this come from way back before Micro Base was even conceptualized. The idea is simple, adding state to your buttons so you don't have to, this will keep a small amount of data even after restarting, no need for cache. In the older days before Micro this was done with many nested switch statements.
```js
// ban_userID
// export_channelID_guildID_timestamp
// modPanel_edit_role
const args = interaction.customId.split('_');
switch (args[0]) {
	case: 'ban':
		const userID = args[1];
		// ban the user
		break;
	case: 'export':
		const channelID = args[1];
		const guildID = args[2];
		const timestamp = args[3];
		// export the channel
		break;
	case: 'modPanel':
		const action = args[1];
		switch (action) {
			case 'edit':
				const role = args[2];
				// edit the role
				break;
			case 'delete':
				// delete the role
				break;
			case 'create':
				// create the role
				break;
		}
	default:
		throw new Error('Unknown button');
}
```
However this is very long winded and extremely hard to maintain. It's useful for buttons that share a lot of similarities to reduce code repition but there is surely a better way to go aboout it. So this led to a full handler system, and where the `customID` fields comes in. **This is NOT the full customID, only the start of it.** Micro is built assuming you are using args so any `_` used in the ID get removed. This effectively turns `ban_guild` into `['ban', 'guild']` where `ban` is the `customID` and `guild` is the arg. This unfortunately confuses a lot of new people, _ is a reserved symbol for the args but - is better for compound IDs: `ban-guild`.
```js
module.exports = {
	customID: 'ban',
	async execute(interaction, client, args) {
		const type = args[0];
		const id = args[1]; // guildID or userID dependending on the type
		switch (type) {
			// CustomID: ban_user_1234567890
			case 'user':
				// ban the user
				await interaction.guild.bans.create(id);
				break;
			// CustomID: ban_guild_1234567890
			case 'guild':
				// ban the guild in a database
				break;
		}
	}
};
```
With a system like this you can pass data around the bot without any caching or database, as long as the button exists so does your data. This same system applies to all components, not just buttons, so you can run a command that spawns a modal, that sends a select menu, and then the buttons *still* remember the data. This is a powerful system that can be used in many ways, but it is not without it's downsides. This system is not perfect and can be a little confusing at first, but once you get the hang of it you will never want to go back.

### Component Restrictions
Micro Base has a ton of built-in restrictions you can apply to components. Everything from required permissions to cooldowns to server owner. It is worth noting however that *these are all single-guilded. This means that if you want users to set their own roles on a dashboard you have to do the check logic yourself.* If that doesn't apply to you then all of these will work perfectly for you!

| Property | Description | Type | Default |
| --- | --- | --- | --- |
| dev | This command will not be registered to any other servers (slash commands only) | Boolean | `false` |
| owner | Only the server owner can use this command | Boolean | `false` |
| cooldown | The cooldown in seconds, using it again before the time has passed will deny access | Number | `0` |
| guilds | An array of guild IDs that can use this command | Array | `[]` |
| roles | An array of role IDs that can use this command | Array | `[]` |
| channels | An array of channel IDs that can use this command | Array | `[]` |
| users | An array of user IDs that can use this command | Array | `[]` |
| userPerms | An array of permissions that the user must have to use this command | Array | `[]` |
| botPerms | An array of permissions that the bot must have (current server) to use this command | Array | `[]` |

```js
module.exports = {
	botPerms: ['BanMembers'], // bot must have ban members permission
	userPerms: ['BanMembers'], // user must also have it
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Bans a user')
		.addUserOption(option => option.setName('user').setDescription('The user to ban').setRequired(true)),
	async execute(interaction) {
		// ban the user, no permission checks needed
	}
};
```

Also under the same category there are a couple of extra options that don't restrict access but simply make life easier
| Property | Description | Type | Default |
| --- | --- | --- | --- |
| defer | Defer the reply automatically, the value will set it as ephemeral or not, no value will make it not defer | Boolean \| Null | `null` |
| cache | Cache the response, this is only useful for static components such as `/help` | Boolean | `false` |
| alias | Just another `aliases` field with a different name, they do the same thing, see [Aliases](#aliases) for more info | Array | `[]` |

### Linking Components
> HINT:<br />
> This section plays perfectly with [Component Args](#component-args), if you are not familiar with that section you may want to read it first. This takes the ideas from there and goes another step further.

Did you know you can make a command run a button automatically? This is not a feature specific to Micro Base but the first that I have seen use it. This can technically be done in any base but Micro capitalizes on it. There are a couple of caveats to note however. When you transfer an interaction it does not change types - If it started as a command and transfer to a button it is still a command interaction. This can be a little confusing at first but it opens the doors to a lot of stuff.

```js
// Button
module.exports = {
	customID: 'poke',
	async execute(interaction) {
		await interaction.reply('Ouch!');
	}
}

// Command
module.exports = {
	data: new SlashCommandBuilder()
		.setName('poke')
		.setDescription('Poke the bot'),
	async execute(interaction, client) {
		const button = client.buttons.get('poke');
		await button.execute(interaction, client); // 'Ouch!'
	}
}
```

### Caching
This is a first-ever for Discord bot bases - Response caching! *(seriously why has no one thought of this?)*
This entire feature, like [Hot Reload](#hot-reload), was inspired by [NextJS](https://nextjs.org/). The idea is simple, cache the response of a command so you don't have to run the same code over and over again. This is especially useful for commands that don't change often, like `/help`. The execution of this is actually very simple, we will save the last response emitted and reuse it if the command gets ran again. This is a huge performance gain for bots that have a lot of commands that don't change often. **However this is only for static commands so if you reply on user input, time of day, or a guild setting this will cause more harm than good.**
```js
module.exports = {
	cache: true, // The first time you run this it will take 5 seconds, the second time is instant
	data: new SlashCommandBuilder()
		.setName('slow-command')
		.setDescription('This is very slooooowwww'),
	async execute(interaction) {
		await interaction.deferReply();
		await new Promise(resolve => setTimeout(resolve, 5000)); // wait 5 seconds
		await interaction.editReply('Done!');
	}
}
```

## Contributing
Contributions are always welcome! If you have an idea for a new feature or a bug fix, feel free to open a pull request - We want this to be the best it can possibly be! On that note however, we do have some guidelines to follow for commits. This is only to make maintaining the project easier for us, and to make sure we can understand what you are trying to do.

1) Keep your commits short and to the point, don't commit 300 lines across 6 different files.
2) Make sure your commit message is clear. We use a standard format inspired by Angular - `type: message`
The type is a general idea of what it is, refer to the table below for a list of types and how they are used.
3) Make sure your code is clean and readable, we don't want to spend hours deciphering why or how it works.
4) Make sure your code works, if it doesn't compile and run then don't commit. We will reject it.
5) Try to only commit full features, make sure you are content with what you have before submitting.

| Type | Description |
| ---  | --- |
| feat | A new feature |
| fix  | A bug fix |
| docs | Documentation changes |
| style | Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc) |
| refactor | A code change that neither fixes a bug nor adds a feature |
| perf | A code change that improves performance |

## License
Micro Base falls under the Apache 2.0 License. You can view the full license [here](LICENSE). \
This project is not affiliated with [Discord](https://discord.com/) or [Discord.js](https://discordjs.dev/) in any way. Discord and Discord.js are registered trademarks of their respective owners. We do not claim ownership of any of the trademarks, logos, names, or any other intellectual property related to Discord or Discord.js.
