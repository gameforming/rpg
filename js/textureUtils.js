async function maketransparent(img){
  let c=document.createElement("canvas")
  c.width=img.width
  c.height=img.height
  let ctx=c.getContext("2d")
  ctx.drawImage(img,0,0)
  let data=ctx.getImageData(0,0,c.width,c.height)
  for(let i=0;i<data.data.length;i+=4){
    if(data.data[i]===0 && data.data[i+1]===0 && data.data[i+2]===0){
      data.data[i+3]=0
    }
  }
  ctx.putImageData(data,0,0)
  return new Promise(res=>{
    let out=new Image()
    out.src=c.toDataURL()
    out.onload=()=>res(out)
  })
}
