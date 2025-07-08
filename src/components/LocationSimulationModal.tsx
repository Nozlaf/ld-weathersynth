import React from 'react';
import locationSimulationService from '../services/locationSimulationService';
import { LocationSimulationState } from '../types/locationSimulation';

interface LocationSimulationModalProps {
  isVisible: boolean;
  onClose: () => void;
  locationSimulation: LocationSimulationState;
  onLocationSimulationUpdate: () => void;
}

const LocationSimulationModal: React.FC<LocationSimulationModalProps> = ({ 
  isVisible, 
  onClose, 
  locationSimulation,
  onLocationSimulationUpdate
}) => {
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleLocationToggle = (locationId: string) => {
    try {
      console.log(`🔍 DEBUG: Location simulation button clicked for ${locationId}`);
      locationSimulationService.toggleSimulation(locationId);
      console.log(`🔍 DEBUG: toggleSimulation completed successfully`);
      onLocationSimulationUpdate(); // Notify parent to update state
    } catch (error) {
      console.error(`🔍 DEBUG: Error in location simulation button click:`, error);
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleStopSimulation = () => {
    try {
      console.log('🔍 DEBUG: Stop simulation button clicked');
      locationSimulationService.stopSimulation();
      console.log('🔍 DEBUG: stopSimulation completed successfully');
      onLocationSimulationUpdate(); // Notify parent to update state
    } catch (error) {
      console.error('🔍 DEBUG: Error in stop simulation button click:', error);
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="debug-overlay" onClick={handleOverlayClick}>
      <div className="debug-panel" style={{ maxWidth: '700px', maxHeight: '80vh', overflowY: 'auto' }}>
        <div className="debug-header">
          <h2 className="debug-title">🌍 LOCATION SIMULATION</h2>
          <button className="debug-close" onClick={onClose}>×</button>
        </div>
        
        <div className="debug-content">
          <div className="debug-section">
            <div className="debug-info">
              <div className="info-row">
                <span className="info-label" style={{ color: '#ffff00', fontWeight: 'bold' }}>CURRENT STATUS:</span>
                <span className={`info-value ${locationSimulation.isSimulating ? 'connected' : 'disconnected'}`}>
                  {locationSimulation.isSimulating ? '🟢 Active Simulation' : '⚪ No Active Simulation'}
                </span>
              </div>
              
              {locationSimulation.activeLocation && (
                <div className="info-row">
                  <span className="info-label">SIMULATING:</span>
                  <span className="info-value" style={{ color: '#00ff00' }}>
                    {locationSimulation.activeLocation.emoji} {locationSimulation.activeLocation.displayName}
                  </span>
                </div>
              )}
              
              <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(0, 255, 255, 0.3)' }}>
                <div className="info-row">
                  <span className="info-label" style={{ color: '#ffff00', fontWeight: 'bold' }}>AVAILABLE LOCATIONS:</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#00ffff', marginTop: '10px', marginBottom: '15px' }}>
                  Select a location to simulate weather from that city:
                </p>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                  gap: '12px' 
                }}>
                  {locationSimulation.presetLocations.map((location) => (
                    <button
                      key={location.id}
                      type="button"
                      className={`error-test-button ${
                        locationSimulation.activeLocation?.id === location.id ? 'active' : ''
                      }`}
                      onClick={() => handleLocationToggle(location.id)}
                      style={{
                        fontSize: '0.8rem',
                        padding: '12px 16px',
                        backgroundColor: locationSimulation.activeLocation?.id === location.id 
                          ? '#ff00ff' : 'transparent',
                        color: locationSimulation.activeLocation?.id === location.id 
                          ? '#000' : '#ff00ff',
                        border: `2px solid ${locationSimulation.activeLocation?.id === location.id ? '#ff00ff' : '#ff00ff'}`,
                        borderRadius: '8px',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '4px'
                      }}
                    >
                      <div style={{ fontSize: '1.2rem' }}>{location.emoji}</div>
                      <div style={{ fontWeight: 'bold' }}>{location.name}</div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                        {location.coordinates?.lat.toFixed(2)}, {location.coordinates?.lon.toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>
                
                {locationSimulation.isSimulating && (
                  <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <button
                      type="button"
                      className="error-test-button"
                      onClick={handleStopSimulation}
                      style={{
                        fontSize: '0.8rem',
                        padding: '10px 20px',
                        backgroundColor: '#ff0000',
                        color: '#fff',
                        borderColor: '#ff0000',
                        borderRadius: '8px'
                      }}
                    >
                      [ STOP SIMULATION ]
                    </button>
                  </div>
                )}
              </div>
              
              <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(0, 255, 255, 0.3)' }}>
                <div className="info-row">
                  <span className="info-label" style={{ color: '#ffff00', fontWeight: 'bold' }}>HOW IT WORKS:</span>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <p style={{ fontSize: '0.8rem', color: '#ffaa00', marginBottom: '8px' }}>
                    🌍 <strong>Location Override:</strong> Simulates your location anywhere in the world
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#ffaa00', marginBottom: '8px' }}>
                    🌤️ <strong>Weather Update:</strong> Automatically fetches weather for the simulated location
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#ffaa00', marginBottom: '8px' }}>
                    🔄 <strong>Real-time Sync:</strong> Weather widget updates immediately when location changes
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#00ffff', marginBottom: '8px' }}>
                    💡 <strong>Testing:</strong> Perfect for testing weather in different climates and timezones
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#00ffff' }}>
                    🔒 <strong>Local Only:</strong> Simulation only affects your browser, not your actual device location
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationSimulationModal; 