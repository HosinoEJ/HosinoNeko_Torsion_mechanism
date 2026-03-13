const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const tagupd = '本子3——北斗前辈の圣遗物'

const IMAGE_DIR = path.join(__dirname, 'public', 'image');
const DATA_FILE = path.join(__dirname, 'data.json');
const SUPPORTED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

async function updateDatabase() {
    let db = [];
    if (fs.existsSync(DATA_FILE)) {
        db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }

    const allFiles = fs.readdirSync(IMAGE_DIR);
    // 過濾出原圖（排除掉已經生成的 thumb_ 開頭的檔案）
    const photoFiles = allFiles.filter(file => 
        SUPPORTED_EXTS.includes(path.extname(file).toLowerCase()) && !file.startsWith('thumb_')
    );

    let updated = false;
    const existingFilenames = db.map(item => item.filename);

    // 使用 for...of 處理非同步任務
    for (const file of photoFiles) {
        if (!existingFilenames.includes(file)) {
            console.log(`✨ 發現新照片: ${file}`);
            
            const thumbName = `thumb_${file}`;
            const inputPath = path.join(IMAGE_DIR, file);
            const outputPath = path.join(IMAGE_DIR, thumbName);

            try {
                // 1. 生成縮圖
                await sharp(inputPath)
                    .resize(400, 300, { fit: 'cover' })
                    .jpeg({ quality: 70 })
                    .toFile(outputPath);
                
                console.log(`📸 已生成縮圖: ${thumbName}`);

                // 2. 寫入資料庫資訊
                db.push({
                    id: Date.now() + Math.floor(Math.random() * 1000),
                    title: path.parse(file).name,
                    filename: file,
                    url: `/image/${file}`,         // 原圖 (點擊放大用)
                    thumbUrl: `/image/${thumbName}`, // 縮圖 (列表顯示用)
                    tags: [tagupd]
                });
                updated = true;
            } catch (err) {
                console.error(`❌ 處理 ${file} 失敗:`, err);
            }
        }
    }

    // 檢查是否有照片已刪除 (同時刪除對應的縮圖檔案)
    const initialLength = db.length;
    db = db.filter(item => {
        const exists = fs.existsSync(path.join(IMAGE_DIR, item.filename));
        if (!exists) {
            const thumbPath = path.join(IMAGE_DIR, `thumb_${item.filename}`);
            if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath); // 刪除殘留縮圖
        }
        return exists;
    });

    if (updated || db.length !== initialLength) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
        console.log('✅ data.json 更新完成！');
    } else {
        console.log('ℹ️ 沒有發現變動。');
    }
}

updateDatabase();