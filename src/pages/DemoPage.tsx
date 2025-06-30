import React, { useState, useCallback, useEffect } from 'react';
import { 
  FileText, 
  Zap, 
  Shield, 
  Download, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Code, 
  Layers, 
  Lock, 
  FileSignature, 
  Search, 
  Printer, 
  Scissors, 
  Merge, 
  Image, 
  Type, 
  Check, 
  X 
} from 'lucide-react';
import { PDFDocument, StandardFonts, rgb, PageSizes, ColorUtils } from '../index.js';

const DemoPage: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<string>('text');
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

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

  // Clear PDF blob when demo changes
  useEffect(() => {
    setPdfBlob(null);
    setPdfDataUrl(null);
    setError(null);
  }, [activeDemo]);

  const generateTextDemo = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const doc = await PDFDocument.create({
        title: 'VibePDF Text Features Demo',
        author: 'VibePDF Library',
        subject: 'Text formatting capabilities'
      });

      const page = doc.addPage(PageSizes.A4);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      page.addFont(font);

      // Title
      page.drawText('VibePDF Text Formatting Demo', {
        x: 50,
        y: 750,
        size: 24,
        color: rgb(0.1, 0.3, 0.8),
        font: StandardFonts.HelveticaBold
      });

      // Subtitle
      page.drawText('Advanced text formatting and layout capabilities', {
        x: 50,
        y: 720,
        size: 14,
        color: rgb(0.3, 0.3, 0.3),
        font: StandardFonts.Helvetica
      });

      // Text alignment examples
      page.drawText('Text Alignment Examples:', {
        x: 50,
        y: 680,
        size: 16,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      const sampleText = 'This is a sample text that demonstrates alignment capabilities in VibePDF. Notice how the text wraps and maintains proper spacing.';

      // Left aligned
      page.drawText('Left Aligned:', {
        x: 50,
        y: 650,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      page.drawText(sampleText, {
        x: 50,
        y: 630,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.Helvetica,
        maxWidth: 200,
        align: 'left'
      });

      // Center aligned
      page.drawText('Center Aligned:', {
        x: 300,
        y: 650,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      page.drawText(sampleText, {
        x: 300,
        y: 630,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.Helvetica,
        maxWidth: 200,
        align: 'center'
      });

      // Right aligned
      page.drawText('Right Aligned:', {
        x: 50,
        y: 550,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      page.drawText(sampleText, {
        x: 50,
        y: 530,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.Helvetica,
        maxWidth: 200,
        align: 'right'
      });

      // Justified
      page.drawText('Justified:', {
        x: 300,
        y: 550,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      page.drawText(sampleText, {
        x: 300,
        y: 530,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.Helvetica,
        maxWidth: 200,
        align: 'justify'
      });

      // Styled text blocks
      page.drawText('Styled Text Blocks:', {
        x: 50,
        y: 450,
        size: 16,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      // Info block
      page.drawTextBlock('Information Block', {
        x: 50,
        y: 420,
        maxWidth: 200,
        size: 12,
        font: StandardFonts.HelveticaBold,
        color: rgb(0.1, 0.4, 0.7),
        backgroundColor: rgb(0.9, 0.95, 1),
        borderColor: rgb(0.1, 0.4, 0.7),
        borderWidth: 2,
        padding: { top: 10, right: 15, bottom: 10, left: 15 }
      });

      // Warning block
      page.drawTextBlock('Warning Block', {
        x: 300,
        y: 420,
        maxWidth: 200,
        size: 12,
        font: StandardFonts.HelveticaBold,
        color: rgb(0.7, 0.4, 0),
        backgroundColor: rgb(1, 0.95, 0.8),
        borderColor: rgb(0.7, 0.4, 0),
        borderWidth: 2,
        padding: { top: 10, right: 15, bottom: 10, left: 15 }
      });

      // Footer
      page.drawText('Generated with VibePDF - Enterprise TypeScript PDF Library', {
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
      console.error('Error generating text demo:', error);
      setError(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateGraphicsDemo = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const doc = await PDFDocument.create({
        title: 'VibePDF Graphics Demo',
        author: 'VibePDF Library',
        subject: 'Vector graphics capabilities'
      });

      const page = doc.addPage(PageSizes.A4);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      page.addFont(font);

      // Title
      page.drawText('VibePDF Graphics Demo', {
        x: 50,
        y: 750,
        size: 24,
        color: rgb(0.1, 0.3, 0.8),
        font: StandardFonts.HelveticaBold
      });

      // Subtitle
      page.drawText('Advanced vector graphics capabilities', {
        x: 50,
        y: 720,
        size: 14,
        color: rgb(0.3, 0.3, 0.3),
        font: StandardFonts.Helvetica
      });

      // Basic shapes
      page.drawText('Basic Shapes:', {
        x: 50,
        y: 680,
        size: 16,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      // Rectangle
      page.drawRectangle(
        { x: 50, y: 600, width: 100, height: 60 },
        { 
          fillColor: rgb(0.9, 0.95, 1),
          strokeColor: rgb(0.1, 0.3, 0.8),
          lineWidth: 2
        }
      );
      page.drawText('Rectangle', {
        x: 75,
        y: 580,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.Helvetica
      });

      // Circle
      page.drawCircle(
        { x: 250, y: 630 },
        30,
        {
          fillColor: rgb(1, 0.8, 0.2),
          strokeColor: rgb(0.8, 0.4, 0),
          lineWidth: 2
        }
      );
      page.drawText('Circle', {
        x: 235,
        y: 580,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.Helvetica
      });

      // Line
      page.drawLine(
        { x: 350, y: 630 },
        { x: 450, y: 630 },
        {
          strokeColor: rgb(0.8, 0.1, 0.1),
          lineWidth: 3,
          lineCap: 'round'
        }
      );
      page.drawText('Line', {
        x: 390,
        y: 580,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.Helvetica
      });

      // Advanced shapes
      page.drawText('Advanced Shapes:', {
        x: 50,
        y: 530,
        size: 16,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      // Rounded rectangle
      page.drawRoundedRectangle(
        { x: 50, y: 450, width: 100, height: 60 },
        10,
        {
          fillColor: rgb(0.9, 0.95, 1),
          strokeColor: rgb(0.1, 0.3, 0.8),
          lineWidth: 2
        }
      );
      page.drawText('Rounded Rectangle', {
        x: 55,
        y: 430,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.Helvetica
      });

      // Ellipse
      page.drawEllipse(
        { x: 250, y: 480 },
        50, 30,
        {
          fillColor: rgb(1, 0.8, 0.2),
          strokeColor: rgb(0.8, 0.4, 0),
          lineWidth: 2
        }
      );
      page.drawText('Ellipse', {
        x: 235,
        y: 430,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.Helvetica
      });

      // Polygon
      page.drawPolygon(
        [
          { x: 350, y: 450 },
          { x: 400, y: 500 },
          { x: 450, y: 450 },
          { x: 400, y: 400 }
        ],
        {
          fillColor: rgb(0.8, 0.1, 0.1),
          strokeColor: rgb(0.6, 0.05, 0.05),
          lineWidth: 2
        }
      );
      page.drawText('Polygon', {
        x: 385,
        y: 430,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.Helvetica
      });

      // Transparency
      page.drawText('Transparency Effects:', {
        x: 50,
        y: 380,
        size: 16,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      // Overlapping circles with transparency
      page.drawCircle(
        { x: 100, y: 320 },
        30,
        {
          fillColor: rgb(1, 0, 0),
          opacity: 0.5
        }
      );
      page.drawCircle(
        { x: 130, y: 320 },
        30,
        {
          fillColor: rgb(0, 1, 0),
          opacity: 0.5
        }
      );
      page.drawCircle(
        { x: 115, y: 290 },
        30,
        {
          fillColor: rgb(0, 0, 1),
          opacity: 0.5
        }
      );
      page.drawText('Overlapping with Transparency', {
        x: 50,
        y: 250,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.Helvetica
      });

      // Footer
      page.drawText('Generated with VibePDF - Enterprise TypeScript PDF Library', {
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
      console.error('Error generating graphics demo:', error);
      setError(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateFormsDemo = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const doc = await PDFDocument.create({
        title: 'VibePDF Forms Demo',
        author: 'VibePDF Library',
        subject: 'Interactive form capabilities'
      });

      const page = doc.addPage(PageSizes.A4);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      page.addFont(font);

      // Title
      page.drawText('VibePDF Interactive Forms Demo', {
        x: 50,
        y: 750,
        size: 24,
        color: rgb(0.1, 0.3, 0.8),
        font: StandardFonts.HelveticaBold
      });

      // Subtitle
      page.drawText('Form field capabilities demonstration', {
        x: 50,
        y: 720,
        size: 14,
        color: rgb(0.3, 0.3, 0.3),
        font: StandardFonts.Helvetica
      });

      // Form fields would be added here in a real implementation
      // For this demo, we'll just show placeholders

      // Text field
      page.drawRectangle(
        { x: 50, y: 650, width: 200, height: 30 },
        { 
          strokeColor: rgb(0.5, 0.5, 0.5),
          lineWidth: 1
        }
      );
      page.drawText('Text Field', {
        x: 50,
        y: 690,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      // Checkbox
      page.drawRectangle(
        { x: 50, y: 580, width: 20, height: 20 },
        { 
          strokeColor: rgb(0.5, 0.5, 0.5),
          lineWidth: 1
        }
      );
      page.drawText('Checkbox', {
        x: 80,
        y: 585,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.Helvetica
      });

      // Radio buttons
      page.drawCircle(
        { x: 60, y: 540 },
        10,
        { 
          strokeColor: rgb(0.5, 0.5, 0.5),
          lineWidth: 1
        }
      );
      page.drawText('Radio Button Option 1', {
        x: 80,
        y: 545,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.Helvetica
      });

      page.drawCircle(
        { x: 60, y: 510 },
        10,
        { 
          strokeColor: rgb(0.5, 0.5, 0.5),
          lineWidth: 1
        }
      );
      page.drawText('Radio Button Option 2', {
        x: 80,
        y: 515,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.Helvetica
      });

      // Dropdown
      page.drawRectangle(
        { x: 50, y: 450, width: 200, height: 30 },
        { 
          strokeColor: rgb(0.5, 0.5, 0.5),
          lineWidth: 1
        }
      );
      page.drawText('Dropdown Field', {
        x: 50,
        y: 490,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      // Signature field
      page.drawRectangle(
        { x: 50, y: 350, width: 200, height: 60 },
        { 
          strokeColor: rgb(0.5, 0.5, 0.5),
          lineWidth: 1
        }
      );
      page.drawText('Signature Field', {
        x: 50,
        y: 420,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      // Form submission button
      page.drawRectangle(
        { x: 50, y: 250, width: 120, height: 40 },
        { 
          fillColor: rgb(0.1, 0.3, 0.8),
          borderWidth: 0
        }
      );
      page.drawText('Submit Form', {
        x: 70,
        y: 270,
        size: 14,
        color: ColorUtils.WHITE,
        font: StandardFonts.HelveticaBold
      });

      // Note about interactive forms
      page.drawTextBlock(
        'Note: This is a visual representation of form fields. In a real implementation, these would be interactive AcroForm fields that users could fill out.',
        {
          x: 50,
          y: 200,
          maxWidth: 500,
          size: 10,
          font: StandardFonts.Helvetica,
          color: rgb(0.5, 0.5, 0.5),
          backgroundColor: rgb(0.95, 0.95, 0.95),
          padding: { top: 10, right: 10, bottom: 10, left: 10 }
        }
      );

      // Footer
      page.drawText('Generated with VibePDF - Enterprise TypeScript PDF Library', {
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
      console.error('Error generating forms demo:', error);
      setError(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateSecurityDemo = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const doc = await PDFDocument.create({
        title: 'VibePDF Security Features Demo',
        author: 'VibePDF Library',
        subject: 'Security and encryption capabilities'
      });

      const page = doc.addPage(PageSizes.A4);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      page.addFont(font);

      // Title
      page.drawText('VibePDF Security Features', {
        x: 50,
        y: 750,
        size: 24,
        color: rgb(0.1, 0.3, 0.8),
        font: StandardFonts.HelveticaBold
      });

      // Subtitle
      page.drawText('Enterprise-grade security and encryption', {
        x: 50,
        y: 720,
        size: 14,
        color: rgb(0.3, 0.3, 0.3),
        font: StandardFonts.Helvetica
      });

      // Security features
      page.drawText('Available Security Features:', {
        x: 50,
        y: 680,
        size: 16,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      const features = [
        'AES-256 encryption for document content',
        'Password protection with owner and user passwords',
        'Permission controls for printing, editing, copying',
        'Digital signatures with certificate validation',
        'Signature verification and timestamp support',
        'Redaction capabilities for sensitive content',
        'Watermarking for document tracking',
        'Compliance with security standards'
      ];

      features.forEach((feature, index) => {
        page.drawText(`• ${feature}`, {
          x: 70,
          y: 650 - (index * 25),
          size: 12,
          color: rgb(0.2, 0.2, 0.2),
          font: StandardFonts.Helvetica
        });
      });

      // Security levels
      page.drawText('Security Levels:', {
        x: 50,
        y: 450,
        size: 16,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      // Basic security
      page.drawRectangle(
        { x: 50, y: 370, width: 150, height: 60 },
        { 
          fillColor: rgb(0.95, 0.95, 1),
          strokeColor: rgb(0.7, 0.7, 0.9),
          lineWidth: 1
        }
      );
      page.drawText('Basic Security', {
        x: 75,
        y: 410,
        size: 14,
        color: rgb(0.3, 0.3, 0.7),
        font: StandardFonts.HelveticaBold
      });
      page.drawText('Password protection', {
        x: 65,
        y: 390,
        size: 10,
        color: rgb(0.3, 0.3, 0.7),
        font: StandardFonts.Helvetica
      });

      // Advanced security
      page.drawRectangle(
        { x: 220, y: 370, width: 150, height: 60 },
        { 
          fillColor: rgb(0.9, 0.95, 0.9),
          strokeColor: rgb(0.5, 0.8, 0.5),
          lineWidth: 1
        }
      );
      page.drawText('Advanced Security', {
        x: 235,
        y: 410,
        size: 14,
        color: rgb(0.2, 0.6, 0.2),
        font: StandardFonts.HelveticaBold
      });
      page.drawText('AES-256 + Permissions', {
        x: 235,
        y: 390,
        size: 10,
        color: rgb(0.2, 0.6, 0.2),
        font: StandardFonts.Helvetica
      });

      // Enterprise security
      page.drawRectangle(
        { x: 390, y: 370, width: 150, height: 60 },
        { 
          fillColor: rgb(1, 0.95, 0.9),
          strokeColor: rgb(0.8, 0.6, 0.2),
          lineWidth: 1
        }
      );
      page.drawText('Enterprise Security', {
        x: 405,
        y: 410,
        size: 14,
        color: rgb(0.7, 0.5, 0.1),
        font: StandardFonts.HelveticaBold
      });
      page.drawText('Digital Signatures + PKI', {
        x: 405,
        y: 390,
        size: 10,
        color: rgb(0.7, 0.5, 0.1),
        font: StandardFonts.Helvetica
      });

      // Note about security
      page.drawTextBlock(
        'Note: This document demonstrates the security features available in VibePDF. In a real implementation, these security features would be applied to protect the document content.',
        {
          x: 50,
          y: 320,
          maxWidth: 500,
          size: 10,
          font: StandardFonts.Helvetica,
          color: rgb(0.5, 0.5, 0.5),
          backgroundColor: rgb(0.95, 0.95, 0.95),
          padding: { top: 10, right: 10, bottom: 10, left: 10 }
        }
      );

      // Footer
      page.drawText('Generated with VibePDF - Enterprise TypeScript PDF Library', {
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
      console.error('Error generating security demo:', error);
      setError(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateDemo = useCallback(() => {
    switch (activeDemo) {
      case 'text':
        return generateTextDemo();
      case 'graphics':
        return generateGraphicsDemo();
      case 'forms':
        return generateFormsDemo();
      case 'security':
        return generateSecurityDemo();
      default:
        return generateTextDemo();
    }
  }, [activeDemo, generateTextDemo, generateGraphicsDemo, generateFormsDemo, generateSecurityDemo]);

  const downloadPDF = useCallback(() => {
    if (!pdfBlob) return;
    
    try {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vibepdf-${activeDemo}-demo.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setError(`Error downloading PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [pdfBlob, activeDemo]);

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
                  VibePDF Demo
                </h1>
                <p className="text-gray-600 text-sm">Interactive feature demonstrations</p>
              </div>
            </div>
            <div className="text-right">
              <a href="/" className="text-blue-600 hover:text-blue-800 font-medium">
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="md:flex">
              {/* Sidebar */}
              <div className="md:w-64 bg-gray-50 p-6 border-r border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Feature Demos</h2>
                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveDemo('text')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeDemo === 'text' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Type className="w-5 h-5" />
                    <span>Text Formatting</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveDemo('graphics')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeDemo === 'graphics' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Layers className="w-5 h-5" />
                    <span>Vector Graphics</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveDemo('forms')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeDemo === 'forms' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                    <span>Interactive Forms</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveDemo('security')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeDemo === 'security' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Shield className="w-5 h-5" />
                    <span>Security Features</span>
                  </button>
                </nav>

                <div className="mt-8">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Other Features
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      <span>Document Merging</span>
                    </li>
                    <li className="flex items-center text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      <span>Page Manipulation</span>
                    </li>
                    <li className="flex items-center text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      <span>Digital Signatures</span>
                    </li>
                    <li className="flex items-center text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      <span>Compliance (PDF/A, PDF/UA)</span>
                    </li>
                    <li className="flex items-center text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      <span>Annotations & Comments</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Main content */}
              <div className="p-6 md:flex-1">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {activeDemo === 'text' && 'Text Formatting Demo'}
                    {activeDemo === 'graphics' && 'Vector Graphics Demo'}
                    {activeDemo === 'forms' && 'Interactive Forms Demo'}
                    {activeDemo === 'security' && 'Security Features Demo'}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {activeDemo === 'text' && 'Demonstrate advanced text formatting, alignment, and styling capabilities.'}
                    {activeDemo === 'graphics' && 'Showcase vector graphics, shapes, and visual effects.'}
                    {activeDemo === 'forms' && 'Explore interactive form fields and data collection.'}
                    {activeDemo === 'security' && 'Highlight encryption, permissions, and digital signatures.'}
                  </p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-4 mb-8">
                  <button
                    onClick={generateDemo}
                    disabled={isGenerating}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <FileText className="w-5 h-5" />
                    <span>{isGenerating ? 'Generating...' : 'Generate Demo PDF'}</span>
                  </button>

                  {pdfBlob && (
                    <>
                      <button
                        onClick={downloadPDF}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md flex items-center space-x-2"
                      >
                        <Download className="w-5 h-5" />
                        <span>Download PDF</span>
                      </button>
                      
                      <button
                        onClick={openPDFInNewTab}
                        className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-md flex items-center space-x-2"
                      >
                        <ExternalLink className="w-5 h-5" />
                        <span>Open in New Tab</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Feature description */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Feature Highlights</h3>
                  
                  {activeDemo === 'text' && (
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                        <span>Multiple text alignment options: left, center, right, justify</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                        <span>Automatic text wrapping with configurable line height</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                        <span>Styled text blocks with background, borders, and padding</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                        <span>Font embedding and subsetting for consistent rendering</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                        <span>Support for Unicode, CJK, and RTL text</span>
                      </li>
                    </ul>
                  )}

                  {activeDemo === 'graphics' && (
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                        <span>Basic shapes: rectangles, circles, lines with styling</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                        <span>Advanced shapes: rounded rectangles, ellipses, polygons</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                        <span>Transparency and blending effects</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                        <span>Line styling with caps, joins, and dash patterns</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                        <span>Complex vector graphics and paths</span>
                      </li>
                    </ul>
                  )}

                  {activeDemo === 'forms' && (
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                        <span>Text fields with validation and formatting</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                        <span>Checkboxes and radio buttons for selections</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                        <span>Dropdown menus and list boxes</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                        <span>Signature fields for digital signing</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                        <span>Form data extraction and submission</span>
                      </li>
                    </ul>
                  )}

                  {activeDemo === 'security' && (
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                        <span>AES-256 encryption for document content</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                        <span>Password protection with user and owner passwords</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                        <span>Permission controls for printing, editing, copying</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                        <span>Digital signatures with certificate validation</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                        <span>Redaction capabilities for sensitive content</span>
                      </li>
                    </ul>
                  )}
                </div>

                {/* PDF Preview */}
                {pdfBlob && (
                  <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">PDF Preview</h3>
                      <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
                      >
                        {showPreview ? (
                          <>
                            <EyeOff className="w-4 h-4" />
                            <span>Hide Preview</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            <span>Show Preview</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    {showPreview && (
                      <div className="bg-gray-100">
                        {pdfDataUrl ? (
                          <iframe
                            src={pdfDataUrl}
                            className="w-full"
                            style={{ height: '600px', border: 'none' }}
                            title="PDF Preview"
                          />
                        ) : (
                          <div className="h-96 flex items-center justify-center">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                              <p className="text-gray-600">Loading PDF preview...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Code Example */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Code Example</h3>
                  
                  <div className="bg-gray-800 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-green-400 text-sm">
                      {activeDemo === 'text' && (
                        <code>{`// Text formatting example
import { PDFDocument, StandardFonts, rgb } from 'vibepdf';

const doc = await PDFDocument.create();
const page = doc.addPage();
const font = await doc.embedFont(StandardFonts.Helvetica);

// Text with alignment
page.drawText('Centered text example', {
  x: 250,
  y: 700,
  size: 16,
  font: StandardFonts.HelveticaBold,
  color: rgb(0.1, 0.3, 0.8),
  align: 'center',
  maxWidth: 400
});

// Styled text block
page.drawTextBlock('This is a styled text block with background, border and padding.', {
  x: 100,
  y: 600,
  maxWidth: 300,
  size: 12,
  font: StandardFonts.Helvetica,
  color: rgb(0.2, 0.2, 0.2),
  backgroundColor: rgb(0.95, 0.95, 1),
  borderColor: rgb(0.7, 0.7, 0.9),
  padding: { top: 10, right: 15, bottom: 10, left: 15 }
});`}</code>
                      )}
                      
                      {activeDemo === 'graphics' && (
                        <code>{`// Vector graphics example
import { PDFDocument, rgb } from 'vibepdf';

const doc = await PDFDocument.create();
const page = doc.addPage();

// Draw rectangle
page.drawRectangle(
  { x: 100, y: 600, width: 200, height: 100 },
  { 
    fillColor: rgb(0.9, 0.95, 1),
    strokeColor: rgb(0.1, 0.3, 0.8),
    lineWidth: 2
  }
);

// Draw circle
page.drawCircle(
  { x: 300, y: 500 },
  50,
  {
    fillColor: rgb(1, 0.8, 0.2),
    strokeColor: rgb(0.8, 0.4, 0),
    lineWidth: 3
  }
);

// Draw polygon
page.drawPolygon(
  [
    { x: 400, y: 600 },
    { x: 450, y: 650 },
    { x: 500, y: 600 },
    { x: 450, y: 550 }
  ],
  {
    fillColor: rgb(0.8, 0.2, 0.2),
    strokeColor: rgb(0.6, 0.1, 0.1),
    lineWidth: 2
  }
);`}</code>
                      )}
                      
                      {activeDemo === 'forms' && (
                        <code>{`// Interactive forms example
import { PDFDocument, StandardFonts } from 'vibepdf';

const doc = await PDFDocument.create();
const page = doc.addPage();

// Create form
const form = doc.getForm();

// Add text field
const nameField = form.createTextField('name');
nameField.setText('');
nameField.addToPage(page, {
  x: 100,
  y: 700,
  width: 300,
  height: 30
});

// Add checkbox
const agreeCheckbox = form.createCheckBox('agree');
agreeCheckbox.addToPage(page, {
  x: 100,
  y: 650,
  size: 20
});

// Add radio group
const radioGroup = form.createRadioGroup('options');
radioGroup.addOptionToPage('option1', page, {
  x: 100,
  y: 600,
  size: 20
});
radioGroup.addOptionToPage('option2', page, {
  x: 100,
  y: 550,
  size: 20
});

// Add dropdown
const dropdown = form.createDropdown('country');
dropdown.addOptions(['USA', 'Canada', 'UK', 'Australia']);
dropdown.addToPage(page, {
  x: 100,
  y: 500,
  width: 200,
  height: 30
});`}</code>
                      )}
                      
                      {activeDemo === 'security' && (
                        <code>{`// Security features example
import { PDFDocument } from 'vibepdf';

// Create encrypted document
const doc = await PDFDocument.create();
const page = doc.addPage();

// Add content to the document
// ...

// Apply encryption
await doc.encrypt({
  userPassword: 'user123',
  ownerPassword: 'owner456',
  permissions: {
    printing: true,
    modifying: false,
    copying: false,
    annotating: true,
    fillingForms: true,
    contentAccessibility: true,
    documentAssembly: false
  },
  encryptionAlgorithm: 'aes-256'
});

// For digital signatures
const signatureField = form.createSignatureField('signature');
signatureField.addToPage(page, {
  x: 100,
  y: 200,
  width: 300,
  height: 150
});

// Sign the document
await doc.sign({
  signatureField: 'signature',
  certificate: myCertificate,
  privateKey: myPrivateKey,
  reason: 'I approve this document',
  location: 'San Francisco, CA',
  contactInfo: 'john@example.com'
});`}</code>
                      )}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Comparison */}
          <div className="mt-12 bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">VibePDF vs. Competitors</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature</th>
                      <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">VibePDF</th>
                      <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">pdf-lib</th>
                      <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">pdf.js</th>
                      <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">iText</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">PDF Creation</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">PDF Rendering</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Digital Signatures</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">AES-256 Encryption</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">PDF/A Compliance</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">TypeScript Native</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Zero Dependencies</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-center"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto text-center">
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
};

export default DemoPage;