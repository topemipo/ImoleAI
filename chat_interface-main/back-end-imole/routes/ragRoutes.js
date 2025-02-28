import express from 'express';
import multer from 'multer';
import {generateResponse} from '../controllers/ragController.js';
import {transcribe} from "../controllers/transcribe.js";

const upload = multer({
    dest: "uploads/",
    fileFilter: (req, file, cb) => {
        const allowedFormats = ["audio/flac", "audio/m4a", "audio/mp3", "audio/mp4", "audio/mpeg", "audio/mpga", "audio/oga", "audio/ogg", "audio/wav", "audio/webm"];
        if (allowedFormats.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Unsupported file format"), false);
        }
    }
});

const router = express.Router();

router.post('/generate', generateResponse);
router.post("/transcribe", upload.single("audio"), transcribe);

export default router;