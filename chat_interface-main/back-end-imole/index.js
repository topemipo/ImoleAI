import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ragRoutes from './routes/ragRoutes.js';
import {connectDB} from "./config/db.js";

dotenv.config();
const PORT = process.env.PORT || 3000;
connectDB()

const app = express();

app.use(cors({
    origin: "https://walrus-app-d2ols.ondigitalocean.app",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

app.get('/', (req,res) => {
    res.json({message: "Welcome to imole ai "})
})

app.use('/api', ragRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
