/**
 * This declaration file provides type information to TypeScript for the 'express-json' module,
 * which is a plain JavaScript library and does not have its own types.
 * We are declaring that the module exists and its default export is a function
 * that can be used as Express middleware.
 */
declare module 'express-json' {
  import { RequestHandler } from 'express';

  function json(options?: any): RequestHandler;

  export = json;
}