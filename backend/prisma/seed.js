require("dotenv").config({ override: true });

const bcrypt = require("bcrypt");
const prisma = require("../src/lib/prisma");
const { ensureCar } = require("../src/services/catalogService");
const {
  buildUniqueEmail,
  buildUniqueUsername,
  normalizeUsername,
} = require("../src/utils/userIdentity");

async function createCatalogProduct(productData) {
  const product = await prisma.product.create({
    data: {
      name: productData.name,
      category: productData.category,
      price: productData.price,
      discountPrice: productData.discountPrice ?? null,
      imageUrl: productData.imageUrl,
      oemCode: productData.oemCode || null,
      description: productData.description || null,
      seller_id: productData.sellerId || null,
    },
  });

  for (const compatibilityEntry of productData.compatibility) {
    const car = await ensureCar(prisma, compatibilityEntry);

    await prisma.productCar.create({
      data: {
        productId: product.id,
        carId: car.id,
      },
    });
  }

  return product;
}

const vehicleCatalogSeed = [
  { name: "Acura", models: ["ILX", "Integra", "MDX", "NSX", "RDX", "TLX", "ZDX"] },
  { name: "Alfa Romeo", models: ["147", "156", "159", "Brera", "Giulia", "Giulietta", "Stelvio", "Tonale"] },
  { name: "Audi", models: ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q5", "Q7", "Q8", "TT"] },
  { name: "Baic", models: ["BJ40", "D20", "X25", "X35", "X55", "X7"] },
  { name: "Bentley", models: ["Bentayga", "Continental", "Flying Spur", "Mulsanne"] },
  { name: "BMW", models: ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "7 Series", "8 Series", "i4", "iX", "X1", "X3", "X5", "X6", "X7", "Z4"] },
  { name: "BYD", models: ["Atto 3", "Dolphin", "Han", "Qin", "Seal", "Song Plus", "Tang", "Yuan Plus"] },
  { name: "Cadillac", models: ["ATS", "CT4", "CT5", "CT6", "Escalade", "SRX", "XT4", "XT5", "XT6"] },
  { name: "Changan", models: ["Alsvin", "CS35", "CS55", "CS75", "Eado", "UNI-K", "UNI-T"] },
  { name: "Chery", models: ["Arrizo 5", "Arrizo 8", "Tiggo 2", "Tiggo 4", "Tiggo 7", "Tiggo 8"] },
  { name: "Chevrolet", models: ["Aveo", "Camaro", "Captiva", "Cobalt", "Cruze", "Equinox", "Malibu", "Spark", "Tahoe", "Traverse"] },
  { name: "Chrysler", models: ["200", "300", "Pacifica", "PT Cruiser", "Voyager"] },
  { name: "Citroen", models: ["Berlingo", "C-Elysee", "C3", "C4", "C4 Cactus", "C5", "C5 Aircross", "DS3", "DS4"] },
  { name: "Cupra", models: ["Ateca", "Born", "Formentor", "Leon", "Terramar"] },
  { name: "Dacia", models: ["Dokker", "Duster", "Jogger", "Lodgy", "Logan", "Sandero"] },
  { name: "Daewoo", models: ["Gentra", "Lacetti", "Lanos", "Matiz", "Nexia"] },
  { name: "Daihatsu", models: ["Charade", "Copen", "Mira", "Rocky", "Terios"] },
  { name: "Dodge", models: ["Caliber", "Challenger", "Charger", "Durango", "Journey", "RAM 1500"] },
  { name: "Dongfeng", models: ["580", "AX7", "DF6", "Fengon ix5", "Shine", "T5 EVO"] },
  { name: "Exeed", models: ["LX", "RX", "TXL", "VX"] },
  { name: "FAW", models: ["Bestune B70", "Bestune T33", "Bestune T77", "Oley", "V5", "X40"] },
  { name: "Ferrari", models: ["296 GTB", "488", "812", "F8", "Portofino", "Purosangue", "Roma"] },
  { name: "Fiat", models: ["500", "500X", "Doblo", "Egea", "Fiorino", "Linea", "Panda", "Tipo"] },
  { name: "Ford", models: ["EcoSport", "Escape", "Everest", "Explorer", "Fiesta", "Focus", "Fusion", "Kuga", "Mondeo", "Mustang", "Ranger", "Transit"] },
  { name: "GAC", models: ["EMKOO", "Empow", "GS3", "GS4", "GS8", "M8"] },
  { name: "GAZ", models: ["Gazelle", "Sobol", "Volga"] },
  { name: "Geely", models: ["Atlas", "Coolray", "Emgrand", "Geometry C", "Monjaro", "Okavango", "Tugella"] },
  { name: "Genesis", models: ["G70", "G80", "G90", "GV70", "GV80"] },
  { name: "GMC", models: ["Acadia", "Sierra", "Terrain", "Yukon"] },
  { name: "Great Wall", models: ["H3", "H5", "Poer", "Wingle 5", "Wingle 7"] },
  { name: "Haval", models: ["Dargo", "F7", "F7x", "H6", "Jolion", "M6"] },
  { name: "Honda", models: ["Accord", "City", "Civic", "CR-V", "Fit", "HR-V", "Odyssey", "Passport", "Pilot"] },
  { name: "Hongqi", models: ["E-HS9", "H5", "H7", "HS5", "HS7"] },
  { name: "Hyundai", models: ["Accent", "Azera", "Creta", "Elantra", "Genesis Coupe", "H-1", "i30", "Kona", "Palisade", "Santa Fe", "Sonata", "Tucson"] },
  { name: "Infiniti", models: ["FX35", "Q30", "Q50", "Q60", "Q70", "QX50", "QX60", "QX70", "QX80"] },
  { name: "Isuzu", models: ["D-Max", "MU-X", "NQR", "Trooper"] },
  { name: "Jaguar", models: ["E-Pace", "F-Pace", "F-Type", "I-Pace", "XE", "XF", "XJ"] },
  { name: "Jeep", models: ["Cherokee", "Compass", "Gladiator", "Grand Cherokee", "Renegade", "Wrangler"] },
  { name: "Jetour", models: ["Dashing", "X70", "X70 Plus", "X90 Plus", "T2"] },
  { name: "Kia", models: ["Bongo", "Ceed", "Cerato", "K5", "Mohave", "Niro", "Optima", "Picanto", "Rio", "Seltos", "Sorento", "Soul", "Sportage", "Stinger"] },
  { name: "Lada", models: ["Granta", "Kalina", "Largus", "Niva", "Priora", "Vesta", "XRAY"] },
  { name: "Lamborghini", models: ["Aventador", "Huracan", "Revuelto", "Urus"] },
  { name: "Land Rover", models: ["Defender", "Discovery", "Discovery Sport", "Freelander", "Range Rover", "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar"] },
  { name: "Lexus", models: ["CT", "ES", "GS", "GX", "IS", "LC", "LS", "LX", "NX", "RX", "UX"] },
  { name: "Li Auto", models: ["L6", "L7", "L8", "L9", "Mega"] },
  { name: "Lucid", models: ["Air", "Gravity"] },
  { name: "Maserati", models: ["Ghibli", "GranTurismo", "Grecale", "Levante", "MC20", "Quattroporte"] },
  { name: "Mazda", models: ["CX-3", "CX-30", "CX-5", "CX-60", "CX-9", "Mazda2", "Mazda3", "Mazda6", "MX-5"] },
  { name: "Mercedes-Benz", models: ["A-Class", "B-Class", "C-Class", "CLA", "CLS", "E-Class", "EQB", "EQE", "EQS", "G-Class", "GLA", "GLB", "GLC", "GLE", "GLS", "S-Class", "Vito"] },
  { name: "Mini", models: ["Clubman", "Cooper", "Countryman", "Paceman"] },
  { name: "Mitsubishi", models: ["ASX", "Attrage", "Eclipse Cross", "L200", "Lancer", "Outlander", "Pajero", "Pajero Sport"] },
  { name: "Nissan", models: ["Altima", "Juke", "Kicks", "Maxima", "Micra", "Navara", "Patrol", "Qashqai", "Rogue", "Sentra", "Sunny", "Tiida", "X-Trail"] },
  { name: "Opel", models: ["Astra", "Combo", "Corsa", "Crossland", "Grandland", "Insignia", "Mokka", "Vectra", "Vivaro", "Zafira"] },
  { name: "Peugeot", models: ["2008", "206", "207", "208", "3008", "301", "308", "408", "5008", "508", "Partner", "Traveller"] },
  { name: "Polestar", models: ["2", "3", "4"] },
  { name: "Porsche", models: ["718", "911", "Cayenne", "Macan", "Panamera", "Taycan"] },
  { name: "RAM", models: ["1500", "2500", "3500", "ProMaster"] },
  { name: "Renault", models: ["Arkana", "Captur", "Clio", "Duster", "Express", "Fluence", "Kangoo", "Koleos", "Logan", "Megane", "Sandero", "Symbol", "Taliant"] },
  { name: "Rivian", models: ["R1S", "R1T"] },
  { name: "Rolls-Royce", models: ["Cullinan", "Ghost", "Phantom", "Spectre"] },
  { name: "Saab", models: ["9-3", "9-5", "900"] },
  { name: "SEAT", models: ["Arona", "Ateca", "Ibiza", "Leon", "Tarraco", "Toledo"] },
  { name: "Skoda", models: ["Fabia", "Kamiq", "Karoq", "Kodiaq", "Octavia", "Rapid", "Scala", "Superb"] },
  { name: "Smart", models: ["#1", "#3", "ForFour", "ForTwo"] },
  { name: "SsangYong", models: ["Actyon", "Korando", "Kyron", "Musso", "Rexton", "Tivoli"] },
  { name: "Subaru", models: ["Crosstrek", "Forester", "Impreza", "Legacy", "Outback", "WRX", "XV"] },
  { name: "Suzuki", models: ["Baleno", "Ciaz", "Grand Vitara", "Jimny", "S-Cross", "Swift", "Vitara"] },
  { name: "Tesla", models: ["Model 3", "Model S", "Model X", "Model Y", "Cybertruck"] },
  { name: "Toyota", models: ["Avalon", "Camry", "Corolla", "Fortuner", "Highlander", "Hilux", "Land Cruiser", "Prado", "Prius", "RAV4", "Tacoma", "Yaris"] },
  { name: "UAZ", models: ["Hunter", "Patriot", "Pickup"] },
  { name: "Volkswagen", models: ["Amarok", "Arteon", "Caddy", "Golf", "ID.4", "Jetta", "Passat", "Polo", "T-Cross", "Tiguan", "Touareg", "Transporter"] },
  { name: "Volvo", models: ["S40", "S60", "S90", "V40", "V60", "XC40", "XC60", "XC90"] },
  { name: "Voyah", models: ["Dream", "Free", "Passion"] },
  { name: "Zeekr", models: ["001", "007", "009", "X"] },
];

