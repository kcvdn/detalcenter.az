const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

const yearCodeMap = {
  Y: 2000,
  "1": 2001,
  "2": 2002,
  "3": 2003,
  "4": 2004,
  "5": 2005,
  "6": 2006,
  "7": 2007,
  "8": 2008,
  "9": 2009,
  A: 2010,
  B: 2011,
  C: 2012,
  D: 2013,
  E: 2014,
  F: 2015,
  G: 2016,
  H: 2017,
  J: 2018,
  K: 2019,
  L: 2020,
  M: 2021,
  N: 2022,
  P: 2023,
  R: 2024,
  S: 2025,
  T: 2026,
  V: 2027,
  W: 2028,
  X: 2029,
};

const mockProfiles = [
  {
    prefixes: ["KMH", "KMF"],
    brand: "Hyundai",
    model: "Elantra",
    engine: "1.6",
  },
  {
    prefixes: ["KNA", "KNE", "KNM"],
    brand: "Kia",
    model: "Cerato",
    engine: "1.6",
  },
  {
    prefixes: ["JTD", "JTE", "JT3", "JT4", "JT5"],
    brand: "Toyota",
    model: "Corolla",
    engine: "1.8",
  },
  {
    prefixes: ["WBA", "WBS", "WBX", "5UX"],
    brand: "BMW",
    model: "3 Series",
    engine: "2.0",
  },
  {
    prefixes: ["WAU", "TRU"],
    brand: "Audi",
    model: "A4",
    engine: "2.0",
  },
  {
    prefixes: ["WVW", "WVG", "3VW"],
    brand: "Volkswagen",
    model: "Golf",
    engine: "1.4",
  },
];

function normalizeVin(vin) {
  return String(vin || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 17);
}

function isValidVin(vin) {
  return VIN_REGEX.test(normalizeVin(vin));
}

function inferYear(vin) {
  return yearCodeMap[normalizeVin(vin).charAt(9)] || 2016;
}

function getMockProfile(vin) {
  const normalizedVin = normalizeVin(vin);
  const wmi = normalizedVin.slice(0, 3);
  const matchedProfile = mockProfiles.find((profile) => profile.prefixes.includes(wmi));

  return (
    matchedProfile || {
      brand: "Hyundai",
      model: "Elantra",
      engine: "1.6",
    }
  );
}

function decodeVin(vin) {
  const normalizedVin = normalizeVin(vin);

  if (!isValidVin(normalizedVin)) {
    throw new Error("VIN must be exactly 17 valid characters");
  }

  const profile = getMockProfile(normalizedVin);

  return {
    vin: normalizedVin,
    brand: profile.brand,
    model: profile.model,
    year: inferYear(normalizedVin),
    engine: profile.engine,
  };
}

module.exports = {
  decodeVin,
  isValidVin,
  normalizeVin,
};
