import axios from "axios";
import api from "./api";

const geoapifyKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
const openCageKey = import.meta.env.VITE_OPENCAGE_API_KEY;

const reverseWithGeoapify = async (lat, lng) => {
  const { data } = await axios.get("https://api.geoapify.com/v1/geocode/reverse", {
    params: {
      lat,
      lon: lng,
      apiKey: geoapifyKey,
    },
  });

  return data.features?.[0]?.properties || null;
};

const reverseWithOpenCage = async (lat, lng) => {
  const { data } = await axios.get("https://api.opencagedata.com/geocode/v1/json", {
    params: {
      q: `${lat},${lng}`,
      key: openCageKey,
    },
  });

  return data.results?.[0]?.components || null;
};

const geocodeWithGeoapify = async (text) => {
  const { data } = await axios.get("https://api.geoapify.com/v1/geocode/search", {
    params: {
      text,
      apiKey: geoapifyKey,
      limit: 1,
    },
  });

  return data.features?.[0] || null;
};

const geocodeWithOpenCage = async (text) => {
  const { data } = await axios.get("https://api.opencagedata.com/geocode/v1/json", {
    params: {
      q: text,
      key: openCageKey,
      limit: 1,
    },
  });

  return data.results?.[0] || null;
};

export const locationService = {
  detectBrowserLocation: () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        ({ coords }) => resolve(coords),
        (error) => reject(error)
      );
    }),
  reverseGeocode: async (lat, lng) => {
    if (geoapifyKey) {
      const result = await reverseWithGeoapify(lat, lng);
      return {
        city: result?.city || result?.county || "",
        area: result?.suburb || result?.state_district || result?.district || "",
        address: result?.formatted || "",
      };
    }

    if (openCageKey) {
      const result = await reverseWithOpenCage(lat, lng);
      return {
        city: result?.city || result?.town || result?.state_district || "",
        area: result?.suburb || result?.county || "",
        address: [result?.road, result?.state, result?.country].filter(Boolean).join(", "),
      };
    }

    return {
      city: "",
      area: "",
      address: "",
    };
  },
  geocodePlace: async (text) => {
    if (geoapifyKey) {
      const result = await geocodeWithGeoapify(text);
      const coordinates = result?.geometry?.coordinates;
      return coordinates
        ? {
            lng: coordinates[0],
            lat: coordinates[1],
          }
        : null;
    }

    if (openCageKey) {
      const result = await geocodeWithOpenCage(text);
      const coordinates = result?.geometry;
      return coordinates
        ? {
            lng: coordinates.lng,
            lat: coordinates.lat,
          }
        : null;
    }

    return null;
  },
  lookupPincode: async (pincode) => {
    const { data } = await api.get(`/location/pincode/${pincode}`);
    return data;
  },
  validatePincode: async ({ pincode, city, area }) => {
    const { data } = await api.post("/location/validate-pincode", {
      pincode,
      city,
      area,
    });
    return data;
  },
  getStaticMapUrl: ({ lat, lng, jobs = [] }) => {
    if (!geoapifyKey || !lat || !lng) {
      return "";
    }

    const markers = [
      `lonlat:${lng},${lat};color:%23f26849;size:large;text:You`,
      ...jobs.slice(0, 12).map((job, index) => {
        const [jobLng, jobLat] = job.location.coordinates.coordinates;
        return `lonlat:${jobLng},${jobLat};color:%237bd3c7;size:medium;text:${index + 1}`;
      }),
    ].join("|");

    return `https://maps.geoapify.com/v1/staticmap?style=dark-matter-brown&width=800&height=420&center=lonlat:${lng},${lat}&zoom=13&marker=${markers}&apiKey=${geoapifyKey}`;
  },
};
