const canvas = document.getElementById("game")
const ctx = canvas.getContext("2d")

canvas.width = window.innerWidth
canvas.height = window.innerHeight

let blocks = {}
let textures = {}

let player
let world

window.structures = null

let camera = {
x:0,
y:0
}

async function loadBlocks(){

console.log("loading blocks")

let res = await fetch("data/blocks.json")

blocks = await res.json()

console.log("blocks loaded",blocks)

}

async function loadTextures(){

console.log("loading textures")

for(let key in blocks){

let texName = blocks[key].texture

if(textures[texName]) continue

let img = new Image()

img.src = "assets/"+texName

await new Promise(resolve=>{
img.onload = resolve
})

textures[texName] = img

console.log("loaded texture",texName)

}

}

async function init(){

await loadBlocks()

await loadTextures()

window.structures = new StructureManager(blocks)

await window.structures.loadStructure("tree")

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

window.addEventListener("resize",()=>{

canvas.width = window.innerWidth
canvas.height = window.innerHeight

})

init()
