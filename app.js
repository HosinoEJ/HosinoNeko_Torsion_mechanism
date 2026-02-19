const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

app.set('view engine', 'ejs');
app.use(express.static('public'));

// 讀取 JSON 檔案的函式
const getPhotos = () => {
    const data = fs.readFileSync(path.join(__dirname, 'data.json'), 'utf-8');
    return JSON.parse(data);
};

app.get('/', (req, res) => {
    const photos = getPhotos(); // 從 JSON 讀取
    const selectedTag = req.query.tag;
    let filteredPhotos = photos;

    if (selectedTag) {
        filteredPhotos = photos.filter(p => p.tags.includes(selectedTag));
    }

    const allTags = [...new Set(photos.flatMap(p => p.tags))];

    res.render('index', { 
        photos: filteredPhotos, 
        allTags, 
        selectedTag 
    });
});

// Vercel 需要匯出 app
module.exports = app;

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});