// const { ChatPromptTemplate } = require('@langchain/core/prompts');
// const { Ollama } = require('@langchain/ollama');
// const { StateGraph, Annotation } = require('@langchain/langgraph');
// const indexing = require('../indexing/indexingData');

// const promptTemplate = ChatPromptTemplate.fromTemplate(`
// You are a helpful assistant. Give direct, concise, and short answers.

// If the provided context contains relevant information, use it to answer in maximum 2-3 sentences.
// If the context doesn't contain sufficient information, say "No specific information found. Based on general knowledge:" and give a brief 1-2 sentence answer.
// Don't references in answer.

// Context: {context}

// Question: {question}

// Keep your response short and to the point.
// `);

// const llm = new Ollama({
//   baseUrl: 'http://localhost:11434',
//   model: 'llama3.1:latest',
// });

// const StateAnnotation = Annotation.Root({
//   question: Annotation(),
//   context: Annotation(),
//   answer: Annotation(),
// });

// const retrieve = async (state) => {
//   try {
//     await indexing.ready;
//     const vectorStore = indexing.vectorStore;

//     const retrievedDocs = await vectorStore.similaritySearch(state.question, 4);
//     return {
//       question: state.question,
//       context: retrievedDocs,
//     };
//   } catch (error) {
//     console.error('Error in retrieve:', error);
//     return {
//       question: state.question,
//       context: [],
//     };
//   }
// };

// const generate = async (state) => {
//   try {
//     const docsContent = state.context.map((doc) => doc.pageContent).join('\n');

//     const messages = await promptTemplate.invoke({
//       question: state.question,
//       context: docsContent,
//     });

//     const response = await llm.invoke(messages);

//     const filenames = state.context
//       .map((doc) => {
//         if (doc.metadata) {
//           return (
//             doc.metadata.filename ||
//             doc.metadata.source ||
//             doc.metadata.file ||
//             doc.metadata.name ||
//             null
//           );
//         }
//         return null;
//       })
//       .filter((filename) => filename !== null)
//       .filter((filename, index, self) => self.indexOf(filename) === index);

//     const llmAnswer = response.content || response;
//     const usedContext = !llmAnswer.includes(
//       "I don't have specific information about this in my knowledge base"
//     );

//     return {
//       question: state.question,
//       context: state.context,
//       answer: {
//         response: llmAnswer,
//         references: usedContext ? filenames : [],
//         fromContext: usedContext,
//       },
//     };
//   } catch (error) {
//     console.error('Error in generate:', error);
//     return {
//       question: state.question,
//       context: state.context,
//       answer: {
//         response: 'Sorry, I encountered an error while generating the answer.',
//         references: [],
//         fromContext: false,
//       },
//     };
//   }
// };

// const graph = new StateGraph(StateAnnotation)
//   .addNode('retrieve', retrieve)
//   .addNode('generate', generate)
//   .addEdge('__start__', 'retrieve')
//   .addEdge('retrieve', 'generate')
//   .addEdge('generate', '__end__');

// const app = graph.compile();

// const runRAG = async (inputQuestion) => {
//   try {
//     const result = await app.invoke({ question: inputQuestion });

//     const response = {
//       answer: result.answer.response,
//       references: result.answer.references,
//       fromContext: result.answer.fromContext,
//     };

//     return response;
//   } catch (error) {
//     console.error('Error in runRAG:', error);
//     return {
//       answer: 'Sorry, I encountered an error while processing your question.',
//       references: [],
//       fromContext: false,
//     };
//   }
// };

// module.exports = { runRAG };
