import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { AzureOpenAIEmbeddings } from "@langchain/openai";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import fs from "fs";

async function run() {
    console.log("De Schikgodinnen spinnen de bronteksten...");

    try {
        const loader = new TextLoader("./public/originals/myths_source.txt");
        const docs = await loader.load();
        const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
        const chunks = await textSplitter.splitDocuments(docs);

        const embeddings = new AzureOpenAIEmbeddings({
            azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME,
        });

        console.log("Vectoren berekenen...");
        const vectorStore = new FaissStore(embeddings, {});
        await vectorStore.addDocuments(chunks);

        if (!fs.existsSync("./documents")) {
            fs.mkdirSync("./documents");
        }

        console.log("Bezig met opslaan naar schijf...");

        await vectorStore.save("./documents");

        console.log(`Het weven is voltooid! ${chunks.length} chunks opgeslagen in /documents`);
    } catch (error) {
        console.error("De draden zijn geknapt:", error.message);
    }
}

run();