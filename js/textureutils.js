async function makeTransparent(img){

 let canvas=document.createElement("canvas")
 let ctx=canvas.getContext("2d")

 canvas.width=img.width
 canvas.height=img.height

 ctx.drawImage(img,0,0)

 let data=ctx.getImageData(0,0,canvas.width,canvas.height)
 let d=data.data

 for(let i=0;i<d.length;i+=4){

  let r=d[i]
  let g=d[i+1]
  let b=d[i+2]

  if(r>240 && g>240 && b>240){
   d[i+3]=0
  }

 }

 ctx.putImageData(data,0,0)

 let newImg=new Image()
 newImg.src=canvas.toDataURL()

 await new Promise(res=>newImg.onload=res)

 return newImg
}
