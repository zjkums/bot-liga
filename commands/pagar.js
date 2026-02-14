const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const path = require("path");
const db = new QuickDB({ filePath: path.join(__dirname, "..", "data", "database.sqlite") });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pagar')
        .setDescription('💸 Pagar sueldo a un jugador desde el presupuesto del club')
        .addUserOption(o => o.setName('jugador').setDescription('Beneficiario').setRequired(true))
        .addIntegerOption(o => o.setName('monto').setDescription('Cantidad').setRequired(true))
        .addRoleOption(o => o.setName('equipo').setDescription('Equipo que paga').setRequired(true)),

    async execute(interaction) {
        const config = await db.get(`config_roles_${interaction.guild.id}`);
        const isDT = interaction.member.roles.cache.has(config?.dt) || interaction.member.roles.cache.has(config?.subdt);
        if (!isDT) return interaction.reply({ content: '❌ Solo el cuerpo técnico puede autorizar pagos.', ephemeral: true });

        const jugador = interaction.options.getUser('jugador');
        const monto = interaction.options.getInteger('monto');
        const equipo = interaction.options.getRole('equipo');

        const saldo = await db.get(`presupuesto_${equipo.id}`) || 0;
        if (saldo < monto) return interaction.reply('❌ Fondos del club insuficientes.');

        await db.sub(`presupuesto_${equipo.id}`, monto);
        await db.add(`cartera_${jugador.id}`, monto);

        const embed = new EmbedBuilder()
            .setTitle('💰 Nómina Individual Procesada')
            .setColor('#2ecc71')
            .addFields(
                { name: '🏟️ Club', value: `${equipo.name}`, inline: true },
                { name: '👤 Jugador', value: `${jugador}`, inline: true },
                { name: '💵 Monto', value: `\`$${monto.toLocaleString()}\``, inline: true }
            );

        await interaction.reply({ embeds: [embed] });
    }
};