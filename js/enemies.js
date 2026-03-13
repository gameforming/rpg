// structures.js
// Beheer van structures en spawns

export const structuresList = [
  // [structureName, spawnChancePerChunk]
  ["tree", 60],
  ["house", 10],
  
];

export class StructureManager {
  constructor(blocks, enemyManager) {
    this.blocks = blocks;
    this.structures = {}; // { name: grid }
    this.enemyManager = enemyManager; // gebruik EnemyManager voor spawns
  }

  // laad een enkele structure uit structures/<name>.txt
  async loadStructure(name) {
    try {
      console.log("STRUCTURES: loading structure:", name);
      let res = await fetch("structures/" + name + ".txt?cache=" + Date.now());
      if (!res.ok) {
        console.error("STRUCTURES: file niet gevonden:", name);
        return;
      }

      const text = await res.text();
      const rows = text.trim().split("\n");
      const grid = [];

      for (let row of rows) {
        const cols = row.split(",");
        const parsedRow = [];

        for (let cell of cols) {
          cell = cell.trim();
          const parts = cell.split(".");
          const block = parts[0];
          const type = parts[1] || "p";

          // FLEXIBELE SPAWN PARSING
          if (cell.includes("spawn.")) {
            const entityType = parts[parts.length - 1];
            parsedRow.push({ spawn: entityType });
          } else {
            parsedRow.push({ block, type });
          }
        }

        grid.push(parsedRow);
      }

      this.structures[name] = grid;
      console.log("STRUCTURES: loaded structure:", name);
    } catch (err) {
      console.error("STRUCTURES: fout bij laden", name, err);
    }
  }

  // laad alle structures in de lijst
  async loadAll() {
    console.log("STRUCTURES: loadAll gestart");
    for (let [name] of structuresList) {
      await this.loadStructure(name);
    }
    console.log("STRUCTURES: loadAll klaar, structures:", Object.keys(this.structures));
  }

  async reloadAll() {
    console.log("STRUCTURES: reloadAll gestart");
    this.structures = {};
    await this.loadAll();
    console.log("STRUCTURES: reloadAll klaar");
  }

  // kies een random structure op basis van spawnChance
  getRandom() {
    const totalWeight = structuresList.reduce((sum, s) => sum + s[1], 0);
    let rnd = Math.random() * totalWeight;
    let accumulated = 0;

    for (let [name, chance] of structuresList) {
      accumulated += chance;
      if (rnd <= accumulated) {
        return this.structures[name] || null;
      }
    }

    return this.structures[structuresList[0][0]] || null;
  }

  get(name) {
    if (!this.structures[name]) {
      console.warn("STRUCTURES: get() niet gevonden", name);
      return null;
    }
    return this.structures[name];
  }

  // ===== SPECIAL SPAWN HANDLER =====
  // world = world instance, worldX/Y = positie in tiles
  handleSpawns(world, worldX, worldY, structure) {
    const h = structure.length;
    const w = structure[0].length;

    for (let sy = 0; sy < h; sy++) {
      for (let sx = 0; sx < w; sx++) {
        const cell = structure[sy][sx];

        if (cell && cell.spawn) {
          const enemyType = cell.spawn;

          try {
            // gebruik EnemyManager om een enemy te spawnen
            const enemy = this.enemyManager.spawn(
              enemyType,
              (worldX + sx) * 32, // pixelpositie
              (worldY + sy) * 32
            );

            if (!enemy) continue;

            // vervang de tile door een walkable tile zodat enemy niet vastzit
            const tile = world.getStructureTile(worldX + sx, worldY + sy);
            if (tile) {
              tile.block = "planks";
              tile.type = "p";
            }
          } catch (err) {
            console.warn("StructureManager: spawn failed for type:", enemyType, err);
          }
        }
      }
    }
  }
}
