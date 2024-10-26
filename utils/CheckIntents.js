const { GatewayIntentBits } = require('discord-api-types/v10');
const { BitField } = require('discord.js');
const Logs = require('./Logs.js');

// Why does DJS have to make this difficult?
// Have to recreate the BitField class since they don't export it
class IntentsBitField extends BitField {
	static Flags = GatewayIntentBits;
}

const REQUIRED_INTENTS = {
	'guildCreate': GatewayIntentBits.Guilds,
	'guildUpdate': GatewayIntentBits.Guilds,
	'guildDelete': GatewayIntentBits.Guilds,
	'channelCreate': GatewayIntentBits.Guilds,
	'channelUpdate': GatewayIntentBits.Guilds,
	'channelDelete': GatewayIntentBits.Guilds,
	'channelPinsUpdate': GatewayIntentBits.Guilds,
	'threadCreate': GatewayIntentBits.Guilds,
	'threadUpdate': GatewayIntentBits.Guilds,
	'threadDelete': GatewayIntentBits.Guilds,
	'threadListSync': GatewayIntentBits.Guilds,
	'threadMemberUpdate': GatewayIntentBits.Guilds,
	'threadMembersUpdate': GatewayIntentBits.Guilds,
	'stageInstanceCreate': GatewayIntentBits.Guilds,
	'stageInstanceUpdate': GatewayIntentBits.Guilds,
	'stageInstanceDelete': GatewayIntentBits.Guilds,
	'guildMemberAdd': GatewayIntentBits.GuildMembers,
	'guildMemberUpdate': GatewayIntentBits.GuildMembers,
	'guildMemberRemove': GatewayIntentBits.GuildMembers,
	'threadMembersUpdate': GatewayIntentBits.GuildMembers,
	'guildAuditLogEntryCreate': GatewayIntentBits.GuildModeration,
	'guildBanAdd': GatewayIntentBits.GuildModeration,
	'guildBanRemove': GatewayIntentBits.GuildModeration,
	'guildEmojisUpdate': GatewayIntentBits.GuildEmojisAndStickers,
	'guildStickersUpdate': GatewayIntentBits.GuildEmojisAndStickers,
	'guildIntegrationsUpdate': GatewayIntentBits.GuildIntegrations,
	'integrationCreate': GatewayIntentBits.GuildIntegrations,
	'integrationUpdate': GatewayIntentBits.GuildIntegrations,
	'integrationDelete': GatewayIntentBits.GuildIntegrations,
	'webhooksUpdate': GatewayIntentBits.GuildWebhooks,
	'inviteCreate': GatewayIntentBits.GuildInvites,
	'inviteDelete': GatewayIntentBits.GuildInvites,
	'voiceStateUpdate': GatewayIntentBits.GuildVoiceStates,
	'presenceUpdate': GatewayIntentBits.GuildPresences,
	'messageCreate': [ GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages ],
	'messageUpdate': [ GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages ],
	'messageDelete': [ GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages ],
	'messageDeleteBulk': GatewayIntentBits.GuildMessages,
	'messageReactionAdd': GatewayIntentBits.GuildMessageReactions,
	'messageReactionRemove': GatewayIntentBits.GuildMessageReactions,
	'messageReactionRemoveAll': GatewayIntentBits.GuildMessageReactions,
	'messageReactionRemoveEmoji': GatewayIntentBits.GuildMessageReactions,
	'typingStart': GatewayIntentBits.GuildMessageTyping,
	'channelPinsUpdate': GatewayIntentBits.GuildMessages,
	'messageReactionAdd': GatewayIntentBits.GuildMessageReactions,
	'messageReactionRemove': GatewayIntentBits.GuildMessageReactions,
	'messageReactionRemoveAll': GatewayIntentBits.GuildMessageReactions,
	'messageReactionRemoveEmoji': GatewayIntentBits.GuildMessageReactions,
	'guildScheduledEventCreate': GatewayIntentBits.GuildScheduledEvents,
	'guildScheduledEventUpdate': GatewayIntentBits.GuildScheduledEvents,
	'guildScheduledEventDelete': GatewayIntentBits.GuildScheduledEvents,
	'guildScheduledEventUserAdd': GatewayIntentBits.GuildScheduledEvents,
	'guildScheduledEventUserRemove': GatewayIntentBits.GuildScheduledEvents,
	'autoModerationRuleCreate': GatewayIntentBits.AutoModerationConfiguration,
	'autoModerationRuleUpdate': GatewayIntentBits.AutoModerationConfiguration,
	'autoModerationRuleDelete': GatewayIntentBits.AutoModerationConfiguration,
	'autoModerationActionExecution': GatewayIntentBits.AutoModerationExecution,
	// Not in DJS, listed on discord api
	// https://discord.com/developers/docs/topics/gateway#gateway-intents
	// 'messagePollVoteAdd': GatewayIntentBits.GuildMessagePolls,
	// 'messagePollVoteRemove': GatewayIntentBits.GuildMessagePolls
}

module.exports = function (client) {

	const missingIntents = new Set();

	const intents = Number(client.options.intents.bitfield);
	for (const eventName of Object.keys(client._events)) {
		const requiredBits = REQUIRED_INTENTS[eventName];
		if (!requiredBits) continue; // custom event
		if (Array.isArray(requiredBits)) {
			for (const bit of requiredBits) {
				if ((intents & bit) > 0) continue; // already have the intent
				missingIntents.add(bit);
			}
		} else {
			if ((intents & requiredBits) > 0) continue; // already have the intent
			missingIntents.add(requiredBits);
		}
	}

	// Some fancy lookup stuff lol
	// We flip the table around so we can lookup names from bits
	const EventNames = Object.fromEntries( Object.entries(GatewayIntentBits).map(([key, value]) => [value, key]) ); // flip key and value for fasater lookup
	const missingIntentNames = Array.from(missingIntents).map(bit => {
		return EventNames[bit] ?? 'unknown';
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

	if (missingIntents.size > 0) Logs.warn(`Applied missing intents: ${missingIntentNames.join(', ')}`);
}
