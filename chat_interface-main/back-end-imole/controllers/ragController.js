import axios from "axios";

export const generateResponse = async (req, res) => {
    const {question} = req.body;

    if (!question) {
        return res.status(400).json({error: "Question is required"});
    }

    try {
        const ragUrl = "https://imole-app-7inkr.ondigitalocean.app/chat/";

        const response = await axios.post(ragUrl, {query: question});

        console.log("Response received from RAG server");

        res.json({message: response.data});

    } catch (error) {
        console.error("Unexpected Error Occurred", error);
        res.status(500).json({error: "An error occurred while streaming data."});
    }
};
