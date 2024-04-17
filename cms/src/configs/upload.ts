import multer from 'multer';
import path from 'path';



// No arquivo de configuração do multer
const storage = multer.diskStorage({
    destination: path.resolve(__dirname, '..','..', 'uploads'),
    filename(req, file, cb) {
        cb(null, file.originalname)
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 2000000 }
}).fields([
    { name: 'images[0][image]', maxCount: 1 },
    { name: 'images[1][image]', maxCount: 1 },
    { name: 'images[2][image]', maxCount: 1 }
    // Adicione mais se houver mais imagens
]);

export default upload;