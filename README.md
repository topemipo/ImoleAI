# Revolutionizing Legal Literacy Through Generative AI

## **University of Wolverhampton**  
**Author:** Temitope Adeyelu  
**Date:** February 2025  

---

## **Abstract**  
Understanding and navigating the legal system is essential for fairness and justice, yet for many, legal knowledge remains out of reach due to its complexity. This project explores how **Retrieval-Augmented Generation (RAG)** systems can make legal knowledge more accessible. By using **AI-powered chatbots** to simplify legal texts and provide relevant case precedents, this study examines how individuals without legal training can better understand their rights and responsibilities.  

Beyond the technical aspects, this research also explores the **ethical challenges** of AI-driven legal assistance, such as **bias, data privacy, and accountability**. The findings highlight how technology can empower individuals, making legal information clearer and easier to navigate, ultimately contributing to a future where **legal literacy is within everyone’s reach**.

---

## **Project Overview**  
This project develops an **advanced RAG system** to enhance legal literacy and decision support by improving the relevance and accessibility of judicial precedents. Unlike traditional RAG models, this system employs a **query expansion-based approach**, where an LLM generates a hypothetical answer to refine retrieval before retrieving case law documents.

The **core components** of the system include:  
- **Summarization-Based Embedding** – Legal case documents are summarized, embedded, and stored in a database.  
- **Query Expansion Mechanism** – User queries are enhanced with hypothetical answers to improve retrieval accuracy.  
- **Vector Similarity Search** – Case law precedents are retrieved based on cosine similarity.  
- **User-Friendly Chatbot Interface** – Built using **Next.js**, with support for text and voice-based interactions.  
- **Secure Database Storage** – Implemented using **PostgreSQL with pgVector** for vector embeddings and **MongoDB** for chat logs.  

---

## **Technologies Used**  
### **Programming Languages**  
- **Python** (Backend, Data Processing)  
- **JavaScript (Next.js, Node.js)** (Frontend)  

### **Frameworks and Libraries**  
- **FastAPI** – For API development  
- **pgVector** – PostgreSQL extension for vector similarity search  
- **OpenAI’s Whisper-1 & TTS-1** – For Speech-to-Text and Text-to-Speech  
- **Anthropic Claude-3.5-Sonnet** – For summarizing case documents  
- **GPT-4-turbo** – For query expansion and response generation  

### **Database and Cloud Services**  
- **PostgreSQL with pgVector** – Storing case summaries and embeddings  
- **MongoDB** – Storing user queries, responses, and voice interactions  
- **DigitalOcean & Cloudinary** – Hosting, storage, and deployment  

---

## **Access Imole:
Web App: https://walrus-app-d2ols.ondigitalocean.app/
Streamlit: https://imoleailegaladvisor.streamlit.app/
