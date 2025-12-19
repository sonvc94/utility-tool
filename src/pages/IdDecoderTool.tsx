import React, { useState } from 'react';
import './IdDecoderTool.css';

interface DecodedId {
  originalId: string;
  decimalValue: bigint;
  appId: number;
  clusterId: number;
  sequence: number;
  timestamp: number;
  formattedTimestamp: string;
  isValid: boolean;
  error?: string;
}

const IdDecoderTool: React.FC = () => {
  const [inputId, setInputId] = useState<string>('');
  const [decodedId, setDecodedId] = useState<DecodedId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimezone, setSelectedTimezone] = useState<'japan' | 'local'>('japan');

  // Constants from XLongGenerator
  const BITS3 = 40, BITS2 = 14, BITS1 = 2, BITS0 = 7;
  const BITS01 = BITS0 + BITS1, BITS012 = BITS01 + BITS2;
  const MASK1 = BigInt((1 << BITS1) - 1), MASK0 = BigInt((1 << BITS0) - 1);
  const MASK3 = BigInt((1 << BITS3) - 1), MASK2 = BigInt((1 << BITS2) - 1);
  const TIMESTAMP_OFFSET = 1451574000000; // 2016-01-01 00:00:00.000

  // XLongGenerator static methods ported to TypeScript
  const decode36 = (value: string): bigint | null => {
    try {
      // Use BigInt for base-36 conversion
      let result = BigInt(0);
      for (let i = 0; i < value.length; i++) {
        const char = value.charCodeAt(i);
        const digit = char >= 48 && char <= 57 ? char - 48 : // 0-9
                     char >= 65 && char <= 90 ? char - 55 : // A-Z (case insensitive)
                     char >= 97 && char <= 122 ? char - 87 : // a-z
                     -1;
        if (digit === -1 || digit >= 36) return null;
        result = result * BigInt(36) + BigInt(digit);
      }
      return result;
    } catch {
      return null;
    }
  };

  const getAppId = (id: bigint): number => {
    return Number(id & MASK0);
  };

  const getClusterId = (id: bigint): number => {
    return Number((id >> BigInt(BITS0)) & MASK1);
  };

  const getSequence = (id: bigint): number => {
    return Number((id >> BigInt(BITS01)) & MASK2);
  };

  const getTimestamp = (id: bigint): number => {
    return Number((id >> BigInt(BITS012))) + TIMESTAMP_OFFSET;
  };

  const formatTimestamp = (timestamp: number, timezone: 'japan' | 'local' = 'japan'): string => {
    const date = new Date(timestamp);

    if (timezone === 'japan') {
      // Format in Japan timezone (Asia/Tokyo, UTC+9)
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };

      const formatter = new Intl.DateTimeFormat('en-CA', options);
      const parts = formatter.formatToParts(date);

      const year = parts.find(p => p.type === 'year')?.value || '0000';
      const month = parts.find(p => p.type === 'month')?.value || '00';
      const day = parts.find(p => p.type === 'day')?.value || '00';
      const hours = parts.find(p => p.type === 'hour')?.value || '00';
      const minutes = parts.find(p => p.type === 'minute')?.value || '00';
      const seconds = parts.find(p => p.type === 'second')?.value || '00';

      // Get milliseconds separately - always use the original date's milliseconds
      const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

      return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
    } else {
      // Format in local timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

      return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
    }
  };

  const decodeId = () => {
    if (!inputId.trim()) {
      setError('Please enter an ID to decode');
      setDecodedId(null);
      return;
    }

    setError(null);

    try {
      let decimalValue: bigint | null = null;

      // Try to parse as decimal first
      if (/^\d+$/.test(inputId.trim())) {
        decimalValue = BigInt(inputId.trim());
      } else {
        // Try to parse as base-36
        decimalValue = decode36(inputId.trim().toLowerCase());
      }

      if (decimalValue === null) {
        setError('Invalid ID format. Please enter a valid decimal number or base-36 string');
        setDecodedId(null);
        return;
      }

      // Check if it's a valid 64-bit number (signed 64-bit range)
      const maxInt64 = BigInt("9223372036854775807"); // 2^63 - 1
      if (decimalValue < BigInt(0) || decimalValue > maxInt64) {
        setError('ID value is out of valid 64-bit range (must be between 0 and 9,223,372,036,854,775,807)');
        setDecodedId(null);
        return;
      }

      // Extract components
      const appId = getAppId(decimalValue);
      const clusterId = getClusterId(decimalValue);
      const sequence = getSequence(decimalValue);
      const timestamp = getTimestamp(decimalValue);
      const formattedTimestamp = formatTimestamp(timestamp, selectedTimezone);

      // Validate if it looks like a valid XLongGenerator ID
      const now = Date.now();
      const isValidTimestamp = timestamp > TIMESTAMP_OFFSET && timestamp <= now + 60000; // Allow 1 minute future

      const result: DecodedId = {
        originalId: inputId.trim(),
        decimalValue: decimalValue,
        appId,
        clusterId,
        sequence,
        timestamp,
        formattedTimestamp,
        isValid: isValidTimestamp
      };

      setDecodedId(result);
      setError(null);

    } catch (err) {
      setError('Failed to decode ID. Please check the input format.');
      setDecodedId(null);
      console.error('ID decode error:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      decodeId();
    }
  };

  const clearAll = () => {
    setInputId('');
    setDecodedId(null);
    setError(null);
  };

  const handleTimezoneChange = (timezone: 'japan' | 'local') => {
    setSelectedTimezone(timezone);
    // If there's already a decoded ID, reformat it with the new timezone
    if (decodedId) {
      const updatedDecodedId = {
        ...decodedId,
        formattedTimestamp: formatTimestamp(decodedId.timestamp, timezone)
      };
      setDecodedId(updatedDecodedId);
    }
  };

  const encodeToBase36 = (decimal: bigint): string => {
    return decimal.toString(36).toUpperCase();
  };

  const formatBigInt = (value: bigint): string => {
    const str = value.toString();
    const regex = /(\d)(?=(\d{3})+(?!\d))/g;
    return str.replace(regex, '$1,');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
    });
  };

  return (
    <div className="id-decoder-tool">
      <div className="tool-header">
        <h1>ID Decoder</h1>
        <p>Decode XLongGenerator IDs to extract component information</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="input-section">
        <h3>Enter ID to Decode</h3>
        <div className="input-container">
          <input
            type="text"
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter decimal ID or base-36 ID"
            className="id-input"
          />
          <button
            className="btn-primary"
            onClick={decodeId}
            disabled={!inputId.trim()}
          >
            Decode
          </button>
          {inputId && (
            <button
              className="btn-secondary"
              onClick={clearAll}
            >
              Clear
            </button>
          )}
        </div>
        <p className="input-hint">
          Supports both decimal (e.g., 1234567890123456789) and base-36 (e.g., A1B2C3D4E5F) formats
        </p>
      </div>

      {decodedId && (
        <div className="results-section">
          <h3>Decoded Results</h3>

          <div className="result-card">
            <h4>ID Information</h4>
            <div className="result-item">
              <label>Original Input:</label>
              <span className="value">{decodedId.originalId}</span>
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(decodedId.originalId)}
                title="Copy to clipboard"
              >
                📋
              </button>
            </div>
            <div className="result-item">
              <label>Decimal Value:</label>
              <span className="value">{formatBigInt(decodedId.decimalValue)}</span>
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(decodedId.decimalValue.toString())}
                title="Copy to clipboard"
              >
                📋
              </button>
            </div>
            <div className="result-item">
              <label>Base-36 Value:</label>
              <span className="value">{encodeToBase36(decodedId.decimalValue)}</span>
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(encodeToBase36(decodedId.decimalValue))}
                title="Copy to clipboard"
              >
                📋
              </button>
            </div>
            <div className="result-item">
              <label>ID Status:</label>
              <span className={`value status ${decodedId.isValid ? 'valid' : 'invalid'}`}>
                {decodedId.isValid ? '✅ Valid XLongGenerator ID' : '⚠️ Possibly Invalid'}
              </span>
            </div>
          </div>

          <div className="result-grid">
            <div className="result-card">
              <h4>Application Info</h4>
              <div className="result-item">
                <label>App ID:</label>
                <span className="value">{decodedId.appId}</span>
              </div>
              <div className="result-item">
                <label>Cluster ID:</label>
                <span className="value">{decodedId.clusterId}</span>
              </div>
              <div className="result-item">
                <label>Sequence:</label>
                <span className="value">{decodedId.sequence.toLocaleString()}</span>
              </div>
            </div>

            <div className="result-card">
              <h4>Timestamp Info</h4>
              <div className="result-item">
                <label>Unix Timestamp:</label>
                <span className="value">{decodedId.timestamp}</span>
              </div>
              <div className="result-item">
                <label>Formatted Date:</label>
                <div className="datetime-container">
                  <span className="value datetime">{decodedId.formattedTimestamp}</span>
                  <button
                    className="timezone-badge clickable"
                    onClick={() => handleTimezoneChange(selectedTimezone === 'japan' ? 'local' : 'japan')}
                    title={`Click to switch to ${selectedTimezone === 'japan' ? 'Local' : 'Japan'} timezone`}
                  >
                    {selectedTimezone === 'japan' ? '🇯🇵 JST' : '🌍 Local'}
                  </button>
                </div>
              </div>
              <div className="result-item">
                <label>Days Since Epoch:</label>
                <span className="value">
                  {Math.floor((decodedId.timestamp - TIMESTAMP_OFFSET) / (1000 * 60 * 60 * 24))}
                </span>
              </div>
            </div>
          </div>

          <div className="bit-breakdown">
            <h4>64-Bit Structure</h4>
            <div className="bit-visualization">
              <div className="bit-section timestamp">
                <span className="bit-label">Timestamp (40 bits)</span>
                <span className="bit-value">{(decodedId.decimalValue >> BigInt(BITS012)).toString(2).padStart(40, '0').slice(0, 40)}</span>
              </div>
              <div className="bit-section sequence">
                <span className="bit-label">Sequence (14 bits)</span>
                <span className="bit-value">{(decodedId.sequence).toString(2).padStart(14, '0')}</span>
              </div>
              <div className="bit-section cluster">
                <span className="bit-label">Cluster (2 bits)</span>
                <span className="bit-value">{(decodedId.clusterId).toString(2).padStart(2, '0')}</span>
              </div>
              <div className="bit-section app">
                <span className="bit-label">App (7 bits)</span>
                <span className="bit-value">{(decodedId.appId).toString(2).padStart(7, '0')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdDecoderTool;