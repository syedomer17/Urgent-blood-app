import React, { useState, useCallback } from 'react';
import {
    GoogleMap,
    useJsApiLoader,
    Marker,
    InfoWindow,
} from '@react-google-maps/api';

export interface DonorMapItem {
    _id: string;
    name: string;
    bloodGroup: string;
    availability: boolean;
    trustRating?: number;
    totalDonations?: number;
    location?: {
        coordinates?: number[]; // [lng, lat]
        city?: string;
        address?: string;
        state?: string;
    };
    contactNumber?: string;
}

export interface RequestMapItem {
    _id: string;
    patientName: string;
    bloodGroup: string;
    urgency: string;
    unitsRequired: number;
    status: string;
    location?: {
        coordinates?: number[]; // [lng, lat]
        address?: string;
        city?: string;
    };
    requesterid?: { name?: string };
}

interface DonorMapViewProps {
    donors: DonorMapItem[];
    requests: RequestMapItem[];
    isLoading?: boolean;
}

const MAP_STYLES = [
    { elementType: 'geometry', stylers: [{ color: '#f8f8f8' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c3e4f5' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5f5e0' }] },
];

const URGENCY_COLOR: Record<string, string> = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#ca8a04',
    low: '#2563eb',
};

const containerStyle = { width: '100%', height: '100%' };

// Default centre: India (central)
const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };

