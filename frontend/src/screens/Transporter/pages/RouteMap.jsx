import { useMemo } from "react";
import { GoogleMap, useLoadScript, MarkerF } from "@react-google-maps/api";
import { DashHead } from "../../../components/DashHead";
import {
  Panel,
  StatCard,
  LoadingState,
  ErrorState,
} from "../../../components/DashboardBits";
import { IconPaths } from "../../../components/icons";
import { useAsync } from "../services/useTransporter";
import { getActiveTrip } from "../services/transporterApi";

export function RouteMap() {
  const { data: trip, loading, error, reload } = useAsync(getActiveTrip, []);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "", // Or process.env.REACT_APP_GOOGLE_MAPS_API_KEY
  });
  const currentLocation = useMemo(() => {
    return trip
      ? { lat: trip.currentLat || -1.1018, lng: trip.currentLng || 37.0144 }
      : { lat: -1.1018, lng: 37.0144 };
  }, [trip]);

  const destinationLocation = useMemo(() => {
    return trip
      ? { lat: trip.destLat || -1.2921, lng: trip.destLng || 36.8219 }
      : { lat: -1.2921, lng: 36.8219 };
  }, [trip]);
  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: true, // Keeps the dashboard clean and uncluttered
      zoomControl: true,
    }),
    [],
  );

  return (
    <>
      <DashHead
        title="Route & GPS Log"
        subtitle="Live location and route for your current trip."
      />

      {loading && (
        <Panel>
          <LoadingState label="Loading GPS data…" />
        </Panel>
      )}
      {!loading && error && (
        <Panel>
          <ErrorState message="Couldn't load GPS data." onRetry={reload} />
        </Panel>
      )}

      {!loading && !error && trip && (
        <>
          <div className="stat-grid">
            <StatCard
              icon={IconPaths.route}
              flagText="Remaining"
              value={`${trip.distanceRemainingKm} km`}
              label="Distance remaining"
            />
            <StatCard
              icon={IconPaths.clock}
              flagText="Estimated"
              value={trip.eta}
              label="ETA"
            />
            <StatCard
              icon={IconPaths.truck}
              flagText="Vehicle"
              value={trip.vehicle}
              label="On this trip"
            />
          </div>

          <Panel title="Live map">
            <div
              style={{
                position: "relative",
                height: 260,
                borderRadius: 12,
                border: "1.5px solid var(--border-soft)",
                background: "var(--cream-100)",
                overflow: "hidden",
              }}
            >
              {loadError && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--rust-600)', fontSize: 13 }}>
                  Error loading map. Please verify your API key.
                </div>
              )}
              {!isLoaded && !loadError && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ink-600)', fontSize: 13 }}>
                  Loading Google Maps...
                </div>
              )}
              {isLoaded && (
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={currentLocation}
                  zoom={11}
                  options={mapOptions}
                >
                  <MarkerF position={currentLocation} label="Current" />
                  <MarkerF position={destinationLocation} label="Destination" />
                </GoogleMap>
              )}
            </div>

            <p
              style={{ fontSize: 11.5, color: "var(--ink-600)", marginTop: 10 }}
            >
  
            </p>
          </Panel>

          <Panel title="Trip route">
            <p style={{ fontSize: 13, color: "var(--ink-600)", margin: 0 }}>
              {trip.route}
            </p>
          </Panel>
        </>
      )}
    </>
  );
}
