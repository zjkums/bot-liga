const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const path = require("path");
const db = new QuickDB({ filePath: path.join(__dirname, "..", "data", "database.sqlite") });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('subdt')
        .setDescription('📋 Asignar un Sub DT a un equipo (Máximo 2)')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a designar').setRequired(true))
        .addRoleOption(o => o.setName('equipo').setDescription('Equipo correspondiente').setRequired(true)),

    async execute(interaction) {
        const config = await db.get(`config_roles_${interaction.guild.id}`);
        if (!config) return interaction.reply({ content: '❌ Configura los roles con `/configurar_liga` primero.', ephemeral: true });

        const usuario = interaction.options.getUser('usuario');
        const equipo = interaction.options.getRole('equipo');
        const miembro = await interaction.guild.members.fetch(usuario.id);

        // LÓGICA DE LÍMITE: Contar cuántos tienen el rol de Sub DT en ese equipo
        const subsActuales = equipo.members.filter(m => m.roles.cache.has(config.subdt)).size;
        
        if (subsActuales >= 2) {
            return interaction.reply({ 
                content: `❌ El equipo **${equipo.name}** ya tiene el cupo máximo de Sub DTs (2/2).`, 
                ephemeral: true 
            });
        }

        await miembro.roles.add([config.subdt, equipo.id]);
        await miembro.roles.remove(config.libre).catch(() => {});

        const embed = new EmbedBuilder()
            .setTitle('📋 Nuevo Sub DT Designado')
            .setColor('#3498db')
            .setThumbnail(usuario.displayAvatarURL())
            .setDescription(`Se han otorgado permisos de gestión técnica en **${equipo.name}**.`)
            .addFields(
                { name: '👤 Usuario', value: `${usuario}`, inline: true },
                { name: '🛡️ Equipo', value: `${equipo.name}`, inline: true }
            )
            .setFooter({ text: `Cupos Sub DT: ${subsActuales + 1}/2` });

        await interaction.reply({ embeds: [embed] });
    }
};