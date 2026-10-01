import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        include: ['test/**/*.spec.ts'],
        reporters: ['default', 'junit'],
        outputFile: { junit: './reports/junit.xml' },
        coverage: {
            provider: 'v8',
            include: ['src/**'],
            exclude: ['src/api/protobuf/**'],
            reporter: ['text', 'lcov'],
        },
    },
});
