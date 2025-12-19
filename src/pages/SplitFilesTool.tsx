import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadedFile } from '../types';
import './SplitFilesTool.css';

interface SplitOption {
  mode: 'split' | 'lastLines';
  numberOfFiles?: number;
  numberOfLines?: number;
}

const SplitFilesTool: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [splitOption, setSplitOption] = useState<SplitOption>({
    mode: 'split',
    numberOfFiles: 2,
    numberOfLines: 1000
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      setError('Please upload a file');
      return;
    }

    const file = acceptedFiles[0];
    setError(null);
    setUploadedFile({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/*': ['.txt', '.csv', '.log', '.json'],
      'application/json': ['.json']
    },
    multiple: false
  });

  const removeFile = () => {
    setUploadedFile(null);
  };

  const processFile = async () => {
    if (!uploadedFile) {
      setError('Please upload a file first');
      return;
    }

    // Validate inputs
    if (splitOption.mode === 'split' && (!splitOption.numberOfFiles || splitOption.numberOfFiles < 2 || splitOption.numberOfFiles > 100)) {
      setError('Please enter a valid number of files (2-100)');
      return;
    }

    if (splitOption.mode === 'lastLines' && (!splitOption.numberOfLines || splitOption.numberOfLines < 1 || splitOption.numberOfLines > 100000)) {
      setError('Please enter a valid number of lines (1-100000)');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const fileContent = await uploadedFile.file.text();
      const lines = fileContent.split('\n');

      if (splitOption.mode === 'split') {
        // Split file into n parts
        const numFiles = splitOption.numberOfFiles || 2;
        const linesPerFile = Math.ceil(lines.length / numFiles);

        for (let i = 0; i < numFiles; i++) {
          const startIndex = i * linesPerFile;
          const endIndex = Math.min(startIndex + linesPerFile, lines.length);
          const fileLines = lines.slice(startIndex, endIndex);
          const fileContent = fileLines.join('\n');

          const blob = new Blob([fileContent], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);

          const link = document.createElement('a');
          link.href = url;
          const baseName = uploadedFile.name.replace(/\.[^/.]+$/, '');
          const extension = uploadedFile.name.substring(uploadedFile.name.lastIndexOf('.'));
          const indexNumber = (i + 1).toString().padStart(2, '0');
          link.download = `${baseName}_${indexNumber}${extension}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      } else if (splitOption.mode === 'lastLines') {
        // Get last n lines
        const numLines = splitOption.numberOfLines || 1000;
        const lastLines = lines.slice(-numLines);
        const extractedContent = lastLines.join('\n');

        // Create HTML content for new tab
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Last ${lastLines.length} Lines from ${uploadedFile.name}</title>
    <style>
        body {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 14px;
            line-height: 1.5;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background-color: white;
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .header-info {
            flex: 1;
        }
        .header h1 {
            margin: 0 0 10px 0;
            color: #2c3e50;
            font-size: 1.5rem;
        }
        .header p {
            margin: 0;
            color: #718096;
        }
        .content {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            max-height: 80vh;
            overflow-y: auto;
        }
        pre {
            margin: 0;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .download-btn {
            background-color: #4299e1;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: background-color 0.2s ease;
            flex-shrink: 0;
        }
        .download-btn:hover {
            background-color: #3182ce;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-info">
            <h1>Preview - Last ${lastLines.length} Lines</h1>
            <p>Source file: ${uploadedFile.name}</p>
        </div>
        <button class="download-btn" onclick="downloadFile()">
            Download File
        </button>
    </div>
    <div class="content">
        <pre>${extractedContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    </div>

    <script>
        function downloadFile() {
            const content = \`${extractedContent.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = '${uploadedFile.name.replace(/\.[^/.]+$/, '')}_last_${numLines}_lines.txt';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    </script>
</body>
</html>`;

        // Open in new tab
        const newTab = window.open('', '_blank');
        if (newTab) {
          newTab.document.write(htmlContent);
          newTab.document.close();
        } else {
          setError('Failed to open new tab. Please check your browser settings.');
        }
      }
    } catch (err) {
      setError('Failed to process file. Please try again.');
      console.error('File processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  
  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'numberOfFiles' | 'numberOfLines') => {
    const value = e.target.value;

    // Allow only empty string or valid numbers
    if (value === '' || /^\d+$/.test(value)) {
      setSplitOption({
        ...splitOption,
        [field]: value === '' ? 0 : parseInt(value) || 0
      });
    }
  };

  return (
    <div className="split-files-tool">
      <div className="tool-header">
        <h1>Split Files</h1>
        <p>Split text files into multiple parts or extract the last n lines</p>
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
              ? 'Drop the file here...'
              : 'Drag & drop a text file here, or click to select file'
            }
          </p>
          <p className="dropzone-hint">Supported formats: .txt, .csv, .log, .json</p>
        </div>
      </div>

      {uploadedFile && (
        <div className="file-info">
          <h3>Selected File</h3>
          <div className="file-item">
            <div className="file-details">
              <span className="file-name">{uploadedFile.name}</span>
              <span className="file-size">
                {(uploadedFile.file.size / 1024).toFixed(2)} KB
              </span>
            </div>
            <button
              className="btn-danger btn-sm"
              onClick={removeFile}
              title="Remove file"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="split-options">
        <h3>Split Options</h3>

        <div className="option-group">
          <label className="radio-label">
            <input
              type="radio"
              name="mode"
              value="split"
              checked={splitOption.mode === 'split'}
              onChange={(e) => setSplitOption({
                ...splitOption,
                mode: 'split'
              })}
            />
            Split file into n parts
          </label>

          {splitOption.mode === 'split' && (
            <div className="option-input">
              <label>Number of files:</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="2"
                value={splitOption.numberOfFiles}
                onChange={(e) => handleNumberInputChange(e, 'numberOfFiles')}
              />
            </div>
          )}
        </div>

        <div className="option-group">
          <label className="radio-label">
            <input
              type="radio"
              name="mode"
              value="lastLines"
              checked={splitOption.mode === 'lastLines'}
              onChange={(e) => setSplitOption({
                ...splitOption,
                mode: 'lastLines'
              })}
            />
            Extract last n lines
          </label>

          {splitOption.mode === 'lastLines' && (
            <div className="option-input">
              <label>Number of lines:</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="1000"
                value={splitOption.numberOfLines}
                onChange={(e) => handleNumberInputChange(e, 'numberOfLines')}
              />
            </div>
          )}
        </div>
      </div>

      <div className="action-buttons">
        <button
          className="btn-primary"
          onClick={processFile}
          disabled={!uploadedFile || isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Process File'}
        </button>

        {uploadedFile && (
          <button
            className="btn-secondary"
            onClick={removeFile}
            disabled={isProcessing}
          >
            Clear File
          </button>
        )}
      </div>
    </div>
  );
};

export default SplitFilesTool;