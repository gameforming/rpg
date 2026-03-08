const canvas = document.getElementById("game")
const ctx = canvas.getContext("2d")
canvas.width = window.innerWidth
canvas.height = window.innerHeight

let blocks = {}
let textures = {}
let player
let world
let inventory = []
let hotbar = Array(9).fill(null)
let selectedHotbar = 0
window.structures = null
let camera = { x: 0, y: 0 }
const SLOT_SIZE = 48
const HOTBAR_Y = canvas.height - SLOT_SIZE - 10
let draggedItem = null
let mouse = { x: 0, y: 0 }

async function loadBlocks() {
  try { let res = await fetch("data/blocks.json"); blocks = await res.json(); console.log("blocks loaded", Object.keys(blocks)) } 
  catch(err){ console.error("blocks load error",err) }
}

async function loadTextures() {
  for(let key in blocks){
    let texName = blocks[key].texture
    if(textures[texName]) continue
    try{ let img = new Image(); img.src="assets/"+texName; await new Promise(r=>img.onload=r); textures[texName]=img; console.log("texture loaded",texName) }
    catch(err){ console.error("texture load error",texName,err) }
  }
}

class Player{
  constructor(){
    this.x=16; this.y=16; this.width=24; this.height=24; this.speed=3; this.keys={}
    window.addEventListener("keydown", e=>{ this.keys[e.key.toLowerCase()]=true })
    window.addEventListener("keyup", e=>{ this.keys[e.key.toLowerCase()]=false })
  }
  update(){
    let nx=this.x, ny=this.y
    if(this.keys["w"]) ny-=this.speed
    if(this.keys["s"]) ny+=this.speed
    if(this.keys["a"]) nx-=this.speed
    if(this.keys["d"]) nx+=this.speed
    if(world.isWalkable(Math.floor(nx/world.tileSize), Math.floor(this.y/world.tileSize))) this.x=nx
    if(world.isWalkable(Math.floor(this.x/world.tileSize), Math.floor(ny/world.tileSize))) this.y=ny
  }
  draw(ctx,camera){ ctx.fillStyle="red"; ctx.fillRect(this.x-camera.x,this.y-camera.y,this.width,this.height) }
}

function drawInventory(){
  for(let i=0;i<hotbar.length;i++){
    let x=10+i*(SLOT_SIZE+5)
    ctx.fillStyle=(i===selectedHotbar)?"yellow":"rgba(0,0,0,0.5)"
    ctx.fillRect(x,HOTBAR_Y,SLOT_SIZE,SLOT_SIZE)
    let item=hotbar[i]
    if(item&&item.image) ctx.drawImage(item.image,x+4,HOTBAR_Y+4,SLOT_SIZE-8,SLOT_SIZE-8)
  }
}

canvas.addEventListener("mousedown", e=>{
  mouse.x=e.clientX; mouse.y=e.clientY
  for(let i=0;i<hotbar.length;i++){
    let x=10+i*(SLOT_SIZE+5)
    if(mouse.x>x && mouse.x<x+SLOT_SIZE && mouse.y>HOTBAR_Y && mouse.y<HOTBAR_Y+SLOT_SIZE){
      if(hotbar[i]){ draggedItem=hotbar[i]; hotbar[i]=null; break }
    }
  }
})

canvas.addEventListener("mouseup", e=>{
  if(!draggedItem) return
  for(let i=0;i<hotbar.length;i++){
    let x=10+i*(SLOT_SIZE+5)
    if(mouse.x>x && mouse.x<x+SLOT_SIZE && mouse.y>HOTBAR_Y && mouse.y<HOTBAR_Y+SLOT_SIZE){
      if(!hotbar[i]){ hotbar[i]=draggedItem; draggedItem=null; return }
    }
  }
  inventory.push(draggedItem); draggedItem=null
})

canvas.addEventListener("mousemove", e=>{ mouse.x=e.clientX; mouse.y=e.clientY })
window.addEventListener("wheel", e=>{
  if(e.deltaY<0) selectedHotbar=(selectedHotbar+1)%hotbar.length
  if(e.deltaY>0) selectedHotbar=(selectedHotbar-1+hotbar.length)%hotbar.length
})

function update(){
  player.update()
  camera.x=player.x-canvas.width/2
  camera.y=player.y-canvas.height/2
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height)
  world.draw(ctx,camera)
  player.draw(ctx,camera)
  drawInventory()
  if(draggedItem&&draggedItem.image) ctx.drawImage(draggedItem.image,mouse.x-SLOT_SIZE/2,mouse.y-SLOT_SIZE/2,SLOT_SIZE,SLOT_SIZE)
}

function loop(){ update(); draw(); requestAnimationFrame(loop) }
window.addEventListener("resize", ()=>{ canvas.width=window.innerWidth; canvas.height=window.innerHeight })

async function init(){
  await loadBlocks(); await loadTextures()
  window.structures=new StructureManager(blocks)
  await window.structures.loadAll()
  player=new Player()
  world=new World(blocks,textures)
  const testImg=new Image(); testImg.src="assets/stick.png"; await new Promise(r=>testImg.onload=r)
  inventory.push({name:"Stick",type:"basic",image:testImg})
  hotbar[0]=inventory.pop()
  loop()
}

init()
