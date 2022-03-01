import React, {useEffect, useRef, useState} from 'react';
import  mapboxgl from 'mapbox-gl';
import generator from './components/generator';
import { usePosition } from 'use-position';
import polygon from './components/polygon'
import 'mapbox-gl/dist/mapbox-gl.css'; 
import icon from './assets/pin.png'


const Home = ()=>{
  mapboxgl.accessToken = 'pk.eyJ1IjoibmVvc2NhIiwiYSI6ImNrZm80ZnI4MzJlcHoyeW52eGZqeDVpNXcifQ.0b4R6NcNKL9SNDq1q7ECrA';
  const mapRef = useRef<any>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [points,setPoints] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const { latitude, longitude, error } = usePosition();
  const [start, setStart] = useState({
    ln: 19.145136,
    lt: 51.919438,
    zoom: 12
  })
  useEffect(()=>{
    setPoints(generator(1000));
  },[])
  useEffect(()=>{
    if(map.current=== null) return;
    const marker1 = new mapboxgl.Marker()
      .setLngLat([start.ln,start.lt])
      .addTo(map.current);
    map.current.flyTo({
      center: [start.ln,start.lt]
    });
  },[start,map]);
  useEffect(()=>{
    if (error || !latitude) return; 
    if (latitude && longitude && !error) {
      setStart((prev)=>({
        ...prev,
        ln: longitude,
        lt: latitude
      }))
    }
  },[longitude,latitude,error])
  
  useEffect(()=>{
    if(map.current!== null) return;
    map.current = new mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/light-v10',
      center: [start.ln, start.lt],
      zoom: start.zoom
    });
    map.current.on('click', 'places', (e:any) => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const description = e.features[0].properties.description;

      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }
       
      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`<div><h2>${e.features[0].properties.sport}</h2><div>${e.features[0].properties.host}</div></div>`)
        .addTo(map.current);
      });
       
      // Change the cursor to a pointer when the mouse is over the places layer.
      map.current.on('mouseenter', 'places', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });
       
      // Change it back to a pointer when it leaves.
      map.current.on('mouseleave', 'places', () => {
        map.current.getCanvas().style.cursor = '';
      });
  },[])
  useEffect(()=>{
    if(Object.keys(points).length === 0&& points.constructor === Object) return;
    console.log(points)
    if (points&& map.current!==null&&loading===false){
      setLoading(true)
      
      map.current.on('load', ()=>{
        map.current.loadImage(
          'https://i.ibb.co/3p77qkp/pin.png',
          (error:any, image:any) => {
            if (error) throw error;
             
            // Add the image to the map style.
            map.current.addImage('pin', image);

          map.current.addSource('places', {
            'type': 'geojson',
            'data': points
          })
          map.current.addLayer({
            'id': 'places',
            'type': 'symbol',
            'source': 'places',
            'layout': {
              'icon-image': 'pin',
              'icon-allow-overlap': true,
              'icon-size': 0.05
              }
          });
        })
      })
    }
  },[points])
  return <div className="container" ref = {mapRef}></div>;
}

export default Home
