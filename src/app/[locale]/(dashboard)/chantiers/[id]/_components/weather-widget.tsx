"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { CloudRain, Cloud, Sun, CloudLightning, CloudSnow } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface WeatherWidgetProps {
  address: string;
}

interface WeatherData {
  temp: number;
  condition: number;
}

export function WeatherWidget({ address }: WeatherWidgetProps) {
  const t = useTranslations("projects.meteo");
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }

    async function fetchWeather() {
      try {
        setLoading(true);
        // 1. Geocode
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
        const geoData = await geoRes.json();
        
        if (!geoData || geoData.length === 0) {
          setError(true);
          return;
        }
        
        const { lat, lon } = geoData[0];

        // 2. Open-Meteo
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const weatherData = await weatherRes.json();

        if (weatherData && weatherData.current_weather) {
          setData({
            temp: Math.round(weatherData.current_weather.temperature),
            condition: weatherData.current_weather.weathercode,
          });
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, [address]);

  if (loading) {
    return (
      <Card className="bg-muted/30 border-none shadow-none">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <Skeleton className="h-7 w-12" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return null;
  }

  // WMO Weather interpretation codes
  // 0 : clear sky
  // 1,2,3 : mainly clear, partly cloudy, overcast
  // 45,48 : fog
  // 51,53,55 : drizzle
  // 61,63,65 : rain
  // 71,73,75 : snow
  // 95,96,99 : t-storm
  
  const getIconAndText = (code: number) => {
    if (code === 0 || code === 1) return { icon: Sun, text: t("conditions.sunny"), color: "text-amber-500" };
    if (code === 2 || code === 3) return { icon: Cloud, text: t("conditions.cloudy"), color: "text-neutral-500" };
    if (code >= 51 && code <= 67) return { icon: CloudRain, text: t("conditions.rainy"), color: "text-blue-500" };
    if (code >= 71 && code <= 77) return { icon: CloudSnow, text: t("conditions.snowy"), color: "text-cyan-400" };
    if (code >= 95 && code <= 99) return { icon: CloudLightning, text: t("conditions.stormy"), color: "text-purple-500" };
    return { icon: Cloud, text: t("conditions.cloudy"), color: "text-neutral-500" };
  };

  const { icon: Icon, text, color } = getIconAndText(data.condition);

  return (
    <Card className="bg-muted/30 border-none shadow-none">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-background rounded-full shadow-sm ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium">{text}</p>
            <p className="text-xs text-muted-foreground">{t("title")}</p>
          </div>
        </div>
        <div className="text-2xl font-light tracking-tight">
          {data.temp}°
        </div>
      </CardContent>
    </Card>
  );
}