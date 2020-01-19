/**
 * Config details for Analysis Class.
 * @param template File path after ConfigFiles directory
 * @param changes Changes to config file options (optional)
 */
export interface AnalysisConfig {
  template: string;
  changes?: {};
}

/**
 * AP analysis types
 */
export enum AnalysisProcessingType {
  audio2csv = "audio2csv",
  audio2sonogram = "Audio2Sonogram",
  indiciesCsv2image = "IndiciesCsv2Image"
}

export enum AnalysisOption {
  temporaryDirectory = "--temp-dir",
  audioOffset = "--offset",
  alignToMinute = "--align-to-minute",
  channels = "--channels",
  mixDownToMono = "--mix-down-to-mono",
  parallel = "--parallel",
  copyLog = "--when-exit-copy-log",
  copyConfig = "--when-exit-copy-config",
  logLevel = "--log-level"
}

/**
 * AP analysis options
 */
export interface AnalysisOptions {
  [AnalysisOption.temporaryDirectory]?: string;
  [AnalysisOption.audioOffset]?: string;
  [AnalysisOption.alignToMinute]?: AnalysisAlignToMinute;
  [AnalysisOption.channels]?: string;
  [AnalysisOption.mixDownToMono]?: AnalysisMixDownToMono;
  [AnalysisOption.parallel]?: boolean;
  [AnalysisOption.copyLog]?: boolean;
  [AnalysisOption.copyConfig]?: boolean;
  [AnalysisOption.logLevel]?: AnalysisLogLevel;
}

/**
 * AP analysis mix down to mono option
 */
export enum AnalysisMixDownToMono {
  False = "false",
  True = "true"
}

/**
 * AP analysis align to minute options
 */
export enum AnalysisAlignToMinute {
  noAlignment = "No Alignment",
  trimBoth = "TrimBoth",
  trimNeither = "TrimNeither",
  trimStart = "TrimStart",
  trimEnd = "TrimEnd"
}

/**
 * AP analysis log level options
 */
export enum AnalysisLogLevel {
  none = "0",
  error = "1",
  warn = "2",
  info = "3",
  debug = "4",
  trace = "5",
  verbose = "6",
  all = "7"
}
