export async function makeTransparent(src) {
    // Maak een Image object
    const img = new Image();
    img.src = src;

    // Wacht tot de afbeelding geladen is
    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
    });

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

    // Maak witte pixels transparant
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (r === 255 && g === 255 && b === 255) {
            data[i + 3] = 0;
        }
    }

    ctx.putImageData(imageData, 0, 0);

    // Maak een nieuwe Image terug van het canvas
    const transparentImg = new Image();
    transparentImg.src = canvas.toDataURL();
    await new Promise(r => transparentImg.onload = r);

    return transparentImg;
}
