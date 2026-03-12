const Pincode = require("../models/Pincode");

const PINCODE_API_BASE =
  process.env.PINCODE_LOOKUP_API_BASE || "https://api.postalpincode.in";

const CITY_ALIASES = {
  bangalore: "bengaluru",
  bengaluru: "bengaluru",
  banglore: "bengaluru",
  "bengaluru urban": "bengaluru",
  "bengaluru rural": "bengaluru",
};

const normalizeText = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const canonicalizeCity = (value = "") => {
  const normalized = normalizeText(value);
  return CITY_ALIASES[normalized] || normalized;
};

const uniqueValues = (values = []) => [...new Set(values.filter(Boolean))];

const buildSearchPool = (record) =>
  uniqueValues([
    ...(record?.districts || []),
    ...(record?.taluks || []),
    ...(record?.areaKeywords || []),
    ...((record?.offices || []).flatMap((office) => [office.name, office.officeName, office.taluk, office.district])),
  ]);

const checkCityMatch = (inputCity, record) => {
  const expected = canonicalizeCity(inputCity);
  const candidates = uniqueValues([record.primaryCity, ...(record.districts || []), ...(record.taluks || [])]).map(
    canonicalizeCity
  );

  return candidates.some((candidate) => candidate && candidate === expected);
};

const checkAreaMatch = (inputArea, record) => {
  const expected = normalizeText(inputArea);
  const pool = buildSearchPool(record).map(normalizeText);

  return pool.some(
    (item) => item === expected || item.includes(expected) || expected.includes(item)
  );
};

const formatLookupResponse = (record, source = "local") => ({
  source,
  pincode: record.pincode,
  state: record.state,
  primaryCity: record.primaryCity,
  primaryArea: record.primaryArea,
  districts: record.districts || [],
  taluks: record.taluks || [],
  areas: uniqueValues([
    ...(record.areaKeywords || []),
    ...((record.offices || []).map((office) => office.officeName)),
  ]).sort(),
  offices: record.offices || [],
});

const getLocalPincodeRecord = async (pincode) => Pincode.findOne({ pincode }).lean();

const fetchExternalPincodeRecord = async (pincode) => {
  const response = await fetch(`${PINCODE_API_BASE}/pincode/${pincode}`);
  if (!response.ok) {
    throw new Error("Unable to reach external pincode lookup service");
  }

  const payload = await response.json();
  const result = payload?.[0];

  if (!result || result.Status !== "Success" || !Array.isArray(result.PostOffice)) {
    return null;
  }

  const offices = result.PostOffice.map((office) => ({
    name: office.Name,
    officeName: office.Name,
    officeType: office.BranchType,
    deliveryStatus: office.DeliveryStatus,
    division: office.Division,
    region: office.Region,
    taluk: office.Block,
    district: office.District,
  }));

  const districts = uniqueValues(offices.map((office) => office.district));
  const taluks = uniqueValues(offices.map((office) => office.taluk));
  const areas = uniqueValues(offices.map((office) => office.officeName));
  const states = uniqueValues(result.PostOffice.map((office) => office.State));

  return {
    pincode,
    state: states[0] || "",
    primaryCity: districts[0] || "",
    primaryArea: taluks[0] || areas[0] || "",
    districts,
    taluks,
    regions: uniqueValues(offices.map((office) => office.region)),
    divisions: uniqueValues(offices.map((office) => office.division)),
    areaKeywords: uniqueValues([...districts, ...taluks, ...areas]),
    offices,
  };
};

const validatePincodeLocation = async ({ pincode, city, area }) => {
  let record = await getLocalPincodeRecord(pincode);
  let source = "local";

  if (!record) {
    record = await fetchExternalPincodeRecord(pincode);
    source = "external";
  }

  if (!record) {
    return {
      isValid: false,
      source,
      message: "Pincode not found in Karnataka lookup",
    };
  }

  if (normalizeText(record.state) !== "karnataka") {
    return {
      isValid: false,
      source,
      record: formatLookupResponse(record, source),
      message: "Only Karnataka pincodes are supported",
    };
  }

  const cityMatches = checkCityMatch(city, record);
  const areaMatches = checkAreaMatch(area, record);

  return {
    isValid: cityMatches && areaMatches,
    source,
    cityMatches,
    areaMatches,
    record: formatLookupResponse(record, source),
    message:
      cityMatches && areaMatches
        ? "Pincode matches city and area"
        : !cityMatches
          ? "Pincode does not match the selected city"
          : "Pincode does not match the selected area",
  };
};

module.exports = {
  normalizeText,
  canonicalizeCity,
  formatLookupResponse,
  getLocalPincodeRecord,
  fetchExternalPincodeRecord,
  validatePincodeLocation,
};
