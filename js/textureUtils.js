// textureUtils.js
// Functie: maakt een afbeelding transparant waar pixels zwart zijn

export async function makeTransparent(img){
  // maak een tijdelijk canvas
  const c = document.createElement("canvas")
  c.width = img.width
  c.height = img.height
  const ctx = c.getContext("2d")

  // teken afbeelding op canvas
  ctx.drawImage(img, 0, 0)

  // haal pixeldata op
  const data = ctx.getImageData(0, 0, c.width, c.height)

  // loop over alle pixels
  for(let i = 0; i < data.data.length; i += 4){
    const r = data.data[i]
    const g = data.data[i+1]
    const b = data.data[i+2]
    // als pixel zwart, maak volledig transparant
    if(r === 0 && g === 0 && b === 0){
      data.data[i+3] = 0
    }
  }

  ctx.putImageData(data, 0, 0)

  // maak een nieuwe Image en return als promise
  return new Promise(res => {
    const out = new Image()
    out.src = c.toDataURL()
    out.onload = () => res(out)
  })
}
