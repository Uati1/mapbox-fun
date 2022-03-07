import type {LayerProps} from 'react-map-gl';
import Pin from './pin'

export const clusterLayer: LayerProps = {
  id: 'clusters',
  type: 'circle',
  source: 'events',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 750, '#f28cb1'],
    'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40]
  }
};

export const clusterCountLayer: LayerProps = {
  id: 'cluster-count',
  type: 'symbol',
  source: 'events',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': 12
  }
};
  //       source: 'places',
  //       layout: {
  //         'icon-image': 'pin',
  //         'icon-allow-overlap': true,
  //         'icon-size': 0.05
  //         },
  //       filter: ['!', ['has', 'point_count']],
export const unclusteredPointLayer: LayerProps = {
  id: 'unclustered-point',
  type: 'symbol',
  source: 'events',
  filter: ['!', ['has', 'point_count']],
  layout: {
    'icon-image': 'map-pin',
    'icon-allow-overlap': true,
    'icon-size': 0.05
  }
};