import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Village } from '../types';
import { 
  Layers, MapPin, ZoomIn, ZoomOut, RotateCcw, Search, 
  Play, Pause, Radio, Shield, Crosshair, Eye, FastForward,
  Compass, Target, AlertTriangle, Zap
} from 'lucide-react';

interface LeafletMapProps {
  villages: Village[];
  selectedVillageId: number | null;
  onSelectVillage: (villageId: number) => void;
  onOpenVillageDetail: (villageId: number) => void;
}

type MapLayerMode = 'satellite' | 'relief' | 'standard';
type MilitaryFilterMode = 'normal' | 'flir' | 'thermal';

export const LeafletMap: React.FC<LeafletMapProps> = ({
  villages,
  selectedVillageId,
  onSelectVillage,
  onOpenVillageDetail
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<{ [id: number]: L.Marker }>({});

  // Mode Satellite par défaut
  const [activeLayer, setActiveLayer] = useState<MapLayerMode>('satellite');
  const [metricDisplay, setMetricDisplay] = useState<'chambres' | 'familles' | 'structures'>('chambres');
  const [mapSearch, setMapSearch] = useState('');
  
  // WAR SATELLITE LIVE ORBIT SYSTEM
  const [isLiveOrbit, setIsLiveOrbit] = useState(true);
  const [orbitSpeed, setOrbitSpeed] = useState<1 | 2 | 4>(2); // 1x, 2x, 4x speed
  const [militaryFilter, setMilitaryFilter] = useState<MilitaryFilterMode>('normal');
  const [lockedVillageId, setLockedVillageId] = useState<number | null>(null);
  
  // Telemetry stream state
  const [telemetry, setTelemetry] = useState({
    lat: 11.4350,
    lng: -9.1750,
    alt: 418.6,
    vel: 7.68,
    azimuth: 142.4,
    elevation: 51.6,
    scanCount: 1740
  });

  const orbitAngleRef = useRef<number>(0);
  const orbitAnimRef = useRef<number | null>(null);
  const centerBase = useRef<{ lat: number; lng: number }>({ lat: 11.435, lng: -9.175 });

  // Tile layers configuration (Satellite default, Relief, Standard)
  const tileLayerUrls: Record<MapLayerMode, { url: string; attribution: string; maxZoom: number }> = {
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri &mdash; Maxar, Earthstar Geographics',
      maxZoom: 18
    },
    relief: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenTopoMap contributors',
      maxZoom: 17
    },
    standard: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Siguiri / Koron Hospital region
    const map = L.map(mapContainerRef.current, {
      center: [centerBase.current.lat, centerBase.current.lng],
      zoom: 12,
      zoomControl: false,
      attributionControl: false
    });

    const cfg = tileLayerUrls.satellite;
    const tileLayer = L.tileLayer(cfg.url, {
      maxZoom: cfg.maxZoom,
      attribution: cfg.attribution
    }).addTo(map);

    currentTileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    // Listen to manual map moves
    map.on('move', () => {
      const center = map.getCenter();
      setTelemetry(prev => ({
        ...prev,
        lat: Number(center.lat.toFixed(4)),
        lng: Number(center.lng.toFixed(4))
      }));
    });

    return () => {
      if (orbitAnimRef.current) cancelAnimationFrame(orbitAnimRef.current);
      map.remove();
      mapInstanceRef.current = null;
      currentTileLayerRef.current = null;
    };
  }, []);

  // Update Base Tile Layer when mode changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    const cfg = tileLayerUrls[activeLayer];
    const newLayer = L.tileLayer(cfg.url, {
      maxZoom: cfg.maxZoom,
      attribution: cfg.attribution
    }).addTo(map);

    newLayer.bringToBack();
    currentTileLayerRef.current = newLayer;
  }, [activeLayer]);

  // =========================================================================
  // WAR SATELLITE ACTIVE ORBIT FLIGHT ENGINE
  // Moves the camera along an elliptical military surveillance trajectory!
  // =========================================================================
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    let lastFrameTime = performance.now();
    const radiusLat = 0.038;
    const radiusLng = 0.058;

    const runWarSatelliteOrbit = (time: number) => {
      if (!isLiveOrbit) return;

      const deltaMs = time - lastFrameTime;

      // Run update roughly every 24-32ms for ultra-smooth physical motion
      if (deltaMs > 28) {
        lastFrameTime = time;

        // If target locked onto a specific village, circle closely around that village!
        let targetCenter = centerBase.current;
        if (lockedVillageId) {
          const lockedVillage = villages.find(v => v.id === lockedVillageId);
          if (lockedVillage) {
            targetCenter = { lat: lockedVillage.latitude, lng: lockedVillage.longitude };
          }
        }

        // Angular increment depends on speed multiplier (1x, 2x, 4x)
        const angularSpeed = 0.0035 * orbitSpeed;
        orbitAngleRef.current = (orbitAngleRef.current + angularSpeed) % (2 * Math.PI);

        const currentAngle = orbitAngleRef.current;

        // Calculate satellite orbital position
        const satLat = targetCenter.lat + Math.sin(currentAngle) * (lockedVillageId ? 0.012 : radiusLat);
        const satLng = targetCenter.lng + Math.cos(currentAngle) * (lockedVillageId ? 0.016 : radiusLng);

        // Pan map smoothly to the satellite eye coordinates
        map.panTo([satLat, satLng], { animate: false, noMoveStart: true });

        // Update war telemetry readouts
        setTelemetry(prev => ({
          lat: Number(satLat.toFixed(5)),
          lng: Number(satLng.toFixed(5)),
          alt: Number((418.6 + Math.sin(currentAngle * 2) * 1.8).toFixed(1)),
          vel: Number((7.68 + Math.cos(currentAngle) * 0.05).toFixed(2)),
          azimuth: Number(((currentAngle * (180 / Math.PI) + 180) % 360).toFixed(1)),
          elevation: Number((51.6 + Math.sin(currentAngle) * 4.2).toFixed(1)),
          scanCount: prev.scanCount + 1
        }));
      }

      orbitAnimRef.current = requestAnimationFrame(runWarSatelliteOrbit);
    };

    if (isLiveOrbit) {
      orbitAnimRef.current = requestAnimationFrame(runWarSatelliteOrbit);
    } else if (orbitAnimRef.current) {
      cancelAnimationFrame(orbitAnimRef.current);
    }

    return () => {
      if (orbitAnimRef.current) cancelAnimationFrame(orbitAnimRef.current);
    };
  }, [isLiveOrbit, orbitSpeed, lockedVillageId, villages]);

  // Update Markers with Pulse / Blink Effect
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    villages.forEach(v => {
      let color = v.heatmap_chambres.hex;
      let metricLabel = `${v.taux_chambres_pct}% (Chambres)`;
      let metricValue = v.taux_chambres_pct;

      if (metricDisplay === 'familles') {
        color = v.heatmap_familles.hex;
        metricLabel = `${v.taux_familles_pct}% (Familles)`;
        metricValue = v.taux_familles_pct;
      } else if (metricDisplay === 'structures') {
        color = v.taux_structures_pct >= 97 ? '#047857' : v.taux_structures_pct >= 75 ? '#d97706' : '#dc2626';
        metricLabel = `${v.taux_structures_pct}% (Structures)`;
        metricValue = v.taux_structures_pct;
      }

      const isSelected = v.id === selectedVillageId;
      const isLocked = v.id === lockedVillageId;

      // Pulsing DivIcon with War Target Bracket if locked
      const iconHtml = `
        <div class="custom-pulse-marker ${isSelected ? 'marker-selected' : ''} ${isLocked ? 'animate-target-lock' : ''}" title="${v.nom} (${metricLabel})">
          <div class="pulse-beacon" style="background-color: ${color};"></div>
          <div class="pulse-core" style="background-color: ${color}; ${isLocked ? 'border-color: #ef4444; box-shadow: 0 0 16px #ef4444;' : ''}"></div>
          ${isLocked ? '<div style="position: absolute; inset: -8px; border: 2px dashed #ef4444; border-radius: 6px; pointer-events: none;"></div>' : ''}
        </div>
      `;

      const pulseIcon = L.divIcon({
        html: iconHtml,
        className: 'leaflet-pulsing-marker-wrapper',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -14]
      });

      const marker = L.marker([v.latitude, v.longitude], { icon: pulseIcon }).addTo(map);

      // Interactive Hover Tooltip
      const tooltipContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 11px; padding: 2px 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <b style="font-size: 12px; color: #0f172a;">${v.nom}</b>
            <span style="font-size: 9px; font-family: monospace; background: #0f172a; color: #38bdf8; padding: 1px 4px; border-radius: 3px;">KORON-SAT</span>
          </div>
          <div style="color: ${color}; font-weight: 700; margin-top: 2px;">
            ${metricLabel}
          </div>
          <div style="color: #64748b; font-size: 10px;">
            ${v.structures_pulverisees} / ${v.nb_structures_total} structures · ${v.pop_couverte_total} hab.
          </div>
          <div style="color: #0284c7; font-size: 9px; margin-top: 2px;">
            Cliquer pour verrouillage
          </div>
        </div>
      `;

      marker.bindTooltip(tooltipContent, {
        direction: 'top',
        offset: [0, -10],
        opacity: 0.95,
        className: 'custom-leaflet-tooltip'
      });

      // Interactive Click Popup
      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 230px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
            <div>
              <div style="font-weight: 800; font-size: 15px; color: #0f172a; line-height: 1.1;">
                ${v.nom}
              </div>
              <span style="font-size: 10px; color: #64748b; font-family: monospace;">CODE: ${v.code} · ${v.type}</span>
            </div>
            <span style="
              font-size: 10px;
              font-weight: 700;
              padding: 2px 6px;
              border-radius: 9999px;
              background: ${metricValue >= 97 ? '#dcfce7' : '#fef3c7'};
              color: ${metricValue >= 97 ? '#15803d' : '#b45309'};
            ">
              ${metricValue >= 97 ? 'Obj. Atteint' : 'En cours'}
            </span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 5px; border-radius: 6px; text-align: center;">
              <div style="font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 600;">% Chambres</div>
              <div style="font-weight: 800; font-size: 15px; color: ${v.heatmap_chambres.hex}; font-family: monospace;">
                ${v.taux_chambres_pct}%
              </div>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 5px; border-radius: 6px; text-align: center;">
              <div style="font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 600;">% Familles</div>
              <div style="font-weight: 800; font-size: 15px; color: ${v.heatmap_familles.hex}; font-family: monospace;">
                ${v.taux_familles_pct}%
              </div>
            </div>
          </div>

          <div style="font-size: 11px; color: #334155; line-height: 1.5; margin-bottom: 10px; background: #f1f5f9; padding: 6px; border-radius: 6px;">
            <div>• Structures : <b>${v.structures_pulverisees} / ${v.nb_structures_total}</b> (${v.taux_structures_pct}%)</div>
            <div>• Recharges Actellic : <b>${v.can_refills_total}</b> bidons</div>
            <div>• Population protégée : <b>${v.pop_couverte_total.toLocaleString('fr-FR')}</b> hab.</div>
          </div>

          <div style="display: flex; gap: 6px;">
            <button id="btn-lock-${v.id}" style="
              flex: 1;
              background: #ef4444;
              color: white;
              border: none;
              padding: 6px 8px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
            ">
               Concentrer sur la ville
            </button>
            <button id="btn-detail-${v.id}" style="
              flex: 1.2;
              background: #047857;
              color: white;
              border: none;
              padding: 6px 8px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 600;
              cursor: pointer;
            ">
              Fiche Village →
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 280 });

      marker.on('click', () => {
        onSelectVillage(v.id);
        setLockedVillageId(v.id);
      });

      marker.on('popupopen', () => {
        setTimeout(() => {
          const btnLock = document.getElementById(`btn-lock-${v.id}`);
          if (btnLock) {
            btnLock.onclick = () => {
              setLockedVillageId(v.id);
              marker.closePopup();
            };
          }
          const btnDetail = document.getElementById(`btn-detail-${v.id}`);
          if (btnDetail) {
            btnDetail.onclick = () => onOpenVillageDetail(v.id);
          }
        }, 50);
      });

      markersRef.current[v.id] = marker;
    });
  }, [villages, selectedVillageId, lockedVillageId, metricDisplay, onSelectVillage, onOpenVillageDetail]);

  // Handlers for Map Controls
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetView = () => {
    setLockedVillageId(null);
    mapInstanceRef.current?.setView([centerBase.current.lat, centerBase.current.lng], 12);
  };

  const handleSearchSelect = (vId: number) => {
    const target = villages.find(v => v.id === vId);
    if (!target || !mapInstanceRef.current) return;

    onSelectVillage(vId);
    setLockedVillageId(vId);
    mapInstanceRef.current.flyTo([target.latitude, target.longitude], 13, { duration: 1.2 });
    setMapSearch('');
  };

  const handleUnlockTarget = () => {
    setLockedVillageId(null);
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950 font-sans select-none">
      
      {/* ========================================================================= */}
      {/* TOP MILITARY WAR SATELLITE COMMAND BANNER (SATELLITE D'ORBITATION)          */}
      {/* ========================================================================= */}
      <div className="relative z-20 bg-slate-950/90 backdrop-blur-md px-3 sm:px-4 py-2 border-b border-slate-800 text-white flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Unit Identity & Active Beacon */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-950/80 border border-red-600/80 text-red-400 text-[10px] font-mono font-black tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
            KORON-SAT // KORON-RECON-09
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-300">
            <span className="text-emerald-400 font-bold">ALT: {telemetry.alt} KM</span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400 font-bold">V: {telemetry.vel} KM/S</span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-400">AZ: {telemetry.azimuth}° / EL: {telemetry.elevation}°</span>
          </div>
        </div>

        {/* Tactical Controls: Orbit Toggle, Speed, & Modes */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Live Orbit  Rotation Toggle */}
          <button
            type="button"
            onClick={() => setIsLiveOrbit(!isLiveOrbit)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer shadow-sm ${
              isLiveOrbit
                ? 'bg-red-600 hover:bg-red-500 text-white ring-2 ring-red-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Activer / Arrêter la rotation d'orbite"
          >
            {isLiveOrbit ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isLiveOrbit ? 'ORBITATION : ACTIVE' : 'ORBITE : PAUSE'}</span>
          </button>

          {/* Speed Multiplier (1X, 2X, 4X) */}
          {isLiveOrbit && (
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-[10px] font-mono font-bold">
              <button
                onClick={() => setOrbitSpeed(1)}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${orbitSpeed === 1 ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Vitesse 1X : Patrouille Tactique"
              >
                1X
              </button>
              <button
                onClick={() => setOrbitSpeed(2)}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${orbitSpeed === 2 ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Vitesse 2X : Surveillance Standard"
              >
                2X
              </button>
              <button
                onClick={() => setOrbitSpeed(4)}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${orbitSpeed === 4 ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Vitesse 4X : Interception Haute Vitesse"
              >
                4X
              </button>
            </div>
          )}

          {/* Military Filter Modes: Normal Satellite, FLIR Night Vision, Thermal Matrix */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-[10px] font-mono font-bold">
            <button
              onClick={() => setMilitaryFilter('normal')}
              className={`px-2 py-1 rounded cursor-pointer ${militaryFilter === 'normal' ? 'bg-emerald-700 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Optique Satellite HD"
            >
              OPTIQUE
            </button>
            <button
              onClick={() => setMilitaryFilter('flir')}
              className={`px-2 py-1 rounded cursor-pointer ${militaryFilter === 'flir' ? 'bg-green-600 text-black font-extrabold' : 'text-slate-400 hover:text-white'}`}
              title="Vision Nocturne FLIR Militaire (Phosphore Vert)"
            >
              FLIR NV
            </button>
            <button
              onClick={() => setMilitaryFilter('thermal')}
              className={`px-2 py-1 rounded cursor-pointer ${militaryFilter === 'thermal' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Vision Thermique Bio-Détection"
            >
              THERMIQUE
            </button>
          </div>

          {/* Target Lock Status */}
          {lockedVillageId ? (
            <button
              onClick={handleUnlockTarget}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-900/90 text-red-200 border border-red-500 text-[10px] font-bold uppercase animate-pulse cursor-pointer"
            >
              <Target className="w-3 h-3 text-red-400" />
              <span>LOCK: {villages.find(v => v.id === lockedVillageId)?.nom} (DÉVERROUILLER)</span>
            </button>
          ) : (
            <div className="hidden xl:flex items-center gap-1 px-2 py-1 rounded bg-slate-900 text-slate-400 text-[10px] font-mono">
              <Crosshair className="w-3 h-3 text-emerald-400" />
              <span>BALAYAGE 360° ACTIF</span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECONDARY TOOLBAR: MAP LAYERS & METRICS                                   */}
      {/* ========================================================================= */}
      <div className="relative z-20 bg-slate-900/80 backdrop-blur-sm px-3 sm:px-4 py-2 border-b border-slate-800 text-white flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Layer selector */}
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-semibold text-slate-300">Couche Fond :</span>
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-bold">
            <button
              onClick={() => setActiveLayer('satellite')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                activeLayer === 'satellite' ? 'bg-emerald-600 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
               Satellite Koron (Par défaut)
            </button>
            <button
              onClick={() => setActiveLayer('relief')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                activeLayer === 'relief' ? 'bg-emerald-600 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
               Relief Topo
            </button>
            <button
              onClick={() => setActiveLayer('standard')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                activeLayer === 'standard' ? 'bg-emerald-600 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
               Standard OSM
            </button>
          </div>
        </div>

        {/* Metric Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-300">Balises :</span>
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-bold">
            <button
              onClick={() => setMetricDisplay('chambres')}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                metricDisplay === 'chambres' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              % Chambres
            </button>
            <button
              onClick={() => setMetricDisplay('familles')}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                metricDisplay === 'familles' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              % Familles
            </button>
            <button
              onClick={() => setMetricDisplay('structures')}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                metricDisplay === 'structures' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              % Structures
            </button>
          </div>
        </div>

        {/* Quick Search Dropdown */}
        <div className="relative w-48 sm:w-56">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cibler un village..."
            value={mapSearch}
            onChange={(e) => setMapSearch(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden font-mono"
          />
          {mapSearch.trim() && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 max-h-40 overflow-y-auto">
              {villages
                .filter(v => v.nom.toLowerCase().includes(mapSearch.toLowerCase()) || v.code.toLowerCase().includes(mapSearch.toLowerCase()))
                .map(v => (
                  <button
                    key={v.id}
                    onClick={() => handleSearchSelect(v.id)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-800 flex items-center justify-between text-white cursor-pointer"
                  >
                    <span className="font-bold">{v.nom}</span>
                    <span className="font-mono text-[10px] text-emerald-400">{v.taux_structures_pct}%</span>
                  </button>
                ))}
            </div>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* LEAFLET MAP CONTAINER WITH OPTIONAL MILITARY SCANLINES & FILTERS          */}
      {/* ========================================================================= */}
      <div className="relative w-full h-130 sm:h-145 bg-slate-950 overflow-hidden">
        
        {/* Real Leaflet Map */}
        <div 
          ref={mapContainerRef} 
          className={`w-full h-full ${
            militaryFilter === 'flir' ? 'map-filter-flir' : militaryFilter === 'thermal' ? 'map-filter-thermal' : ''
          }`}
        />

        {/* Scanlines Overlay for authentic War Satellite feel */}
        <div className="absolute inset-0 pointer-events-none military-scanlines opacity-40 z-10" />

        {/* Radar Rotating Sweep Cone across satellite feed */}
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center overflow-hidden">
          <div className="w-212.5 h-212.5 rounded-full radar-sweep-beam relative opacity-30">
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-linear-to-br from-emerald-500/30 via-emerald-500/5 to-transparent rounded-tr-full origin-bottom-left" />
          </div>
        </div>

        {/* Center Tactical Crosshair Reticle */}
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
          {/* Milliradian Crosshair Lines */}
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* Outer Range Ring */}
            <div className="absolute inset-0 border border-emerald-500/40 rounded-full" />
            <div className="absolute inset-6 border border-emerald-500/25 rounded-full border-dashed" />
            
            {/* Center crosshair */}
            <div className="w-12 h-0.5 bg-emerald-400/80" />
            <div className="h-12 w-0.5 bg-emerald-400/80 absolute" />
            <div className="w-2.5 h-2.5 rounded-full border border-emerald-400 absolute" />

            {/* Corner Bracket Rangefinders */}
            <div className="absolute -top-3 -left-3 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
            <div className="absolute -top-3 -right-3 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
            <div className="absolute -bottom-3 -left-3 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
            <div className="absolute -bottom-3 -right-3 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
          </div>
        </div>

        {/* Live War Satellite Telemetry Overlay HUD (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-20 bg-black/75 backdrop-blur-md p-3 rounded-xl border border-emerald-500/40 text-emerald-400 font-mono text-[11px] shadow-2xl pointer-events-none">
          <div className="flex items-center gap-2 mb-1 border-b border-emerald-500/30 pb-1 font-bold">
            <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span>OPTICAL SENSOR RECON // KORON-SAT</span>
          </div>
          <div>LAT : <span className="text-white font-bold">{telemetry.lat}° N</span></div>
          <div>LNG : <span className="text-white font-bold">{telemetry.lng}° W</span></div>
          <div>ALT : <span className="text-white font-bold">{telemetry.alt} KM</span> · VEL : <span className="text-cyan-300 font-bold">{telemetry.vel} KM/S</span></div>
          <div className="text-[10px] text-emerald-500/80 mt-1">
            SPECTRE PYRÉTHROÏDE : 8.4 µm (ACTELLIC DÉTECTÉ)
          </div>
        </div>

        {/* Zoom & Reset Floating Buttons (Bottom Right) */}
        <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 flex items-center justify-center shadow-lg transition-colors cursor-pointer"
            title="Zoom Avant"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 flex items-center justify-center shadow-lg transition-colors cursor-pointer"
            title="Zoom Arrière"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            className="w-8 h-8 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-emerald-400 border border-slate-700 flex items-center justify-center shadow-lg transition-colors cursor-pointer"
            title="Recadrer Vue Centrale Siguiri"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* FOOTER LEGEND                                                             */}
      {/* ========================================================================= */}
      <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-[11px]">
          <span className="font-bold text-slate-300">Légende Épidémiologique :</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 border border-white" />
            <span>&ge; 97% (Conforme SAG/OMS)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-white" />
            <span>75% &agrave; 96% (En cours)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-600 border border-white" />
            <span>&lt; 75% (Alerte Épidémique)</span>
          </div>
        </div>

        <span className="text-[10px] text-slate-500 font-mono">
          KORON-SAT · Système de Statistique Géomatique IRS
        </span>
      </div>

    </div>
  );
};
