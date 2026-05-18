// src/mapview.jsx
import React, { useEffect, useRef, useState } from "react";
import "./App.css";

// Load keys from Vite environment variables. If they are not provided,
// the component falls back to an embedded map instead of showing a blank box.
const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
const OPENWEATHER_KEY = import.meta.env.VITE_OPENWEATHER_KEY;

export default function MapView({ layer = "clouds_new", onLocationSelect = () => {} }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const weatherLayerRef = useRef(null);
  const markerRef = useRef(null);
  const [useFallbackMap, setUseFallbackMap] = useState(false);

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY) {
      console.error("Google Maps API key missing.");
      setUseFallbackMap(true);
      return;
    }

    // avoid adding duplicate script
    const existing = document.querySelector('script[data-gmaps="true"]');
    if (!existing) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.setAttribute("data-gmaps", "true");
      script.onload = () => {
        initMap();
      };
      script.onerror = () => {
        console.error("Google Maps script failed to load.");
        setUseFallbackMap(true);
      };
      document.head.appendChild(script);
    } else {
      // if already loaded
      if (window.google && window.google.maps) initMap();
      else existing.addEventListener("load", initMap);
    }

    // cleanup on unmount
    return () => {
      if (mapInstance.current) {
        // remove overlays
        if (weatherLayerRef.current && mapInstance.current.overlayMapTypes) {
          try { mapInstance.current.overlayMapTypes.clear(); } catch (e) {}
        }
        mapInstance.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // update overlay if layer changes
  useEffect(() => {
    if (mapInstance.current && window.google) addWeatherOverlay(layer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer]);

  function initMap() {
    if (!mapRef.current) return;
    // create map (if not already created)
    if (!mapInstance.current) {
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 20.5937, lng: 78.9629 },
        zoom: 4,
        mapTypeControl: true,
        streetViewControl: false,
      });
    }
    addWeatherOverlay(layer);

    // create/search input control
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Search location...";
    input.className = "map-search";
    mapInstance.current.controls[window.google.maps.ControlPosition.TOP_LEFT].push(input);

    const searchBox = new window.google.maps.places.SearchBox(input);

    // bias search to map bounds
    mapInstance.current.addListener("bounds_changed", () => {
      searchBox.setBounds(mapInstance.current.getBounds());
    });

    // when a place is selected
    searchBox.addListener("places_changed", () => {
      const places = searchBox.getPlaces();
      if (!places || places.length === 0) return;
      const place = places[0];
      if (!place.geometry || !place.geometry.location) return;

      const loc = place.geometry.location;
      mapInstance.current.panTo(loc);
      mapInstance.current.setZoom(8);

      // show marker
      placeMarker(loc.lat(), loc.lng());

      // callback to parent
      onLocationSelect(loc.lat(), loc.lng());
    });

    // click on map
    mapInstance.current.addListener("click", (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      placeMarker(lat, lng);
      onLocationSelect(lat, lng);
    });
  }

  function placeMarker(lat, lng) {
    if (!mapInstance.current) return;
    // remove old marker
    if (markerRef.current) markerRef.current.setMap(null);
    markerRef.current = new window.google.maps.Marker({
      position: { lat, lng },
      map: mapInstance.current,
    });
    mapInstance.current.panTo({ lat, lng });
    mapInstance.current.setZoom(8);
  }

  function addWeatherOverlay(layerName) {
    if (!window.google || !mapInstance.current || !OPENWEATHER_KEY) return;
    const urlTemplate = `https://tile.openweathermap.org/map/${layerName}/{z}/{x}/{y}.png?appid=${OPENWEATHER_KEY}`;
    const layerObj = new window.google.maps.ImageMapType({
      getTileUrl: (coord, zoom) => urlTemplate.replace("{z}", zoom).replace("{x}", coord.x).replace("{y}", coord.y),
      tileSize: new window.google.maps.Size(256, 256),
      opacity: 0.6,
      name: "OWMLayer",
    });

    // remove old overlay at index 0 if present
    try {
      if (weatherLayerRef.current) {
        mapInstance.current.overlayMapTypes.removeAt(0);
      }
    } catch (e) {}
    weatherLayerRef.current = layerObj;
    mapInstance.current.overlayMapTypes.insertAt(0, layerObj);
  }

  if (useFallbackMap) {
    return (
      <iframe
        title="Live Google Map fallback"
        className="map-container map-fallback"
        src="https://www.openstreetmap.org/export/embed.html?bbox=76.6%2C8.0%2C77.8%2C13.6&layer=mapnik"
        loading="lazy"
      />
    );
  }

  return <div ref={mapRef} className="map-container"></div>;
}
