import { PDFDocument, radians, rgb, StandardFonts } from 'pdf-lib';

/**
 * Utility function to download documents with watermark
 * @param documentUrl - URL or path to the document
 * @param fileName - Name for the downloaded file
 * @param baseURL - Base URL for the API (optional, defaults to current origin)
 */
// Small internal helpers to reduce nesting without changing behavior
const resolveActualUrl = (documentUrl: any): string => {
  if (typeof documentUrl === 'string') return documentUrl;
  if (Array.isArray(documentUrl)) return documentUrl[0] || '';
  if (documentUrl && typeof documentUrl === 'object') {
    return documentUrl.url || documentUrl.path || documentUrl.file || '';
  }
  throw new Error(`Invalid document URL type: ${typeof documentUrl}`);
};

const normalizeBaseUrl = (baseURL?: string): string => {
  let b = baseURL || window.location.origin;
  if (b.includes(':3001')) b = b.replace(':3001', ':8385');
  else if (b === window.location.origin && !b.includes(':8385')) b = b.replace(/:\d+/, ':8385');
  return b.endsWith('/') ? b : `${b}/`;
};

const triggerDownload = (buffer: ArrayBuffer | Uint8Array, fileName: string, mime: string) => {
  const blob = new Blob([buffer], { type: mime });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const downloadDocumentWithWatermark = async (
  documentUrl: any,
  fileName: string,
  baseURL?: string
): Promise<void> => {
  try {
    const actualUrl = resolveActualUrl(documentUrl);
    if (!actualUrl || typeof actualUrl !== 'string' || actualUrl.trim() === '') {
      throw new Error(`Invalid document URL: ${actualUrl}`);
    }
    if (!fileName || typeof fileName !== 'string') throw new Error('Invalid file name');

    const cleanUrl = actualUrl.trim().replace(/^\//, '');
    const fullUrl = `${normalizeBaseUrl(baseURL)}${cleanUrl}`;

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: { Accept: 'application/pdf,application/octet-stream,*/*' },
    });
    if (!response.ok) {
      if (response.status === 404) throw new Error(`Document not found: ${fileName}. The file may have been deleted or moved.`);
      throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const fileExtension = fileName.split('.').pop() || 'pdf';
    const cleanUnitName = fileName.replace(/[^a-zA-Z0-9]/g, '_');
    const customFileName = `${cleanUnitName}_application.${fileExtension}`;

    if (fileName.toLowerCase().endsWith('.pdf')) {
      try {
        const pdfBytes = new Uint8Array(arrayBuffer);
        const watermarkedPdfBytes = await addWatermarkToPDF(pdfBytes);
        triggerDownload(watermarkedPdfBytes, customFileName, 'application/pdf');
      } catch {
        triggerDownload(arrayBuffer, customFileName, 'application/pdf');
      }
      return;
    }

    try {
      const currentDateTime = new Date().toLocaleString();
      const userIP = window.location.hostname || 'localhost';
      const convertedPdfBytes = await convertToPDF(arrayBuffer, fileName, userIP, currentDateTime);
      triggerDownload(convertedPdfBytes, customFileName.replace(/\.[^/.]+$/, '.pdf'), 'application/pdf');
    } catch {
      const mimeType = response.headers.get('content-type') || 'application/octet-stream';
      triggerDownload(arrayBuffer, customFileName, mimeType);
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Function to add watermark to PDF using pdf-lib
 * @param pdfBytes - PDF file as Uint8Array
 * @returns Watermarked PDF as Uint8Array
 */
const addWatermarkToPDF = async (pdfBytes: Uint8Array): Promise<Uint8Array> => {
  const currentDateTime = new Date().toLocaleString();
  const userIP = window.location.hostname || "localhost";


  const pdfDoc = await PDFDocument.load(pdfBytes);
  

  const pages = pdfDoc.getPages();
  

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  

  pages.forEach((page:any) => {
    const { width, height } = page.getSize();
    

    const centerX = width / 2;
    const centerY = height / 2;
    


    page.drawText(userIP, {
      x: centerX - 50,
      y: centerY - 30,
      size: 40, // Large size
      font: font,
      color: rgb(0, 0, 0), // Black color
      opacity: 0.2, // Semi-transparent
      rotate: {
        type: 'radians',
        angle: Math.PI / 4, // 45 degrees
      },
    });
    
    page.drawText(currentDateTime, {
      x: centerX - 50,
      y: centerY + 30, // Time below IP
      size: 40, // Large size
      font: font,
      color: rgb(0, 0, 0), // Black color
      opacity: 0.2, // Semi-transparent
      rotate: {
        type: 'radians',
        angle: Math.PI / 4, // 45 degrees
      },
    });
  });
  

  return await pdfDoc.save();
};

/**
 * Function to convert non-PDF files to PDF format
 * @param fileBytes - File as ArrayBuffer
 * @param fileName - Original file name
 * @param userIP - User IP for watermark
 * @param currentDateTime - Current timestamp for watermark
 * @returns PDF as Uint8Array
 */
const convertToPDF = async (
  fileBytes: ArrayBuffer, 
  fileName: string, 
  userIP: string, 
  currentDateTime: string
): Promise<Uint8Array> => {

  const pdfDoc = await PDFDocument.create();
  

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  

  const fileExtension = fileName.toLowerCase().split('.').pop() || '';
  
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension)) {

    try {

      const imageBytes = new Uint8Array(fileBytes);
      

      let image;
      if (fileExtension === 'png') {
        image = await pdfDoc.embedPng(imageBytes);
      } else {
        image = await pdfDoc.embedJpg(imageBytes);
      }
      

      const { width: imageWidth, height: imageHeight } = image;
      

      const pageWidth = Math.min(imageWidth, 595); // A4 width
      const pageHeight = Math.min(imageHeight, 842); // A4 height
      
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      

      const scaleX = pageWidth / imageWidth;
      const scaleY = pageHeight / imageHeight;
      const scale = Math.min(scaleX, scaleY);
      
      const scaledWidth = imageWidth * scale;
      const scaledHeight = imageHeight * scale;
      

      const x = (pageWidth - scaledWidth) / 2;
      const y = (pageHeight - scaledHeight) / 2;
      

      page.drawImage(image, {
        x: x,
        y: y,
        width: scaledWidth,
        height: scaledHeight,
      });
      

      const centerX = pageWidth / 2;
      const centerY = pageHeight / 2;
      
      page.drawText(userIP, {
        x: centerX - 50,
        y: centerY - 30,
        size: 40,
        font: font,
        color: rgb(0, 0, 0),
        opacity: 0.2,
        rotate: radians(Math.PI / 4),
      });
      
      page.drawText(currentDateTime, {
        x: centerX - 50,
        y: centerY + 30,
        size: 40,
        font: font,
        color: rgb(0, 0, 0),
        opacity: 0.2,
        rotate: radians(Math.PI / 4),
      });
      
    } catch (imageError) {
      throw new Error('Failed to convert image to PDF');
    }
  } else {


    const page = pdfDoc.addPage([595, 842]); // A4 size
    

    page.drawText(`File: ${fileName}`, {
      x: 50,
      y: 750,
      size: 16,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`Original file type: ${fileExtension.toUpperCase()}`, {
      x: 50,
      y: 720,
      size: 14,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('This file has been converted to PDF format.', {
      x: 50,
      y: 690,
      size: 12,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });
    

    const centerX = 595 / 2;
    const centerY = 842 / 2;
    
    page.drawText(userIP, {
      x: centerX - 50,
      y: centerY - 30,
      size: 40,
      font: font,
      color: rgb(0, 0, 0),
      opacity: 0.2,
      rotate: radians(Math.PI / 4),
    });
    
    page.drawText(currentDateTime, {
      x: centerX - 50,
      y: centerY + 30,
      size: 40,
      font: font,
      color: rgb(0, 0, 0),
      opacity: 0.2,
      rotate: radians(Math.PI / 4),
    });
  }
  

  return await pdfDoc.save();
};

/**
 * Utility function to view documents in a new tab
 * @param documentUrl - URL or path to the document
 * @param baseURL - Base URL for the API (optional, defaults to current origin)
 */
export const viewDocument = async (
  documentUrl: any,
  baseURL?: string
): Promise<void> => {
  try {

    let actualUrl: string;
    
    if (typeof documentUrl === 'string') {
      actualUrl = documentUrl;
    } else if (Array.isArray(documentUrl)) {
      actualUrl = documentUrl[0] || '';
    } else if (documentUrl && typeof documentUrl === 'object') {
      actualUrl = documentUrl.url || documentUrl.path || documentUrl.file || '';
    } else {
      throw new Error(`Invalid document URL type: ${typeof documentUrl}`);
    }
    
    if (!actualUrl || typeof actualUrl !== 'string' || actualUrl.trim() === '') {
      throw new Error(`Invalid document URL: ${actualUrl}`);
    }
    

    let cleanUrl = actualUrl.trim();
    

    if (cleanUrl.startsWith('/')) {
      cleanUrl = cleanUrl.substring(1);
    }
    

    let defaultBaseURL = baseURL || window.location.origin;
    

    if (defaultBaseURL.includes(':3001')) {
      defaultBaseURL = defaultBaseURL.replace(':3001', ':8385');
    } else if (defaultBaseURL === window.location.origin && !defaultBaseURL.includes(':8385')) {

      defaultBaseURL = defaultBaseURL.replace(/:\d+/, ':8385');
    }
    
    const baseUrlWithSlash = defaultBaseURL.endsWith('/') ? defaultBaseURL : `${defaultBaseURL}/`;
    const fullUrl = `${baseUrlWithSlash}${cleanUrl}`;
    

    window.open(fullUrl, '_blank');
      } catch (error) {
    throw error;
  }
};
