const { EmbedBuilder } = require("discord.js");

module.exports = {
  fichajeEmbed({ jugador, equipo, dt }) {
    return new EmbedBuilder()
      .setTitle("🟢 FICHAJE CONFIRMADO")
      .setColor(0x2ecc71)
      .addFields(
        { name: "Jugador", value: `<@${jugador}>`, inline: true },
        { name: "Equipo", value: equipo, inline: true },
        { name: "DT", value: `<@${dt}>`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: "Liga de Vóley" });
  },

  bajaEmbed({ jugador, equipo }) {
    return new EmbedBuilder()
      .setTitle("🔴 BAJA DE JUGADOR")
      .setColor(0xe74c3c)
      .addFields(
        { name: "Jugador", value: `<@${jugador}>`, inline: true },
        { name: "Equipo", value: equipo, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: "Liga de Vóley" });
  },

  economiaEmbed({ titulo, descripcion }) {
    return new EmbedBuilder()
      .setTitle(`🪙 ${titulo}`)
      .setColor(0x3498db)
      .setDescription(descripcion)
      .setTimestamp()
      .setFooter({ text: "Sistema de economía - VBUCKS" });
  }
};
