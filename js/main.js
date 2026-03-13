import { Player } from "./player.js";
import { makeTransparent } from "./textureUtils.js";
import { World } from "./world.js";
import { StructureManager } from "./structures.js";
import { Combat } from "./combat.js";
import { EnemyManager } from "./enemies.js"; // ✅ toegevoegd

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- GAME STATE ---
let world;
let player;
let combat = null;
let enemiesManager = null; // ✅ vervangt de oude enemies array

let items = {};
let itemTextures = {};
let blocks = {};
let textures = {};

let camera = { x: 0, y: 0 };

let inventory = Array(27).fill(null);
let hotbar = Array(9).fill(null);
let selectedHotbar = 0;
let inventoryOpen = false;

const SLOT_SIZE = 48;
const COLS = 9;
const ROWS = 3;

let openedChests = new Set();

let draggedItem = null;
let mouse = { x: 0, y: 0 };
let mouseDown = false;

// --- INPUT EVENTS ---
canvas.addEventListener("mousedown", () => { mouseDown = true; });
canvas.addEventListener("mouseup", () => { mouseDown = false; });
canvas.addEventListener("mousemove", e => { mouse.x = e.clientX; mouse.y = e.clientY; });

window.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();
    if (!player.keys) player.keys = {};
    player.keys[key] = true;

    if (key === "e") inventoryOpen = !inventoryOpen;
    if (key === "arrowright") selectedHotbar = (selectedHotbar + 1) % hotbar.length;
    if (key === "arrowleft") selectedHotbar = (selectedHotbar - 1 + hotbar.length) % hotbar.length;
});

window.addEventListener("keyup", e => {
    const key = e.key.toLowerCase();
    if (!player.keys) player.keys = {};
    player.keys[key] = false;
});

window.addEventListener("wheel", e => {
    if (inventoryOpen) return;
    if (e.deltaY < 0) selectedHotbar = (selectedHotbar + 1) % hotbar.length;
    if (e.deltaY > 0) selectedHotbar = (selectedHotbar - 1 + hotbar.length) % hotbar.length;
});

// --- LOAD ASSETS ---
async function loadBlocks() {
    const r = await fetch("data/blocks.json");
    blocks = await r.json();
}

async function loadItems() {
    const r = await fetch("data/items.json");
    items = await r.json();

    for (let id in items) {
        const img = new Image();
        img.src = "assets/" + items[id].texture;
        await new Promise(res => img.onload = res);
        itemTextures[id] = await makeTransparent(img);
    }
}

async function loadTextures() {
    for (let k in blocks) {
        const t = blocks[k].texture;
        if (textures[t]) continue;
        const img = new Image();
        img.src = "assets/" + t;
        await new Promise(res => img.onload = res);
        textures[t] = img;
    }
}

// --- INVENTORY & HOTBAR ---
function hotbarX() {
    const total = hotbar.length * SLOT_SIZE + (hotbar.length - 1) * 5;
    return (canvas.width - total) / 2;
}

function hotbarY() {
    return canvas.height - SLOT_SIZE - 10;
}

function invStart() {
    const w = COLS * SLOT_SIZE + (COLS - 1) * 5;
    return { x: (canvas.width - w) / 2, y: hotbarY() - ROWS * (SLOT_SIZE + 5) - 30 };
}

function drawHotbar() {
    const y = hotbarY();
    const sx = hotbarX();
    for (let i = 0; i < hotbar.length; i++) {
        const x = sx + i * (SLOT_SIZE + 5);
        ctx.fillStyle = i === selectedHotbar ? "yellow" : "rgba(0,0,0,0.6)";
        ctx.fillRect(x, y, SLOT_SIZE, SLOT_SIZE);

        const item = hotbar[i];
        if (item && item.image instanceof HTMLImageElement) {
            ctx.drawImage(item.image, x + 4, y + 4, SLOT_SIZE - 8, SLOT_SIZE - 8);
        }
    }
}

function drawInventory() {
    if (!inventoryOpen) return;
    const s = invStart();
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const i = r * COLS + c;
            const x = s.x + c * (SLOT_SIZE + 5);
            const y = s.y + r * (SLOT_SIZE + 5);
            ctx.fillStyle = "rgba(0,0,0,0.7)";
            ctx.fillRect(x, y, SLOT_SIZE, SLOT_SIZE);

            const item = inventory[i];
            if (item && item.image instanceof HTMLImageElement) {
                ctx.drawImage(item.image, x + 4, y + 4, SLOT_SIZE - 8, SLOT_SIZE - 8);
            }
        }
    }
}

function getSlot(mx, my) {
    const sx = hotbarX();
    const y = hotbarY();
    for (let i = 0; i < hotbar.length; i++) {
        const x = sx + i * (SLOT_SIZE + 5);
        if (mx >= x && mx <= x + SLOT_SIZE && my >= y && my <= y + SLOT_SIZE) return { t: "h", i };
    }
    if (inventoryOpen) {
        const s = invStart();
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const i = r * COLS + c;
                const x = s.x + c * (SLOT_SIZE + 5);
                const y = s.y + r * (SLOT_SIZE + 5);
                if (mx >= x && mx <= x + SLOT_SIZE && my >= y && my <= y + SLOT_SIZE) return { t: "i", i };
            }
        }
    }
    return null;
}

function addItemToInventory(item) {
    for (let i = 0; i < inventory.length; i++) {
        if (!inventory[i]) { inventory[i] = item; return; }
    }
}

