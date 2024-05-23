import express from 'express';
import multer from 'multer';
import { HfInference } from '@huggingface/inference';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

config();

const app = express();
const PORT = process.env.PORT || 3000;
const hf = new HfInference(process.env.HF_ACCESS_TOKEN);
const model = "Salesforce/blip-image-captioning-large";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar multer para almacenar imágenes en la carpeta "uploads"
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `image-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

app.use(express.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/generate-story', upload.single('image'), async (req, res) => {
    const { brand, tone } = req.body;
    console.log('Received /generate-story request with:', { brand, tone });

    if (!req.file) {
        console.log('No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const imageBuffer = fs.readFileSync(req.file.path);
        console.log('Read file:', req.file.path);

        const imageResult = await hf.imageToText({
            data: imageBuffer,
            model,
        });
        console.log('Image to text result:', imageResult);

        const story = `Marca: ${brand}, Tono: ${tone}, Descripción de la imagen: ${imageResult.generated_text}`;
        res.json({ story });
    } catch (error) {
        console.error('Error in /generate-story:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
