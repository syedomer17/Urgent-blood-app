import { AppError } from './appError';
import { StatusCodes } from 'http-status-codes';

interface LocationInput {
    latitude?: number;
    longitude?: number;
    address?: string;
    state?: string;
    city?: string;
    zipCode?: string;
    areaName?: string;
}

interface LocationOutput {
    type: 'Point';
    coordinates: number[]; // [longitude, latitude]
    address?: string;
    state?: string;
    city?: string;
    zipCode?: string;
    areaName?: string;
}

export const processLocation = async (locationData: LocationInput): Promise<LocationOutput | undefined> => {
    if (!locationData) return undefined;

    let { latitude, longitude, address, state, city, zipCode, areaName } = locationData;

    // 1. If coordinates are provided, use them directly
    if (latitude !== undefined && longitude !== undefined) {
        return {
            type: 'Point',
            coordinates: [longitude, latitude],
            address,
            state,
            city,
            zipCode,
            areaName,
        };
    }

    // 2. If coordinates are missing but address is provided, try geocoding
    if (address) {
        try {
            // Lazy load geocoder to avoid circular dependencies or strict startup requirements
            const geocoder = (await import('./geocoder')).default;
            const loc = await geocoder.geocode(address);

            if (loc && loc.length > 0 && loc[0].latitude !== undefined && loc[0].longitude !== undefined) {
                // Extract address components from geocoder response
                const geoResult = loc[0];
                
                // Ensure coordinates are valid numbers
                const longitude = geoResult.longitude ?? null;
                const latitude = geoResult.latitude ?? null;
                
                if (!longitude || !latitude) {
                    return undefined;
                }
                
                return {
                    type: 'Point',
                    coordinates: [longitude, latitude] as [number, number],
                    address: address || geoResult.formattedAddress,
                    state: state || geoResult.state || geoResult.administrativeLevels?.level1long,
                    city: city || geoResult.city || geoResult.administrativeLevels?.level2long,
                    zipCode: zipCode || geoResult.zipcode,
                    areaName: areaName || geoResult.administrativeLevels?.level2long,
                };
            }
        } catch (error) {
            // console.error("Geocoding error:", error);
            // Optionally: throw new AppError('Geocoding service unavailable', StatusCodes.SERVICE_UNAVAILABLE);
            // For now, we fall through.
        }
    }

    // 3. If neither valid coordinates nor successful geocoding could occur, return undefined
    // (Or throw error if location is strictly required by the caller)
    return undefined;
};
