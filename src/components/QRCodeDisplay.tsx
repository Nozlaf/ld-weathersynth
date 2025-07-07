import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useTheme, Theme } from '../hooks/useTheme';
import './QRCodeDisplay.css';

const QRCodeDisplay: React.FC = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [isVisible, setIsVisible] = useState(true);
  const { theme } = useTheme();

  // Map theme to QR code colors
  const getQRCodeColors = (currentTheme: Theme) => {
    switch (currentTheme) {
      case 'dark-synth':
        return {
          dark: '#ff00ff',    // Magenta
          light: '#0f0f23'    // Dark background
        };
      case 'dark-green':
        return {
          dark: '#00ff00',    // Green
          light: '#001100'    // Dark green background
        };
      case 'dark-orange':
        return {
          dark: '#ff8800',    // Orange
          light: '#1a0e00'    // Dark orange background
        };
      case 'light':
        return {
          dark: '#8b4513',    // Brown
          light: '#f0f0e8'    // Light background
        };
      case 'grayscale':
        return {
          dark: '#666666',    // Gray
          light: '#ffffff'    // White background
        };
      case 'dark-grayscale':
        return {
          dark: '#cccccc',    // Light gray
          light: '#000000'    // Black background
        };
      default:
        return {
          dark: '#ff00ff',    // Default to magenta
          light: '#0f0f23'    // Default to dark
        };
    }
  };

  useEffect(() => {
    // Detect if device is desktop
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 768;
      
      setIsDesktop(!isMobile && !isSmallScreen);
    };

    // Generate QR code with current URL and theme colors
    const generateQRCode = async () => {
      try {
        const currentUrl = window.location.href;
        const colors = getQRCodeColors(theme);
        
        const qrCodeUrl = await QRCode.toDataURL(currentUrl, {
          errorCorrectionLevel: 'M',
          margin: 1,
          color: colors,
          width: 120
        });
        
        setQrCodeDataURL(qrCodeUrl);
      } catch (error) {
        console.warn('Failed to generate QR code:', error);
      }
    };

    detectDevice();
    generateQRCode();

    // Listen for window resize to recheck device type
    const handleResize = () => {
      detectDevice();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [theme]); // Add theme as dependency to regenerate QR code when theme changes

  if (!isDesktop || !qrCodeDataURL) {
    return null;
  }

  return (
    <div className={`qr-code-display ${theme} ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="qr-code-container">
        <div className="qr-code-header">
          <span className="qr-code-title">📱 MOBILE ACCESS</span>
          <button 
            className="qr-code-close"
            onClick={() => setIsVisible(false)}
            title="Hide QR Code"
          >
            ×
          </button>
        </div>
        <div className="qr-code-content">
          <img 
            src={qrCodeDataURL} 
            alt="QR Code for mobile access"
            className="qr-code-image"
          />
          <p className="qr-code-text">Scan to access on mobile</p>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay; 