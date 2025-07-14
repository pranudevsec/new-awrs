const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { PDFLoader } = require('@langchain/community/document_loaders/fs/pdf');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const { Document } = require('@langchain/core/documents');
const indexing = require('../chatbot/indexing/indexingData');
const { runRAG } = require('../chatbot/retrieval/retrievalData');

const embeddings = indexing.embeddings;

const uploadDir = path.join(__dirname, '..',  'chatbot','chatbot_uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

const uploadFile = async (req, res) => {

  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    await indexing.ready;
    const vectorStore = indexing.vectorStore;

    const filepath = path.join(uploadDir, req.file.filename);
    const loader = new PDFLoader(filepath);
    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const allSplits = await splitter.splitDocuments(docs);

    const texts = allSplits.map((d) => d.pageContent);
    const vectors = await embeddings.embedDocuments(texts);

    const documents = allSplits.map((doc, idx) =>
      new Document({
        pageContent: doc.pageContent,
        metadata: { filename: req.file.filename, pageNumber: idx + 1 },
      })
    );

    await vectorStore.addVectors(vectors, documents);

    res.status(200).json({
      message: 'File uploaded successfully',
      filePath: `/uploads/${req.file.filename}`,
    });
  } catch (err) {
    console.error('uploadFile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const retrieveAnswer = async (req, res) => {
  const { question } = req.body;
  if (!question || typeof question !== 'string')
    return res.status(400).json({ error: 'Invalid question format' });

  try {
    await indexing.ready;
    const result = await runRAG(question);

    res.status(200).json({
      answer: result.answer || 'No answer found',
    });
  } catch (err) {
    console.error('retrieveAnswer error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  upload,
  uploadFile,
  retrieveAnswer,
};
