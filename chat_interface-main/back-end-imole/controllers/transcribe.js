import {OpenAI} from "openai";
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import {v4 as uuidv4} from "uuid";
import cloudinary from "cloudinary";
import Transcription from "../Model/transcribe.js";

dotenv.config();

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

export const transcribe = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({error: "No audio file uploaded"});
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname) || ".mp3";
    const newFilePath = `${filePath}${fileExtension}`;
    fs.renameSync(filePath, newFilePath);

    try {
        // Step 1: Transcribe audio
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(newFilePath),
            model: "whisper-1",
            language: "en",
        });

        const transcribedText = transcription.text;

        // Step 2: Get RAG response
        const ragUrl = "https://imole-app-7inkr.ondigitalocean.app/chat/";
        const ragResponse = await axios.post(ragUrl, {query: transcribedText});

        const ragTextResponse = ragResponse.data.response;
        console.log("RAG Response received:", ragResponse.data);

        // Step 3: Generate Speech from Text
        const audioResponse = await openai.audio.speech.create({
            model: "tts-1",
            input: ragTextResponse,
            voice: "alloy",
        });

        const speechFileName = `output-${uuidv4()}.mp3`;
        const speechFilePath = path.join("uploads", speechFileName);

        const buffer = Buffer.from(await audioResponse.arrayBuffer());
        fs.writeFileSync(speechFilePath, buffer);

        // Step 4: Upload to Cloudinary
        const cloudinaryUpload = await cloudinary.v2.uploader.upload(speechFilePath, {
            resource_type: "video",
            folder: "transcriptions",
        });

        const cloudinaryUrl = cloudinaryUpload.secure_url;

        // Step 5: Save to Database
        const savedData = await Transcription.create({
            transcribedText,
            ragResponse: ragTextResponse,
            audioUrl: cloudinaryUrl,
        });

        console.log("Saved to DB:", savedData);

        // Step 6: Return Response
        res.json({
            transcription: transcribedText,
            ragResponse: ragTextResponse,
            audioUrl: cloudinaryUrl,
        });

        // Cleanup local files
        fs.unlinkSync(newFilePath);
        fs.unlinkSync(speechFilePath);
    } catch (error) {
        console.error("Transcription error:", error);
        res.status(500).json({error: "Failed to transcribe audio"});
    }
};
