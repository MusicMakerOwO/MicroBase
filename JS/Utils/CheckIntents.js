//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _v10 = require('discord-api-types/v10');
var _discordjs = require('discord.js');
var _Logs = require('./Logs'); var _Logs2 = _interopRequireDefault(_Logs);

const { CHECK_INTENTS } = require('../../config.json') ;

// Why does DJS have to make this difficult?
// Have to recreate the BitField class since they don't export it
class IntentsBitField extends _discordjs.BitField {
	static  __initStatic() {this.Flags = _v10.GatewayIntentBits}
} IntentsBitField.__initStatic();

const REQUIRED_INTENTS = {
	'guildCreate': [ _v10.GatewayIntentBits.Guilds ],
	'guildUpdate': [ _v10.GatewayIntentBits.Guilds ],
	'guildDelete': [ _v10.GatewayIntentBits.Guilds ],
	'channelCreate': [ _v10.GatewayIntentBits.Guilds ],
	'channelUpdate': [ _v10.GatewayIntentBits.Guilds ],
	'channelDelete': [ _v10.GatewayIntentBits.Guilds ],
	'channelPinsUpdate': [ _v10.GatewayIntentBits.Guilds ],
	'threadCreate': [ _v10.GatewayIntentBits.Guilds ],
	'threadUpdate': [ _v10.GatewayIntentBits.Guilds ],
	'threadDelete': [ _v10.GatewayIntentBits.Guilds ],
	'threadListSync': [ _v10.GatewayIntentBits.Guilds ],
	'threadMemberUpdate': [ _v10.GatewayIntentBits.Guilds ],
	'threadMembersUpdate': [ _v10.GatewayIntentBits.Guilds ],
	'stageInstanceCreate': [ _v10.GatewayIntentBits.Guilds ],
	'stageInstanceUpdate': [ _v10.GatewayIntentBits.Guilds ],
	'stageInstanceDelete': [ _v10.GatewayIntentBits.Guilds ],
	'guildMemberAdd': [ _v10.GatewayIntentBits.GuildMembers ],
	'guildMemberUpdate': [ _v10.GatewayIntentBits.GuildMembers ],
	'guildMemberRemove': [ _v10.GatewayIntentBits.GuildMembers ],
	'guildAuditLogEntryCreate': [ _v10.GatewayIntentBits.GuildModeration ],
	'guildBanAdd': [ _v10.GatewayIntentBits.GuildModeration ],
	'guildBanRemove': [ _v10.GatewayIntentBits.GuildModeration ],
	'guildEmojisUpdate': [ _v10.GatewayIntentBits.GuildEmojisAndStickers ],
	'guildStickersUpdate': [ _v10.GatewayIntentBits.GuildEmojisAndStickers ],
	'guildIntegrationsUpdate': [ _v10.GatewayIntentBits.GuildIntegrations ],
	'integrationCreate': [ _v10.GatewayIntentBits.GuildIntegrations ],
	'integrationUpdate': [ _v10.GatewayIntentBits.GuildIntegrations ],
	'integrationDelete': [ _v10.GatewayIntentBits.GuildIntegrations ],
	'webhooksUpdate': [ _v10.GatewayIntentBits.GuildWebhooks ],
	'inviteCreate': [ _v10.GatewayIntentBits.GuildInvites ],
	'inviteDelete': [ _v10.GatewayIntentBits.GuildInvites ],
	'voiceStateUpdate': [ _v10.GatewayIntentBits.GuildVoiceStates ],
	'presenceUpdate': [ _v10.GatewayIntentBits.GuildPresences ],
	'messageCreate': [ _v10.GatewayIntentBits.GuildMessages, _v10.GatewayIntentBits.DirectMessages ],
	'messageUpdate': [ _v10.GatewayIntentBits.GuildMessages, _v10.GatewayIntentBits.DirectMessages ],
	'messageDelete': [ _v10.GatewayIntentBits.GuildMessages, _v10.GatewayIntentBits.DirectMessages ],
	'messageDeleteBulk': [ _v10.GatewayIntentBits.GuildMessages ],
	'messageReactionAdd': [ _v10.GatewayIntentBits.GuildMessageReactions ],
	'messageReactionRemove': [ _v10.GatewayIntentBits.GuildMessageReactions ],
	'messageReactionRemoveAll': [ _v10.GatewayIntentBits.GuildMessageReactions ],
	'messageReactionRemoveEmoji': [ _v10.GatewayIntentBits.GuildMessageReactions ],
	'typingStart': [ _v10.GatewayIntentBits.GuildMessageTyping ],
	'guildScheduledEventCreate': [ _v10.GatewayIntentBits.GuildScheduledEvents ],
	'guildScheduledEventUpdate': [ _v10.GatewayIntentBits.GuildScheduledEvents ],
	'guildScheduledEventDelete': [ _v10.GatewayIntentBits.GuildScheduledEvents ],
	'guildScheduledEventUserAdd': [ _v10.GatewayIntentBits.GuildScheduledEvents ],
	'guildScheduledEventUserRemove': [ _v10.GatewayIntentBits.GuildScheduledEvents ],
	'autoModerationRuleCreate': [ _v10.GatewayIntentBits.AutoModerationConfiguration ],
	'autoModerationRuleUpdate': [ _v10.GatewayIntentBits.AutoModerationConfiguration ],
	'autoModerationRuleDelete': [ _v10.GatewayIntentBits.AutoModerationConfiguration ],
	'autoModerationActionExecution': [ _v10.GatewayIntentBits.AutoModerationExecution ],
	// Not in DJS, listed on discord api
	// https://discord.com/developers/docs/topics/gateway#gateway-intents
	// 'messagePollVoteAdd': GatewayIntentBits.GuildMessagePolls,
	// 'messagePollVoteRemove': GatewayIntentBits.GuildMessagePolls
}

exports. default = function (client) {
	if (!CHECK_INTENTS) return;

	const missingIntents = new Set();

	const intents = Number(client.options.intents.bitfield);
	for (const eventName of Object.keys(client._events)) {
		const requiredBits = REQUIRED_INTENTS[eventName];
		if (!requiredBits) continue; // custom event
		for (const bit of requiredBits) {
			if ((intents & bit) > 0) continue; // already have the intent
			missingIntents.add(bit);
		}
	}

	// Some fancy lookup stuff lol
	// We flip the table around so we can lookup names from bits
	const EventNames = Object.fromEntries( Object.entries(_v10.GatewayIntentBits).map(([key, value]) => [value, key]) );
	const missingIntentNames = Array.from(missingIntents).map(bit => {
		return EventNames[bit] || 'unknown';
	});

	// Apply missing intents
	const newIntents = intents | Array.from(missingIntents).reduce((acc, bit) => acc | bit, intents); 

	// DJS makes this hard so have to recreate the bitfield and overwrite the client options
	const newBitField = new IntentsBitField(0);
	for (let i = 0; i < 32; i++) {
		const bit = 1 << i;
		if ((newIntents & bit) === 0) continue;
		newBitField.add(EventNames[bit]);
	}
	newBitField.add('Guilds'); // Why would you ever leave this out???
	client.options.intents = newBitField;

	if (missingIntents.size > 0) _Logs2.default.warn(`Applied missing intents: ${missingIntentNames.join(', ')}`);
}

module.exports = exports.default;