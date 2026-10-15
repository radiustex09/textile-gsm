require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// No API key needed for Pollinations.ai

app.post('/api/generate-designs', upload.single('referenceImage'), async (req, res) => {
    try {
        const garmentType = req.body.garmentType;
        const variations = req.body.variations;
        if (req.file) {
            console.log(`Received file: ${req.file.originalname}, mimetype: ${req.file.mimetype}`);
        }
        const colors = req.body.colors;
        const details = req.body.details;
        
        // Build a prompt that strictly enforces the user's color choices and garment type.
        const prompt = `A professional clothing design concept for a ${garmentType}. 
Primary colors to use: ${colors}. 
CRITICAL: FLAT LAY PHOTOGRAPHY ONLY. NO HUMANS, NO PEOPLE, NO MANNEQUINS, NO FACES, NO BODY PARTS. 
The image must ONLY show the ${garmentType} laying flat by itself on a clean, empty, neutral background.
Design details to include/change: ${details}.`;

        // Generate images using the completely free Pollinations.ai service!
        const numVariations = Math.min(parseInt(variations) || 1, 20); // cap at 20
        const images = [];
        
        for (let i = 0; i < numVariations; i++) {
            // Use a random seed so each image variation is unique
            const seed = Math.floor(Math.random() * 1000000000);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${seed}&width=1024&height=1024&nologo=true`;
            images.push({ url: imageUrl });
        }
        
        // Add an artificial small delay so the user sees the loading state
        await new Promise(resolve => setTimeout(resolve, 2000));

        res.json({ message: "Designs generated successfully (" + images.length + " returned)", images: images });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message || 'Failed to generate designs' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
