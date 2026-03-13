// structures.js
window.structures = {
  list: {},
  metadata: {},

  add: function(name, grid, options={}) {
    this.list[name] = grid;
    this.metadata[name] = {
      chance: options.chance || 0.2,
      rare: options.rare || false
    };
  },

  get: function(name) {
    return this.list[name] || null;
  },

  handleSpawns: function(enemyManager, wx, wy, structure) {
    for (let y = 0; y < structure.length; y++) {
      for (let x = 0; x < structure[y].length; x++) {
        const cell = structure[y][x];
        if (typeof cell === "string" && cell.startsWith("spawn.")) {
          const type = cell.substring(6).replace(".p","");
          enemyManager.spawn(type, wx + x, wy + y);
        }
      }
    }
  },

  loadAll: async function(files) {
    for (let file of files) {
      const name = file.replace(".txt","");
      try {
        const res = await fetch("structures/" + file);
        const text = await res.text();
        const grid = text.split("\n").map(line => line.split(","));
        this.add(name, grid);
        console.log("STRUCTURES: geladen", name);
      } catch(e) {
        console.warn("STRUCTURES: file niet gevonden:", name);
      }
    }
  },

  checkOverlap: function(structuresList, x, y, w, h) {
    for (let s of structuresList) {
      if (x < s.x + s.w && x + w > s.x && y < s.y + s.h && y + h > s.y) {
        return true;
      }
    }
    return false;
  },

  placeStructure: function(world, structure, x, y) {
    const w = structure[0].length;
    const h = structure.length;

    const grid = structure.map(row => row.slice());
    world.structures.push({ x, y, w, h, grid });

    // vervang special tiles zoals LT10 of spawn.<entity>.p
    for (let sy = 0; sy < h; sy++) {
      for (let sx = 0; sx < w; sx++) {
        let cell = grid[sy][sx];
        if (typeof cell === "string") {
          if (cell.startsWith("LT")) {
            const luck = parseInt(cell.substring(2)) || 1;
            grid[sy][sx] = { block: "chest", type: "c", luck };
          } else if (cell.startsWith("spawn.")) {
            grid[sy][sx] = { spawn: cell.substring(6) };
          }
        }
      }
    }
  },

  getRandomStructure: function() {
    const names = Object.keys(this.list);
    const filtered = names.filter(name => Math.random() < this.metadata[name].chance);
    if (filtered.length === 0) return null;
    return this.list[filtered[Math.floor(Math.random() * filtered.length)]];
  },

  spawnStructuresInChunk: function(world, cx, cy, maxStructures=3) {
    let spawned = 0;
    while (spawned < maxStructures) {
      const structure = this.getRandomStructure();
      if (!structure) break;

      const w = structure[0].length;
      const h = structure.length;

      const worldX = cx * world.chunkSize + Math.floor(Math.random() * (world.chunkSize - w));
      const worldY = cy * world.chunkSize + Math.floor(Math.random() * (world.chunkSize - h));

      if (this.checkOverlap(world.structures, worldX, worldY, w, h)) continue;

      this.placeStructure(world, structure, worldX, worldY);

      if (world.enemyManager) this.handleSpawns(world.enemyManager, worldX, worldY, structure);

      spawned++;
    }
  }
};
