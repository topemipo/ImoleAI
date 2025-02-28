import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export async function callRAGSystem(question) {
    try {
        const response = await axios.post(process.env.RAG_API_URL, {
            user_query: question,
        });
        return response.data.response;
    } catch (error) {
        console.error('Error calling RAG system: ', error);
        throw new Error('Failed to get response from RAG system');
    }
}