export async function makeTransparent(img) {
    // Maak een canvas van dezelfde grootte
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");

    // Teken de originele afbeelding
    ctx.drawImage(img, 0, 0);

    // Pak pixeldata
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Loop door alle pixels
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Alleen wit (255,255,255) transparant maken
        if (r === 255 && g === 255 && b === 255) {
            data[i + 3] = 0; // alpha = 0
        }
    }

    // Zet de aangepaste data terug
    ctx.putImageData(imageData, 0, 0);

    // Maak een nieuwe Image en wacht tot hij geladen is
    const transparentImg = new Image();
    transparentImg.src = canvas.toDataURL();
    await new Promise(r => transparentImg.onload = r);

    return transparentImg;
}
