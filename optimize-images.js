const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'images');
const outputDir = path.join(__dirname, 'images/optimized');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Configuration for resizing
// 1920w = Large desktop hero
// 1024w = Desktop content / Tablet hero
// 640w = Mobile hero / Desktop grid
// 320w = Mobile grid
const sizes = [1920, 1024, 640];

async function optimizeImages() {
    const files = fs.readdirSync(imagesDir);

    for (const file of files) {
        // Skip previously optimized backups or non-image files
        if (!file.match(/\.(jpg|jpeg|png)$/i) || file.startsWith('backup_')) {
            continue;
        }

        const inputPath = path.join(imagesDir, file);
        const fileName = path.parse(file).name;
        // Output base name (e.g. "images/optimized/my-image")
        const outputBase = path.join(outputDir, fileName);

        console.log(`Processing: ${file}`);

        try {
            const image = sharp(inputPath);
            const metadata = await image.metadata();
            const originalWidth = metadata.width;

            // 1. Always create a full-size WebP
            // Copy original dimensions but compressed
            await image
                .webp({ quality: 80 })
                .toFile(`${outputBase}.webp`);

            // 2. Also copy the original as optimized JPG/PNG for fallback (compressed)
            if (file.endsWith('.png')) {
                await image.png({ quality: 80 }).toFile(`${outputBase}.png`);
            } else {
                await image.jpeg({ quality: 80, mozjpeg: true }).toFile(`${outputBase}.jpg`);
            }

            // 3. Generate resized versions for srcset
            for (const size of sizes) {
                if (originalWidth > size) {
                    // Generate resized WebP
                    await image
                        .clone()
                        .resize(size, null, { withoutEnlargement: true })
                        .webp({ quality: 80 })
                        .toFile(`${outputBase}-${size}w.webp`);

                    // Generate resized JPG/PNG
                    if (file.endsWith('.png')) {
                        await image
                            .clone()
                            .resize(size, null, { withoutEnlargement: true })
                            .png({ quality: 80 })
                            .toFile(`${outputBase}-${size}w.png`);
                    } else {
                        await image
                            .clone()
                            .resize(size, null, { withoutEnlargement: true })
                            .jpeg({ quality: 80, mozjpeg: true })
                            .toFile(`${outputBase}-${size}w.jpg`);
                    }
                    console.log(`  Expected generated ${size}w variants for ${file}`);
                }
            }

        } catch (err) {
            console.error(`Error processing ${file}:`, err);
        }
    }
}

optimizeImages();
