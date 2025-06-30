import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Download, FileText, Zap, Shield, Palette, Settings, Type, Shapes, Layout, Eye, EyeOff, ExternalLink, Github } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PDFDocument, StandardFonts, rgb, PageSizes, ColorUtils } from './index.js';

function App() {
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoType, setDemoType] = useState<'basic' | 'advanced' | 'text'>('basic');
  const [showPreview, setShowPreview] = useState(true);
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Clear PDF blob when demo type changes
  useEffect(() => {
    setPdfBlob(null);
    setPdfDataUrl(null);
    setError(null);
  }, [demoType]);

  // Convert blob to data URL for iframe
  useEffect(() => {
    if (pdfBlob) {
      const reader = new FileReader();
      reader.onload = () => {
        setPdfDataUrl(reader.result as string);
      };
      reader.readAsDataURL(pdfBlob);
    } else {
      setPdfDataUrl(null);
    }
  }, [pdfBlob]);

  const generateBasicPDF = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      console.log('Starting basic PDF generation...');
      
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

  const generateAdvancedPDF = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const doc = await PDFDocument.create({
        title: 'VibePDF Advanced Features Demo',
        author: 'VibePDF Library',
        subject: 'Advanced drawing and layout capabilities'
      });

      const page = doc.addPage(PageSizes.A4);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      page.addFont(font);

      // Title with background
      page.drawTextBlock('Advanced VibePDF Features', {
        x: 50,
        y: 750,
        size: 20,
        font: StandardFonts.HelveticaBold,
        color: ColorUtils.WHITE,
        backgroundColor: rgb(0.1, 0.3, 0.8),
        padding: { top: 15, right: 20, bottom: 15, left: 20 },
        maxWidth: 500
      });

      // Rounded rectangles
      page.drawRoundedRectangle(
        { x: 50, y: 600, width: 150, height: 80 },
        10,
        { fillColor: rgb(0.9, 0.95, 1), strokeColor: rgb(0.1, 0.3, 0.8), lineWidth: 2 }
      );

      page.drawText('Rounded\nRectangles', {
        x: 75,
        y: 650,
        size: 12,
        font: StandardFonts.HelveticaBold,
        color: rgb(0.1, 0.3, 0.8),
        align: 'center'
      });

      // Ellipse
      page.drawEllipse(
        { x: 300, y: 640 },
        60, 40,
        { fillColor: rgb(1, 0.8, 0.2), strokeColor: rgb(0.8, 0.4, 0), lineWidth: 2 }
      );

      page.drawText('Ellipses', {
        x: 275,
        y: 645,
        size: 12,
        font: StandardFonts.HelveticaBold,
        color: rgb(0.8, 0.4, 0)
      });

      // Polygon (triangle)
      page.drawPolygon([
        { x: 450, y: 600 },
        { x: 500, y: 680 },
        { x: 400, y: 680 }
      ], {
        fillColor: rgb(0.8, 0.2, 0.2),
        strokeColor: rgb(0.6, 0.1, 0.1),
        lineWidth: 2
      });

      page.drawText('Polygons', {
        x: 430,
        y: 590,
        size: 12,
        font: StandardFonts.HelveticaBold,
        color: rgb(0.6, 0.1, 0.1)
      });

      // Transparency demonstration
      page.drawText('Transparency Effects:', {
        x: 50,
        y: 520,
        size: 16,
        font: StandardFonts.HelveticaBold,
        color: ColorUtils.BLACK
      });

      // Overlapping circles with transparency
      page.drawCircle({ x: 100, y: 450 }, 30, { fillColor: rgb(1, 0, 0), opacity: 0.5 });
      page.drawCircle({ x: 130, y: 450 }, 30, { fillColor: rgb(0, 1, 0), opacity: 0.5 });
      page.drawCircle({ x: 115, y: 420 }, 30, { fillColor: rgb(0, 0, 1), opacity: 0.5 });

      // Complex layout demonstration
      page.drawText('Complex Layout Example:', {
        x: 50,
        y: 350,
        size: 16,
        font: StandardFonts.HelveticaBold,
        color: ColorUtils.BLACK
      });

      // Multi-column layout simulation
      const col1Text = 'This is the first column of text. It demonstrates how VibePDF can handle complex layouts with multiple columns and proper text flow.';
      const col2Text = 'This is the second column. Notice how the text wraps properly and maintains consistent spacing and alignment throughout the document.';

      page.drawTextBlock(col1Text, {
        x: 50,
        y: 320,
        maxWidth: 200,
        size: 10,
        font: StandardFonts.Helvetica,
        align: 'justify',
        backgroundColor: rgb(0.98, 0.98, 0.98),
        borderColor: rgb(0.8, 0.8, 0.8),
        padding: { top: 8, right: 12, bottom: 8, left: 12 }
      });

      page.drawTextBlock(col2Text, {
        x: 300,
        y: 320,
        maxWidth: 200,
        size: 10,
        font: StandardFonts.Helvetica,
        align: 'justify',
        backgroundColor: rgb(0.98, 0.98, 0.98),
        borderColor: rgb(0.8, 0.8, 0.8),
        padding: { top: 8, right: 12, bottom: 8, left: 12 }
      });

      // Footer
      page.drawText('Generated with VibePDF v1.0.0 - Advanced Features', {
        x: 50,
        y: 50,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
        font: StandardFonts.Helvetica
      });

      const pdfBytes = await doc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setPdfBlob(blob);
      
    } catch (error) {
      console.error('Error generating advanced PDF:', error);
      setError(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateTextDemo = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const doc = await PDFDocument.create({
        title: 'VibePDF Text Features Demo',
        author: 'VibePDF Library',
        subject: 'Text wrapping, alignment, and typography'
      });

      const page = doc.addPage(PageSizes.A4);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      page.addFont(font);

      // Title
      page.drawText('Typography & Text Layout Demo', {
        x: 50,
        y: 750,
        size: 24,
        font: StandardFonts.HelveticaBold,
        color: rgb(0.1, 0.3, 0.8)
      });

      // Left aligned text
      page.drawText('Left Aligned Text:', {
        x: 50,
        y: 700,
        size: 14,
        font: StandardFonts.HelveticaBold,
        color: ColorUtils.BLACK
      });

      const leftText = 'This is a demonstration of left-aligned text with automatic word wrapping. The text will flow naturally from line to line while maintaining proper spacing and readability.';
      
      page.drawText(leftText, {
        x: 50,
        y: 680,
        maxWidth: 200,
        size: 11,
        font: StandardFonts.Helvetica,
        align: 'left',
        lineHeight: 14
      });

      // Center aligned text
      page.drawText('Center Aligned Text:', {
        x: 300,
        y: 700,
        size: 14,
        font: StandardFonts.HelveticaBold,
        color: ColorUtils.BLACK
      });

      const centerText = 'This text is center-aligned and demonstrates how VibePDF handles text alignment with proper word wrapping and spacing.';
      
      page.drawText(centerText, {
        x: 300,
        y: 680,
        maxWidth: 200,
        size: 11,
        font: StandardFonts.Helvetica,
        align: 'center',
        lineHeight: 14
      });

      // Right aligned text
      page.drawText('Right Aligned Text:', {
        x: 50,
        y: 580,
        size: 14,
        font: StandardFonts.HelveticaBold,
        color: ColorUtils.BLACK
      });

      const rightText = 'This text demonstrates right alignment with proper word wrapping and consistent spacing throughout the text block.';
      
      page.drawText(rightText, {
        x: 50,
        y: 560,
        maxWidth: 200,
        size: 11,
        font: StandardFonts.Helvetica,
        align: 'right',
        lineHeight: 14
      });

      // Justified text
      page.drawText('Justified Text:', {
        x: 300,
        y: 580,
        size: 14,
        font: StandardFonts.HelveticaBold,
        color: ColorUtils.BLACK
      });

      const justifiedText = 'This text is justified, meaning it aligns to both left and right margins by adjusting the spacing between words. This creates a clean, professional appearance.';
      
      page.drawText(justifiedText, {
        x: 300,
        y: 560,
        maxWidth: 200,
        size: 11,
        font: StandardFonts.Helvetica,
        align: 'justify',
        lineHeight: 14
      });

      // Text blocks with styling
      page.drawText('Styled Text Blocks:', {
        x: 50,
        y: 450,
        size: 16,
        font: StandardFonts.HelveticaBold,
        color: ColorUtils.BLACK
      });

      // Info box
      page.drawTextBlock('Information Box', {
        x: 50,
        y: 420,
        maxWidth: 150,
        size: 12,
        font: StandardFonts.HelveticaBold,
        color: rgb(0.1, 0.4, 0.7),
        backgroundColor: rgb(0.9, 0.95, 1),
        borderColor: rgb(0.1, 0.4, 0.7),
        borderWidth: 2,
        padding: { top: 10, right: 15, bottom: 10, left: 15 }
      });

      page.drawTextBlock('This is an informational text block with custom styling, background color, and border.', {
        x: 50,
        y: 380,
        maxWidth: 150,
        size: 10,
        font: StandardFonts.Helvetica,
        backgroundColor: rgb(0.98, 0.99, 1),
        borderColor: rgb(0.8, 0.85, 0.9),
        padding: { top: 8, right: 12, bottom: 8, left: 12 }
      });

      // Warning box
      page.drawTextBlock('Warning', {
        x: 250,
        y: 420,
        maxWidth: 150,
        size: 12,
        font: StandardFonts.HelveticaBold,
        color: rgb(0.8, 0.4, 0),
        backgroundColor: rgb(1, 0.95, 0.8),
        borderColor: rgb(0.8, 0.4, 0),
        borderWidth: 2,
        padding: { top: 10, right: 15, bottom: 10, left: 15 }
      });

      page.drawTextBlock('This is a warning text block with orange styling to draw attention to important information.', {
        x: 250,
        y: 380,
        maxWidth: 150,
        size: 10,
        font: StandardFonts.Helvetica,
        backgroundColor: rgb(1, 0.98, 0.9),
        borderColor: rgb(0.9, 0.7, 0.4),
        padding: { top: 8, right: 12, bottom: 8, left: 12 }
      });

      // Error box
      page.drawTextBlock('Error', {
        x: 450,
        y: 420,
        maxWidth: 100,
        size: 12,
        font: StandardFonts.HelveticaBold,
        color: ColorUtils.WHITE,
        backgroundColor: rgb(0.8, 0.1, 0.1),
        padding: { top: 10, right: 15, bottom: 10, left: 15 }
      });

      page.drawTextBlock('Critical error message with red styling.', {
        x: 450,
        y: 380,
        maxWidth: 100,
        size: 10,
        font: StandardFonts.Helvetica,
        backgroundColor: rgb(1, 0.9, 0.9),
        borderColor: rgb(0.8, 0.1, 0.1),
        padding: { top: 8, right: 12, bottom: 8, left: 12 }
      });

      // Different font sizes
      page.drawText('Font Size Variations:', {
        x: 50,
        y: 280,
        size: 16,
        font: StandardFonts.HelveticaBold,
        color: ColorUtils.BLACK
      });

      const sizes = [8, 10, 12, 14, 16, 18, 20, 24];
      sizes.forEach((size, index) => {
        page.drawText(`${size}pt text sample`, {
          x: 50,
          y: 250 - (index * (size + 4)),
          size,
          font: StandardFonts.Helvetica,
          color: rgb(0.2, 0.2, 0.2)
        });
      });

      // Footer
      page.drawText('Generated with VibePDF v1.0.0 - Typography Demo', {
        x: 50,
        y: 50,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
        font: StandardFonts.Helvetica
      });

      const pdfBytes = await doc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setPdfBlob(blob);
      
    } catch (error) {
      console.error('Error generating text demo PDF:', error);
      setError(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generatePDF = useCallback(() => {
    switch (demoType) {
      case 'advanced':
        return generateAdvancedPDF();
      case 'text':
        return generateTextDemo();
      default:
        return generateBasicPDF();
    }
  }, [demoType, generateBasicPDF, generateAdvancedPDF, generateTextDemo]);

  const downloadPDF = useCallback(() => {
    if (!pdfBlob) return;
    
    try {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vibepdf-${demoType}-demo.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setError(`Error downloading PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [pdfBlob, demoType]);

  const openPDFInNewTab = useCallback(() => {
    if (!pdfBlob) return;
    
    try {
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error opening PDF:', error);
      setError(`Error opening PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [pdfBlob]);

  const getDemoDescription = (type: string) => {
    switch (type) {
      case 'basic':
        return 'Text, shapes, lines, and basic graphics';
      case 'advanced':
        return 'Rounded rectangles, ellipses, polygons, transparency';
      case 'text':
        return 'Text wrapping, alignment, styled blocks, typography';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Bolt.new Badge - Top */}
      <div className="flex justify-center py-2 bg-white shadow-sm">
        <a href="https://bolt.new" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-900 transition-colors">
          <span>Built with</span>
          <img src="https://bolt.new/badge.svg" alt="Built with Bolt.new" className="h-4" />
        </a>
      </div>

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
            <div className="flex items-center space-x-4">
              <a 
                href="https://github.com/VibePDF/VibePDF" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <Github className="w-5 h-5" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
              <Link 
                to="/demo" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                View Demo
              </Link>
              <div className="text-right">
                <div className="text-sm text-gray-500">Version 1.0.0</div>
                <div className="text-xs text-gray-400">TypeScript 5.8.3</div>
              </div>
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

          {/* Demo Type Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Demo Type:</h3>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => setDemoType('basic')}
                className={`flex flex-col items-center space-y-2 px-6 py-4 rounded-lg font-medium transition-all duration-200 ${
                  demoType === 'basic'
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:shadow-md'
                }`}
              >
                <FileText className="w-6 h-6" />
                <div className="text-center">
                  <div className="font-semibold">Basic Features</div>
                  <div className="text-xs opacity-75">{getDemoDescription('basic')}</div>
                </div>
              </button>
              <button
                onClick={() => setDemoType('advanced')}
                className={`flex flex-col items-center space-y-2 px-6 py-4 rounded-lg font-medium transition-all duration-200 ${
                  demoType === 'advanced'
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:shadow-md'
                }`}
              >
                <Shapes className="w-6 h-6" />
                <div className="text-center">
                  <div className="font-semibold">Advanced Graphics</div>
                  <div className="text-xs opacity-75">{getDemoDescription('advanced')}</div>
                </div>
              </button>
              <button
                onClick={() => setDemoType('text')}
                className={`flex flex-col items-center space-y-2 px-6 py-4 rounded-lg font-medium transition-all duration-200 ${
                  demoType === 'text'
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:shadow-md'
                }`}
              >
                <Type className="w-6 h-6" />
                <div className="text-center">
                  <div className="font-semibold">Typography</div>
                  <div className="text-xs opacity-75">{getDemoDescription('text')}</div>
                </div>
              </button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={generatePDF}
              disabled={isGenerating}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <FileText className="w-5 h-5" />
              <span>{isGenerating ? 'Generating...' : `Generate ${demoType.charAt(0).toUpperCase() + demoType.slice(1)} Demo`}</span>
            </button>
            
            {pdfBlob && (
              <>
                <button
                  onClick={downloadPDF}
                  className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Download PDF</span>
                </button>
                
                <button
                  onClick={openPDFInNewTab}
                  className="bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span>Open in New Tab</span>
                </button>
              </>
            )}
          </div>

          {/* PDF Preview */}
          {pdfBlob && (
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">PDF Preview</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
                  </button>
                </div>
              </div>
              
              {showPreview && (
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  {pdfDataUrl ? (
                    <iframe
                      ref={iframeRef}
                      src={pdfDataUrl}
                      className="w-full h-96"
                      title="PDF Preview"
                      style={{ 
                        minHeight: '600px',
                        border: 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-96 flex items-center justify-center bg-gray-100">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading PDF preview...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-4 space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm text-green-700 font-medium">
                      PDF generated successfully! 
                    </p>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Content is rendering correctly. The PDF contains all the expected elements and formatting.
                  </p>
                </div>

                {!pdfDataUrl && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <p className="text-sm text-blue-700 font-medium">
                        Browser Security Notice
                      </p>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      If the preview doesn't load, this is due to browser security restrictions. 
                      Use "Open in New Tab" or "Download PDF" to view the generated document.
                    </p>
                  </div>
                )}

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <p className="text-sm text-gray-700 font-medium">
                      Viewing Options
                    </p>
                  </div>
                  <div className="text-xs text-gray-600 mt-1 space-y-1">
                    <p>• <strong>Preview:</strong> View embedded in this page (may have browser limitations)</p>
                    <p>• <strong>New Tab:</strong> Open in a clean browser tab with full PDF viewer controls</p>
                    <p>• <strong>Download:</strong> Save to your device for viewing in any PDF reader</p>
                  </div>
                </div>
              </div>
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
                icon: <Type className="w-8 h-8 text-orange-600" />,
                title: 'Advanced Typography',
                description: 'Font embedding, subsetting, Unicode support, CJK languages, and RTL text handling.'
              },
              {
                icon: <Settings className="w-8 h-8 text-red-600" />,
                title: 'Standards Compliance',
                description: 'Advanced PDF/A, PDF/UA, PDF/X support for accessibility and archiving.'
              },
              {
                icon: <Layout className="w-8 h-8 text-indigo-600" />,
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
  
  // Advanced text with wrapping and alignment
  page.drawText('Hello from VibePDF!', {
    x: 50, y: 750, font, size: 24,
    color: rgb(0.1, 0.3, 0.8),
    maxWidth: 400,
    align: 'center'
  });
  
  // Styled text blocks
  page.drawTextBlock('Information Box', {
    x: 50, y: 650, maxWidth: 200,
    backgroundColor: rgb(0.9, 0.95, 1),
    borderColor: rgb(0.1, 0.3, 0.8),
    padding: { top: 15, right: 20, bottom: 15, left: 20 }
  });
  
  // Advanced shapes
  page.drawRoundedRectangle(
    { x: 300, y: 600, width: 200, height: 100 }, 15,
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
          <div className="flex justify-center space-x-6 mb-4">
            <a 
              href="https://github.com/VibePDF/VibePDF" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              <Github className="w-6 h-6" />
            </a>
          </div>
          <p className="text-gray-600">
            VibePDF v1.0.0 - Enterprise TypeScript PDF Library
          </p>
          <p className="text-gray-400 text-sm mt-2">
            AGPL-3.0 License • Built with TypeScript 5.8.3 • Zero Dependencies
          </p>
          
          {/* Bolt.new Badge - Bottom */}
          <div className="mt-4">
            <a href="https://bolt.new" target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
              <span>Built with</span>
              <img src="https://bolt.new/badge.svg" alt="Built with Bolt.new" className="h-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;