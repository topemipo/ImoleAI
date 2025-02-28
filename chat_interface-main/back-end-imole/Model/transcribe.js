import mongoose from "mongoose";

const TranscriptionSchema = new mongoose.Schema({
    transcribedText: String,
    ragResponse: String,
    audioUrl: String,
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Transcription", TranscriptionSchema);
