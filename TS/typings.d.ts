import { Client, SlashCommandBuilder, Message, InteractionReplyOptions, ContextMenuCommandBuilder } from 'discord.js';
import { ChatInputCommandInteraction, ButtonInteraction as _Button, UserSelectMenuInteraction, StringSelectMenuInteraction, RoleSelectMenuInteraction, ModalSubmitInteraction, UserContextMenuCommandInteraction, MessageContextMenuCommandInteraction, AutocompleteInteraction as _Autocomplete} from 'discord.js';
type AnySelectMenuInteraction = UserSelectMenuInteraction | StringSelectMenuInteraction | RoleSelectMenuInteraction;
type AnyContextMenu = UserContextMenuCommandInteraction | MessageContextMenuCommandInteraction;
import ShardManager from './Utils/Sharding/ShardManager';
import Collector from './Utils/Overrides/Collector';

import Log from './Utils/Logs';

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
	owner?: boolean;

	// Alias(es)
	alias?: string | string[]; // gets converted to 'aliases' in the loader
	aliases: string | string[];
}

// Slash Commands, Autocomplete
export interface CommandFile extends File {
	data: SlashCommandBuilder;
	autocomplete?: (interaction: MicroInteraction, client: MicroClient, args?: string[]) => Promise<any>;
	execute: (interaction: MicroInteraction, client: MicroClient, args?: string[]) => Promise<any>;
}

export interface ContextFile extends File {
	data: ContextMenuCommandBuilder;
	execute: (interaction: MicroInteraction, client: MicroClient, args?: string[]) => Promise<any>;
}

// Buttons, Modals, Menus
export interface ComponentFile extends File {
	customID: string;
	execute: (interaction: MicroInteraction, client: MicroClient, args?: string[]) => Promise<any>;
}

// Messages
export interface MessageFile extends File {
	name: string;
	description: string;
	execute: (message: Message, client: MicroClient, args?: string[]) => Promise<any>;
}

export interface ComponentError {
	message: string;
	stack: string[];
	lines: string[];
}

export interface MicroClient extends Client {
	config: Record<string, any>;
	logs: typeof Log;
	cooldowns: Map<string, number>;
	activeCollectors: Map<string, any>;
	responseCache: Map<string, any>;
	shards: ShardManager;
	fileErrors: Map<string, ComponentError>;

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

export interface MicroInteractionResponse extends InteractionReplyOptions {
	hidden?: boolean;
}

export interface InteractionOverrides {
	reply: (options: string | MicroInteractionResponse) => Promise<any>;
	editReply: (options: string | MicroInteractionResponse) => Promise<any>;
	deferReply: (options: string | MicroInteractionResponse) => Promise<any>;
	deferUpdate: (options: string | MicroInteractionResponse) => Promise<any>;
	deleteReply: (message?: string) => Promise<any>;
	followUp: (options: string | MicroInteractionResponse) => Promise<any>;
	fetchReply: (message?: string) => Promise<any>;
	showModal: (modal: any) => Promise<any>;

	createCollector: () => Collector;

	allowCache: boolean; // used internally to determine if the response should be cached
}

export type CommandInteraction 			= InteractionOverrides & ChatInputCommandInteraction;
export type ButtonInteraction 			= InteractionOverrides & _Button;
export type MenuInteraction 			= InteractionOverrides & AnySelectMenuInteraction;
export type ModalInteraction 			= InteractionOverrides & ModalSubmitInteraction;
export type MessageContextInteraction 	= InteractionOverrides & MessageContextMenuCommandInteraction;
export type UserContextInteraction 		= InteractionOverrides & UserContextMenuCommandInteraction;
export type AutocompleteInteraction 	= InteractionOverrides & _Autocomplete;

export type MicroInteraction = CommandInteraction | ButtonInteraction | MenuInteraction | ModalInteraction | MessageContextInteraction | UserContextInteraction | AutocompleteInteraction;

interface IPCMessage {
	type: number;
	shardID: number;
	requestID: string;
	data?: any;
}