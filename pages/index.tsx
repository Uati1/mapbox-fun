import React, {useEffect, useRef, useState} from 'react';
import  mapboxgl from 'mapbox-gl';
import generator from './components/generator';
import { usePosition } from 'use-position';
import polygon from './components/polygon'
import 'mapbox-gl/dist/mapbox-gl.css'; 
import icon from './assets/pin.png'


const Home = ()=>{
  //split to tiles
  //memo tiles with layers
  // fire full load on drag, unzooom only map + button load events, on specific zoom
  //add types
  mapboxgl.accessToken = 'pk.eyJ1IjoibmVvc2NhIiwiYSI6ImNrZm80ZnI4MzJlcHoyeW52eGZqeDVpNXcifQ.0b4R6NcNKL9SNDq1q7ECrA';
  const mapRef = useRef<any>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [points,setPoints] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const { latitude, longitude, error } = usePosition();
  const [start, setStart] = useState({
    ln: 19.145136,
    lt: 51.919438,
    zoom: 5
  })
  useEffect(()=>{
    setPoints(generator(10000));
  },[])
  useEffect(()=>{
    if(map.current=== null) return;
    const marker1 = new mapboxgl.Marker()
      .setLngLat([start.ln,start.lt])
      .addTo(map.current);
    map.current.flyTo({
      center: [start.ln,start.lt],
      zoom: start.zoom
    });
  },[start,map]);
  useEffect(()=>{
    if (error || !latitude) return; 
    if (latitude && longitude && !error) {
      setStart((prev)=>({
        ...prev,
        ln: longitude,
        lt: latitude,
        zoom: 12
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
      // Change the cursor to a pointer when the mouse is over the places layer.
      map.current.on('mouseenter', 'unclustered-point', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });
       
      // Change it back to a pointer when it leaves.
      map.current.on('mouseleave', 'unclustered-point', () => {
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
            type: 'geojson',
            data: points,
            cluster: true,
            clusterMaxZoom: 13, // Max zoom to cluster points on
            clusterRadius: 100,
            tolerance: 1
          })
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
          // map.current.addLayer({
          //   'id': 'events',
          //   'type': 'symbol',
          //   'source': 'places',
          //   'layout': {
          //     'icon-image': 'pin',
          //     'icon-allow-overlap': true,
          //     'icon-size': 0.05
          //     }
          // });
        })
      })
    }
  },[points])
  return <div className="container" ref = {mapRef}></div>;
}

export default Home
