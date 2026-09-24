export type Mode = 'sunset' | 'sunrise';

export interface SpotRawData {
  cloud_cover_low: number;
  cloud_cover_mid: number;
  cloud_cover_high: number;
  visibility_metres: number;
  visibility_km: number;
}

export interface SpotItem {
  name: string;
  lat: number;
  lon: number;
  facing: 'east' | 'west';
  score: number;
  eventTime: string;
  raw: SpotRawData;
}

export interface SkyApiResponse {
  mode: Mode;
  outOfRange?: boolean;
  message?: string;
  date: string;
  availableDates: string[];
  eventTime: string;
  rankedSpots: SpotItem[];
  allSpots: SpotItem[];
  missingSpots: string[];
  error?: string;
  status?: number;
}

export interface ApodApiResponse {
  date: string;
  title: string;
  explanation: string;
  url: string;
  media_type: 'image' | 'video' | string;
  credit: string;
  error?: string;
  status?: number;
  message?: string;
}

export interface HealthApiResponse {
  keyConfigured: boolean;
  upstreams: {
    openMeteo: number | string | null;
    nasa: number | string | null;
  };
  timestamp: string;
}

export interface NearestBusStop {
  code: string;
  name: string;
  road: string;
  metresFromSpot: number;
  source: 'LTA DataMall' | 'built-in fallback list';
}

export interface NearestSpotItem {
  name: string;
  lat: number;
  lon: number;
  facing: 'east' | 'west';
  distanceFromUserKm: number | null;
  nearestBusStop: NearestBusStop;
}

export interface NearestApiResponse {
  fetchedAt: string;
  source: string;
  usingFallback: boolean;
  fallbackReason?: string | null;
  spots: NearestSpotItem[];
  userLocationProvided: boolean;
  error?: string;
  status?: number;
  reference?: string;
  message?: string;
}

export interface BusServiceArrival {
  serviceNo: string;
  nextBus: {
    arrival: string;
    load: string;
    busType: string;
    feature: string;
  };
  subsequentBuses: string[];
}

export interface ArrivalsApiResponse {
  fetchedAt?: string;
  source?: string;
  busStopCode?: string;
  noBusesDue?: boolean;
  services?: BusServiceArrival[];
  error?: string;
  status?: number;
  reference?: string;
  message?: string;
}

