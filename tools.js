import { AzureOpenAIEmbeddings } from "@langchain/openai";
import { FaissStore } from "@langchain/community/vectorstores/faiss";

const embeddings = new AzureOpenAIEmbeddings({
    azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME
});

const vectorStore = await FaissStore.load("./documents", embeddings);

export const getMythData = async (category, name) => {
    try {
        const cleanName = name.toLowerCase().trim();
        const response = await fetch(`https://thegreekmythapi.vercel.app/api/${category}/${cleanName}`);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        return null;
    }
};

export const retrieve = async (query) => {
    console.log("De Fates raadplegen de oude rollen voor:", query);
    const docs = await vectorStore.similaritySearch(query, 2);
    return docs.map(d => d.pageContent).join("\n\n");
};