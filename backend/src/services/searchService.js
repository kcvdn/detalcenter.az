const prisma = require("../lib/prisma");
const { decodeVin } = require("../utils/vinDecoder");
const { productInclude } = require("./productService");
const {
  normalizeBrandName,
  normalizeEngineName,
  normalizeModelName,
} = require("./catalogService");

function buildCarWhere(vehicle, { includeEngine = true } = {}) {
  const where = {
    brand: {
      name: {
        equals: normalizeBrandName(vehicle.brand),
        mode: "insensitive",
      },
    },
    model: {
      name: {
        equals: normalizeModelName(vehicle.model),
        mode: "insensitive",
      },
    },
    yearFrom: {
      lte: Number(vehicle.year),
    },
    yearTo: {
      gte: Number(vehicle.year),
    },
  };

  if (includeEngine && vehicle.engine) {
    where.engine = {
      name: {
        equals: normalizeEngineName(vehicle.engine),
        mode: "insensitive",
      },
    };
  }

  return where;
}

async function findProductsByVin(vin) {
  const vehicle = decodeVin(vin);

  const exactCars = await prisma.car.findMany({
    where: buildCarWhere(vehicle, { includeEngine: true }),
    select: {
      id: true,
    },
  });

  const fallbackCars =
    exactCars.length > 0
      ? exactCars
      : await prisma.car.findMany({
          where: buildCarWhere(vehicle, { includeEngine: false }),
          select: {
            id: true,
          },
        });

  const carIds = fallbackCars.map((car) => car.id);
  const products =
    carIds.length === 0
      ? []
      : await prisma.product.findMany({
          where: {
            productCars: {
              some: {
                carId: {
                  in: carIds,
                },
              },
            },
          },
          include: productInclude,
          orderBy: {
            createdAt: "desc",
          },
        });

  return {
    vehicle,
    products,
  };
}

module.exports = {
  findProductsByVin,
};
