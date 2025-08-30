import React, { useState } from 'react';
import { UVIndexData } from '../services/weatherService';
import './UVIndexModal.css';

interface UVIndexModalProps {
  isOpen: boolean;
  onClose: () => void;
  uvIndex: UVIndexData;
}

const UVIndexModal: React.FC<UVIndexModalProps> = ({ isOpen, onClose, uvIndex }) => {
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);
  const [showUVScale, setShowUVScale] = useState(false);

  if (!isOpen) return null;

  const getUVColor = (value: number) => {
    if (value <= 2) return '#00ff00'; // Green
    if (value <= 5) return '#ffff00'; // Yellow
    if (value <= 7) return '#ff8000'; // Orange
    if (value <= 10) return '#ff0000'; // Red
    return '#800080'; // Purple
  };

  const getUVBackgroundColor = (value: number) => {
    if (value <= 2) return '#00ff00'; // Green
    if (value <= 5) return '#ffff00'; // Yellow
    if (value <= 7) return '#ff8000'; // Orange
    if (value <= 10) return '#ff0000'; // Red
    return '#800080'; // Purple
  };

  return (
    <div className="uv-modal-overlay" onClick={onClose}>
      <div className="uv-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="uv-modal-header">
          <h2>UV INDEX MONITOR</h2>
          <button className="uv-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="uv-modal-body">
          {/* Main UV Index Display */}
          <div className="uv-main-display">
            <div 
              className="uv-index-rectangle"
              style={{
                backgroundColor: getUVBackgroundColor(uvIndex.value)
              }}
            >
              <span className="uv-index-value">{uvIndex.value}</span>
            </div>
            <div className="uv-index-info">
              <h3 className="uv-risk-level">{uvIndex.risk} RISK</h3>
              <p className="uv-description">
                {uvIndex.value === 0 && "No UV radiation"}
                {uvIndex.value >= 1 && uvIndex.value <= 2 && "Low UV radiation"}
                {uvIndex.value >= 3 && uvIndex.value <= 5 && "Moderate UV radiation"}
                {uvIndex.value >= 6 && uvIndex.value <= 7 && "High UV radiation"}
                {uvIndex.value >= 8 && uvIndex.value <= 10 && "Very high UV radiation"}
                {uvIndex.value >= 11 && "Extreme UV radiation"}
              </p>
            </div>
          </div>

          {/* Sun Position & Time */}
          <div className="uv-sun-info">
            <div className="sun-position">
              <span className="sun-icon">☀</span>
              <span>Current UV exposure level</span>
            </div>
          </div>

          {/* Protection Advice - Always Visible */}
          <div className="uv-protection">
            <h4>PROTECTION REQUIRED:</h4>
            <ul>
              {uvIndex.protection.map((advice, index) => (
                <li key={index}>{advice}</li>
              ))}
            </ul>
          </div>

          {/* Collapsible Detailed Information */}
          <div className="uv-collapsible-section">
            <button 
              className="uv-collapse-button"
              onClick={() => setShowDetailedInfo(!showDetailedInfo)}
            >
              {showDetailedInfo ? '▼' : '▶'} DETAILED RECOMMENDATIONS
            </button>
            {showDetailedInfo && (
              <div className="uv-detailed-info">
                <div className="uv-recommendations">
                  <h4>SPECIFIC ACTIONS:</h4>
                  {uvIndex.value <= 2 && (
                    <ul>
                      <li>No protection required</li>
                      <li>You can safely stay outside</li>
                      <li>Normal outdoor activities are safe</li>
                    </ul>
                  )}
                  {uvIndex.value >= 3 && uvIndex.value <= 5 && (
                    <ul>
                      <li>Seek shade during midday hours</li>
                      <li>Slip on a shirt, slop on sunscreen, slap on a hat</li>
                      <li>Limit sun exposure between 10 AM and 4 PM</li>
                    </ul>
                  )}
                  {uvIndex.value >= 6 && uvIndex.value <= 7 && (
                    <ul>
                      <li>Reduce time in the sun between 10 AM and 4 PM</li>
                      <li>Shirt, sunscreen, and hat are essential</li>
                      <li>Seek shade and minimize sun exposure</li>
                    </ul>
                  )}
                  {uvIndex.value >= 8 && (
                    <ul>
                      <li>Minimize sun exposure during midday hours</li>
                      <li>Protection against skin and eye damage is essential</li>
                      <li>Shirt, sunscreen, hat, and sunglasses required</li>
                      <li>Seek shade and avoid outdoor activities during peak hours</li>
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Collapsible UV Scale */}
          <div className="uv-collapsible-section">
            <button 
              className="uv-collapse-button"
              onClick={() => setShowUVScale(!showUVScale)}
            >
              {showUVScale ? '▼' : '▶'} UV INDEX SCALE
            </button>
            {showUVScale && (
              <div className="uv-scale">
                <div className="uv-scale-item">
                  <span className="uv-scale-color" style={{ backgroundColor: '#00ff00' }}>0-2</span>
                  <span className="uv-scale-label">LOW</span>
                  <span className="uv-scale-desc">Safe to be outside</span>
                </div>
                <div className="uv-scale-item">
                  <span className="uv-scale-color" style={{ backgroundColor: '#ffff00' }}>3-5</span>
                  <span className="uv-scale-label">MODERATE</span>
                  <span className="uv-scale-desc">Take precautions</span>
                </div>
                <div className="uv-scale-item">
                  <span className="uv-scale-color" style={{ backgroundColor: '#ff8000' }}>6-7</span>
                  <span className="uv-scale-label">HIGH</span>
                  <span className="uv-scale-desc">Protection required</span>
                </div>
                <div className="uv-scale-item">
                  <span className="uv-scale-color" style={{ backgroundColor: '#ff0000' }}>8-10</span>
                  <span className="uv-scale-label">VERY HIGH</span>
                  <span className="uv-scale-desc">Extra precautions</span>
                </div>
                <div className="uv-scale-item">
                  <span className="uv-scale-color" style={{ backgroundColor: '#800080' }}>11+</span>
                  <span className="uv-scale-label">EXTREME</span>
                  <span className="uv-scale-desc">Avoid sun exposure</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="uv-modal-footer">
          <button className="uv-modal-ok" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
};

export default UVIndexModal;
