import React, {useEffect, useRef, useState,useMemo,memo, useCallback} from 'react';
import  mapboxgl from 'mapbox-gl';
//import generator from './components/generator';
import { usePosition } from 'use-position';
import 'mapbox-gl/dist/mapbox-gl.css'; 
import axios from 'axios';

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
  mapboxgl.accessToken = 'pk.eyJ1Ijoic2xhdGFjeiIsImEiOiJja24yNnFsNmgwY3gzMnFtbjNxODR2Z2Z6In0.L1xJBH_-hTpQ4QCRoNCDCQ';
  const mapRef = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [points,setPoints] = useState<geoJSONObject | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { latitude, longitude, error }:{latitude: number, longitude: number, error: string} = usePosition();
  const [render, setRender] = useState(0);
  const initialState = {
    ln: 19.145136,
    lt: 51.919438,
    zoom: 5
  }
  //delete previous markers if there are any
  const [start, setStart] = useState(initialState)
  const addMapEventListeners = ()=>{
    //single event
    map.current.on('click', 'unclustered-point', (e:any) => {
      const coordinates = e.features[0].geometry.coordinates.slice();

      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }
       
      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`<div><h2>${e.features[0].properties.sport}</h2><div>${e.features[0].properties.host}</div></div>`)
        .addTo(map.current);
    });
    //cluster
    map.current.on('click', 'clusters', (e:any) => {
      const features = map.current.queryRenderedFeatures(e.point, {
        layers: ['clusters']
      });
      const clusterId = features[0].properties.cluster_id;
      map.current.getSource('places').getClusterExpansionZoom(
        clusterId,
        (err:any, zoom:any ) => {
          if (err) return;
          map.current.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
          });
        }
      );
    });
    //mouseenter & mouseleave
    map.current.on('mouseenter', 'unclustered-point', () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });
      
    map.current.on('mouseleave', 'unclustered-point', () => {
      map.current.getCanvas().style.cursor = '';
    });
    //map loaded
    map.current.on('idle', () => {
      setLoading(false);
    });
  }

  const addLayersOnLoad = () =>{
    if(map.current ===null) return
    map.current.on('load', ()=>{
      console.log('loading image')
      // addImage
      map.current.loadImage(
        'https://i.ibb.co/3p77qkp/pin.png',
        (error:any, image:any) => {
          if (error) console.log(error) ;
          map.current.addImage('pin', image);
      });
      //add GeoJSON as source
      map.current.addSource('places', {
        type: 'geojson',
        data: points,
        cluster: true,
        clusterMaxZoom: 13, 
        clusterRadius: 100,
        tolerance: 1
      })

      //cluster layer
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'places',
        filter: ['has', 'point_count'],
        paint: {
            // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
            // with three steps to implement three types of circles:
            //   * Blue, 20px circles when point count is less than 100
            //   * Yellow, 30px circles when point count is between 100 and 750
            //   * Pink, 40px circles when point count is greater than or equal to 750
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#51bbd6',
              100,
              '#f1f075',
              750,
              '#f28cb1'
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              20,
              100,
              30,
              750,
              40
            ]
          }
      });
      // cluster count
      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'places',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        }
      });
      // single event
      map.current.addLayer({
        id: 'unclustered-point',
        type: 'symbol',
        source: 'places',
        layout: {
          'icon-image': 'pin',
          'icon-allow-overlap': true,
          'icon-size': 0.05
          },
        filter: ['!', ['has', 'point_count']],
      });
      
    })
  }
  const getPoints = useCallback(() =>{
    return (axios.get('/api', {
      params: {
        quantity: 100000
      }
    }).then(res=>{
      setPoints(res.data)
    }).catch(err=> {throw err}))
  },[])


  const generateMap = useCallback(()=>{
    setLoading(true);
    return map.current = new mapboxgl.Map({
      container: mapRef.current,
      type: "vector",
      style: 'mapbox://styles/slatacz/cl09oziqt000x15s1igs277dx',
      center: [start.ln, start.lt],
      zoom: start.zoom,
      maxZoom: 15,
      minZoom: 6
    })
  },[getPoints])

  useEffect(()=>{
    getPoints()
  },[])

  useEffect(()=>{
    console.log(points)
  },[points])
  
  useEffect( ()=>{
    if(loading === true) return;
    if(map.current=== null) return;
    const marker1 = new mapboxgl.Marker()
      .setLngLat([start.ln,start.lt])
      .addTo(map.current);
    map.current.flyTo({
      center: [start.ln,start.lt],
      zoom: start.zoom
    });
  },[loading])

  useEffect(()=>{
    if (error || !latitude) return; 
    if (latitude && longitude && !error) {
      setStart((prev)=>({
        ...prev,
        ln: longitude,
        lt: latitude,
        zoom: 10
      }))
    }
  },[longitude,latitude,error])
  
  useEffect(()=>{
    if(points !== null) {
      generateMap();
      addMapEventListeners();
      addLayersOnLoad();
    }
    
  },[points,render])
  return <>
    <div id='static' className={loading?'':'hide'}><img src={`https://api.mapbox.com/styles/v1/mapbox/light-v10/static/${initialState.ln},${initialState.lt-6},${initialState.zoom}/720x1280?access_token=${mapboxgl.accessToken}`} /></div>
    <div className={loading?'hide container':'container'} ref = {mapRef}></div>
    <button onClick={()=>getPoints()}>generate</button>
    <button onClick={()=>setRender(prev=>prev+1)}>render</button>
  </>;
}

export default Home
