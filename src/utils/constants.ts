export const AVAILABLE_MODULES = [
  { label: 'logging', description: 'Logging Service', picked: true },
  { label: 'locator', description: 'Dependency Injection (GetIt)', picked: false },
  { label: 'theming', description: 'Theme Management', picked: false },
  { label: 'routing', description: 'Routing (GoRouter)', picked: false },
  { label: 'api', description: 'API Requests & Interceptors (Dio)', picked: false },
  { label: 'ai', description: 'AI Service', picked: false },
  { label: 'localization', description: 'Multi-language Support', picked: false },
  { label: 'startup', description: 'Startup Service', picked: false },
  { label: 'toast', description: 'Toast Notifications', picked: false },
  { label: 'testing', description: 'Testing Setup', picked: false },
  { label: 'cicd', description: 'CI/CD Pipeline', picked: false },
  { label: 'flavors', description: 'Build Flavors', picked: false },
];

export const AVAILABLE_PLATFORMS = [
  { label: 'android', description: 'Android' },
  { label: 'ios', description: 'iOS' },
  { label: 'web', description: 'Web' },
  { label: 'macos', description: 'macOS Desktop' },
  { label: 'windows', description: 'Windows Desktop' },
  { label: 'linux', description: 'Linux Desktop' },
];

export const CONFIGURABLE_MODULES = [
  { label: 'cicd', description: 'CI/CD Pipeline (GitHub Actions)' },
  { label: 'flavors', description: 'App Environments / Flavors' },
];
