const fs = require('fs');

const jugadoresPath = './data/jugadores.json';
const equiposPath = './data/equipos.json';

function revisarPrestamos() {
  const jugadores = JSON.parse(fs.readFileSync(jugadoresPath, 'utf8'));
  const equipos = JSON.parse(fs.readFileSync(equiposPath, 'utf8'));

  let cambios = false;

  for (const jugadorId in jugadores) {
    const jugador = jugadores[jugadorId];

    if (jugador.prestamo?.activo) {
      if (Date.now() >= jugador.prestamo.fin) {
        const equipoActual = jugador.equipo;
        const equipoOrigen = jugador.prestamo.equipoOrigen;

        // Quitar del equipo actual
        if (equipos[equipoActual]) {
          equipos[equipoActual].jugadores =
            equipos[equipoActual].jugadores.filter(id => id !== jugadorId);
        }

        // Volver al equipo origen
        if (equipos[equipoOrigen]) {
          equipos[equipoOrigen].jugadores.push(jugadorId);
        }

        // Resetear jugador
        jugador.equipo = equipoOrigen;
        jugador.prestamo = {
          activo: false,
          equipoOrigen: null,
          fin: null
        };

        cambios = true;

        console.log(
          `🔁 Préstamo finalizado: jugador ${jugadorId} volvió a ${equipoOrigen}`
        );
      }
    }
  }

  if (cambios) {
    fs.writeFileSync(jugadoresPath, JSON.stringify(jugadores, null, 2));
    fs.writeFileSync(equiposPath, JSON.stringify(equipos, null, 2));
  }
}

module.exports = revisarPrestamos;
