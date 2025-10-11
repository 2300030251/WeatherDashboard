  // src/App.jsx
  import React, { useState, useEffect } from "react";
  import WeatherCard from "./weathercard";
  import MapView from "./mapview";
  import "./App.css";

  const API_KEY = "ba2c501303c394b73b15a36c6989d93c"; // OpenWeather API key (hardcoded for testing)

  function App() {
    const [city, setCity] = useState("");
    const [weather, setWeather] = useState(null);
    const [error, setError] = useState("");
    const [bg, setBg] = useState("default.jpg");
    const [layer, setLayer] = useState("clouds_new");

    useEffect(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(fetchByCoords, () => {
          // ignore error, user can search manually
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchByCoords = async (positionOrLat, lonParam) => {
      let lat, lon;
      if (typeof positionOrLat === "object" && positionOrLat.coords) {
        lat = positionOrLat.coords.latitude;
        lon = positionOrLat.coords.longitude;
      } else {
        lat = positionOrLat;
        lon = lonParam;
      }
      await getWeatherData(`lat=${lat}&lon=${lon}`);
    };

    const fetchByCity = async () => {
      if (city.trim() === "") {
        setError("Please enter a city name");
        return;
      }
      await getWeatherData(`q=${city}`);
    };

    const getWeatherData = async (query) => {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?${query}&appid=${API_KEY}&units=metric`
        );
        const data = await res.json();
        if (data.cod !== 200) throw new Error(data.message || "API error");

        setWeather(data);
        setError("");
        updateBackground(data.weather[0].main || "");
      } catch (e) {
        setError(e?.message || "City not found or API issue");
        setWeather(null);
      }
    };

    const updateBackground = (condition) => {
      if (condition.includes("Rain")) setBg("rainy.jpg");
      else if (condition.includes("Cloud")) setBg("cloudy.jpg");
      else if (condition.includes("Snow")) setBg("snow.jpg");
      else if (condition.includes("Clear")) setBg("sunny.jpg");
      else setBg("default.jpg");
    };

    return (
      <div
        className="app"
        style={{
          backgroundImage: `url(/assets/${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "100vh",
          color: "#fff",
        }}
      >
        <div className="weather-box">
          <h1 className="title">🌦️ Dynamic Weather Dashboard</h1>

          <div className="search">
            <input
              type="text"
              placeholder="Enter city name"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <button onClick={fetchByCity}>Search</button>
          </div>

          {error && <p className="error">{error}</p>}
          {weather && <WeatherCard data={weather} />}

          <div className="layer-controls">
            <button onClick={() => setLayer("clouds_new")}>☁️ Clouds</button>
            <button onClick={() => setLayer("precipitation_new")}>🌧️ Rain</button>
            <button onClick={() => setLayer("temp_new")}>🌡️ Temperature</button>
            <button onClick={() => setLayer("pressure_new")}>🌪️ Pressure</button>
          </div>

          <h2 className="map-title">🗺️ Live Google Map</h2>
          <MapView layer={layer} onLocationSelect={(lat, lon) => fetchByCoords(lat, lon)} />
        </div>
      </div>
    );
  }

  export default App;
