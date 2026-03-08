const canvas = document.getElementById("game")
const ctx = canvas.getContext("2d")

canvas.width = window.innerWidth
canvas.height = window.innerHeight



// GAME DATA
let blocks = {}
let textures = {}

let player
let world

// structure manager global zodat world.js hem kan gebruiken
window.structures = null



// CAMERA
let camera = {
x:0,
y:0
}



// LOAD BLOCKS
async function loadBlocks(){

let res = await fetch("data/blocks.json")

blocks = await res.json()

}



// LOAD TEXTURES
async function loadTextures(){

for(let key in blocks){

let texName = blocks[key].texture

if(textures[texName]) continue

let img = new Image()

img.src = "assets/" + texName

await new Promise(resolve=>{
img.onload = resolve
})

textures[texName] = img

}

}



// INIT GAME
async function init(){

await loadBlocks()

await loadTextures()



// load structures
window.structures = new StructureManager(blocks)

await window.structures.loadAll()



// create player
player = new Player()



// create world
world = new World(blocks,textures)



// start game loop
loop()

}



// UPDATE
function update(){

player.update()



// camera follow
camera.x = player.x - canvas.width/2
camera.y = player.y - canvas.height/2

}



// DRAW
function draw(){

ctx.clearRect(0,0,canvas.width,canvas.height)



// world
world.draw(ctx,camera)



// player
player.draw(ctx,camera)

}



// GAME LOOP
function loop(){

update()

draw()

requestAnimationFrame(loop)

}



// RESIZE SUPPORT
window.addEventListener("resize",()=>{

canvas.width = window.innerWidth
canvas.height = window.innerHeight

})



// START
init()
