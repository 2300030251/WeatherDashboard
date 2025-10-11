// src/weathercard.jsx
import React from "react";

export default function WeatherCard({ data }) {
  if (!data) return null;
  const { name, sys, main, weather, wind } = data;
  const icon = weather?.[0]?.icon;
  const desc = weather?.[0]?.description || "";

  return (
    <div className="weather-card">
      <h2>{name}{sys?.country ? `, ${sys.country}` : ""}</h2>
      {icon && (
        <img
          src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
          alt={desc}
        />
      )}
      <p className="desc">{desc.toUpperCase()}</p>
      <h3>{main?.temp?.toFixed(1)}°C</h3>

      <div className="details">
        <p>💧 Humidity: {main?.humidity}%</p>
        <p>🌬️ Wind: {(wind?.speed * 3.6 || 0).toFixed(1)} km/h</p>
      </div>
    </div>
  );
}
