"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.processLocation = void 0;
const processLocation = async (locationData) => {
    if (!locationData)
        return undefined;
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
            const geocoder = (await Promise.resolve().then(() => __importStar(require('./geocoder')))).default;
            const query = locationString || address;
            const loc = await geocoder.geocode(query);
            if (loc && loc.length > 0 && loc[0].latitude !== undefined && loc[0].longitude !== undefined) {
                const geoResult = loc[0];
                const finalLongitude = geoResult.longitude;
                const finalLatitude = geoResult.latitude;
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
        }
        catch (error) {
            // Silence geocoding errors, returning what we can below
        }
    }
    return undefined;
};
exports.processLocation = processLocation;
