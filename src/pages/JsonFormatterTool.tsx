import React, { useState, useCallback, useMemo } from 'react';
import './JsonFormatterTool.css';

interface ValidationResult {
  isValid: boolean;
  error?: string;
  line?: number;
  column?: number;
}

interface JsonTreeNode {
  key: string;
  value: any;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  isExpanded: boolean;
  level: number;
  children?: JsonTreeNode[];
  path: string;
}

const JsonFormatterTool: React.FC = () => {
  const [inputJson, setInputJson] = useState<string>('');
  const [formattedJson, setFormattedJson] = useState<string>('');
  const [validationResult, setValidationResult] = useState<ValidationResult>({ isValid: true });
  const [indentSize, setIndentSize] = useState<number>(2);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  const [viewMode, setViewMode] = useState<'tree' | 'raw'>('tree');

  const buildJsonTree = useCallback((obj: any, key: string = 'root', level: number = 0, path: string = 'root'): JsonTreeNode => {
    let type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

    if (Array.isArray(obj)) {
      type = 'array';
    } else if (obj === null) {
      type = 'null';
    } else if (typeof obj === 'object') {
      type = 'object';
    } else if (typeof obj === 'string') {
      type = 'string';
    } else if (typeof obj === 'number') {
      type = 'number';
    } else if (typeof obj === 'boolean') {
      type = 'boolean';
    } else {
      type = 'null'; // fallback for other types
    }

    const node: JsonTreeNode = {
      key,
      value: obj,
      type,
      isExpanded: expandedNodes.has(path),
      level,
      path
    };

    if (obj && typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
      node.children = Object.entries(obj).map(([k, v]) => ({
        ...buildJsonTree(v, k, level + 1, path === 'root' ? k : `${path}.${k}`)
      }));
    } else if (Array.isArray(obj)) {
      node.children = obj.map((item, index) => ({
        ...buildJsonTree(item, `[${index}]`, level + 1, `${path}[${index}]`)
      }));
    }

    return node;
  }, [expandedNodes]);

  const toggleNodeExpansion = (path: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const getAllPaths = (node: JsonTreeNode): string[] => {
      const paths = [node.path];
      if (node.children) {
        node.children.forEach(child => {
          paths.push(...getAllPaths(child));
        });
      }
      return paths;
    };

    if (formattedJson) {
      try {
        const parsedJson = JSON.parse(inputJson);
        const tree = buildJsonTree(parsedJson);
        const allPaths = getAllPaths(tree);
        setExpandedNodes(new Set(allPaths));
      } catch (error) {
        // If parsing fails, don't do anything
      }
    }
  };

  const collapseAll = () => {
    setExpandedNodes(new Set(['root']));
  };

  const renderValue = (value: any, node: JsonTreeNode): React.ReactNode => {
    if (value === null) {
      return <span className="json-null">null</span>;
    } else if (typeof value === 'boolean') {
      return <span className="json-boolean">{value.toString()}</span>;
    } else if (typeof value === 'number') {
      return <span className="json-number">{value}</span>;
    } else if (typeof value === 'string') {
      return <span className="json-string">"{value}"</span>;
    }
    return null;
  };

  const renderNode = (node: JsonTreeNode): React.ReactNode => {
    const isExpandable = node.type === 'object' || node.type === 'array';
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.path} className={`json-node level-${node.level}`}>
        {node.key !== 'root' && (
          <span className="json-key">"{node.key}": </span>
        )}

        {isExpandable ? (
          <>
            <button
              className={`json-toggle ${node.isExpanded ? 'expanded' : 'collapsed'}`}
              onClick={() => toggleNodeExpansion(node.path)}
              aria-expanded={node.isExpanded}
              aria-label={`${node.isExpanded ? 'Collapse' : 'Expand'} ${node.key}`}
            >
              {node.type === 'array' ? '[' : '{'}
            </button>

            {node.isExpanded && hasChildren && (
              <div className="json-children">
                {node.children!.map((child, index) => (
                  <div key={child.path} className="json-child">
                    {renderNode(child)}
                  </div>
                ))}
              </div>
            )}

            {!node.isExpanded && hasChildren && (
              <span className="json-collapsed">
                {node.children!.length} {node.type === 'array' ? 'items' : 'properties'}
              </span>
            )}

            {node.isExpanded && <span className="json-bracket-end">{node.type === 'array' ? ']' : '}'}</span>}
          </>
        ) : (
          renderValue(node.value, node)
        )}
      </div>
    );
  };

  const validateAndFormatJson = useCallback((jsonString: string) => {
    if (jsonString.trim() === '') {
      setValidationResult({ isValid: true });
      setFormattedJson('');
      return;
    }

    try {
      // Parse and validate JSON
      const parsedJson = JSON.parse(jsonString);

      // Format JSON with specified indentation
      const formatted = JSON.stringify(parsedJson, null, indentSize);

      setFormattedJson(formatted);
      setValidationResult({ isValid: true });
    } catch (error: any) {
      // Extract error information
      let errorMessage = 'Invalid JSON format';
      let line: number | undefined;
      let column: number | undefined;

      if (error.message) {
        errorMessage = error.message;

        // Try to extract line and column from error message
        const lineMatch = error.message.match(/line (\d+)/i);
        const columnMatch = error.message.match(/column (\d+)/i);
        const positionMatch = error.message.match(/position (\d+)/i);

        if (lineMatch) line = parseInt(lineMatch[1]);
        if (columnMatch) column = parseInt(columnMatch[1]);
        if (positionMatch && !column) column = parseInt(positionMatch[1]);
      }

      setValidationResult({
        isValid: false,
        error: errorMessage,
        line,
        column
      });

      // Don't update formatted JSON on error
    }
  }, [indentSize]);

  const treeNodes = useMemo(() => {
    if (formattedJson && validationResult.isValid) {
      try {
        const parsedJson = JSON.parse(inputJson);
        return buildJsonTree(parsedJson);
      } catch (error) {
        return null;
      }
    }
    return null;
  }, [formattedJson, validationResult, inputJson, expandedNodes, buildJsonTree]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputJson(value);
    validateAndFormatJson(value);
  };

  const handleIndentSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const size = parseInt(e.target.value);
    setIndentSize(size);
    // Re-format with new indent size if there's input
    if (inputJson.trim()) {
      validateAndFormatJson(inputJson);
    }
  };

  const clearAll = () => {
    setInputJson('');
    setFormattedJson('');
    setValidationResult({ isValid: true });
  };

  const formatFromCurrentInput = () => {
    if (inputJson.trim()) {
      validateAndFormatJson(inputJson);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
    });
  };

  const minifyJson = () => {
    if (inputJson.trim()) {
      try {
        const parsedJson = JSON.parse(inputJson);
        const minified = JSON.stringify(parsedJson);
        setInputJson(minified);
        setFormattedJson(minified);
        setValidationResult({ isValid: true });
      } catch (error) {
        // Keep current validation state if parsing fails
      }
    }
  };

  const loadSampleJson = () => {
    const sampleJson = {
      "name": "John Doe",
      "age": 30,
      "city": "New York",
      "skills": ["JavaScript", "React", "TypeScript", "Node.js"],
      "active": true,
      "address": {
        "street": "123 Main St",
        "zipCode": "10001",
        "country": "USA"
      },
      "projects": [
        {
          "title": "E-commerce Platform",
          "status": "completed",
          "technologies": ["React", "Node.js", "MongoDB"]
        },
        {
          "title": "Mobile App",
          "status": "in-progress",
          "technologies": ["React Native", "Firebase"]
        }
      ],
      "lastLogin": "2023-12-20T10:30:00Z",
      "preferences": {
        "theme": "dark",
        "notifications": true,
        "language": "en"
      }
    };

    const jsonString = JSON.stringify(sampleJson, null, 2);
    setInputJson(jsonString);
    validateAndFormatJson(jsonString);
  };

  return (
    <div className="json-formatter-tool">
      <div className="tool-header">
        <h1>JSON Formatter & Validator</h1>
        <p>Format, validate, and minify JSON with real-time validation</p>
      </div>

      <div className="controls-section">
        <div className="controls-group">
          <div className="indent-control">
            <label>Indent Size:</label>
            <select
              value={indentSize}
              onChange={handleIndentSizeChange}
              className="indent-select"
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
              <option value={0}>Minified</option>
            </select>
          </div>

          <div className="view-mode-control">
            <label>View Mode:</label>
            <div className="view-mode-toggle">
              <button
                className={`view-mode-btn ${viewMode === 'tree' ? 'active' : ''}`}
                onClick={() => setViewMode('tree')}
              >
                🌳 Tree
              </button>
              <button
                className={`view-mode-btn ${viewMode === 'raw' ? 'active' : ''}`}
                onClick={() => setViewMode('raw')}
              >
                📄 Raw
              </button>
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn-secondary" onClick={loadSampleJson}>
              Load Sample
            </button>
            {viewMode === 'tree' && (
              <>
                <button className="btn-secondary" onClick={expandAll}>
                  Expand All
                </button>
                <button className="btn-secondary" onClick={collapseAll}>
                  Collapse All
                </button>
              </>
            )}
            <button className="btn-secondary" onClick={formatFromCurrentInput}>
              Reformat
            </button>
            <button className="btn-secondary" onClick={minifyJson}>
              Minify
            </button>
            <button className="btn-secondary" onClick={clearAll}>
              Clear
            </button>
          </div>
        </div>

        {validationResult.error && (
          <div className="error-message">
            <strong>JSON Error:</strong> {validationResult.error}
            {validationResult.line && (
              <span> (Line: {validationResult.line}{validationResult.column && `, Column: ${validationResult.column}`})</span>
            )}
          </div>
        )}

        {validationResult.isValid && inputJson.trim() && (
          <div className="success-message">
            ✅ Valid JSON format
          </div>
        )}
      </div>

      <div className="editor-container">
        <div className="editor-section input-section">
          <div className="editor-header">
            <h3>Input JSON</h3>
            <div className="editor-stats">
              {inputJson.trim() && (
                <>
                  <span>Characters: {inputJson.length}</span>
                  <span>Lines: {inputJson.split('\n').length}</span>
                </>
              )}
            </div>
          </div>
          <div className="editor-wrapper">
            <textarea
              value={inputJson}
              onChange={handleInputChange}
              placeholder="Paste or type your JSON here..."
              className={`json-textarea ${!validationResult.isValid ? 'error' : ''}`}
              spellCheck={false}
            />
            {inputJson.trim() && (
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(inputJson)}
                title="Copy input JSON"
              >
                📋 Copy
              </button>
            )}
          </div>
        </div>

        <div className="editor-section output-section">
          <div className="editor-header">
            <h3>Formatted JSON</h3>
            <div className="editor-stats">
              {formattedJson && (
                <>
                  <span>Characters: {formattedJson.length}</span>
                  <span>Lines: {formattedJson.split('\n').length}</span>
                </>
              )}
            </div>
          </div>
          <div className="editor-wrapper">
            {formattedJson && validationResult.isValid ? (
              viewMode === 'tree' ? (
                <>
                  <div className="json-tree">
                    {treeNodes && renderNode(treeNodes)}
                  </div>
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(JSON.stringify(JSON.parse(inputJson), null, indentSize))}
                    title="Copy formatted JSON"
                  >
                    📋 Copy
                  </button>
                </>
              ) : (
                <>
                  <pre className="json-output">{formattedJson}</pre>
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(formattedJson)}
                    title="Copy raw JSON"
                  >
                    📋 Copy
                  </button>
                </>
              )
            ) : (
              <div className="empty-output">
                <p>Formatted JSON will appear here</p>
                <small>Paste JSON on the left to see the {viewMode === 'tree' ? 'interactive tree' : 'formatted text'}</small>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonFormatterTool;