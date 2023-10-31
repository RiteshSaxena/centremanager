/**
 * A set of functions called "actions" for `import-data`
 */
import fs from 'node:fs';
import { parse } from 'csv-parse/sync';

export default {
  importData: async (ctx, next) => {
    try {

      if (!ctx.request.files || !ctx.request.files.file) {
        throw new Error('No file to upload');
      }

      if (ctx.request.files.file.length) {
        throw new Error('Only one file is allowed to upload');
      }

      if (ctx.request.files.file.type !== 'text/csv') {
        throw new Error('Only csv files are allowed to upload');
      }

      const csvFile = fs.readFileSync(ctx.request.files.file.path, 'utf-8')

      const records = parse(csvFile.trim(), {
        columns: true,
        skip_empty_lines: true
      });

      return records;
    } catch (err) {
      ctx.body = err;
    }
  }
};
