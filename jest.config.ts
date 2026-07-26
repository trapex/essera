import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
	testEnvironment: 'jest-environment-jsdom',
	setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
		'^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
	},
	testPathIgnorePatterns: ['/node_modules/', '/.next/', '/playwright-report/'],

	// collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};

export default createJestConfig(customJestConfig);
