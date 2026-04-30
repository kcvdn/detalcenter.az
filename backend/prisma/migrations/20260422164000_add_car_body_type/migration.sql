ALTER TABLE "Car"
ADD COLUMN "bodyType" TEXT NOT NULL DEFAULT 'UNKNOWN';

DROP INDEX "Car_brandId_modelId_yearFrom_yearTo_idx";
DROP INDEX "Car_brandId_modelId_yearFrom_yearTo_engineId_key";

CREATE INDEX "Car_brandId_modelId_bodyType_yearFrom_yearTo_idx"
ON "Car"("brandId", "modelId", "bodyType", "yearFrom", "yearTo");

CREATE UNIQUE INDEX "Car_brandId_modelId_bodyType_yearFrom_yearTo_engineId_key"
ON "Car"("brandId", "modelId", "bodyType", "yearFrom", "yearTo", "engineId");
