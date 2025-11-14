import type { Config } from "jest";
import nextJest from "next/jest";

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
    "^.+\\.jsx?$": "babel-jest",
  },
  transformIgnorePatterns: ["/node_modules/(?!(YOUR_MODULE_HERE)/)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};

export default createJestConfig(customJestConfig);
