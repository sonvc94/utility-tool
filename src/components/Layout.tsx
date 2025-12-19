import React from 'react';
import Sidebar from './Sidebar';
import { MenuItem } from '../types';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  menuItems: MenuItem[];
}

const Layout: React.FC<LayoutProps> = ({ children, menuItems }) => {
  return (
    <div className="app-layout">
      <Sidebar menuItems={menuItems} />
      <div className="main-content">
        <div className="content-wrapper">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;