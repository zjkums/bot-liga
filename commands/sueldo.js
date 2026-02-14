const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { QuickDB } = require("quick.db");
const path = require("path");
const db = new QuickDB({ filePath: path.join(__dirname, "..", "data", "database.sqlite") });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sueldo')
        .setDescription('💵 Pago masivo de sueldos por cargo')
        .addSubcommand(sub => sub.setName('dts').setDescription('Pagar a todos los Dueños/DTs').addIntegerOption(o => o.setName('monto').setDescription('Monto').setRequired(true)))
        .addSubcommand(sub => sub.setName('subdts').setDescription('Pagar a todos los Sub DTs').addIntegerOption(o => o.setName('monto').setDescription('Monto').setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const config = await db.get(`config_roles_${interaction.guild.id}`);
        if (!config) return interaction.reply('❌ Configura la liga primero.');

        const sub = interaction.options.getSubcommand();
        const monto = interaction.options.getInteger('monto');
        await interaction.deferReply();

        const rolId = sub === 'dts' ? config.dt : config.subdt;
        const miembros = await interaction.guild.members.fetch();
        const beneficiarios = miembros.filter(m => m.roles.cache.has(rolId));

        for (const [id, m] of beneficiarios) {
            await db.add(`cartera_${m.id}`, monto);
        }

        const embed = new EmbedBuilder()
            .setTitle('🏦 Pago de Nómina General')
            .setColor('#2ecc71')
            .setDescription(`Se ha procesado el pago para el rango **${sub.toUpperCase()}**.`)
            .addFields(
                { name: '👥 Total Personas', value: `${beneficiarios.size}`, inline: true },
                { name: '💰 Monto c/u', value: `\`$${monto.toLocaleString()}\``, inline: true }
            );

        await interaction.editReply({ embeds: [embed] });
    }
};