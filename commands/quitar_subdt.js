const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const path = require("path");
const db = new QuickDB({ filePath: path.join(__dirname, "..", "data", "database.sqlite") });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quitar_subdt')
        .setDescription('🚫 Remover el cargo de Sub DT a un usuario'),

    async execute(interaction) {
        const config = await db.get(`config_roles_${interaction.guild.id}`);
        const usuario = interaction.options.getUser('usuario');
        const miembro = await interaction.guild.members.fetch(usuario.id);

        await miembro.roles.remove(config.subdt);
        
        await interaction.reply({ content: `✅ Se han retirado los permisos de Sub DT a **${usuario.username}**.` });
    }
};