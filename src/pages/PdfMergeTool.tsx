import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import { UploadedFile } from '../types';
import './PdfMergeTool.css';

const PdfMergeTool: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputFileName, setOutputFileName] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const pdfFiles = acceptedFiles.filter(file => file.type === 'application/pdf');

    if (pdfFiles.length === 0) {
      setError('Please upload PDF files only');
      return;
    }

    setError(null);
    const newFiles: UploadedFile[] = pdfFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...uploadedFiles];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex < uploadedFiles.length) {
      [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
      setUploadedFiles(newFiles);
    }
  };

  const generateFileName = (customName: string): string => {
    if (customName.trim() === '') {
      // Generate default filename with timestamp
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      return `mergedpdf_${year}${month}${day}${hours}${minutes}${seconds}.pdf`;
    } else {
      // Use custom name
      let fileName = customName.trim();

      // Check if filename already ends with .pdf (case insensitive)
      if (!fileName.toLowerCase().endsWith('.pdf')) {
        fileName += '.pdf';
      }

      return fileName;
    }
  };

  const mergePdfs = async () => {
    if (uploadedFiles.length === 0) {
      setError('Please upload at least one PDF file');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const uploadedFile of uploadedFiles) {
        const existingPdfBytes = await uploadedFile.file.arrayBuffer();
        const existingPdf = await PDFDocument.load(existingPdfBytes);
        const copiedPages = await mergedPdf.copyPages(existingPdf, existingPdf.getPageIndices());

        copiedPages.forEach(page => {
          mergedPdf.addPage(page);
        });
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const fileName = generateFileName(outputFileName);

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      setError('Failed to merge PDF files. Please try again.');
      console.error('PDF merge error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="pdf-merge-tool">
      <div className="tool-header">
        <h1>PDF Merger</h1>
        <p>Merge multiple PDF files into a single document</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="dropzone-content">
          <div className="dropzone-icon">📄</div>
          <p>
            {isDragActive
              ? 'Drop the PDF files here...'
              : 'Drag & drop PDF files here, or click to select files'
            }
          </p>
          <p className="dropzone-hint">You can upload multiple files at once</p>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="file-list">
          <h3>Files to merge ({uploadedFiles.length})</h3>
          <div className="file-items">
            {uploadedFiles.map((file, index) => (
              <div key={file.id} className="file-item">
                <div className="file-info">
                  <span className="file-number">{index + 1}.</span>
                  <span className="file-name">{file.name}</span>
                </div>
                <div className="file-controls">
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => moveFile(index, 'up')}
                    disabled={index === 0}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => moveFile(index, 'down')}
                    disabled={index === uploadedFiles.length - 1}
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    className="btn-danger btn-sm"
                    onClick={() => removeFile(file.id)}
                    title="Remove file"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="filename-section">
        <h3>Output File Name (Optional)</h3>
        <div className="filename-input-container">
          <input
            type="text"
            value={outputFileName}
            onChange={(e) => setOutputFileName(e.target.value)}
            placeholder="Leave blank for default name (mergedpdf_YYYYMMDDHHMMSS.pdf)"
            className="filename-input"
          />
          <div className="filename-preview">
            {outputFileName.trim() ?
              `File will be saved as: ${generateFileName(outputFileName)}` :
              `File will be saved as: ${generateFileName('')}`
            }
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button
          className="btn-primary"
          onClick={mergePdfs}
          disabled={uploadedFiles.length === 0 || isProcessing}
        >
          {isProcessing ? 'Merging...' : `Merge ${uploadedFiles.length} PDF${uploadedFiles.length !== 1 ? 's' : ''}`}
        </button>

        {uploadedFiles.length > 0 && (
          <button
            className="btn-secondary"
            onClick={() => setUploadedFiles([])}
            disabled={isProcessing}
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
};

export default PdfMergeTool;