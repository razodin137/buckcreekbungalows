const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'images');
const outputDir = path.join(__dirname, 'images/optimized');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

const largeImages = [
    'lakewinter.jpg',
    '20150720_143243.jpg',
    '730a0cb6-7716-4c99-b731-2cf02d2e2592.jpg',
    '2020-06-19.png',
    'e5b1c46e-9278-41bf-9a15-bee0689fbb10.jpeg',
    'aa475c5e_original.jpg'
];

async function optimizeImages() {
    const files = fs.readdirSync(imagesDir);

    for (const file of files) {
        if (file.match(/\.(jpg|jpeg|png)$/i) && !file.includes('optimized')) {
            const inputPath = path.join(imagesDir, file);
            
            // Basic optimization for all images
            // Convert to WebP for modern support
             const webpOutput = path.join(imagesDir, path.parse(file).name + '.webp');
             // Only create if it doesn't exist
             if (!fs.existsSync(webpOutput)) {
                 await sharp(inputPath)
                    .webp({ quality: 80 })
                    .toFile(webpOutput)
                    .then(() => console.log(`Generated WebP: ${webpOutput}`))
                    .catch(err => console.error(`Error processing ${file}:`, err));
             }

            // Specialized resizing for known large images
            if (largeImages.includes(file)) {
                console.log(`Optimizing large image: ${file}`);
                // Overwrite original with optimized JPEG/PNG? 
                // No, let's keep original safely and link to new ones or rename.
                // For this task, to be safe, I'll create a .min version or just overwrite if I'm confident.
                // The implementation plan said "Compress and resize". 
                // Let's create optimized versions with same name in a temp folder then move them back if successful?
                // Actually, let's just make a backup of the big ones.
                
                const backupPath = path.join(imagesDir, 'backup_' + file);
                 if (!fs.existsSync(backupPath)) {
                    fs.copyFileSync(inputPath, backupPath);
                 }

                 // Resize logic based on usage
                 let pipeline = sharp(inputPath);
                 
                 // lakewinter.jpg is a banner, maybe max width 1920
                 if (file === 'lakewinter.jpg') {
                     pipeline = pipeline.resize(1920, null, { withoutEnlargement: true });
                 }
                 // 20150720_143243.jpg is hero bg, max width 1920
                 if (file === '20150720_143243.jpg') {
                     pipeline = pipeline.resize(1920, null, { withoutEnlargement: true });
                 }
                 
                 // Others appear to be gallery images, maybe 800-1000px width?
                 if (!['lakewinter.jpg', '20150720_143243.jpg'].includes(file)) {
                     pipeline = pipeline.resize(1024, null, { withoutEnlargement: true });
                 }

                 await pipeline
                    .jpeg({ quality: 80, mozjpeg: true })
                    .toFile(path.join(outputDir, file))
                    .then(() => {
                        console.log(`Optimized: ${file}`);
                        // Move back to overwrite original
                        fs.copyFileSync(path.join(outputDir, file), inputPath);
                    })
                    .catch(err => console.error(`Error optimizing ${file}:`, err));
            }
        }
    }
}

optimizeImages();
