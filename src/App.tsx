import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import PdfMergeTool from './pages/PdfMergeTool';
import SplitFilesTool from './pages/SplitFilesTool';
import IdDecoderTool from './pages/IdDecoderTool';
import { MenuItem } from './types';
import './App.css';

const menuItems: MenuItem[] = [
  {
    id: 'pdf-merge',
    label: 'PDF Merger',
    icon: '📄',
    path: '/pdf-merge'
  },
  {
    id: 'split-files',
    label: 'Split Files',
    icon: '✂️',
    path: '/split-files'
  },
  {
    id: 'id-decoder',
    label: 'ID Decoder',
    icon: '🔍',
    path: '/id-decoder'
  },
  {
    id: 'placeholder-3',
    label: 'QR Code Generator',
    icon: '📱',
    path: '/qr-generator'
  }
];

function App() {
  return (
    <Router>
      <Layout menuItems={menuItems}>
        <Routes>
          <Route path="/pdf-merge" element={<PdfMergeTool />} />
          <Route path="/split-files" element={<SplitFilesTool />} />
          <Route path="/id-decoder" element={<IdDecoderTool />} />
          <Route path="/" element={<PdfMergeTool />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;