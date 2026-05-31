import { AppError } from './appError';
import { StatusCodes } from 'http-status-codes';

interface LocationInput {
    latitude?: number;
    longitude?: number;
    address?: string;
    country?: string;
    state?: string;
    city?: string;
    zipCode?: string;
    areaName?: string;
}

interface LocationOutput {
    type: 'Point';
    coordinates: number[]; // [longitude, latitude]
    address?: string;
    country?: string;
    state?: string;
    city?: string;
    zipCode?: string;
    areaName?: string;
}

export const processLocation = async (locationData: LocationInput): Promise<LocationOutput | undefined> => {
    if (!locationData) return undefined;

    let { latitude, longitude, address, country, state, city, zipCode, areaName } = locationData;

    // 1. If coordinates are provided, use them directly
    if (latitude !== undefined && longitude !== undefined) {
        return {
            type: 'Point',
            coordinates: [longitude, latitude],
            address,
            country,
            state,
            city,
            zipCode,
            areaName,
        };
    }

    // 2. Prioritize structured fields for geocoding
    const locationString = [city, state, country].filter(Boolean).join(', ');

    if (locationString || address) {
        try {
            const geocoder = (await import('./geocoder')).default;
            const query = locationString || address;
            const loc = await geocoder.geocode(query!);

            if (loc && loc.length > 0 && loc[0].latitude !== undefined && loc[0].longitude !== undefined) {
                const geoResult = loc[0];

                const finalLongitude = geoResult.longitude!;
                const finalLatitude = geoResult.latitude!;

                return {
                    type: 'Point',
                    coordinates: [finalLongitude, finalLatitude],
                    address: address || geoResult.formattedAddress,
                    country: country || geoResult.country || geoResult.countryCode,
                    state: state || geoResult.state || geoResult.administrativeLevels?.level1long,
                    city: city || geoResult.city || geoResult.administrativeLevels?.level2long,
                    zipCode: zipCode || geoResult.zipcode,
                    areaName: areaName || geoResult.administrativeLevels?.level2long,
                };
            }
        } catch (error) {
            // Silence geocoding errors, returning what we can below
        }
    }

    return undefined;
};
