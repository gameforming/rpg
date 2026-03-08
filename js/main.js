const canvas=document.getElementById("game")
const ctx=canvas.getContext("2d")
canvas.width=window.innerWidth
canvas.height=window.innerHeight

let blocks={}
let textures={}
let player
let world
let camera={x:0,y:0}

let inventory=[]
let hotbar=Array(9).fill(null)
let selectedHotbar=0

const SLOT_SIZE=48
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

function drawHotbar(){
 let y=canvas.height-SLOT_SIZE-10
 let total=hotbar.length*SLOT_SIZE+(hotbar.length-1)*5
 let startX=(canvas.width-total)/2
 for(let i=0;i<hotbar.length;i++){
  let x=startX+i*(SLOT_SIZE+5)
  ctx.fillStyle=i===selectedHotbar?"yellow":"rgba(0,0,0,0.6)"
  ctx.fillRect(x,y,SLOT_SIZE,SLOT_SIZE)
  let item=hotbar[i]
  if(item&&item.image)ctx.drawImage(item.image,x+4,y+4,SLOT_SIZE-8,SLOT_SIZE-8)
 }
}

canvas.addEventListener("mousedown",e=>{
 mouse.x=e.clientX
 mouse.y=e.clientY
 let y=canvas.height-SLOT_SIZE-10
 let total=hotbar.length*SLOT_SIZE+(hotbar.length-1)*5
 let startX=(canvas.width-total)/2
 for(let i=0;i<hotbar.length;i++){
  let x=startX+i*(SLOT_SIZE+5)
  if(mouse.x>x&&mouse.x<x+SLOT_SIZE&&mouse.y>y&&mouse.y<y+SLOT_SIZE){
   if(hotbar[i]){draggedItem=hotbar[i];hotbar[i]=null}
  }
 }
})

canvas.addEventListener("mouseup",e=>{
 if(!draggedItem)return
 mouse.x=e.clientX
 mouse.y=e.clientY
 let y=canvas.height-SLOT_SIZE-10
 let total=hotbar.length*SLOT_SIZE+(hotbar.length-1)*5
 let startX=(canvas.width-total)/2
 for(let i=0;i<hotbar.length;i++){
  let x=startX+i*(SLOT_SIZE+5)
  if(mouse.x>x&&mouse.x<x+SLOT_SIZE&&mouse.y>y&&mouse.y<y+SLOT_SIZE){
   if(!hotbar[i]){hotbar[i]=draggedItem;draggedItem=null;return}
  }
 }
 inventory.push(draggedItem)
 draggedItem=null
})

canvas.addEventListener("mousemove",e=>{
 mouse.x=e.clientX
 mouse.y=e.clientY
})

window.addEventListener("wheel",e=>{
 if(e.deltaY<0)selectedHotbar=(selectedHotbar+1)%hotbar.length
 if(e.deltaY>0)selectedHotbar=(selectedHotbar-1+hotbar.length)%hotbar.length
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
