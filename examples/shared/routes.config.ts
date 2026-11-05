// The example routes, defined once, for every example app.
import { expo } from "@mismo/expo";
import { next } from "@mismo/next";
import { reactRouter } from "@mismo/react-router";
import { tanstack } from "@mismo/tanstack";
import { defineRoutes } from "@mismo/core/config";

export default defineRoutes({
  source: "./routes",
  input: expo.input(),
  validFor: [expo, tanstack, reactRouter, next],
});
