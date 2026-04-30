function normalizeUsername(value) {
  const normalizedValue = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalizedValue || "user";
}

async function buildUniqueUsername(prisma, value, excludeUserId = null) {
  const baseUsername = normalizeUsername(value);
  let candidate = baseUsername;
  let counter = 1;

  while (true) {
    const existingUser = await prisma.user.findFirst({
      where: {
        username: candidate,
        ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
      },
      select: {
        id: true,
      },
    });

    if (!existingUser) {
      return candidate;
    }

    counter += 1;
    candidate = `${baseUsername}_${counter}`;
  }
}

async function buildUniqueEmail(prisma, value, fallbackUsername, excludeUserId = null) {
  const baseEmail = String(value || "").trim().toLowerCase() || `${normalizeUsername(fallbackUsername)}@detalcenter.local`;
  const [localPart, domainPart = "detalcenter.local"] = baseEmail.split("@");
  let candidate = `${localPart || normalizeUsername(fallbackUsername)}@${domainPart}`;
  let counter = 1;

  while (true) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email: candidate,
        ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
      },
      select: {
        id: true,
      },
    });

    if (!existingUser) {
      return candidate;
    }

    counter += 1;
    candidate = `${localPart || normalizeUsername(fallbackUsername)}_${counter}@${domainPart}`;
  }
}

module.exports = {
  buildUniqueEmail,
  buildUniqueUsername,
  normalizeUsername,
};
