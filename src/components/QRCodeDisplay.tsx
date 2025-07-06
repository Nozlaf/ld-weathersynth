import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import './QRCodeDisplay.css';

const QRCodeDisplay: React.FC = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Detect if device is desktop
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 768;
      
      setIsDesktop(!isMobile && !isSmallScreen);
    };

    // Generate QR code with current URL
    const generateQRCode = async () => {
      try {
        const currentUrl = window.location.href;
        const qrCodeUrl = await QRCode.toDataURL(currentUrl, {
          errorCorrectionLevel: 'M',
          margin: 1,
          color: {
            dark: '#00ff00',  // Green for retro look
            light: '#000000'  // Black background
          },
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
  }, []);

  if (!isDesktop || !qrCodeDataURL) {
    return null;
  }

  return (
    <div className={`qr-code-display ${isVisible ? 'visible' : 'hidden'}`}>
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