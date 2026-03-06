export const DESIGN_PATTERNS = [
  { id: 'mvvm', displayName: 'MVVM', description: 'Provider + ChangeNotifier', cliChoice: '1' },
  { id: 'mvi', displayName: 'MVI', description: 'BLoC + Equatable', cliChoice: '2' },
  { id: 'riverpod', displayName: 'MVVM + Riverpod', description: 'flutter_riverpod + AsyncNotifier', cliChoice: '3' },
];

/** Modules to hide from the selectable list per design pattern */
export const PATTERN_MODULE_EXCLUSIONS: Record<string, string[]> = {
  mvvm: [],
  mvi: [],
  riverpod: ['locator'],
};

/** Pattern module IDs that are auto-managed and cannot be removed */
export const PATTERN_MODULE_IDS = ['mvvm', 'mvi', 'riverpod'];

export const AVAILABLE_MODULES = [
  { label: 'logging', description: 'Logging Service', picked: true },
  { label: 'locator', description: 'Dependency Injection (GetIt)', picked: false },
  { label: 'theming', description: 'Theme Management', picked: false },
  { label: 'routing', description: 'Routing (GoRouter)', picked: false },
  { label: 'api', description: 'API Requests & Interceptors (Dio)', picked: false },
  { label: 'preferences', description: 'Local Preferences (SharedPreferences)', picked: false },
  { label: 'database', description: 'Local Database (sqflite)', picked: false },
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

/** module → modules it depends on (auto-added when adding this module) */
export const MODULE_DEPENDENCIES: Record<string, string[]> = {
  ai: ['api'],
};

/** module → modules that depend on it (auto-removed when removing this module) */
export const MODULE_DEPENDENTS: Record<string, string[]> = {
  api: ['ai'],
};
