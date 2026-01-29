import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { haversineDistance } from '@/lib/haversine';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom trainer icon
const trainerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// User location icon
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Trainer {
  id: string;
  full_name: string;
  avatar_url: string | null;
  lat: number;
  lng: number;
}

interface TrainerMapProps {
  trainers: Trainer[];
  userLocation: { lat: number; lng: number };
  filterRadius: number | null;
  onTrainerClick: (trainer: Trainer) => void;
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  
  return null;
}

export function TrainerMap({ trainers, userLocation, filterRadius, onTrainerClick }: TrainerMapProps) {
  const filteredTrainers = useMemo(() => {
    if (filterRadius === null) return trainers;
    
    return trainers.filter((trainer) => {
      const distance = haversineDistance(
        userLocation.lat,
        userLocation.lng,
        trainer.lat,
        trainer.lng
      );
      return distance <= filterRadius;
    });
  }, [trainers, userLocation, filterRadius]);

  const center: [number, number] = [userLocation.lat, userLocation.lng];

  return (
    <MapContainer
      center={center}
      zoom={13}
      className="h-full w-full"
      style={{ height: '100%', width: '100%' }}
    >
      <MapController center={center} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
        <Popup>Your Location</Popup>
      </Marker>

      {filteredTrainers.map((trainer) => (
        <Marker
          key={trainer.id}
          position={[trainer.lat, trainer.lng]}
          icon={trainerIcon}
          eventHandlers={{
            click: () => onTrainerClick(trainer),
          }}
        >
          <Popup>
            {trainer.full_name} - {haversineDistance(userLocation.lat, userLocation.lng, trainer.lat, trainer.lng).toFixed(1)} km away
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
