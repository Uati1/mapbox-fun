import polygon from "../polygon";
import * as turf from '@turf/turf';
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
    features: featureObject
  }
const generator:geoJSONObject = (nb:number) =>{
    const getPolygonBoundingBox = (feature:any)=> {
        let bounds:any[] = [[], []];
        let polygon,latitude,longitude;

        for (let i = 0; i < feature.data.geometry.coordinates.length; i++) {
            if (feature.data.geometry.coordinates.length === 1) {
                polygon = feature.data.geometry.coordinates[0];
            } else {
                polygon = feature.data.geometry.coordinates[i][0];
            }

            for (let j = 0; j < polygon.length; j++) {
                longitude = polygon[j][0];
                latitude = polygon[j][1];

                bounds[0][0] = bounds[0][0] < longitude ? bounds[0][0] : longitude;
                bounds[1][0] = bounds[1][0] > longitude ? bounds[1][0] : longitude;
                bounds[0][1] = bounds[0][1] < latitude ? bounds[0][1] : latitude;
                bounds[1][1] = bounds[1][1] > latitude ? bounds[1][1] : latitude;
            }
        }
        return bounds;
    }
    const generateAttr = ()=>{
        const sportsArray = ['Football', 'Volleyball', 'Tennis', 'Squash', 'Basketball', 'Table tennis'];
        return {
            'people': Math.floor(Math.random() * 15 + 2),
            'price': 0,
            'sport': sportsArray[Math.floor(Math.random() * 6)],
            'host': 'John Doe'
        }
    }
    const randomPoint:any = (polygonGeoJson:any, bounds:any) => {
        const x_min  = bounds[0][0];
        const x_max  = bounds[1][0];
        const y_min  = bounds[0][1];
        const y_max  = bounds[1][1];

        const lat = y_min + (Math.random() * (y_max - y_min));
        const lng = x_min + (Math.random() * (x_max - x_min));

        const pt = turf.point([lng, lat])
        const inside = turf.booleanPointInPolygon(pt, polygonGeoJson.data);

        if (inside) {
            const randomAttr = generateAttr();
            return {
                'type': 'Feature',
                'properties': {
                    ...randomAttr
                },
                'geometry': {
                    'type': 'Point',
                    'coordinates': [lng,lat]
                }
            }
        } else {
            return randomPoint(polygon,bounds)
        }
    }
    const points= [];
    const bounds = getPolygonBoundingBox(polygon)
    for(let i=0; i<nb; i++){
        points.push(randomPoint(polygon,bounds))
    }
    const geoJSON = {
        'type': 'FeatureCollection',
        'features': points
    }

    return geoJSON;
}

export default generator;