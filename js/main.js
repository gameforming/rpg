const canvas = document.getElementById("game")
const ctx = canvas.getContext("2d")

canvas.width = window.innerWidth
canvas.height = window.innerHeight

let blocks = {}
let textures = {}

let player
let world

let camera = {
x:0,
y:0
}

async function loadBlocks(){

let res = await fetch("data/blocks.json")
blocks = await res.json()

}

async function loadTextures(){

for(let key in blocks){

let texName = blocks[key].texture

if(textures[texName]) continue

let img = new Image()

img.src = "assets/"+texName

await new Promise(r=>img.onload=r)

textures[texName] = img

}

}

async function init(){

await loadBlocks()
await loadTextures()

player = new Player()

world = new World(blocks,textures)

loop()

}

function update(){

player.update()

camera.x = player.x - canvas.width/2
camera.y = player.y - canvas.height/2

}

function draw(){

ctx.clearRect(0,0,canvas.width,canvas.height)

world.draw(ctx,camera)

player.draw(ctx,camera)

}

function loop(){

update()
draw()

requestAnimationFrame(loop)

}

init()
