PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "total" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Order" ("id", "user_id", "total", "status", "name", "phone", "address", "note", "createdAt")
SELECT
    "Order"."id",
    "Order"."user_id",
    "Order"."total",
    "Order"."status",
    COALESCE(
        (
            SELECT "User"."name"
            FROM "User"
            WHERE "User"."id" = "Order"."user_id"
        ),
        ''
    ),
    '',
    '',
    NULL,
    "Order"."createdAt"
FROM "Order";

DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