const baseRarityChances = { common: 60, uncommon: 25, rare: 10, epic: 4, legendary: 1 };
function generateLoot(luck = 1) {
    let chances = {};
    for (let k in baseRarityChances) chances[k] = baseRarityChances[k] * (1 + luck / 100);

    let total = Object.values(chances).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let sum = 0;
    let selected = "common";
    for (let k in chances) { sum += chances[k]; if (r <= sum) { selected = k; break; } }

    let pool = [];
    for (let id in items) if (items[id].rarity === selected) pool.push(id);
    if (!pool.length) pool = Object.keys(items);
    const id = pool[Math.floor(Math.random() * pool.length)];

    return {
        id, name: items[id].name, type: items[id].type,
        damage: items[id].damage, rarity: items[id].rarity,
        image: itemTextures[id] || null
    };
}

// --- MOUSE INTERACTIONS ---
canvas.addEventListener("mousedown", e => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    const s = getSlot(mouse.x, mouse.y);

    if (s) {
        if (s.t === "h" && hotbar[s.i]) { draggedItem = hotbar[s.i]; hotbar[s.i] = null; }
        if (s.t === "i" && inventory[s.i]) { draggedItem = inventory[s.i]; inventory[s.i] = null; }
        return;
    }

    const weapon = hotbar[selectedHotbar];
    if (weapon && weapon.damage && combat) {
        combat.attack(enemiesManager.enemies, weapon, mouse.x, mouse.y, camera, performance.now());
    }

    const wx = mouse.x + camera.x;
    const wy = mouse.y + camera.y;
    const tx = Math.floor(wx / world.tileSize);
    const ty = Math.floor(wy / world.tileSize);
    const tile = world.getTile(tx, ty);
    if (tile && tile.block === "chest") {
        const key = `${tx},${ty}`;
        if (!openedChests.has(key)) {
            openedChests.add(key);
            const loot = generateLoot(tile.luck || 1);
            addItemToInventory(loot);
        }
    }
});

canvas.addEventListener("mouseup", e => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (!draggedItem) return;
    const s = getSlot(mouse.x, mouse.y);
    if (s) {
        if (s.t === "h" && !hotbar[s.i]) { hotbar[s.i] = draggedItem; draggedItem = null; return; }
        if (s.t === "i" && !inventory[s.i]) { inventory[s.i] = draggedItem; draggedItem = null; return; }
    }
    for (let i = 0; i < inventory.length; i++) {
        if (!inventory[i]) { inventory[i] = draggedItem; draggedItem = null; return; }
    }
    draggedItem = null;
});

// --- GAME LOOP ---
function update() {
    player.update(world, mouse, camera);
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;

    enemiesManager?.update(player, performance.now()); // ✅ enemy update

    const weapon = hotbar[selectedHotbar];
    if (weapon && combat) {
        // Space attack
        if (player.keys[" "] || player.keys["space"] || player.keys["spacebar"]) {
            combat.attack(enemiesManager.enemies, weapon, mouse.x, mouse.y, camera, performance.now());
        }
        // Mouse continuous attack
        if (mouseDown) {
            combat.attack(enemiesManager.enemies, weapon, mouse.x, mouse.y, camera, performance.now());
        }
    }
}

function drawItemTooltip() {
    if (!inventoryOpen) return;
    const s = getSlot(mouse.x, mouse.y);
    if (!s) return;
    let item = s.t === "h" ? hotbar[s.i] : inventory[s.i];
    if (!item) return;
    let name = item.name.replace(/\.[^/.]+$/, "");
    const padding = 6;
    ctx.font = "16px Arial";
    const width = ctx.measureText(name).width + padding * 2;
    const height = 20 + padding * 2;
    let x = mouse.x + 15;
    let y = mouse.y - height - 5;
    if (x + width > canvas.width) x = canvas.width - width - 10;
    if (y < 0) y = mouse.y + 15;
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = "white";
    ctx.fillText(name, x + padding, y + padding + 14);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    world.draw(ctx, camera);
    player.draw(ctx, camera);

    const selectedItem = hotbar[selectedHotbar];
    player.drawWeapon(ctx, camera, selectedItem, itemTextures);

    drawInventory();
    drawHotbar();
    drawItemTooltip();

    if (draggedItem && draggedItem.image) {
        ctx.drawImage(draggedItem.image, mouse.x - SLOT_SIZE / 2, mouse.y - SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE);
    }

    if (combat) combat.drawUI(ctx, canvas);

    enemiesManager?.draw(ctx, camera); // ✅ draw enemies
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// --- INIT ---
async function init() {
    await loadBlocks();
    await loadTextures();
    await loadItems();

    player = new Player();
    world = new World(blocks, textures, canvas);

    // ✅ EnemyManager initialiseren
    const enemyTypesResp = await fetch("data/enemys.json");
    const enemyTypes = await enemyTypesResp.json();
    enemiesManager = new EnemyManager(enemyTypes);
    world.enemyManager = enemiesManager;

    window.structures = new StructureManager();
    await window.structures.loadAll(["house.txt", "tree.txt"]);
    world.structuresManager = window.structures;

    combat = new Combat(player, world);

    const img = new Image();
    img.src = "assets/stick.png";
    await new Promise(r => img.onload = r);
    const stickTexture = await makeTransparent(img);
    hotbar[0] = { id: "stick", name: "Stick", type: "weapon", image: stickTexture, damage: 2 };

    loop();
}

init();
