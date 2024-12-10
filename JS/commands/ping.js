//////////////////////////////////////////////////////////////////////
// Welcome to MicroBase!											//
// This code is written in TypeScript and compiled using Sucrase	//
// For any issues, please report them on the GitHub repository		//
// https://github.com/MusicMakerOwO/MicroBase/issues				//
//////////////////////////////////////////////////////////////////////

"use strict";// const { SlashCommandBuilder } = require('@discordjs/builders');
var _builders = require('@discordjs/builders');
module.exports = {
	alias: 'pong',
	// aliases: ['pong'],
	data: new (0, _builders.SlashCommandBuilder)()
		.setName('ping')
		.setDescription('Pong!'),
	autocomplete: async function(interaction, client) {
		// this is optional, called on any autocomplete stuff
	},
	execute: async function(interaction, client) {
		await interaction.deferReply({ ephemeral: true, content: 'Pong!' });
		await interaction.reply({ content: 'Pong again!', hidden: true });
		await interaction.reply('This is pretty cool lol');
	}
}