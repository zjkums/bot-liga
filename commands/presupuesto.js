const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('presupuesto')
        .setDescription('🏦 Gestión financiera de los clubes oficiales')
        .addSubcommand(sub => sub.setName('ver').setDescription('Consultar fondos de un equipo').addRoleOption(o => o.setName('equipo').setDescription('Equipo').setRequired(true)))
        .addSubcommand(sub => 
            sub.setName('modificar')
            .setDescription('Ajustar fondos (Solo Staff)')
            .addRoleOption(o => o.setName('equipo').setDescription('Equipo').setRequired(true))
            .addIntegerOption(o => o.setName('monto').setDescription('Cantidad a sumar/restar').setRequired(true))
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const equipo = interaction.options.getRole('equipo');
        const saldo = await db.get(`presupuesto_${equipo.id}`) || 0;

        if (sub === 'ver') {
            const embed = new EmbedBuilder()
                .setTitle(`🏦 Bóveda Bancaria: ${equipo.name}`)
                .setColor('#3498db')
                .setThumbnail(interaction.guild.iconURL())
                .setDescription(`Consulta de fondos oficiales para transacciones de mercado.`)
                .addFields(
                    { name: '🛡️ Entidad Deportiva', value: `${equipo}`, inline: true },
                    { name: '💰 Capital en Bóveda', value: `\`$${saldo.toLocaleString()}\``, inline: true },
                    { name: '🕒 Última Sincronización', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: false }
                )
                .setTimestamp();
            return interaction.reply({ embeds: [embed] });
        }

        // Lógica de Modificación para Staff
        const monto = interaction.options.getInteger('monto');
        await db.add(`presupuesto_${equipo.id}`, monto);
        const nuevoTotal = await db.get(`presupuesto_${equipo.id}`);

        const embedMod = new EmbedBuilder()
            .setTitle('⚖️ Ajuste de Tesorería Registrado')
            .setColor(monto > 0 ? '#2ecc71' : '#e74c3c')
            .addFields(
                { name: '🏟️ Club', value: `${equipo.name}`, inline: true },
                { name: '📥 Movimiento', value: `\`$${monto.toLocaleString()}\``, inline: true },
                { name: '🏦 Saldo Final', value: `\`$${nuevoTotal.toLocaleString()}\``, inline: true }
            )
            .setTimestamp();

        return interaction.reply({ embeds: [embedMod] });
    }
};