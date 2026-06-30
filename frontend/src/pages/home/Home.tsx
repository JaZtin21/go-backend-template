import React from 'react';
import { Marker, Popup } from 'react-map-gl/maplibre'; // 🌟 Import native marker features
import { useOutletContext } from 'react-router-dom';

// Simple mock structure representing data you'll eventually pull from PostgreSQL
const MOCK_MAP_PINS = [
    { id: "1", latitude: 14.5995, longitude: 120.9736, title: "Intramuros Pin" },
    { id: "2", latitude: 14.6010, longitude: 120.9760, title: "Binondo Food Post" },
];

export const Home = () => {
    // 🔑 Grab the parent MapRef engine context from the Layout component outlet!
    const { mapRef } = useOutletContext<{ mapRef: React.MutableRefObject<any> }>();

    const handleRecenterMap = () => {
        // Floating controls can command the layout map instance seamlessly!
        mapRef.current?.flyTo({
            center: [120.9736, 14.5997],
            zoom: 14,
            duration: 1500
        });
    };

    return (
        <>
            {/* 1. FLOATING CONTROL BUTTONS */}
            {/* Since this is a regular div inside the layout content flow, you can place panels anywhere */}
            <div style={{
                position: 'absolute', top: '20px', left: '20px', zIndex: 30,
                background: '#fff', padding: '15px', borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Map Controls</h3>
                <button
                    onClick={handleRecenterMap}
                    style={{ padding: '6px 12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    🎯 Recenter Camera
                </button>
            </div>

            {/* 2. INJECTING THE MARKERS ONTO THE LAYOUT MAP CANVAS */}
            {/* react-map-gl natively detects the running map instance in the layout and draws these elements directly into the WebGL scene */}
            {MOCK_MAP_PINS.map((pin) => (
                <Marker
                    key={pin.id}
                    latitude={pin.latitude}
                    longitude={pin.longitude}
                    onClick={(e) => {
                        e.originalEvent.stopPropagation();
                        alert(`You clicked on: ${pin.title}`);
                    }}
                >
                    {/* Custom HTML/CSS/Emoji marker layout - styled however you want! */}
                    <div style={{ fontSize: '32px', cursor: 'pointer', transform: 'translate(-50%, -100%)' }}>
                        📍
                    </div>
                </Marker>
            ))}
        </>
    );
};
