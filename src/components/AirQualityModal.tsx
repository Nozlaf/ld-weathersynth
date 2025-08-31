import React from 'react';
import { AirQualityData } from '../services/weatherService';
import './AirQualityModal.css';

interface AirQualityModalProps {
  isOpen: boolean;
  onClose: () => void;
  airQuality: AirQualityData;
}

const AirQualityModal: React.FC<AirQualityModalProps> = ({ isOpen, onClose, airQuality }) => {
  if (!isOpen) return null;

  const getAQIColor = (index: number) => {
    if (index <= 50) return '#00e400'; // Good - Green
    if (index <= 100) return '#ffff00'; // Moderate - Yellow
    if (index <= 150) return '#ff7e00'; // Unhealthy for Sensitive Groups - Orange
    if (index <= 200) return '#ff0000'; // Unhealthy - Red
    if (index <= 300) return '#8f3f97'; // Very Unhealthy - Purple
    return '#7e0023'; // Hazardous - Maroon
  };

  const getAQIDescription = (index: number) => {
    if (index <= 50) return 'Air quality is considered satisfactory, and air pollution poses little or no risk.';
    if (index <= 100) return 'Air quality is acceptable; however, some pollutants may be a concern for a small number of people.';
    if (index <= 150) return 'Members of sensitive groups may experience health effects. The general public is not likely to be affected.';
    if (index <= 200) return 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious effects.';
    if (index <= 300) return 'Health warnings of emergency conditions. The entire population is more likely to be affected.';
    return 'Health alert: everyone may experience more serious health effects.';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="air-quality-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🌬️ AIR QUALITY INDEX</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <div className="aqi-display">
            <div 
              className="aqi-rectangle"
              style={{ backgroundColor: getAQIColor(airQuality.index) }}
            >
              <span className="aqi-value">{airQuality.index}</span>
              <span className="aqi-category">{airQuality.category}</span>
            </div>
          </div>
          
          <div className="aqi-description">
            <p>{getAQIDescription(airQuality.index)}</p>
          </div>
          
          <div className="pollutants-section">
            <h3>📊 POLLUTANT LEVELS</h3>
            <div className="pollutants-grid">
              <div className="pollutant-item">
                <span className="pollutant-label">PM2.5</span>
                <span className="pollutant-value">{airQuality.pollutants.pm25} µg/m³</span>
                <span className="pollutant-name">Fine Particles</span>
              </div>
              <div className="pollutant-item">
                <span className="pollutant-label">PM10</span>
                <span className="pollutant-value">{airQuality.pollutants.pm10} µg/m³</span>
                <span className="pollutant-name">Coarse Particles</span>
              </div>
              <div className="pollutant-item">
                <span className="pollutant-label">O₃</span>
                <span className="pollutant-value">{airQuality.pollutants.o3} µg/m³</span>
                <span className="pollutant-name">Ozone</span>
              </div>
              <div className="pollutant-item">
                <span className="pollutant-label">NO₂</span>
                <span className="pollutant-value">{airQuality.pollutants.no2} µg/m³</span>
                <span className="pollutant-name">Nitrogen Dioxide</span>
              </div>
              <div className="pollutant-item">
                <span className="pollutant-label">SO₂</span>
                <span className="pollutant-value">{airQuality.pollutants.so2} µg/m³</span>
                <span className="pollutant-name">Sulfur Dioxide</span>
              </div>
              <div className="pollutant-item">
                <span className="pollutant-label">CO</span>
                <span className="pollutant-value">{airQuality.pollutants.co} µg/m³</span>
                <span className="pollutant-name">Carbon Monoxide</span>
              </div>
            </div>
          </div>
          
          <div className="health-advice">
            <h3>💡 HEALTH ADVICE</h3>
            <div className="advice-content">
              {airQuality.index <= 50 && (
                <p>✅ Enjoy outdoor activities! Air quality is good.</p>
              )}
              {airQuality.index > 50 && airQuality.index <= 100 && (
                <p>⚠️ Air quality is acceptable. Consider reducing outdoor activities if you're unusually sensitive to air pollution.</p>
              )}
              {airQuality.index > 100 && airQuality.index <= 150 && (
                <p>⚠️ Sensitive groups should reduce outdoor activities. Consider wearing a mask if you have respiratory conditions.</p>
              )}
              {airQuality.index > 150 && airQuality.index <= 200 && (
                <p>🚨 Everyone should reduce outdoor activities. Sensitive groups should avoid outdoor activities.</p>
              )}
              {airQuality.index > 200 && (
                <p>🚨🚨 Avoid outdoor activities. Stay indoors with filtered air if possible.</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="modal-button" onClick={onClose}>
            [ CLOSE ]
          </button>
        </div>
      </div>
    </div>
  );
};

export default AirQualityModal;
