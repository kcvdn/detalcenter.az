const { spawn } = require("child_process");
const net = require("net");

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const runningChildren = [];
let settled = false;

function isPortOpen(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    let resolved = false;

    const finish = (value) => {
      if (resolved) {
        return;
      }

      resolved = true;
      socket.destroy();
      resolve(value);
    };

    socket.setTimeout(2000);

    socket.once("connect", () => {
      finish(true);
    });

    socket.once("error", () => {
      finish(false);
    });

    socket.once("timeout", () => {
      finish(false);
    });
  });
}

function stopChildren() {
  runningChildren.forEach((child) => {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  });
}

function runCommand(name, args) {
  return new Promise((resolve, reject) => {
    const child =
      process.platform === "win32"
        ? spawn("cmd.exe", ["/c", npmCommand, ...args], {
            cwd: process.cwd(),
            stdio: "inherit",
          })
        : spawn(npmCommand, args, {
            cwd: process.cwd(),
            stdio: "inherit",
          });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${name} stopped with signal ${signal}`));
        return;
      }

      if (code !== 0) {
        reject(new Error(`${name} exited with code ${code}`));
        return;
      }

      resolve();
    });
  });
}

function spawnService(name, args) {
  console.log(`[dev] starting ${name}...`);

  const child =
    process.platform === "win32"
      ? spawn("cmd.exe", ["/c", npmCommand, ...args], {
          cwd: process.cwd(),
          stdio: "inherit",
        })
      : spawn(npmCommand, args, {
          cwd: process.cwd(),
          stdio: "inherit",
        });

  runningChildren.push(child);

  child.on("exit", (code, signal) => {
    if (settled) {
      return;
    }

    if (signal) {
      console.log(`[dev] ${name} stopped with signal ${signal}`);
    } else if (code !== 0) {
      console.error(`[dev] ${name} exited with code ${code}`);
      settled = true;
      stopChildren();
      process.exitCode = code || 1;
      return;
    } else {
      console.log(`[dev] ${name} stopped`);
    }

    const activeChildren = runningChildren.filter((currentChild) => !currentChild.killed);

    if (activeChildren.every((currentChild) => currentChild.exitCode !== null)) {
      settled = true;
    }
  });

  return child;
}

async function ensureLocalDatabase() {
  const databaseRunning = await isPortOpen(5433);

  if (databaseRunning) {
    console.log("[dev] database already running at postgresql://localhost:5433/detal");
    return;
  }

  if (process.platform !== "win32") {
    console.warn("[dev] database is not running on port 5433. Start PostgreSQL manually, then rerun `npm run dev`.");
    return;
  }

  console.log("[dev] database is not running. Bootstrapping local PostgreSQL...");
  await runCommand("database", ["--prefix", "backend", "run", "db:local"]);
}

async function main() {
  const frontendRunning = await isPortOpen(3000);
  const backendRunning = await isPortOpen(5000);

  if (frontendRunning) {
    console.log("[dev] frontend already running at http://localhost:3000");
  } else {
    spawnService("frontend", ["--prefix", "frontend", "run", "dev"]);
  }

  if (backendRunning) {
    console.log("[dev] backend already running at http://localhost:5000");
  } else {
    await ensureLocalDatabase();
    spawnService("backend", ["--prefix", "backend", "start"]);
  }

  if (runningChildren.length === 0) {
    console.log("[dev] nothing to start. Both services are already running.");
    return;
  }

  process.on("SIGINT", () => {
    settled = true;
    stopChildren();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    settled = true;
    stopChildren();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("[dev] failed to start development services:", error);
  stopChildren();
  process.exit(1);
});
