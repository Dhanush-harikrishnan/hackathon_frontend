import { useEffect, useRef } from 'react';

interface Shelter {
  _id: string;
  name: string;
  address: string;
  location: { coordinates: [number, number] };
  status: string;
  capacity: { current: number; total: number };
}

interface LiveMapProps {
  shelters: Shelter[];
  userLocation?: { lat: number; lng: number } | null;
}

export default function LiveMap({ shelters, userLocation }: LiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markers = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (!window.google || !mapRef.current) return;
    if (!mapInstance.current) {
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: userLocation || { lat: 13.0827, lng: 80.2707 },
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
    }
    // Remove old markers
    markers.current.forEach(m => m.setMap(null));
    markers.current = [];
    // Add shelter markers
    shelters.forEach(shelter => {
      const marker = new window.google.maps.Marker({
        position: {
          lat: shelter.location.coordinates[1],
          lng: shelter.location.coordinates[0],
        },
        map: mapInstance.current!,
        title: shelter.name,
        icon: {
          url:
            shelter.status === 'OPEN'
              ? 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
              : shelter.status === 'FULL'
              ? 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
              : 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
        },
      });
      const info = new window.google.maps.InfoWindow({
        content: `<div><strong>${shelter.name}</strong><br/>${shelter.address}<br/>${shelter.capacity.total - shelter.capacity.current} spots left</div>`
      });
      marker.addListener('click', () => info.open(mapInstance.current!, marker));
      markers.current.push(marker);
    });
    // Add user marker
    if (userLocation) {
      const userMarker = new window.google.maps.Marker({
        position: userLocation,
        map: mapInstance.current!,
        title: 'Your Location',
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        },
      });
      markers.current.push(userMarker);
    }
    // Center map if user location changes
    if (userLocation) {
      mapInstance.current.setCenter(userLocation);
    }
  }, [shelters, userLocation]);

  return (
    <div ref={mapRef} style={{ width: '100%', height: 400, borderRadius: 16, overflow: 'hidden' }} />
  );
}
