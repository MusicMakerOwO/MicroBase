import { Client, Interaction, Events, SlashCommandBuilder } from 'discord.js';

// This is the outlier lol
export interface EventFile {
	name: string;
	once?: boolean;
	execute: (client: MicroClient, ...args: any[]) => any;
}

export interface File {
	// whitelists
	roles?: string[];
	users?: string[];
	channels?: string[];
	guilds?: string[];

	// Permissions
	userPerms?: string[];
	botPerms?: string[];

	// Flags
	dev?: boolean;
	cooldown?: number;
	cache?: boolean;
	defer?: boolean;

	// Alias(es)
	alias?: string | string[]; // gets converted to 'aliases' in the loader
	aliases: string | string[];

	execute: (interaction: Interaction, client: MicroClient, args?: string[]) => Promise<any>;
}

// Slash Commands, Autocomplete, Context Menu
export interface CommandFile extends File {
	data: SlashCommandBuilder;
}

// Buttons, Modals, Menus
export interface ComponentFile extends File {
	customID: string;
}

// Messages
export interface MessageFile extends File {
	name: string;
	description: string;
}

export interface MicroClient extends Client {
	config: Record<string, any>;
	logs: typeof Log;
	cooldowns: Map<string, number>;
	activeCollectors: Map<string, any>;
	responseCache: Map<string, any>;
	shards: ShardManager;

	// it's part of the builtin EventEmitter but TS doesn't like it lol
	_events: Record<string, Function[]>;

	// Components
	context: Map<string, CommandFile>;
	commands: Map<string, CommandFile>;
	buttons: Map<string, ComponentFile>;
	menus: Map<string, ComponentFile>;
	modals: Map<string, ComponentFile>;
	messages: Map<string, MessageFile>;
}