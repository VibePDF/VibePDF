import React, { useState, useCallback } from 'react';
import { Download, FileText, Zap, Shield, Palette, Settings } from 'lucide-react';
import { PDFDocument, StandardFonts, rgb, PageSizes, ColorUtils } from './index.js';

function App() {
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSimplePDF = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      console.log('Starting PDF generation...');
      
      const doc = await PDFDocument.create({
        title: 'VibePDF Demo Document',
        author: 'VibePDF Library',
        subject: 'Demonstration of VibePDF capabilities',
        creator: 'VibePDF Demo App'
      });

      console.log('Document created, adding page...');
      
      const page = doc.addPage(PageSizes.A4);
      
      console.log('Page added, embedding font...');
      
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      
      // Add font to page
      page.addFont(font);
      
      console.log('Font embedded, adding content...');
      
      // Title
      page.drawText('VibePDF Library Demo', {
        x: 50,
        y: 750,
        size: 24,
        color: rgb(0.1, 0.3, 0.8),
        font: StandardFonts.HelveticaBold
      });

      // Subtitle
      page.drawText('Enterprise-grade TypeScript PDF creation', {
        x: 50,
        y: 720,
        size: 14,
        color: rgb(0.3, 0.3, 0.3),
        font: StandardFonts.Helvetica
      });

      // Features section
      page.drawText('Key Features:', {
        x: 50,
        y: 680,
        size: 16,
        color: ColorUtils.BLACK,
        font: StandardFonts.HelveticaBold
      });

      const features = [
        'Pure TypeScript 5.8.3 implementation',
        'PDF 2.0 and PDF/A compliance',
        'High-performance rendering engine',
        'Digital signatures and encryption',
        'Interactive forms and annotations',
        'Font embedding and subsetting',
        'Zero runtime dependencies'
      ];

      features.forEach((feature, index) => {
        page.drawText(`• ${feature}`, {
          x: 70,
          y: 650 - (index * 20),
          size: 12,
          color: rgb(0.2, 0.2, 0.2),
          font: StandardFonts.Helvetica
        });
      });

      // Graphics demonstration
      page.drawRectangle(
        { x: 50, y: 400, width: 200, height: 100 },
        { 
          fillColor: rgb(0.9, 0.95, 1),
          strokeColor: rgb(0.1, 0.3, 0.8),
          lineWidth: 2
        }
      );

      page.drawText('Graphics Support', {
        x: 60,
        y: 460,
        size: 14,
        color: rgb(0.1, 0.3, 0.8),
        font: StandardFonts.HelveticaBold
      });

      page.drawText('Rectangles, lines, circles', {
        x: 60,
        y: 440,
        size: 10,
        color: rgb(0.3, 0.3, 0.3),
        font: StandardFonts.Helvetica
      });

      page.drawText('and complex vector graphics', {
        x: 60,
        y: 425,
        size: 10,
        color: rgb(0.3, 0.3, 0.3),
        font: StandardFonts.Helvetica
      });

      // Circle demonstration
      page.drawCircle(
        { x: 400, y: 450 },
        30,
        {
          fillColor: rgb(1, 0.8, 0.2),
          strokeColor: rgb(0.8, 0.4, 0),
          lineWidth: 3
        }
      );

      // Line demonstration
      page.drawLine(
        { x: 300, y: 380 },
        { x: 500, y: 380 },
        {
          strokeColor: rgb(0.8, 0.1, 0.1),
          lineWidth: 4,
          lineCap: 'round'
        }
      );

      // Footer
      page.drawText('Generated with VibePDF v1.0.0', {
        x: 50,
        y: 50,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
        font: StandardFonts.Helvetica
      });

      console.log('Content added, saving PDF...');
      
      const pdfBytes = await doc.save();
      
      console.log('PDF saved, creating blob...');
      
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setPdfBlob(blob);
      
      console.log('PDF generation completed successfully!');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const downloadPDF = useCallback(() => {
    if (!pdfBlob) return;
    
    try {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vibepdf-demo.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setError(`Error downloading PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [pdfBlob]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  VibePDF
                </h1>
                <p className="text-gray-600 text-sm">Enterprise TypeScript PDF Library</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Version 1.0.0</div>
              <div className="text-xs text-gray-400">TypeScript 5.8.3</div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Beyond pdf-lib, pdf.js & iText
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A production-grade, strictly TypeScript PDF library with enterprise features, 
            standards compliance, and zero dependencies. Built for modern web applications.
          </p>
          
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={generateSimplePDF}
              disabled={isGenerating}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <FileText className="w-5 h-5" />
              <span>{isGenerating ? 'Generating...' : 'Generate Demo PDF'}</span>
            </button>
            
            {pdfBlob && (
              <button
                onClick={downloadPDF}
                className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Download PDF</span>
              </button>
            )}
          </div>

          {/* PDF Preview */}
          {pdfBlob && (
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-4xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">PDF Preview</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <iframe
                  src={URL.createObjectURL(pdfBlob)}
                  className="w-full h-96"
                  title="PDF Preview"
                  style={{ minHeight: '600px' }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                PDF generated successfully! You can view it above or download it using the button.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Enterprise-Grade Features
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <FileText className="w-8 h-8 text-blue-600" />,
                title: 'PDF Creation & Editing',
                description: 'Programmatic PDF generation with full page manipulation, merge, split, and watermarking capabilities.'
              },
              {
                icon: <Zap className="w-8 h-8 text-purple-600" />,
                title: 'High-Performance Rendering',
                description: 'Optimized Canvas 2D and WebGL rendering pipelines for large documents and complex graphics.'
              },
              {
                icon: <Shield className="w-8 h-8 text-green-600" />,
                title: 'Security & Encryption',
                description: 'AES-256 encryption, digital signatures, password protection, and permission management.'
              },
              {
                icon: <Palette className="w-8 h-8 text-orange-600" />,
                title: 'Advanced Typography',
                description: 'Font embedding, subsetting, Unicode support, CJK languages, and RTL text handling.'
              },
              {
                icon: <Settings className="w-8 h-8 text-red-600" />,
                title: 'Standards Compliance',
                description: 'Full PDF 2.0, PDF/A, PDF/UA, and PDF/X compliance for accessibility and archiving.'
              },
              {
                icon: <FileText className="w-8 h-8 text-indigo-600" />,
                title: 'Interactive Forms',
                description: 'Complete AcroForm support, XFA handling, dynamic form generation and flattening.'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex items-center mb-4">
                  {feature.icon}
                  <h4 className="text-lg font-semibold text-gray-900 ml-3">
                    {feature.title}
                  </h4>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-white mb-8">
            Clean, TypeScript-First API
          </h3>
          
          <div className="bg-gray-800 rounded-lg p-6 overflow-x-auto">
            <pre className="text-green-400 text-sm leading-relaxed">
              <code>{`import { PDFDocument, StandardFonts, rgb, PageSizes } from 'vibepdf';

const generatePDF = async () => {
  const doc = await PDFDocument.create({
    title: 'Enterprise PDF',
    author: 'VibePDF'
  });
  
  const page = doc.addPage(PageSizes.A4);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  
  page.drawText('Hello from VibePDF!', {
    x: 50,
    y: 750,
    font,
    size: 24,
    color: rgb(0.1, 0.3, 0.8)
  });
  
  page.drawRectangle(
    { x: 50, y: 600, width: 200, height: 100 },
    { fillColor: rgb(0.9, 0.95, 1), strokeColor: rgb(0.1, 0.3, 0.8) }
  );
  
  return await doc.save();
};`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600">
            VibePDF v1.0.0 - Enterprise TypeScript PDF Library
          </p>
          <p className="text-gray-400 text-sm mt-2">
            AGPL-3.0 License • Built with TypeScript 5.8.3 • Zero Dependencies
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;