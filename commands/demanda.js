const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const path = require("path");
const db = new QuickDB({ filePath: path.join(__dirname, "..", "data", "database.sqlite") });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('demanda')
        .setDescription('🚪 Abandonar tu equipo actual (Multa del 75% de tu cartera)'),

    async execute(interaction) {
        const config = await db.get(`config_roles_${interaction.guild.id}`);
        if (!config) return interaction.reply({ content: '❌ La liga no está configurada.', ephemeral: true });

        const usuario = interaction.user;
        const miembro = await interaction.guild.members.fetch(usuario.id);
        
        // Buscar el equipo del jugador (asumiendo que tiene un rol de equipo)
        const equipoRol = miembro.roles.cache.find(r => r.id !== config.dt && r.id !== config.subdt && r.id !== config.libre && r.id !== interaction.guild.id && r.managed === false);
        
        if (!equipoRol) return interaction.reply({ content: '❌ No pareces estar en ningún equipo oficial.', ephemeral: true });

        // Cooldown de 7 días
        const cd = await db.get(`sancion_demanda_${usuario.id}`);
        if (cd && Date.now() < cd) {
            const dias = Math.ceil((cd - Date.now()) / (1000 * 60 * 60 * 24));
            return interaction.reply({ content: `⚠️ Debes esperar **${dias} días** para volver a usar este comando.`, ephemeral: true });
        }

        const cartera = await db.get(`cartera_${usuario.id}`) || 0;
        const multa = Math.floor(cartera * 0.75);

        await db.set(`sancion_demanda_${usuario.id}`, Date.now() + (7 * 24 * 60 * 60 * 1000));
        await db.sub(`cartera_${usuario.id}`, multa);
        await db.delete(`contrato_${usuario.id}`);
        
        await miembro.roles.remove(equipoRol);
        await miembro.roles.add(config.libre).catch(() => {});

        const embed = new EmbedBuilder()
            .setTitle('⚖️ Demanda de Salida Procesada')
            .setColor('#f39c12')
            .setThumbnail(usuario.displayAvatarURL())
            .setDescription('Has decidido rescindir tu contrato unilateralmente.')
            .addFields(
                { name: '👤 Jugador', value: `${usuario.username}`, inline: true },
                { name: '💸 Multa (75%)', value: `\`$${multa.toLocaleString()}\``, inline: true },
                { name: '⏳ Sanción', value: '7 días sin usar /demanda', inline: false }
            )
            .setFooter({ text: 'Ahora eres Agente Libre' });

        await interaction.reply({ embeds: [embed] });
    }
};