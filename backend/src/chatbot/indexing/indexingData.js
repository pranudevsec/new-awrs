// const { PGVectorStore } = require('@langchain/community/vectorstores/pgvector');
// const { OllamaEmbeddings } = require('@langchain/ollama');

// const embeddings = new OllamaEmbeddings({
//   model: 'nomic-embed-text:latest',
//   baseUrl: 'http://localhost:11434',
// });

// let vectorStore;

// const initializeVectorStore = async () => {
//   vectorStore = await PGVectorStore.initialize(embeddings, {
//     postgresConnectionOptions: {
//       type: 'postgres',
//       host: 'localhost',
//       port: 5432,
//       user: 'postgres',
//       password: process.env.DB_PASSWORD || 'nakul',
//       database: 'ecitation',
//     },
//     tableName: 'documents',
//     columns: {
//       idColumnName: 'id',
//       vectorColumnName: 'embedding',
//       contentColumnName: 'text',
//       metadataColumnName: 'metadata',
//     },
//   });
// };

// const ready = initializeVectorStore();

// module.exports = {
//   embeddings,
//   get vectorStore() {
//     if (!vectorStore) {
//       throw new Error('Vector store not initialized yet. Await `ready` first.');
//     }
//     return vectorStore;
//   },
//   ready,
// };
