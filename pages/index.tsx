import React, {useEffect, useRef, useState} from 'react';
import   mapboxgl from 'mapbox-gl';
import generator from './components/generator';
import { usePosition } from 'use-position';
import polygon from './components/polygon'

const Home = ()=>{
  mapboxgl.accessToken = 'pk.eyJ1IjoibmVvc2NhIiwiYSI6ImNrZm80ZnI4MzJlcHoyeW52eGZqeDVpNXcifQ.0b4R6NcNKL9SNDq1q7ECrA';
  const mapRef = useRef<any>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [points,setPoints] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const { latitude, longitude, error } = usePosition();
  const [start, setStart] = useState({
    ln: 19.145136,
    lt: 51.919438,
    zoom: 10
  })
  useEffect(()=>{
    setPoints(generator(100));
  },[])
  useEffect(()=>{
    if(points === []) return;
    if (points){
      points.forEach((point)=>{
        console.log(point)
        //new mapboxgl.Marker().setLngLat(point.point).addTo(map)
      })
    }
  },[points])
  useEffect(()=>{

    if (map.current || error || !latitude) return; 
    if (latitude && longitude && !error) {
      
      setStart((prev)=>({
        ...prev,
        ln: longitude,
        lt: latitude
      }))
    }
    map.current = new mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [start.ln, start.lt],
      zoom: start.zoom
    });
    map.current.on('load', ()=>{
      // map.current.addSource('pol', polygon)
      // map.current.addLayer({
      //   'id': 'pol',
      //   'type': 'fill',
      //   'source': 'pol',
      //   'layout': {},
      //   'paint': {
      //   'fill-color': '#088',
      //   'fill-opacity': 0.8
      //   }
      //   });
      })
  },[start])
  return <div
    ref = {mapRef}></div>;
}

export default Home
