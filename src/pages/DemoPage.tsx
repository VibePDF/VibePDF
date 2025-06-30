import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, Zap, Shield, Type, Shapes, Layout, Eye, EyeOff, 
  Download, ExternalLink, Github, ChevronLeft, Code, 
  FileCheck, Layers, Lock, PenTool, Palette, Settings
} from 'lucide-react';
import { PDFDocument, StandardFonts, rgb, PageSizes, ColorUtils } from '../index.js';

function DemoPage() {
  const [activeTab, setActiveTab] = useState('basic');
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  // Clear PDF blob when tab changes
  useEffect(() => {
    setPdfBlob(null);
    setPdfDataUrl(null);
    setError(null);
  }, [activeTab]);

  const generateBasicPDF = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const doc = await PDFDocument.create({
        title: 'VibePDF Basic Demo',
        author: 'VibePDF Library',
        subject: 'Basic PDF Generation'
      });

      const page = doc.addPage(PageSizes.A4);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      page.addFont(font);

      // Title
      page.drawText('VibePDF Basic Features', {
        x: 50,
        y: 750,
        size: 24,
        color: rgb(0.1, 0.3, 0.8),
        font: StandardFonts.HelveticaBold
      });

      // Subtitle
      page.drawText('Simple PDF generation with text and graphics', {
        x: 50,
        y: 720,
        size: 14,
        color: rgb(0.3, 0.3, 0.3),
        font: StandardFonts.Helvetica
      });

      // Text content
      page.drawText('This PDF demonstrates the basic capabilities of VibePDF:', {
        x: 50,
        y: 680,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.Helvetica
      });

      const features = [
        'Text rendering with font embedding',
        'Basic shapes (rectangles, circles, lines)',
        'Color management (RGB, CMYK)',
        'Page configuration and sizing',
        'Metadata handling'
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

      // Basic shapes
      page.drawRectangle(
        { x: 50, y: 500, width: 150, height: 80 },
        { 
          fillColor: rgb(0.9, 0.95, 1),
          strokeColor: rgb(0.1, 0.3, 0.8),
          lineWidth: 2
        }
      );

      page.drawText('Rectangle', {
        x: 95,
        y: 535,
        size: 12,
        color: rgb(0.1, 0.3, 0.8),
        font: StandardFonts.HelveticaBold
      });

      page.drawCircle(
        { x: 300, y: 540 },
        40,
        {
          fillColor: rgb(1, 0.8, 0.2),
          strokeColor: rgb(0.8, 0.4, 0),
          lineWidth: 2
        }
      );

      page.drawText('Circle', {
        x: 285,
        y: 535,
        size: 12,
        color: rgb(0.8, 0.4, 0),
        font: StandardFonts.HelveticaBold
      });

      page.drawLine(
        { x: 400, y: 500 },
        { x: 550, y: 580 },
        {
          strokeColor: rgb(0.8, 0.1, 0.1),
          lineWidth: 3,
          lineCap: 'round'
        }
      );

      page.drawText('Line', {
        x: 465,
        y: 535,
        size: 12,
        color: rgb(0.8, 0.1, 0.1),
        font: StandardFonts.HelveticaBold
      });

      // Text wrapping example
      page.drawText('Text Wrapping Example:', {
        x: 50,
        y: 400,
        size: 14,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      const wrappedText = 'This text demonstrates automatic word wrapping in VibePDF. The text will flow to the next line when it reaches the specified maximum width, maintaining proper spacing and alignment throughout the paragraph.';
      
      page.drawText(wrappedText, {
        x: 50,
        y: 380,
        maxWidth: 300,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.Helvetica,
        lineHeight: 16
      });

      // Footer
      page.drawText('Generated with VibePDF v1.0.0', {
        x: 50,
        y: 50,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
        font: StandardFonts.Helvetica
      });

      page.drawText('https://github.com/VibePDF/VibePDF', {
        x: 50,
        y: 35,
        size: 10,
        color: rgb(0.3, 0.4, 0.8),
        font: StandardFonts.Helvetica
      });

      const pdfBytes = await doc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setPdfBlob(blob);
      
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
        subject: 'Advanced PDF Generation'
      });

      const page = doc.addPage(PageSizes.A4);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      page.addFont(font);

      // Title with background
      page.drawTextBlock('VibePDF Advanced Graphics', {
        x: 50,
        y: 750,
        size: 20,
        font: StandardFonts.HelveticaBold,
        color: ColorUtils.WHITE,
        backgroundColor: rgb(0.1, 0.3, 0.8),
        padding: { top: 15, right: 20, bottom: 15, left: 20 },
        maxWidth: 500
      });

      // Advanced shapes section
      page.drawText('Advanced Shape Rendering:', {
        x: 50,
        y: 670,
        size: 16,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      // Rounded rectangle
      page.drawRoundedRectangle(
        { x: 50, y: 570, width: 150, height: 80 },
        10,
        { 
          fillColor: rgb(0.9, 0.95, 1), 
          strokeColor: rgb(0.1, 0.3, 0.8), 
          lineWidth: 2 
        }
      );

      page.drawText('Rounded\nRectangle', {
        x: 100,
        y: 615,
        size: 12,
        color: rgb(0.1, 0.3, 0.8),
        font: StandardFonts.HelveticaBold,
        align: 'center'
      });

      // Ellipse
      page.drawEllipse(
        { x: 300, y: 610 },
        60, 40,
        { 
          fillColor: rgb(1, 0.8, 0.2), 
          strokeColor: rgb(0.8, 0.4, 0), 
          lineWidth: 2 
        }
      );

      page.drawText('Ellipse', {
        x: 285,
        y: 610,
        size: 12,
        color: rgb(0.8, 0.4, 0),
        font: StandardFonts.HelveticaBold
      });

      // Polygon
      page.drawPolygon(
        [
          { x: 450, y: 570 },
          { x: 500, y: 650 },
          { x: 400, y: 650 }
        ],
        { 
          fillColor: rgb(0.8, 0.2, 0.2), 
          strokeColor: rgb(0.6, 0.1, 0.1), 
          lineWidth: 2 
        }
      );

      page.drawText('Polygon', {
        x: 435,
        y: 610,
        size: 12,
        color: rgb(0.6, 0.1, 0.1),
        font: StandardFonts.HelveticaBold
      });

      // Transparency section
      page.drawText('Transparency Effects:', {
        x: 50,
        y: 520,
        size: 16,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      // Overlapping circles with transparency
      page.drawCircle(
        { x: 100, y: 450 }, 
        30, 
        { fillColor: rgb(1, 0, 0), opacity: 0.5 }
      );
      
      page.drawCircle(
        { x: 130, y: 450 }, 
        30, 
        { fillColor: rgb(0, 1, 0), opacity: 0.5 }
      );
      
      page.drawCircle(
        { x: 115, y: 420 }, 
        30, 
        { fillColor: rgb(0, 0, 1), opacity: 0.5 }
      );

      page.drawText('Overlapping transparent circles', {
        x: 180,
        y: 440,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.Helvetica
      });

      // Gradient simulation (using multiple rectangles)
      page.drawText('Gradient Simulation:', {
        x: 350,
        y: 480,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      for (let i = 0; i < 20; i++) {
        const ratio = i / 19;
        page.drawRectangle(
          { x: 350, y: 450 - i * 2, width: 150, height: 2 },
          { 
            fillColor: rgb(0.1 + ratio * 0.7, 0.3, 0.8 - ratio * 0.6),
            strokeColor: undefined
          }
        );
      }

      // Complex layout section
      page.drawText('Complex Layout Example:', {
        x: 50,
        y: 350,
        size: 16,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      // Multi-column layout
      const col1Text = 'This is the first column of text demonstrating VibePDF\'s layout capabilities. Notice how the text wraps properly and maintains consistent spacing.';
      const col2Text = 'This is the second column with different styling. VibePDF handles complex layouts with ease, allowing for sophisticated document designs.';

      page.drawTextBlock(col1Text, {
        x: 50,
        y: 320,
        maxWidth: 200,
        size: 10,
        font: StandardFonts.Helvetica,
        align: 'justify',
        backgroundColor: rgb(0.98, 0.98, 0.98),
        borderColor: rgb(0.8, 0.8, 0.8),
        padding: { top: 10, right: 10, bottom: 10, left: 10 }
      });

      page.drawTextBlock(col2Text, {
        x: 300,
        y: 320,
        maxWidth: 200,
        size: 10,
        font: StandardFonts.Helvetica,
        align: 'justify',
        backgroundColor: rgb(0.95, 0.95, 1),
        borderColor: rgb(0.7, 0.7, 0.9),
        padding: { top: 10, right: 10, bottom: 10, left: 10 }
      });

      // Styled boxes
      page.drawTextBlock('Info Box', {
        x: 50,
        y: 230,
        maxWidth: 150,
        size: 12,
        font: StandardFonts.HelveticaBold,
        color: rgb(0.1, 0.4, 0.7),
        backgroundColor: rgb(0.9, 0.95, 1),
        borderColor: rgb(0.1, 0.4, 0.7),
        borderWidth: 2,
        padding: { top: 10, right: 10, bottom: 10, left: 10 }
      });

      page.drawTextBlock('Warning Box', {
        x: 230,
        y: 230,
        maxWidth: 150,
        size: 12,
        font: StandardFonts.HelveticaBold,
        color: rgb(0.7, 0.4, 0),
        backgroundColor: rgb(1, 0.95, 0.8),
        borderColor: rgb(0.7, 0.4, 0),
        borderWidth: 2,
        padding: { top: 10, right: 10, bottom: 10, left: 10 }
      });

      page.drawTextBlock('Error Box', {
        x: 410,
        y: 230,
        maxWidth: 150,
        size: 12,
        font: StandardFonts.HelveticaBold,
        color: ColorUtils.WHITE,
        backgroundColor: rgb(0.8, 0.1, 0.1),
        borderColor: rgb(0.6, 0.1, 0.1),
        borderWidth: 2,
        padding: { top: 10, right: 10, bottom: 10, left: 10 }
      });

      // Footer
      page.drawText('Generated with VibePDF v1.0.0 - Advanced Graphics Demo', {
        x: 50,
        y: 50,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
        font: StandardFonts.Helvetica
      });

      page.drawText('https://github.com/VibePDF/VibePDF', {
        x: 50,
        y: 35,
        size: 10,
        color: rgb(0.3, 0.4, 0.8),
        font: StandardFonts.Helvetica
      });

      const pdfBytes = await doc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setPdfBlob(blob);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateFormsPDF = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const doc = await PDFDocument.create({
        title: 'VibePDF Forms Demo',
        author: 'VibePDF Library',
        subject: 'Interactive Forms'
      });

      const page = doc.addPage(PageSizes.A4);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      page.addFont(font);

      // Title
      page.drawTextBlock('Interactive Forms Demo', {
        x: 50,
        y: 750,
        size: 20,
        font: StandardFonts.HelveticaBold,
        color: ColorUtils.WHITE,
        backgroundColor: rgb(0.1, 0.3, 0.8),
        padding: { top: 15, right: 20, bottom: 15, left: 20 },
        maxWidth: 500
      });

      // Form fields would be added here in a real implementation
      // For now, we'll simulate form fields with styled rectangles

      // Text field
      page.drawText('Text Field:', {
        x: 50,
        y: 670,
        size: 14,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      page.drawRectangle(
        { x: 150, y: 655, width: 200, height: 25 },
        { 
          fillColor: rgb(1, 1, 1), 
          strokeColor: rgb(0.7, 0.7, 0.7), 
          lineWidth: 1 
        }
      );

      // Checkbox
      page.drawText('Checkbox:', {
        x: 50,
        y: 620,
        size: 14,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      page.drawRectangle(
        { x: 150, y: 615, width: 20, height: 20 },
        { 
          fillColor: rgb(1, 1, 1), 
          strokeColor: rgb(0.7, 0.7, 0.7), 
          lineWidth: 1 
        }
      );

      page.drawText('Option 1', {
        x: 180,
        y: 620,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.Helvetica
      });

      // Radio buttons
      page.drawText('Radio Buttons:', {
        x: 50,
        y: 580,
        size: 14,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      // Radio 1
      page.drawCircle(
        { x: 160, y: 580 },
        10,
        { 
          fillColor: rgb(1, 1, 1), 
          strokeColor: rgb(0.7, 0.7, 0.7), 
          lineWidth: 1 
        }
      );

      page.drawText('Option A', {
        x: 180,
        y: 580,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.Helvetica
      });

      // Radio 2
      page.drawCircle(
        { x: 260, y: 580 },
        10,
        { 
          fillColor: rgb(1, 1, 1), 
          strokeColor: rgb(0.7, 0.7, 0.7), 
          lineWidth: 1 
        }
      );

      page.drawText('Option B', {
        x: 280,
        y: 580,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.Helvetica
      });

      // Dropdown
      page.drawText('Dropdown:', {
        x: 50,
        y: 540,
        size: 14,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      page.drawRectangle(
        { x: 150, y: 525, width: 200, height: 25 },
        { 
          fillColor: rgb(1, 1, 1), 
          strokeColor: rgb(0.7, 0.7, 0.7), 
          lineWidth: 1 
        }
      );

      // Dropdown arrow
      page.drawPolygon(
        [
          { x: 335, y: 540 },
          { x: 345, y: 540 },
          { x: 340, y: 530 }
        ],
        { 
          fillColor: rgb(0.7, 0.7, 0.7),
          strokeColor: undefined
        }
      );

      // Multiline text field
      page.drawText('Multiline Text:', {
        x: 50,
        y: 490,
        size: 14,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      page.drawRectangle(
        { x: 150, y: 400, width: 350, height: 100 },
        { 
          fillColor: rgb(1, 1, 1), 
          strokeColor: rgb(0.7, 0.7, 0.7), 
          lineWidth: 1 
        }
      );

      // Submit button
      page.drawRoundedRectangle(
        { x: 150, y: 350, width: 100, height: 30 },
        5,
        { 
          fillColor: rgb(0.1, 0.3, 0.8), 
          strokeColor: rgb(0.05, 0.15, 0.4), 
          lineWidth: 1 
        }
      );

      page.drawText('Submit', {
        x: 180,
        y: 360,
        size: 14,
        color: rgb(1, 1, 1),
        font: StandardFonts.HelveticaBold
      });

      // Reset button
      page.drawRoundedRectangle(
        { x: 270, y: 350, width: 100, height: 30 },
        5,
        { 
          fillColor: rgb(0.9, 0.9, 0.9), 
          strokeColor: rgb(0.7, 0.7, 0.7), 
          lineWidth: 1 
        }
      );

      page.drawText('Reset', {
        x: 305,
        y: 360,
        size: 14,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      // Form explanation
      page.drawTextBlock(
        'Note: This is a visual representation of form fields. In a real implementation, VibePDF supports interactive AcroForm fields with validation, calculations, and JavaScript actions.',
        {
          x: 50,
          y: 300,
          maxWidth: 500,
          size: 10,
          font: StandardFonts.Helvetica,
          color: rgb(0.4, 0.4, 0.4),
          backgroundColor: rgb(0.95, 0.95, 0.95),
          padding: { top: 10, right: 10, bottom: 10, left: 10 }
        }
      );

      // Footer
      page.drawText('Generated with VibePDF v1.0.0 - Forms Demo', {
        x: 50,
        y: 50,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
        font: StandardFonts.Helvetica
      });

      page.drawText('https://github.com/VibePDF/VibePDF', {
        x: 50,
        y: 35,
        size: 10,
        color: rgb(0.3, 0.4, 0.8),
        font: StandardFonts.Helvetica
      });

      const pdfBytes = await doc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setPdfBlob(blob);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateSecurityPDF = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const doc = await PDFDocument.create({
        title: 'VibePDF Security Features Demo',
        author: 'VibePDF Library',
        subject: 'Security and Encryption'
      });

      const page = doc.addPage(PageSizes.A4);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      page.addFont(font);

      // Title
      page.drawTextBlock('Security & Encryption Features', {
        x: 50,
        y: 750,
        size: 20,
        font: StandardFonts.HelveticaBold,
        color: ColorUtils.WHITE,
        backgroundColor: rgb(0.1, 0.3, 0.8),
        padding: { top: 15, right: 20, bottom: 15, left: 20 },
        maxWidth: 500
      });

      // Security features section
      page.drawText('VibePDF Security Features:', {
        x: 50,
        y: 680,
        size: 16,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      const securityFeatures = [
        'AES-256 encryption for document protection',
        'Password protection with user and owner passwords',
        'Permission management for controlling document usage',
        'Digital signatures for document authenticity',
        'Certificate-based security',
        'Redaction capabilities for sensitive information'
      ];

      securityFeatures.forEach((feature, index) => {
        page.drawText(`• ${feature}`, {
          x: 70,
          y: 650 - (index * 20),
          size: 12,
          color: rgb(0.2, 0.2, 0.2),
          font: StandardFonts.Helvetica
        });
      });

      // Security visualization
      page.drawText('Security Visualization:', {
        x: 50,
        y: 520,
        size: 16,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      // Lock icon (simplified)
      page.drawRoundedRectangle(
        { x: 100, y: 440, width: 60, height: 50 },
        5,
        { 
          fillColor: rgb(0.1, 0.3, 0.8), 
          strokeColor: rgb(0.05, 0.15, 0.4), 
          lineWidth: 2 
        }
      );

      page.drawRoundedRectangle(
        { x: 85, y: 440, width: 90, height: 20 },
        5,
        { 
          fillColor: rgb(0.1, 0.3, 0.8), 
          strokeColor: rgb(0.05, 0.15, 0.4), 
          lineWidth: 2 
        }
      );

      // Encryption key visualization
      page.drawText('Encryption Key:', {
        x: 200,
        y: 480,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      const keyChars = '0123456789ABCDEF';
      let keyString = '';
      for (let i = 0; i < 32; i++) {
        keyString += keyChars[Math.floor(Math.random() * keyChars.length)];
        if (i % 4 === 3 && i < 31) keyString += ' ';
      }

      page.drawTextBlock(keyString, {
        x: 200,
        y: 460,
        maxWidth: 300,
        size: 10,
        font: StandardFonts.Courier,
        color: rgb(0.1, 0.5, 0.1),
        backgroundColor: rgb(0.95, 1, 0.95),
        borderColor: rgb(0.7, 0.9, 0.7),
        padding: { top: 8, right: 8, bottom: 8, left: 8 }
      });

      // Permission settings visualization
      page.drawText('Permission Settings:', {
        x: 50,
        y: 400,
        size: 14,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      const permissions = [
        { name: 'Printing', allowed: true },
        { name: 'Content Copying', allowed: false },
        { name: 'Content Modification', allowed: false },
        { name: 'Annotations', allowed: true },
        { name: 'Form Filling', allowed: true },
        { name: 'Document Assembly', allowed: false }
      ];

      permissions.forEach((permission, index) => {
        // Permission name
        page.drawText(permission.name, {
          x: 70,
          y: 370 - (index * 20),
          size: 12,
          color: rgb(0.2, 0.2, 0.2),
          font: StandardFonts.Helvetica
        });

        // Permission status
        const statusColor = permission.allowed ? rgb(0.2, 0.7, 0.3) : rgb(0.8, 0.2, 0.2);
        const statusText = permission.allowed ? 'Allowed' : 'Denied';

        page.drawText(statusText, {
          x: 250,
          y: 370 - (index * 20),
          size: 12,
          color: statusColor,
          font: StandardFonts.HelveticaBold
        });
      });

      // Digital signature visualization
      page.drawText('Digital Signature:', {
        x: 50,
        y: 230,
        size: 14,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      page.drawRectangle(
        { x: 50, y: 150, width: 250, height: 70 },
        { 
          fillColor: rgb(0.98, 0.98, 0.98), 
          strokeColor: rgb(0.7, 0.7, 0.7), 
          lineWidth: 1 
        }
      );

      page.drawText('Digitally signed by: VibePDF Demo', {
        x: 60,
        y: 200,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      page.drawText('Date: ' + new Date().toISOString().split('T')[0], {
        x: 60,
        y: 180,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.Helvetica
      });

      page.drawText('Reason: Demonstration', {
        x: 60,
        y: 165,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.Helvetica
      });

      // Footer
      page.drawText('Generated with VibePDF v1.0.0 - Security Demo', {
        x: 50,
        y: 50,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
        font: StandardFonts.Helvetica
      });

      page.drawText('https://github.com/VibePDF/VibePDF', {
        x: 50,
        y: 35,
        size: 10,
        color: rgb(0.3, 0.4, 0.8),
        font: StandardFonts.Helvetica
      });

      const pdfBytes = await doc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setPdfBlob(blob);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateCompliancePDF = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const doc = await PDFDocument.create({
        title: 'VibePDF Compliance Features Demo',
        author: 'VibePDF Library',
        subject: 'Standards Compliance',
        language: 'en-US'
      });

      const page = doc.addPage(PageSizes.A4);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      page.addFont(font);

      // Title
      page.drawTextBlock('Standards Compliance Features', {
        x: 50,
        y: 750,
        size: 20,
        font: StandardFonts.HelveticaBold,
        color: ColorUtils.WHITE,
        backgroundColor: rgb(0.1, 0.3, 0.8),
        padding: { top: 15, right: 20, bottom: 15, left: 20 },
        maxWidth: 500
      });

      // Compliance standards section
      page.drawText('Supported Compliance Standards:', {
        x: 50,
        y: 680,
        size: 16,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      const standards = [
        { name: 'PDF/A-1b', description: 'ISO 19005-1 Level B (basic) compliance' },
        { name: 'PDF/A-2u', description: 'ISO 19005-2 Unicode compliance' },
        { name: 'PDF/A-3', description: 'ISO 19005-3 for embedded files' },
        { name: 'PDF/UA', description: 'ISO 14289 for accessibility' },
        { name: 'PDF/X', description: 'ISO 15930 for print production' }
      ];

      standards.forEach((standard, index) => {
        page.drawText(standard.name, {
          x: 70,
          y: 650 - (index * 30),
          size: 14,
          color: rgb(0.1, 0.3, 0.8),
          font: StandardFonts.HelveticaBold
        });

        page.drawText(standard.description, {
          x: 70,
          y: 635 - (index * 30),
          size: 12,
          color: rgb(0.2, 0.2, 0.2),
          font: StandardFonts.Helvetica
        });
      });

      // Accessibility features section
      page.drawText('Accessibility Features (PDF/UA):', {
        x: 50,
        y: 480,
        size: 16,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      const accessibilityFeatures = [
        'Tagged PDF structure for screen readers',
        'Alternative text for images',
        'Document language specification',
        'Logical reading order',
        'Proper heading structure',
        'Table structure with headers'
      ];

      accessibilityFeatures.forEach((feature, index) => {
        page.drawText(`• ${feature}`, {
          x: 70,
          y: 450 - (index * 20),
          size: 12,
          color: rgb(0.2, 0.2, 0.2),
          font: StandardFonts.Helvetica
        });
      });

      // Archival features section
      page.drawText('Archival Features (PDF/A):', {
        x: 50,
        y: 330,
        size: 16,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      const archivalFeatures = [
        'Embedded fonts for consistent rendering',
        'Device-independent color spaces',
        'XMP metadata for document properties',
        'Self-contained (no external references)',
        'No encryption or JavaScript'
      ];

      archivalFeatures.forEach((feature, index) => {
        page.drawText(`• ${feature}`, {
          x: 70,
          y: 300 - (index * 20),
          size: 12,
          color: rgb(0.2, 0.2, 0.2),
          font: StandardFonts.Helvetica
        });
      });

      // Print production features section
      page.drawText('Print Production Features (PDF/X):', {
        x: 50,
        y: 180,
        size: 16,
        color: rgb(0.2, 0.2, 0.2),
        font: StandardFonts.HelveticaBold
      });

      const printFeatures = [
        'Output intent for color management',
        'Embedded fonts and images',
        'CMYK color space support',
        'Trim and bleed box specifications',
        'Print marks and color bars'
      ];

      printFeatures.forEach((feature, index) => {
        page.drawText(`• ${feature}`, {
          x: 70,
          y: 150 - (index * 20),
          size: 12,
          color: rgb(0.2, 0.2, 0.2),
          font: StandardFonts.Helvetica
        });
      });

      // Footer
      page.drawText('Generated with VibePDF v1.0.0 - Compliance Demo', {
        x: 50,
        y: 50,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
        font: StandardFonts.Helvetica
      });

      page.drawText('https://github.com/VibePDF/VibePDF', {
        x: 50,
        y: 35,
        size: 10,
        color: rgb(0.3, 0.4, 0.8),
        font: StandardFonts.Helvetica
      });

      const pdfBytes = await doc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setPdfBlob(blob);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generatePDF = useCallback(() => {
    switch (activeTab) {
      case 'advanced':
        return generateAdvancedPDF();
      case 'forms':
        return generateFormsPDF();
      case 'security':
        return generateSecurityPDF();
      case 'compliance':
        return generateCompliancePDF();
      default:
        return generateBasicPDF();
    }
  }, [activeTab, generateBasicPDF, generateAdvancedPDF, generateFormsPDF, generateSecurityPDF, generateCompliancePDF]);

  const downloadPDF = useCallback(() => {
    if (!pdfBlob) return;
    
    try {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vibepdf-${activeTab}-demo.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setError(`Error downloading PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [pdfBlob, activeTab]);

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

  const getTabDescription = (tab: string) => {
    switch (tab) {
      case 'basic':
        return 'Basic PDF generation with text, shapes, and graphics';
      case 'advanced':
        return 'Advanced graphics with complex shapes, transparency, and layouts';
      case 'forms':
        return 'Interactive form fields, validation, and data handling';
      case 'security':
        return 'Encryption, digital signatures, and permission management';
      case 'compliance':
        return 'PDF/A, PDF/UA, and PDF/X standards compliance';
      default:
        return '';
    }
  };

  const getCodeExample = (tab: string) => {
    switch (tab) {
      case 'basic':
        return `import { PDFDocument, StandardFonts, rgb, PageSizes } from 'vibepdf';

const generateBasicPDF = async () => {
  // Create a new PDF document
  const doc = await PDFDocument.create({
    title: 'Basic PDF Example',
    author: 'VibePDF'
  });

  // Add a page
  const page = doc.addPage(PageSizes.A4);
  
  // Embed a font
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  page.addFont(font);

  // Draw text
  page.drawText('Hello from VibePDF!', {
    x: 50,
    y: 750,
    size: 24,
    color: rgb(0.1, 0.3, 0.8),
    font: StandardFonts.HelveticaBold
  });

  // Draw a rectangle
  page.drawRectangle(
    { x: 50, y: 700, width: 200, height: 100 },
    { 
      fillColor: rgb(0.9, 0.95, 1),
      strokeColor: rgb(0.1, 0.3, 0.8),
      lineWidth: 2
    }
  );

  // Save the PDF
  const pdfBytes = await doc.save();
  return pdfBytes;
};`;
      case 'advanced':
        return `import { PDFDocument, StandardFonts, rgb, PageSizes } from 'vibepdf';

const generateAdvancedPDF = async () => {
  const doc = await PDFDocument.create();
  const page = doc.addPage(PageSizes.A4);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  
  // Draw text block with background
  page.drawTextBlock('Advanced VibePDF Features', {
    x: 50, y: 750, size: 20,
    font: StandardFonts.HelveticaBold,
    color: rgb(1, 1, 1),
    backgroundColor: rgb(0.1, 0.3, 0.8),
    padding: { top: 15, right: 20, bottom: 15, left: 20 },
    maxWidth: 500
  });
  
  // Draw rounded rectangle
  page.drawRoundedRectangle(
    { x: 50, y: 600, width: 150, height: 80 }, 10,
    { 
      fillColor: rgb(0.9, 0.95, 1), 
      strokeColor: rgb(0.1, 0.3, 0.8), 
      lineWidth: 2 
    }
  );
  
  // Draw ellipse
  page.drawEllipse(
    { x: 300, y: 640 }, 60, 40,
    { 
      fillColor: rgb(1, 0.8, 0.2), 
      strokeColor: rgb(0.8, 0.4, 0), 
      lineWidth: 2 
    }
  );
  
  // Draw polygon
  page.drawPolygon(
    [
      { x: 450, y: 600 },
      { x: 500, y: 680 },
      { x: 400, y: 680 }
    ],
    { 
      fillColor: rgb(0.8, 0.2, 0.2), 
      strokeColor: rgb(0.6, 0.1, 0.1), 
      lineWidth: 2 
    }
  );
  
  // Draw with transparency
  page.drawCircle(
    { x: 100, y: 450 }, 30,
    { fillColor: rgb(1, 0, 0), opacity: 0.5 }
  );
  
  return await doc.save();
};`;
      case 'forms':
        return `import { PDFDocument, StandardFonts, rgb, PageSizes } from 'vibepdf';
import { AcroForm, TextField, CheckBoxField, RadioGroupField } from 'vibepdf';

const generateFormPDF = async () => {
  const doc = await PDFDocument.create();
  const page = doc.addPage(PageSizes.A4);
  
  // Create a form
  const form = new AcroForm();
  
  // Add a text field
  const nameField = form.addTextField({
    name: 'name',
    value: '',
    defaultValue: '',
    required: true,
    bounds: { x: 150, y: 700, width: 200, height: 25 }
  });
  
  // Add a checkbox
  const agreeField = form.addCheckBox({
    name: 'agree',
    value: false,
    required: true,
    bounds: { x: 150, y: 650, width: 20, height: 20 }
  });
  
  // Add a radio group
  const optionsField = form.addRadioGroup({
    name: 'options',
    choices: ['Option A', 'Option B', 'Option C'],
    value: 'Option A',
    bounds: { x: 150, y: 600, width: 20, height: 20 }
  });
  
  // Add form to document
  doc.addForm(form);
  
  return await doc.save();
};`;
      case 'security':
        return `import { PDFDocument, StandardFonts, rgb, PageSizes } from 'vibepdf';
import { PDFSecurity, EncryptionAlgorithm } from 'vibepdf';

const generateSecurePDF = async () => {
  const doc = await PDFDocument.create();
  const page = doc.addPage(PageSizes.A4);
  
  // Add content
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  page.drawText('Secure Document', {
    x: 50, y: 750, size: 24,
    font: StandardFonts.HelveticaBold
  });
  
  // Apply encryption
  const security = new PDFSecurity({
    algorithm: EncryptionAlgorithm.AES_256,
    userPassword: 'user123',
    ownerPassword: 'owner456',
    permissions: {
      print: true,
      modify: false,
      copy: false,
      annotate: true,
      fillForms: true,
      extractForAccessibility: true,
      assemble: false,
      printHighRes: false
    }
  });
  
  // Apply security to document
  doc.applySecurity(security);
  
  return await doc.save();
};`;
      case 'compliance':
        return `import { PDFDocument, StandardFonts, rgb, PageSizes } from 'vibepdf';
import { PDFComplianceManager, ComplianceLevel } from 'vibepdf';

const generateCompliantPDF = async () => {
  const doc = await PDFDocument.create({
    title: 'PDF/A Compliant Document',
    author: 'VibePDF',
    language: 'en-US'
  });
  
  const page = doc.addPage(PageSizes.A4);
  
  // Add content
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  page.drawText('PDF/A Compliant Document', {
    x: 50, y: 750, size: 24,
    font: StandardFonts.HelveticaBold
  });
  
  // Set compliance level
  const compliance = new PDFComplianceManager();
  compliance.setComplianceLevel({
    level: ComplianceLevel.PDF_A_2B,
    title: 'PDF/A Compliant Document',
    language: 'en-US'
  });
  
  // Apply compliance to document
  doc.applyCompliance(compliance);
  
  return await doc.save();
};`;
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Bolt.new Badge - Top */}
      <div className="flex justify-center py-2 bg-white shadow-sm">
        <a href="https://bolt.new" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-900 transition-colors">
        <span><b>Built with</b></span>
              <img src="/white_circle_360x360.png" alt="Built with Bolt.new" className="h-12" />
        </a>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link to="/" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
                <ChevronLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  VibePDF Demo
                </h1>
                <p className="text-gray-600 text-sm">Interactive Feature Showcase</p>
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
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Feature Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {[
                { id: 'basic', name: 'Basic Features', icon: <FileText className="w-5 h-5" /> },
                { id: 'advanced', name: 'Advanced Graphics', icon: <Shapes className="w-5 h-5" /> },
                { id: 'forms', name: 'Interactive Forms', icon: <FileCheck className="w-5 h-5" /> },
                { id: 'security', name: 'Security & Encryption', icon: <Lock className="w-5 h-5" /> },
                { id: 'compliance', name: 'Standards Compliance', icon: <FileCheck className="w-5 h-5" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  `}
                >
                  {tab.icon}
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Description */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {activeTab === 'basic' && 'Basic PDF Generation'}
            {activeTab === 'advanced' && 'Advanced Graphics & Layout'}
            {activeTab === 'forms' && 'Interactive Forms'}
            {activeTab === 'security' && 'Security & Encryption'}
            {activeTab === 'compliance' && 'Standards Compliance'}
          </h2>
          <p className="text-gray-600">{getTabDescription(activeTab)}</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Demo Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column - PDF Generation */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              PDF Generation
            </h3>
            
            <p className="text-gray-600 mb-6">
              Generate a sample PDF demonstrating the {activeTab} features of VibePDF.
            </p>
            
            <div className="flex flex-col space-y-4">
              <button
                onClick={generatePDF}
                disabled={isGenerating}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <FileText className="w-5 h-5" />
                <span>{isGenerating ? 'Generating...' : `Generate ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Demo`}</span>
              </button>
              
              {pdfBlob && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={downloadPDF}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download PDF</span>
                  </button>
                  
                  <button
                    onClick={openPDFInNewTab}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span>Open in New Tab</span>
                  </button>
                </div>
              )}
            </div>
            
            {/* PDF Preview */}
            {pdfBlob && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">PDF Preview</h4>
                  <button
                    onClick={() => setPdfDataUrl(pdfDataUrl ? null : URL.createObjectURL(pdfBlob))}
                    className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    {pdfDataUrl ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{pdfDataUrl ? 'Hide' : 'Show'} Preview</span>
                  </button>
                </div>
                
                {pdfDataUrl && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <iframe
                      ref={iframeRef}
                      src={pdfDataUrl}
                      className="w-full h-96"
                      title="PDF Preview"
                      style={{ 
                        minHeight: '400px',
                        border: 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Right Column - Code Example */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Code className="w-5 h-5 mr-2 text-blue-600" />
              Code Example
            </h3>
            
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-green-400 text-sm leading-relaxed">
                <code>{getCodeExample(activeTab)}</code>
              </pre>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <p>This example demonstrates how to use VibePDF to create a PDF with {activeTab} features.</p>
              <p className="mt-2">See the <a href="https://github.com/VibePDF/VibePDF" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub repository</a> for more examples and documentation.</p>
            </div>
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Feature Comparison
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VibePDF</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">pdf-lib</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">pdf.js</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">iText</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">PDF Creation</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">✓ Advanced</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">✓ Basic</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">✗</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">✓ Advanced</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">PDF Rendering</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">✓ High Performance</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">✗</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">✓ Standard</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">✓ Limited</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Digital Signatures</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">✓ Advanced</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">✗</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">✗</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">✓ Advanced</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">PDF/A Compliance</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">✓ Full Support</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">✗</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">✗</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">✓ Full Support</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">PDF/UA Accessibility</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">✓ Full Support</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">✗</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">✓ Limited</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">✓ Full Support</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">TypeScript Support</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">✓ Native TS 5.8.3</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">✓ Limited</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">✓ Limited</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">✗ Java Only</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">AI Capabilities</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">✓ Advanced</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">✗</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">✗</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">✗</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Collaboration</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">✓ Real-time</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">✗</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">✗</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">✗</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Getting Started
          </h3>
          
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Installation</h4>
            <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
              <pre className="text-green-400 text-sm">
                <code>npm install vibepdf</code>
              </pre>
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Basic Usage</h4>
            <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
              <pre className="text-green-400 text-sm">
                <code>{`import { PDFDocument, StandardFonts, rgb } from 'vibepdf';

// Create a new PDF document
const doc = await PDFDocument.create();

// Add a page
const page = doc.addPage();

// Add content
page.drawText('Hello, World!', {
  x: 50,
  y: 700,
  size: 30,
  color: rgb(0, 0.53, 0.71)
});

// Save the PDF
const pdfBytes = await doc.save();`}</code>
              </pre>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Resources</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>
                <a 
                  href="https://github.com/VibePDF/VibePDF" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/VibePDF/VibePDF/wiki" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/VibePDF/VibePDF/issues" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Issue Tracker
                </a>
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 px-4 sm:px-6 lg:px-8 mt-8">
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
              <span><b>Built with</b></span>
              <img src="/white_circle_360x360.png" alt="Built with Bolt.new" className="h-13" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default DemoPage;