export class StructureManager {

constructor(blocks) {

    this.blocks = blocks;
    this.structures = {}; // { name: grid }

}


// ===== LOAD SINGLE STRUCTURE =====

async loadStructure(name) {

    try {

        console.log("STRUCTURES: loading structure:", name);

        let res = await fetch("structures/" + name + ".txt?cache=" + Date.now());

        if (!res.ok) {
            console.error("STRUCTURES: file niet gevonden:", name);
            return;
        }

        let text = await res.text();

        let rows = text.trim().split("\n");

        let grid = [];

        for (let row of rows) {

            let cols = row.split(",");

            let parsedRow = [];

            for (let cell of cols) {

                cell = cell.trim();

                if (!cell) {
                    parsedRow.push(null);
                    continue;
                }

                let parts = cell.split(".");

                let block = parts[0] || null;
                let type = "p";
                let spawn = null;

                // voorbeeld:
                // planks.spawn.zombie.p

                if (parts.includes("spawn")) {

                    let spawnIndex = parts.indexOf("spawn");

                    spawn = parts[spawnIndex + 1] || null;

                    if (parts[spawnIndex + 2]) {
                        type = parts[spawnIndex + 2];
                    }

                } else if (parts[1]) {

                    type = parts[1];

                }

                parsedRow.push({
                    block,
                    type,
                    spawn
                });

            }

            grid.push(parsedRow);

        }

        this.structures[name] = grid;

        console.log("STRUCTURES: loaded structure:", name);

    } catch (err) {

        console.error("STRUCTURES: fout bij laden", name, err);

    }

}


// ===== LOAD ALL STRUCTURES =====

async loadAll() {

    console.log("STRUCTURES: loadAll gestart");

    let list = [
        "tree",
        "house",
        "plank.spawnzombie"
    ];

    for (let s of list) {

        await this.loadStructure(s);

    }

    console.log("STRUCTURES: loadAll klaar", Object.keys(this.structures));

}


// ===== RELOAD =====

async reloadAll() {

    console.log("STRUCTURES: reloadAll gestart");

    this.structures = {};

    await this.loadAll();

    console.log("STRUCTURES: reloadAll klaar");

}


// ===== GET RANDOM =====

getRandom() {

    let keys = Object.keys(this.structures);

    if (keys.length === 0) {

        console.warn("STRUCTURES: geen structures beschikbaar");

        return null;

    }

    return this.structures[
        keys[Math.floor(Math.random() * keys.length)]
    ];

}


// ===== GET BY NAME =====

get(name) {

    if (!this.structures[name]) {

        console.warn("STRUCTURES: get() niet gevonden", name);

        return null;

    }

    return this.structures[name];

}


// ===== SPAWN HANDLER =====

handleSpawns(world, worldX, worldY, structure) {

    let h = structure.length;
    let w = structure[0].length;

    for (let sy = 0; sy < h; sy++) {

        for (let sx = 0; sx < w; sx++) {

            let cell = structure[sy][sx];

            if (!cell) continue;

            if (cell.spawn) {

                let x = worldX + sx;
                let y = worldY + sy;

                // spawn enemy
                world.spawnEnemy(cell.spawn, x, y);

                // vervang tile door plank
                let tile = world.getStructureTile(x, y);

                if (tile) {

                    tile.block = "planks";
                    tile.type = "p";

                }

            }

        }

    }

}

}
