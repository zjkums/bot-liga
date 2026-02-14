const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { QuickDB } = require("quick.db");
const path = require("path");
const db = new QuickDB({ filePath: path.join(__dirname, "..", "data", "database.sqlite") });

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

        if (sub === 'ver') {
            const saldo = await db.get(`presupuesto_${equipo.id}`) || 0;
            const embed = new EmbedBuilder()
                .setTitle(`🏦 Bóveda Bancaria: ${equipo.name}`)
                .setColor('#3498db')
                .setThumbnail(interaction.guild.iconURL())
                .addFields(
                    { name: '💰 Capital Actual', value: `\`$${saldo.toLocaleString()}\``, inline: true },
                    { name: '🕒 Estado', value: 'Sincronizado', inline: true }
                )
                .setTimestamp();
            return interaction.reply({ embeds: [embed] });
        }

        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '❌ Solo administradores pueden modificar presupuestos.', ephemeral: true });
        }

        const monto = interaction.options.getInteger('monto');
        await db.add(`presupuesto_${equipo.id}`, monto);
        const nuevoTotal = await db.get(`presupuesto_${equipo.id}`);

        const embedMod = new EmbedBuilder()
            .setTitle('⚖️ Ajuste de Tesorería')
            .setColor(monto > 0 ? '#2ecc71' : '#e74c3c')
            .setDescription(`Se ha registrado un movimiento en las arcas de **${equipo.name}**.`)
            .addFields(
                { name: '📥 Movimiento', value: `\`$${monto.toLocaleString()}\``, inline: true },
                { name: '🏦 Saldo Final', value: `\`$${nuevoTotal.toLocaleString()}\``, inline: true }
            );
        await interaction.reply({ embeds: [embedMod] });
    }
};