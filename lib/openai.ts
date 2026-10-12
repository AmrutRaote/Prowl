import OpenAI from "openai";


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
})


export async function embedTexts(texts: string[]) {
    const response = await openai.embeddings.create({
        model: "text-embedding-3-large",
        input: texts,
        dimensions: 1024
    });

    return response.data.map((item) => item.embedding)
    
}