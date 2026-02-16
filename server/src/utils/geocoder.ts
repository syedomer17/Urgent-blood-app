import NodeGeocoder from 'node-geocoder';

const options: NodeGeocoder.Options = {
    provider: 'openstreetmap',
    // Optional: apiKey, formatter
    formatter: null,
};

const geocoder = NodeGeocoder(options);

export default geocoder;
