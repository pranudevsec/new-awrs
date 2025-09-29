import { PDFDocument, radians, rgb, StandardFonts } from 'pdf-lib';

/**
 * Utility function to download documents with watermark
 * @param documentUrl - URL or path to the document
 * @param fileName - Name for the downloaded file
 * @param baseURL - Base URL for the API (optional, defaults to current origin)
 */
export const downloadDocumentWithWatermark = async (
  documentUrl: any,
  fileName: string,
  baseURL?: string
): Promise<void> => {
  try {
    
    // Handle different types of documentUrl
    let actualUrl: string;
    
    if (typeof documentUrl === 'string') {
      actualUrl = documentUrl;
    } else if (Array.isArray(documentUrl)) {
      // If it's an array, take the first element
      actualUrl = documentUrl[0] || '';
    } else if (documentUrl && typeof documentUrl === 'object') {
      // If it's an object, try to extract a URL property
      actualUrl = documentUrl.url || documentUrl.path || documentUrl.file || '';
    } else {
      throw new Error(`Invalid document URL type: ${typeof documentUrl}`);
    }
    
    // Validate the extracted URL
    if (!actualUrl || typeof actualUrl !== 'string' || actualUrl.trim() === '') {
      throw new Error(`Invalid document URL: ${actualUrl}`);
    }
    
    if (!fileName || typeof fileName !== 'string') {
      throw new Error('Invalid file name');
    }
    
    // Clean the document URL and ensure proper URL construction
    let cleanUrl = actualUrl.trim();
    
    // Remove leading slash if present
    if (cleanUrl.startsWith('/')) {
      cleanUrl = cleanUrl.substring(1);
    }
    
    // Use provided baseURL or fallback to configured API URL
    let defaultBaseURL = baseURL || window.location.origin;
    
    // Ensure we're using the correct backend port (8385)
    if (defaultBaseURL.includes(':3001')) {
      defaultBaseURL = defaultBaseURL.replace(':3001', ':8385');
    } else if (defaultBaseURL === window.location.origin && !defaultBaseURL.includes(':8385')) {
      // If no specific port is set and we're not already on 8385, use 8385
      defaultBaseURL = defaultBaseURL.replace(/:\d+/, ':8385');
    }
    
    const baseUrlWithSlash = defaultBaseURL.endsWith('/') ? defaultBaseURL : `${defaultBaseURL}/`;
    const fullUrl = `${baseUrlWithSlash}${cleanUrl}`;
    
    // Fetch the document with proper headers
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf,application/octet-stream,*/*',
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Document not found: ${fileName}. The file may have been deleted or moved.`);
      }
      throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    // Extract file extension
    const fileExtension = fileName.split('.').pop() || 'pdf';
    const cleanUnitName = fileName.replace(/[^a-zA-Z0-9]/g, '_');
    const customFileName = `${cleanUnitName}_application.${fileExtension}`;
    
    // Check if it's a PDF to add watermark
    if (fileName.toLowerCase().endsWith('.pdf')) {
      try {
        // Convert arrayBuffer to Uint8Array for pdf-lib
        const pdfBytes = new Uint8Array(arrayBuffer);
        
        // Add watermark to the original PDF
        const watermarkedPdfBytes = await addWatermarkToPDF(pdfBytes);
        
        // Create blob from watermarked PDF
        const blob = new Blob([watermarkedPdfBytes], { type: 'application/pdf' });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = customFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
      } catch (watermarkError) {        
        // Fallback: download original PDF without watermark
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = customFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } else {
      // For non-PDF files, convert to PDF with watermark
      try {
        const currentDateTime = new Date().toLocaleString();
        const userIP = window.location.hostname || "localhost";
        const convertedPdfBytes = await convertToPDF(arrayBuffer, fileName, userIP, currentDateTime);
        
        // Create blob from converted PDF
        const blob = new Blob([convertedPdfBytes], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = customFileName.replace(/\.[^/.]+$/, '.pdf'); // Change extension to .pdf
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
      } catch (conversionError) {        
        // Fallback: download original file without conversion
        const mimeType = response.headers.get('content-type') || 'application/octet-stream';
        const blob = new Blob([arrayBuffer], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = customFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
              }
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

  // Load the existing PDF
  const pdfDoc = await PDFDocument.load(pdfBytes);
  
  // Get all pages
  const pages = pdfDoc.getPages();
  
  // Get the font
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Add watermark to each page
  pages.forEach((page:any) => {
    const { width, height } = page.getSize();
    
    // Calculate center position for diagonal watermark
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Add large diagonal watermark - IP first, then time, both centered
    // Adjust positioning to account for diagonal rotation
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
  
  // Return the modified PDF as bytes
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
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Get the font for watermark
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Get file extension to determine how to handle the file
  const fileExtension = fileName.toLowerCase().split('.').pop() || '';
  
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension)) {
    // Handle image files
    try {
      // Convert ArrayBuffer to Uint8Array
      const imageBytes = new Uint8Array(fileBytes);
      
      // Embed the image in the PDF
      let image;
      if (fileExtension === 'png') {
        image = await pdfDoc.embedPng(imageBytes);
      } else {
        image = await pdfDoc.embedJpg(imageBytes);
      }
      
      // Get image dimensions
      const { width: imageWidth, height: imageHeight } = image;
      
      // Create a page with the image dimensions (A4 size if image is too large)
      const pageWidth = Math.min(imageWidth, 595); // A4 width
      const pageHeight = Math.min(imageHeight, 842); // A4 height
      
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      
      // Scale image to fit the page
      const scaleX = pageWidth / imageWidth;
      const scaleY = pageHeight / imageHeight;
      const scale = Math.min(scaleX, scaleY);
      
      const scaledWidth = imageWidth * scale;
      const scaledHeight = imageHeight * scale;
      
      // Center the image on the page
      const x = (pageWidth - scaledWidth) / 2;
      const y = (pageHeight - scaledHeight) / 2;
      
      // Draw the image
      page.drawImage(image, {
        x: x,
        y: y,
        width: scaledWidth,
        height: scaledHeight,
      });
      
      // Add watermark
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
    // Handle other file types (text, documents, etc.)
    // Create a simple PDF with file information
    const page = pdfDoc.addPage([595, 842]); // A4 size
    
    // Add file information
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
    
    // Add watermark
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
  
  // Return the PDF as bytes
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
    // Handle different types of documentUrl
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
    
    // Clean the document URL and ensure proper URL construction
    let cleanUrl = actualUrl.trim();
    
    // Remove leading slash if present
    if (cleanUrl.startsWith('/')) {
      cleanUrl = cleanUrl.substring(1);
    }
    
    // Use provided baseURL or fallback to configured API URL
    let defaultBaseURL = baseURL || window.location.origin;
    
    // Ensure we're using the correct backend port (8385)
    if (defaultBaseURL.includes(':3001')) {
      defaultBaseURL = defaultBaseURL.replace(':3001', ':8385');
    } else if (defaultBaseURL === window.location.origin && !defaultBaseURL.includes(':8385')) {
      // If no specific port is set and we're not already on 8385, use 8385
      defaultBaseURL = defaultBaseURL.replace(/:\d+/, ':8385');
    }
    
    const baseUrlWithSlash = defaultBaseURL.endsWith('/') ? defaultBaseURL : `${defaultBaseURL}/`;
    const fullUrl = `${baseUrlWithSlash}${cleanUrl}`;
    
    // Open document in new tab
    window.open(fullUrl, '_blank');
      } catch (error) {
    throw error;
  }
};
