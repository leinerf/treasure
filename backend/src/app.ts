import "reflect-metadata";
import dataSource from "./dataSource.js";

try {
    await dataSource.initialize();
    console.log("Data Source has been initialized!");
} catch (err) {
    console.error("Error during Data Source initialization:", err);
    process.exit(1);
}