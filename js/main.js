const canvas=document.getElementById("game")
const ctx=canvas.getContext("2d")
canvas.width=window.innerWidth
canvas.height=window.innerHeight

let blocks={}
let textures={}
let player
let world
let camera={x:0,y:0}

let inventory=Array(27).fill(null)
let hotbar=Array(9).fill(null)
let selectedHotbar=0
let inventoryOpen=false

const SLOT_SIZE=48
const INV_COLS=9
const INV_ROWS=3

let draggedItem=null
let mouse={x:0,y:0}

async function loadBlocks(){
 let res=await fetch("data/blocks.json")
 blocks=await res.json()
}

async function loadTextures(){
 for(let key in blocks){
  let texName=blocks[key].texture
  if(textures[texName])continue
  let img=new Image()
  img.src="assets/"+texName
  await new Promise(r=>img.onload=r)
  textures[texName]=img
 }
}

function hotbarStartX(){
 let total=hotbar.length*SLOT_SIZE+(hotbar.length-1)*5
 return (canvas.width-total)/2
}

function hotbarY(){
 return canvas.height-SLOT_SIZE-10
}

function drawHotbar(){
 let y=hotbarY()
 let startX=hotbarStartX()
 for(let i=0;i<hotbar.length;i++){
  let x=startX+i*(SLOT_SIZE+5)
  ctx.fillStyle=i===selectedHotbar?"yellow":"rgba(0,0,0,0.6)"
  ctx.fillRect(x,y,SLOT_SIZE,SLOT_SIZE)
  let item=hotbar[i]
  if(item&&item.image)ctx.drawImage(item.image,x+4,y+4,SLOT_SIZE-8,SLOT_SIZE-8)
 }
}

function inventoryStart(){
 let gridWidth=INV_COLS*SLOT_SIZE+(INV_COLS-1)*5
 let x=(canvas.width-gridWidth)/2
 let y=hotbarY()-INV_ROWS*(SLOT_SIZE+5)-30
 return {x,y}
}

function drawInventory(){
 if(!inventoryOpen)return
 let start=inventoryStart()
 for(let r=0;r<INV_ROWS;r++){
  for(let c=0;c<INV_COLS;c++){
   let i=r*INV_COLS+c
   let x=start.x+c*(SLOT_SIZE+5)
   let y=start.y+r*(SLOT_SIZE+5)
   ctx.fillStyle="rgba(0,0,0,0.6)"
   ctx.fillRect(x,y,SLOT_SIZE,SLOT_SIZE)
   let item=inventory[i]
   if(item&&item.image)ctx.drawImage(item.image,x+4,y+4,SLOT_SIZE-8,SLOT_SIZE-8)
  }
 }
}

function slotAt(mx,my){
 let startX=hotbarStartX()
 let y=hotbarY()
 for(let i=0;i<hotbar.length;i++){
  let x=startX+i*(SLOT_SIZE+5)
  if(mx>x&&mx<x+SLOT_SIZE&&my>y&&my<y+SLOT_SIZE)return{type:"hotbar",i}
 }
 if(inventoryOpen){
  let start=inventoryStart()
  for(let r=0;r<INV_ROWS;r++){
   for(let c=0;c<INV_COLS;c++){
    let i=r*INV_COLS+c
    let x=start.x+c*(SLOT_SIZE+5)
    let y=start.y+r*(SLOT_SIZE+5)
    if(mx>x&&mx<x+SLOT_SIZE&&my>y&&my<y+SLOT_SIZE)return{type:"inv",i}
   }
  }
 }
 return null
}

canvas.addEventListener("mousedown",e=>{
 mouse.x=e.clientX
 mouse.y=e.clientY
 let s=slotAt(mouse.x,mouse.y)
 if(!s)return
 if(s.type==="hotbar"){
  if(hotbar[s.i]){draggedItem=hotbar[s.i];hotbar[s.i]=null}
 }
 if(s.type==="inv"){
  if(inventory[s.i]){draggedItem=inventory[s.i];inventory[s.i]=null}
 }
})

canvas.addEventListener("mouseup",e=>{
 mouse.x=e.clientX
 mouse.y=e.clientY
 if(!draggedItem)return
 let s=slotAt(mouse.x,mouse.y)
 if(s){
  if(s.type==="hotbar"){
   if(!hotbar[s.i]){hotbar[s.i]=draggedItem;draggedItem=null;return}
  }
  if(s.type==="inv"){
   if(!inventory[s.i]){inventory[s.i]=draggedItem;draggedItem=null;return}
  }
 }
 for(let i=0;i<inventory.length;i++){
  if(!inventory[i]){inventory[i]=draggedItem;draggedItem=null;return}
 }
 draggedItem=null
})

canvas.addEventListener("mousemove",e=>{
 mouse.x=e.clientX
 mouse.y=e.clientY
})

window.addEventListener("wheel",e=>{
 if(inventoryOpen)return
 if(e.deltaY<0)selectedHotbar=(selectedHotbar+1)%hotbar.length
 if(e.deltaY>0)selectedHotbar=(selectedHotbar-1+hotbar.length)%hotbar.length
})

window.addEventListener("keydown",e=>{
 if(e.key.toLowerCase()==="e")inventoryOpen=!inventoryOpen
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
 drawHotbar()
 if(draggedItem&&draggedItem.image){
  ctx.drawImage(draggedItem.image,mouse.x-SLOT_SIZE/2,mouse.y-SLOT_SIZE/2,SLOT_SIZE,SLOT_SIZE)
 }
}

function loop(){
 update()
 draw()
 requestAnimationFrame(loop)
}

window.addEventListener("resize",()=>{
 canvas.width=window.innerWidth
 canvas.height=window.innerHeight
})

async function init(){
 await loadBlocks()
 await loadTextures()
 window.structures=new StructureManager(blocks)
 await window.structures.loadAll()
 player=new Player()
 world=new World(blocks,textures)
 let img=new Image()
 img.src="assets/stick.png"
 await new Promise(r=>img.onload=r)
 hotbar[0]={name:"Stick",type:"basic",image:img}
 loop()
}

init()
