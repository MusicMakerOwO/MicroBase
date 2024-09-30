const { GatewayIntentBits } = require('discord-api-types/v10');

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
	'messageCreate': GatewayIntentBits.GuildMessages | GatewayIntentBits.DirectMessages,
	'messageUpdate': GatewayIntentBits.GuildMessages | GatewayIntentBits.DirectMessages,
	'messageDelete': GatewayIntentBits.GuildMessages | GatewayIntentBits.DirectMessages,
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
		const requiredBit = REQUIRED_INTENTS[eventName];
		if (!requiredBit) continue; // custom event
		if ((intents & requiredBit) > 0) continue; // already have the intent
		missingIntents.add(requiredBit);
	}

	if (missingIntents.size === 0) return;

	const EventNames = Object.fromEntries( Object.entries(GatewayIntentBits).map(([key, value]) => [value, key]) ); // flip key and value for fasater lookup
	const missingIntentNames = [...missingIntents].map(bit => {
		return EventNames[bit] ?? 'unknown';
	});
	client.logs.error(`Missing intents: ${missingIntentNames.join(', ')}`);
}
