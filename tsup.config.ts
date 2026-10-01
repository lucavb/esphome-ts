import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: {
        // TypeScript 6 deprecates `baseUrl` (TS5101), but tsup's dts plugin
        // force-adds `baseUrl: "."` when absent — acknowledge the deprecation
        // until tsup stops doing that.
        compilerOptions: { ignoreDeprecations: '6.0' },
    },
    outDir: 'dist',
    clean: true,
});
