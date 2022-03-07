import React, {useEffect, useRef, useState,useMemo,memo, useCallback} from 'react';
import  mapboxgl from 'mapbox-gl';
//import generator from './components/generator';
import { usePosition } from 'use-position';
import 'mapbox-gl/dist/mapbox-gl.css'; 
import axios from 'axios';
import Feature,{Map,Source,Layer,Marker,Popup} from 'react-map-gl'
import Pin from './pin'
import {clusterLayer, clusterCountLayer, unclusteredPointLayer} from './layers';
import type {GeoJSONSource} from 'react-map-gl';
import type {MapRef} from 'react-map-gl';
import location from './location.png'
import pin from './map-pin.png'


const Home = ()=>{
  //split to tiles
  //memo if geoJSON unchanged
  // fire full load on drag, unzooom only map + button load events, on specific zoom
  //add types
  interface pointObject {
    type: string
    coordinates: [x:number, y:number]
  }
  interface featureObject {
    type: string,
    properties: object
    geometry: pointObject
  }
  interface geoJSONObject {
    type: string,
    features: Array<featureObject>
  }
  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const mapRef = useRef<MapRef | null>(null);
  const [points,setPoints] = useState<[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { latitude, longitude, error }:{latitude: number, longitude: number, error: string} = usePosition();
  const [render, setRender] = useState(0);
  const initialState = {
    longitude: 19.145136,
    latitude: 51.919438,
    zoom: 5
  }
 
  // if(mapRef.current!==null){
  //   mapRef.current.on('click', 'unclustered-point', (e:any) => {
  //     e.preventDefault()
  //     const coordinates = e.features[0].geometry.coordinates.slice();

  //     while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
  //       coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  //     }
  //     console.log(e)
  // });
  // }
  

  const getPoints = useCallback(() =>{
    return (axios.get('/api', {
      params: {
        quantity: 20000
      }
    }).then(res=>{
      setPoints(res.data)
    }).catch(err=> {throw err}))
  },[])

  const [start, setStart] = useState(initialState)
  useEffect(()=>{
    getPoints()
  },[])

  const [selected, setSelected] = useState(null);

  
  
  const pins = useMemo(
    () =>
      points!==null?
      points.map((event, index) => (
        <Marker
          key={`marker-${index}`}
          longitude={event.longitude}
          latitude={event.latitude}
          anchor="bottom"
        >
          <Pin onClick={() => {console.log('clicked'); setSelected(event)}} />
        </Marker>
      )):'',
    []
  );
  const selectedEvent = (selected && selected.sport) || '';
  // const addMapEventListeners = ()=>{
  //   //single event
  //   map.current.on('click', 'unclustered-point', (e:any) => {
  //     const coordinates = e.features[0].geometry.coordinates.slice();

  //     while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
  //       coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  //     }
       
  //     new mapboxgl.Popup()
  //       .setLngLat(coordinates)
  //       .setHTML(`<div><h2>${e.features[0].properties.sport}</h2><div>${e.features[0].properties.host}</div></div>`)
  //       .addTo(map.current);
  //   });
  //   //cluster
  //   map.current.on('click', 'clusters', (e:any) => {
  //     const features = map.current.queryRenderedFeatures(e.point, {
  //       layers: ['clusters']
  //     });
  //     const clusterId = features[0].properties.cluster_id;
  //     map.current.getSource('places').getClusterExpansionZoom(
  //       clusterId,
  //       (err:any, zoom:any ) => {
  //         if (err) return;
  //         map.current.easeTo({
  //           center: features[0].geometry.coordinates,
  //           zoom: zoom
  //         });
  //       }
  //     );
  //   });
  //   //mouseenter & mouseleave
  //   map.current.on('mouseenter', 'unclustered-point', () => {
  //     map.current.getCanvas().style.cursor = 'pointer';
  //   });
      
  //   map.current.on('mouseleave', 'unclustered-point', () => {
  //     map.current.getCanvas().style.cursor = '';
  //   });
  //   //map loaded
  //   map.current.on('idle', () => {
  //     setLoading(false);
  //   });
  // }
  const geoJSON = useMemo(()=>{
    if(points===null) return
    console.log(points)
    return {
        'type': 'FeatureCollection',
        'features': points
    }
  },[points])


  useEffect(() => {
    if(mapRef.current === null) return;
    const map = mapRef.current.getMap();
    map.loadImage(pin.src, (error, image) => {
        if (error) throw error;
        if (!map.hasImage('map-pin')) map.addImage('map-pin', image, { sdf: true });
    });
  }, [mapRef]);

  const onClick = (event:any) => {
    if(mapRef.current===null) return;
    const feature = event.features[0];
    const clusterId = feature.properties.cluster_id;
    console.log(event)

    const mapboxSource = mapRef.current.getSource('events') as GeoJSONSource;

    mapboxSource.getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) {
        return;
      }
      if(mapRef.current===null) return;
      mapRef.current.easeTo({
        center: feature.geometry.coordinates,
        zoom,
        duration: 500
      });
    });
  };
  useEffect(()=>{
    if (error || !latitude) return; 
    if (latitude && longitude && !error) {
      setStart((prev)=>({
        ...prev,
        longitude: longitude,
        latitude: latitude,
        zoom: 10
      }))
    }
  },[longitude,latitude,error])

  useEffect( ()=>{
    if(loading === true) return;
    if(mapRef.current=== null) return;
    mapRef.current.flyTo({
      center: [start.longitude,start.latitude],
      zoom: start.zoom
    })
  },[start,mapRef,loading])
  
  return <>
    <div id='static' className={loading?'':'hide'}><img src={`https://api.mapbox.com/styles/v1/mapbox/light-v10/static/${initialState.longitude},${initialState.latitude-6},${initialState.zoom}/720x1280?access_token=${MAPBOX_TOKEN}`} /></div>
    <div className={loading?'hide container':'container'} >
      <Map reuseMaps
        initialViewState={start}
        maxZoom={13}
        minZoom={5}
        mapStyle= 'mapbox://styles/slatacz/cl09oziqt000x15s1igs277dx'
        mapboxAccessToken={MAPBOX_TOKEN}
        interactiveLayerIds={[clusterLayer.id]}
        id = {'test'+render}
        onClick={onClick}
        ref={mapRef}
      >
        <Marker longitude={start.longitude} latitude={start.latitude} anchor="bottom" >
          <img src={location.src} height={start.zoom*6+'px'} width={start.zoom*6+'px'}/>
        </Marker>
        {points !== null? <Source id="events" type="geojson" cluster={true}
          clusterMaxZoom={14}
          clusterRadius={100} data={geoJSON}>
          {}
          <Layer {...clusterLayer} />
          <Layer {...clusterCountLayer} />
          <Layer {...unclusteredPointLayer}>
          </Layer>
        </Source>:''
        }
        {selectedEvent && (
          <Popup
            longitude={selected.longitude}
            latitude={selected.latitude}
            offset={[0, -10]}
            closeButton={true}
            className="event-info"
          >
            {selectedEvent}
          </Popup>
        )}
      </Map>
    </div>
    <button onClick={()=>getPoints()}>generate</button>
    <button onClick={()=>setRender(prev=>prev+1)}>render</button>
  </>;
}

export default Home
