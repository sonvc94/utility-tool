# Utility Website

A React-based utility website with common tools for your homelab deployment.

## Features

- **PDF Merger**: Merge multiple PDF files into a single document
- **Left Sidebar Menu**: Organized navigation for different tools
- **Responsive Design**: Works on desktop and mobile devices
- **Docker Support**: Easy deployment with Docker and Nginx

## Technologies Used

- React 18 with TypeScript
- React Router for navigation
- PDF-lib for PDF manipulation
- React Dropzone for file uploads
- Nginx for serving static files
- Docker for containerization

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn
- Docker and Docker Compose (for container deployment)

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open http://localhost:3000 in your browser

### Production Deployment

#### Using Docker Compose (Recommended)

1. Build and run with Docker Compose:
```bash
docker-compose up -d
```

2. The app will be available at http://localhost:8080

#### Using Docker

1. Build the Docker image:
```bash
docker build -t utility-website .
```

2. Run the container:
```bash
docker run -d -p 8080:80 --name utility-website utility-website
```

#### Manual Deployment

1. Build the React app:
```bash
npm run build
```

2. Copy the `build` directory to your web server
3. Configure your web server to serve the files

## Project Structure

```
utility-website/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── Layout.css
│   │   ├── Sidebar.tsx
│   │   └── Sidebar.css
│   ├── pages/
│   │   ├── PdfMergeTool.tsx
│   │   └── PdfMergeTool.css
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── App.css
│   └── index.tsx
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── README.md
```

## Usage

1. Navigate to the PDF Merger tool from the left sidebar
2. Drag and drop PDF files or click to select files
3. Reorder files using the up/down arrows
4. Remove unwanted files with the × button
5. Click "Merge PDFs" to combine all files into one document
6. Download the merged PDF

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Future Enhancements

- [ ] Add more utility tools (text formatter, image converter, QR code generator)
- [ ] Add file size limits and progress indicators
- [ ] Implement user settings and preferences
- [ ] Add dark mode support
- [ ] Implement API for server-side PDF processing for large files