const DonorMapView: React.FC<DonorMapViewProps> = ({ donors, requests, isLoading }) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: apiKey,
        id: 'google-map-script',
    });

    const [selectedDonor, setSelectedDonor] = useState<DonorMapItem | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<RequestMapItem | null>(null);

    // Find a good initial centre from the data
    const computeCenter = useCallback(() => {
        const donorsWithCoords = donors.filter(
            (d) => d.location?.coordinates && d.location.coordinates.length === 2
        );
        const requestsWithCoords = requests.filter(
            (r) => r.location?.coordinates && r.location.coordinates.length === 2
        );
        const all = [...donorsWithCoords, ...requestsWithCoords];
        if (all.length === 0) return DEFAULT_CENTER;
        // Average lat/lng
        const lats = all.map((x) => {
            const coords = (x as any).location?.coordinates as number[];
            return coords[1];
        });
        const lngs = all.map((x) => {
            const coords = (x as any).location?.coordinates as number[];
            return coords[0];
        });
        return {
            lat: lats.reduce((a, b) => a + b, 0) / lats.length,
            lng: lngs.reduce((a, b) => a + b, 0) / lngs.length,
        };
    }, [donors, requests]);

    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                <p className="text-4xl mb-3">🗺️</p>
                <p className="text-gray-700 font-semibold text-sm">Google Maps API key missing</p>
                <p className="text-gray-400 text-xs mt-1 max-w-xs">
                    Add <code className="bg-gray-100 px-1 rounded">VITE_GOOGLE_MAPS_KEY</code> to{' '}
                    <code className="bg-gray-100 px-1 rounded">client/.env</code> and restart the dev server.
                </p>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                <p className="text-4xl mb-3">⚠️</p>
                <p className="text-gray-600 text-sm">Failed to load Google Maps</p>
                <p className="text-gray-400 text-xs mt-1">Check your API key and internet connection.</p>
            </div>
        );
    }

    if (!isLoaded || isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-10 h-10 rounded-full border-4 border-red-100 border-t-red-500 animate-spin" />
            </div>
        );
    }

    const donorsWithCoords = donors.filter(
        (d) => d.location?.coordinates && d.location.coordinates.length === 2
    );
    const requestsWithCoords = requests.filter(
        (r) => r.location?.coordinates && r.location.coordinates.length === 2
    );

    const center = computeCenter();

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={donorsWithCoords.length + requestsWithCoords.length === 0 ? 5 : 10}
            options={{
                styles: MAP_STYLES,
                disableDefaultUI: false,
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
            }}
            onClick={() => {
                setSelectedDonor(null);
                setSelectedRequest(null);
            }}
        >
            {/* Donor markers — blue */}
            {donorsWithCoords.map((donor) => {
                const [lng, lat] = donor.location!.coordinates!;
                return (
                    <Marker
                        key={`donor-${donor._id}`}
                        position={{ lat, lng }}
                        title={`${donor.name} (${donor.bloodGroup})`}
                        icon={{
                            url: `data:image/svg+xml,${encodeURIComponent(
                                `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
                  <path d="M16 0C7.163 0 0 7.163 0 16c0 9 10 20 16 24 6-4 16-15 16-24C32 7.163 24.837 0 16 0z" 
                        fill="${donor.availability ? '#2563eb' : '#94a3b8'}"/>
                  <circle cx="16" cy="15" r="8" fill="white" opacity="0.9"/>
                  <text x="16" y="19" text-anchor="middle" font-size="8" font-weight="bold" 
                        fill="${donor.availability ? '#2563eb' : '#94a3b8'}">${donor.bloodGroup}</text>
                </svg>`
                            )}`,
                            scaledSize: new window.google.maps.Size(32, 40),
                            anchor: new window.google.maps.Point(16, 40),
                        }}
                        onClick={() => {
                            setSelectedRequest(null);
                            setSelectedDonor(donor);
                        }}
                    />
                );
            })}

            {/* Request markers — red */}
            {requestsWithCoords.map((req) => {
                const [lng, lat] = req.location!.coordinates!;
                const color = URGENCY_COLOR[req.urgency] || '#dc2626';
                return (
                    <Marker
                        key={`req-${req._id}`}
                        position={{ lat, lng }}
                        title={`${req.patientName} — ${req.bloodGroup} (${req.urgency})`}
                        icon={{
                            url: `data:image/svg+xml,${encodeURIComponent(
                                `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
                  <path d="M18 0C8.059 0 0 8.059 0 18c0 10 11 22 18 26 7-4 18-16 18-26C36 8.059 27.941 0 18 0z" 
                        fill="${color}"/>
                  <circle cx="18" cy="17" r="10" fill="white" opacity="0.9"/>
                  <text x="18" y="21" text-anchor="middle" font-size="9" font-weight="bold" 
                        fill="${color}">${req.bloodGroup}</text>
                </svg>`
                            )}`,
                            scaledSize: new window.google.maps.Size(36, 44),
                            anchor: new window.google.maps.Point(18, 44),
                        }}
                        onClick={() => {
                            setSelectedDonor(null);
                            setSelectedRequest(req);
                        }}
                    />
                );
            })}

            {/* Donor InfoWindow */}
            {selectedDonor && selectedDonor.location?.coordinates && (
                <InfoWindow
                    position={{
                        lat: selectedDonor.location.coordinates[1],
                        lng: selectedDonor.location.coordinates[0],
                    }}
                    onCloseClick={() => setSelectedDonor(null)}
                >
                    <div style={{ minWidth: 160, fontFamily: 'sans-serif' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    background: '#eff6ff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 900,
                                    color: '#2563eb',
                                    fontSize: 13,
                                    flexShrink: 0,
                                }}
                            >
                                {selectedDonor.bloodGroup}
                            </div>
                            <div>
                                <p style={{ fontWeight: 700, fontSize: 13, margin: 0, color: '#111' }}>
                                    {selectedDonor.name}
                                </p>
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: selectedDonor.availability ? '#16a34a' : '#94a3b8',
                                    }}
                                >
                                    {selectedDonor.availability ? '● Available' : '○ Away'}
                                </span>
                            </div>
                        </div>
                        {selectedDonor.location?.city && (
                            <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0' }}>
                                📍 {selectedDonor.location.city}
                            </p>
                        )}
                        {selectedDonor.trustRating !== undefined && (
                            <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0' }}>
                                ⭐ {selectedDonor.trustRating.toFixed(1)} · {selectedDonor.totalDonations || 0} donations
                            </p>
                        )}
                        {selectedDonor.contactNumber && (
                            <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>
                                📞 {selectedDonor.contactNumber}
                            </p>
                        )}
                    </div>
                </InfoWindow>
            )}

            {/* Request InfoWindow */}
            {selectedRequest && selectedRequest.location?.coordinates && (
                <InfoWindow
                    position={{
                        lat: selectedRequest.location.coordinates[1],
                        lng: selectedRequest.location.coordinates[0],
                    }}
                    onCloseClick={() => setSelectedRequest(null)}
                >
                    <div style={{ minWidth: 170, fontFamily: 'sans-serif' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    background: '#fef2f2',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 900,
                                    color: URGENCY_COLOR[selectedRequest.urgency] || '#dc2626',
                                    fontSize: 12,
                                    flexShrink: 0,
                                }}
                            >
                                {selectedRequest.bloodGroup}
                            </div>
                            <div>
                                <p style={{ fontWeight: 700, fontSize: 13, margin: 0, color: '#111' }}>
                                    {selectedRequest.patientName}
                                </p>
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: URGENCY_COLOR[selectedRequest.urgency] || '#dc2626',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    🚨 {selectedRequest.urgency}
                                </span>
                            </div>
                        </div>
                        <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0' }}>
                            🩸 {selectedRequest.unitsRequired} unit{selectedRequest.unitsRequired > 1 ? 's' : ''} needed
                        </p>
                        {selectedRequest.location?.city && (
                            <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0' }}>
                                📍 {selectedRequest.location.city}
                            </p>
                        )}
                        {selectedRequest.requesterid?.name && (
                            <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0' }}>
                                By {selectedRequest.requesterid.name}
                            </p>
                        )}
                    </div>
                </InfoWindow>
            )}

            {/* Empty state overlay */}
            {donorsWithCoords.length === 0 && requestsWithCoords.length === 0 && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: 16,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'white',
                        borderRadius: 12,
                        padding: '10px 18px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                        fontSize: 12,
                        color: '#6b7280',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                    }}
                >
                    <span>📍</span> No location data available yet
                </div>
            )}
        </GoogleMap>
    );
};

export default DonorMapView;
