const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const path = require("path");
const db = new QuickDB({ filePath: path.join(__dirname, "..", "data", "database.sqlite") });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('baja')
        .setDescription('📉 Tramitar la salida de un jugador del club')
        .addRoleOption(o => o.setName('equipo').setDescription('Equipo emisor').setRequired(true))
        .addUserOption(o => o.setName('jugador').setDescription('Jugador a desvincular').setRequired(true)),

    async execute(interaction) {
        const config = await db.get(`config_roles_${interaction.guild.id}`);
        const isStaff = interaction.member.roles.cache.has(config?.dt) || interaction.member.roles.cache.has(config?.subdt);
        if (!isStaff) return interaction.reply({ content: '❌ No tienes permisos de gestión técnica.', ephemeral: true });

        const equipo = interaction.options.getRole('equipo');
        const usuario = interaction.options.getUser('jugador');
        const miembro = await interaction.guild.members.fetch(usuario.id);

        const valorC = await db.get(`contrato_${usuario.id}`) || 0;
        const cartera = await db.get(`cartera_${usuario.id}`) || 0;

        const reembolso = Math.floor(valorC * 0.5);
        const multa = Math.floor(cartera * 0.5);

        await db.add(`presupuesto_${equipo.id}`, reembolso);
        await db.sub(`cartera_${usuario.id}`, multa);
        await db.delete(`contrato_${usuario.id}`);
        
        await miembro.roles.remove(equipo);
        await miembro.roles.add(config.libre).catch(() => {});

        const embed = new EmbedBuilder()
            .setTitle('📉 Baja Procesada')
            .setColor('#e74c3c')
            .setDescription(`Se ha rescindido el contrato de **${usuario.username}**.`)
            .addFields(
                { name: '💰 Reembolso Club', value: `\`$${reembolso.toLocaleString()}\``, inline: true },
                { name: '💸 Sanción Jugador', value: `\`$${multa.toLocaleString()}\``, inline: true }
            );

        await interaction.reply({ embeds: [embed] });
    }
};