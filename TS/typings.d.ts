import { Client, Events, SlashCommandBuilder } from 'discord.js';
import { ChatInputCommandInteraction, ButtonInteraction as _Button, UserSelectMenuInteraction, StringSelectMenuInteraction, RoleSelectMenuInteraction, ModalSubmitInteraction, ContextMenuCommandInteraction as _Context } from 'discord.js';
import { BaseInteraction, InteractionReplyOptions } from 'discord.js';
type AnySelectMenuInteraction = UserSelectMenuInteraction | StringSelectMenuInteraction | RoleSelectMenuInteraction;
type Interaction = ChatInputCommandInteraction | _Button | AnySelectMenuInteraction | ModalSubmitInteraction | _Context;
import ShardManager from './Utils/Sharding/ShardManager';
import Collector from './Utils/Overrides/Collector';

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

	shards: ShardManager | null;

	// Components
	context: Map<string, CommandFile>;
	commands: Map<string, CommandFile>;
	buttons: Map<string, ComponentFile>;
	menus: Map<string, ComponentFile>;
	modals: Map<string, ComponentFile>;
	messages: Map<string, MessageFile>;
}

export interface MicroInteractionResponse extends InteractionReplyOptions {
	hidden?: boolean;
}

export interface MicroInteraction {
	reply: (options: string | MicroInteractionResponse) => Promise<any>;
	editReply: (options: string | MicroInteractionResponse) => Promise<any>;
	deferReply: (options: string | MicroInteractionResponse) => Promise<any>;
	deferUpdate: (options: string | MicroInteractionResponse) => Promise<any>;
	deleteReply: (message?: string) => Promise<any>;
	followUp: (options: string | MicroInteractionResponse) => Promise<any>;
	fetchReply: (message?: string) => Promise<any>;
	showModal: (modal: any) => Promise<any>;
}

export interface CommandInteraction extends MicroInteraction, ChatInputCommandInteraction {
	createCollector: () => Collector;
}

export interface ButtonInteraction extends MicroInteraction, _Button {
	createCollector: () => Collector;
}

export interface MenuInteraction extends MicroInteraction, AnySelectMenuInteraction {
	createCollector: () => Collector;
}

export interface ModalInteraction extends MicroInteraction, ModalSubmitInteraction {
	createCollector: () => Collector;
}

export interface ContextMenuInteraction extends MicroInteraction, _Context {
	createCollector: () => Collector;
}