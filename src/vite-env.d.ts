/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_OPEN_REQUEST_FALLBACK_MINUTES?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
