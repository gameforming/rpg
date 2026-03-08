const canvas=document.getElementById("game")
const ctx=canvas.getContext("2d")
canvas.width=window.innerWidth
canvas.height=window.innerHeight

let items={}
let itemTextures={}
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
const COLS=9
const ROWS=3

let draggedItem=null
let mouse={x:0,y:0}

async function loadBlocks(){
 let r=await fetch("data/blocks.json")
 blocks=await r.json()
}

async function loadItems(){
 let r=await fetch("data/items.json")
 items=await r.json()

 for(let id in items){
  let img=new Image()
  img.src="assets/"+items[id].texture
  await new Promise(res=>img.onload=res)
  itemTextures[id]=img
 }
}

async function loadTextures(){
 for(let k in blocks){
  let t=blocks[k].texture
  if(textures[t])continue
  let img=new Image()
  img.src="assets/"+t
  await new Promise(r=>img.onload=r)
  textures[t]=img
 }
}

function hotbarX(){
 let total=hotbar.length*SLOT_SIZE+(hotbar.length-1)*5
 return (canvas.width-total)/2
}

function hotbarY(){
 return canvas.height-SLOT_SIZE-10
}

function invStart(){
 let w=COLS*SLOT_SIZE+(COLS-1)*5
 return{
  x:(canvas.width-w)/2,
  y:hotbarY()-ROWS*(SLOT_SIZE+5)-30
 }
}

function drawHotbar(){
 let y=hotbarY()
 let sx=hotbarX()
 for(let i=0;i<hotbar.length;i++){
  let x=sx+i*(SLOT_SIZE+5)
  ctx.fillStyle=i===selectedHotbar?"yellow":"rgba(0,0,0,0.6)"
  ctx.fillRect(x,y,SLOT_SIZE,SLOT_SIZE)
  let item=hotbar[i]
  if(item&&item.image)ctx.drawImage(item.image,x+4,y+4,SLOT_SIZE-8,SLOT_SIZE-8)
 }
}

function drawInventory(){
 if(!inventoryOpen)return
 let s=invStart()
 for(let r=0;r<ROWS;r++){
  for(let c=0;c<COLS;c++){
   let i=r*COLS+c
   let x=s.x+c*(SLOT_SIZE+5)
   let y=s.y+r*(SLOT_SIZE+5)
   ctx.fillStyle="rgba(0,0,0,0.6)"
   ctx.fillRect(x,y,SLOT_SIZE,SLOT_SIZE)
   let item=inventory[i]
   if(item&&item.image)ctx.drawImage(item.image,x+4,y+4,SLOT_SIZE-8,SLOT_SIZE-8)
  }
 }
}

function getSlot(mx,my){
 let sx=hotbarX()
 let y=hotbarY()
 for(let i=0;i<hotbar.length;i++){
  let x=sx+i*(SLOT_SIZE+5)
  if(mx>x&&mx<x+SLOT_SIZE&&my>y&&my<y+SLOT_SIZE)return{t:"h",i}
 }

 if(inventoryOpen){
  let s=invStart()
  for(let r=0;r<ROWS;r++){
   for(let c=0;c<COLS;c++){
    let i=r*COLS+c
    let x=s.x+c*(SLOT_SIZE+5)
    let y=s.y+r*(SLOT_SIZE+5)
    if(mx>x&&mx<x+SLOT_SIZE&&my>y&&my<y+SLOT_SIZE)return{t:"i",i}
   }
  }
 }

 return null
}

function addItemToInventory(item){
 for(let i=0;i<inventory.length;i++){
  if(!inventory[i]){
   inventory[i]=item
   return
  }
 }
}

const rarityChances={
 common:60,
 uncommon:25,
 rare:10,
 epic:4,
 legendary:1
}

function getRandomRarity(){
 let r=Math.random()*100
 let total=0
 for(let k in rarityChances){
  total+=rarityChances[k]
  if(r<=total)return k
 }
 return "common"
}

function generateLoot(){
 let rarity=getRandomRarity()
 let pool=[]

 for(let id in items){
  if(items[id].rarity===rarity)pool.push(id)
 }

 if(pool.length===0)pool=Object.keys(items)

 let id=pool[Math.floor(Math.random()*pool.length)]

 return{
  id:id,
  name:items[id].name,
  type:items[id].type,
  damage:items[id].damage,
  rarity:items[id].rarity,
  image:itemTextures[id]
 }
}

canvas.addEventListener("mousedown",e=>{
 mouse.x=e.clientX
 mouse.y=e.clientY

 let s=getSlot(mouse.x,mouse.y)

 if(s){
  if(s.t==="h"&&hotbar[s.i]){draggedItem=hotbar[s.i];hotbar[s.i]=null}
  if(s.t==="i"&&inventory[s.i]){draggedItem=inventory[s.i];inventory[s.i]=null}
  return
 }

 let wx=mouse.x+camera.x
 let wy=mouse.y+camera.y

 let tx=Math.floor(wx/world.tileSize)
 let ty=Math.floor(wy/world.tileSize)

 let tile=world.getTile(tx,ty)

 if(tile&&tile.block==="chest"){
  let loot=generateLoot()
  addItemToInventory(loot)
 }
})

canvas.addEventListener("mouseup",e=>{
 mouse.x=e.clientX
 mouse.y=e.clientY
 if(!draggedItem)return
 let s=getSlot(mouse.x,mouse.y)
 if(s){
  if(s.t==="h"&&!hotbar[s.i]){hotbar[s.i]=draggedItem;draggedItem=null;return}
  if(s.t==="i"&&!inventory[s.i]){inventory[s.i]=draggedItem;draggedItem=null;return}
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
 await loadItems()
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