async function seedVehicleCatalog() {
  for (const entry of vehicleCatalogSeed) {
    await prisma.brand.create({
      data: {
        name: entry.name,
        models: {
          create: entry.models.map((modelName) => ({
            name: modelName,
          })),
        },
      },
    });
  }
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminName = process.env.ADMIN_NAME || "admin";

  await prisma.productCar.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.car.deleteMany();
  await prisma.model.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.engine.deleteMany();
  await prisma.seller.deleteMany();
  await prisma.siteContent.deleteMany();

  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const preferredAdminUsername = normalizeUsername(adminName);
  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [
        { role: "ADMIN" },
        { username: preferredAdminUsername },
      ],
    },
    select: {
      id: true,
      username: true,
    },
  });

  if (existingAdmin) {
    const normalizedAdminEmail = await buildUniqueEmail(
      prisma,
      adminEmail,
      existingAdmin.username,
      existingAdmin.id,
    );

    await prisma.user.update({
      where: {
        id: existingAdmin.id,
      },
      data: {
        name: adminName,
        email: normalizedAdminEmail,
        password: hashedPassword,
        role: "ADMIN",
      },
    });
  } else {
    const adminUsername = await buildUniqueUsername(prisma, preferredAdminUsername);
    const normalizedAdminEmail = await buildUniqueEmail(prisma, adminEmail, adminUsername);

    await prisma.user.create({
      data: {
        username: adminUsername,
        name: adminName,
        email: normalizedAdminEmail,
        password: hashedPassword,
        role: "ADMIN",
      },
    });
  }

  await prisma.user.upsert({
    where: {
      username: "demo_user",
    },
    update: {
      name: "Demo User",
      email: "demo@detalcenter.local",
      password: await bcrypt.hash("demo123", 10),
      role: "USER",
    },
    create: {
      username: "demo_user",
      name: "Demo User",
      email: "demo@detalcenter.local",
      password: await bcrypt.hash("demo123", 10),
      role: "USER",
    },
  });

  await seedVehicleCatalog();

  const [mainSeller, premiumSeller] = await Promise.all([
    prisma.seller.create({
      data: {
        name: "Detalcenter.az Main Warehouse",
      },
    }),
    prisma.seller.create({
      data: {
        name: "OEM Premium Parts",
      },
    }),
  ]);

  await createCatalogProduct({
    name: "Brake Pad Set",
    category: "Brakes",
    price: 120,
    discountPrice: 95,
    imageUrl: "https://images.unsplash.com/photo-1613214201082-68a0d1c94d55?auto=format&fit=crop&w=1200&q=80",
    oemCode: "123ABC",
    description: "Front brake pad set with multi-vehicle compatibility mapping.",
    sellerId: mainSeller.id,
    compatibility: [
      {
        brand: "Hyundai",
        model: "Elantra",
        yearFrom: 2015,
        yearTo: 2018,
        engine: "1.6",
        fuelType: "PETROL",
      },
      {
        brand: "Kia",
        model: "Cerato",
        yearFrom: 2016,
        yearTo: 2019,
        engine: "1.6",
        fuelType: "PETROL",
      },
    ],
  });

  await createCatalogProduct({
    name: "Oil Filter Cartridge",
    category: "Engine",
    price: 35,
    imageUrl: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1200&q=80",
    oemCode: "OIL-456",
    description: "Long-life oil filter for everyday service intervals.",
    sellerId: mainSeller.id,
    compatibility: [
      {
        brand: "Hyundai",
        model: "Elantra",
        yearFrom: 2015,
        yearTo: 2018,
        engine: "1.6",
        fuelType: "PETROL",
      },
      {
        brand: "Toyota",
        model: "Corolla",
        yearFrom: 2014,
        yearTo: 2018,
        engine: "1.8",
        fuelType: "PETROL",
      },
    ],
  });

  await createCatalogProduct({
    name: "Rear Shock Absorber",
    category: "Suspension",
    price: 220,
    imageUrl: "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&w=1200&q=80",
    oemCode: "SHK-908",
    description: "Gas-filled rear shock absorber for stable ride comfort.",
    sellerId: premiumSeller.id,
    compatibility: [
      {
        brand: "BMW",
        model: "3 Series",
        yearFrom: 2013,
        yearTo: 2018,
        engine: "2.0",
        fuelType: "PETROL",
      },
      {
        brand: "Audi",
        model: "A4",
        yearFrom: 2014,
        yearTo: 2019,
        engine: "2.0",
        fuelType: "PETROL",
      },
    ],
  });

  await createCatalogProduct({
    name: "Spark Plug Set",
    category: "Ignition",
    price: 42,
    imageUrl: "https://images.unsplash.com/photo-1635774855317-edf3ee446ff2?auto=format&fit=crop&w=1200&q=80",
    oemCode: "SPK-771",
    description: "OE-spec spark plug set for efficient combustion.",
    sellerId: premiumSeller.id,
    compatibility: [
      {
        brand: "Hyundai",
        model: "Elantra",
        yearFrom: 2015,
        yearTo: 2018,
        engine: "1.6",
        fuelType: "PETROL",
      },
      {
        brand: "Toyota",
        model: "Corolla",
        yearFrom: 2014,
        yearTo: 2018,
        engine: "1.8",
        fuelType: "PETROL",
      },
    ],
  });

  await createCatalogProduct({
    name: "Air Filter Panel",
    category: "Filters",
    price: 28,
    discountPrice: 22,
    imageUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
    oemCode: "AIR-552",
    description: "High-flow panel air filter for routine maintenance.",
    sellerId: mainSeller.id,
    compatibility: [
      {
        brand: "Volkswagen",
        model: "Golf",
        yearFrom: 2015,
        yearTo: 2020,
        engine: "1.4",
        fuelType: "PETROL",
      },
      {
        brand: "Audi",
        model: "A4",
        yearFrom: 2014,
        yearTo: 2019,
        engine: "2.0",
        fuelType: "PETROL",
      },
    ],
  });

  await prisma.siteContent.create({
    data: {
      heroTitle: "Onlayn ehtiyat hissəsi mağazan",
      heroDesc: "Bütün şəhər və rayonlara pulsuz çatdırılma və taksitlə alış imkanı",
      heroButton: "Axtar",
      heroImage:
        "https://images.unsplash.com/photo-1613214149922-f1809c99b414?auto=format&fit=crop&w=1200&q=80",
      footerDescription: "Keyfiyyetli ehtiyat hisseleri, rahat sifaris ve suretli destek bir yerde.",
      footerHighlightLabel: "Destek xidmeti",
      footerHighlightValue: "24/7",
      footerWorkHoursLabel: "Is gunleri",
      footerWorkHoursValue: "Be. - Ce. / 09:00 - 18:00",
      footerPhoneLabel: "Elaqe nomresi",
      footerPhoneValue: "+994 55 738 00 13",
      footerEmailLabel: "E-poct",
      footerEmailValue: "info@avtopro.az",
      footerSocialLabel: "Bizi izleyin",
      footerFacebookUrl: "https://facebook.com",
      footerInstagramUrl: "https://instagram.com",
      footerLinkedinUrl: "https://linkedin.com",
      footerTiktokUrl: "https://tiktok.com",
      footerCopyright: "Detalcenter.az 2026, Butun huquqlar qorunur.",
      footerPrivacyLabel: "Mexfilik siyaseti",
      footerTermsLabel: "Sertler ve qaydalar",
      footerAboutLabel: "Haqqimizda",
      footerFaqLabel: "Tez-tez verilen suallar",
    },
  });

  console.log("Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("SEED ERROR:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
