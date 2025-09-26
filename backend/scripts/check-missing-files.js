const fs = require('fs');
const path = require('path');

/**
 * Script to check for missing files referenced in the database
 * This helps identify files that are referenced in the database but don't exist on disk
 */

const uploadsDir = path.join(__dirname, '../uploads');

// Get list of files that actually exist in uploads directory
function getExistingFiles() {
  try {
    const files = fs.readdirSync(uploadsDir);
    return files.filter(file => {
      const filePath = path.join(uploadsDir, file);
      return fs.statSync(filePath).isFile();
    });
  } catch (error) {
    return [];
  }
}

// Function to check if a file exists
function fileExists(fileName) {
  const filePath = path.join(uploadsDir, fileName);
  return fs.existsSync(filePath);
}

// Main function to check missing files
function checkMissingFiles() {
 
  // Check specific files that might be referenced
  const filesToCheck = [
    'accepted-applications (1).pdf',
    'accepted-applications (2).pdf',
    '3249816.pdf',
    'fluent-emoji-high-contrast_tiger-face.png'
  ];
  
  filesToCheck.forEach(file => {
    const exists = fileExists(file);
  });
  
}

// Run the check
checkMissingFiles();
