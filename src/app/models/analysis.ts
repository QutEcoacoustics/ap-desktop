import { readFileSync } from 'fs';
import { safeLoad } from 'js-yaml';
import { join } from 'path';
import { ChildProcess } from 'child_process';
import { remote } from 'electron';

import APTerminal from './terminal';

/**
 * Config details for Analysis Class.
 * @param template File path after ConfigFiles directory
 * @param changes Changes to config file options (optional)
 */
interface AnalysisConfig {
  template: string;
  changes?: {};
}

/**
 * AP analysis types
 */
export enum AnalysisType {
  audio2csv = 'audio2csv',
  audio2sonogram = 'Audio2Sonogram',
  indiciesCsv2image = 'IndiciesCsv2Image'
}

/**
 * AP analysis options
 */
export interface AnalysisOptions {
  'temp-dir'?: string;
  offset?: string;
  'align-to-minute'?: AnalysisAlignToMinute;
  channels?: string;
  'mix-down-to-mono'?: boolean;
  parallel?: boolean;
  'when-exit-copy-log'?: boolean;
  'when-exit-copy-config'?: boolean;
  'log-level'?: AnalysisLogLevel;
}

/**
 * AP analysis align to minute options
 */
export enum AnalysisAlignToMinute {
  no_alignment = 'No Alignment',
  trim_both = 'TrimBoth',
  trim_neither = 'TrimNeither',
  trim_start = 'TrimStart',
  trim_end = 'TrimEnd'
}

/**
 * AP analysis log level options
 */
export enum AnalysisLogLevel {
  none = 0,
  error = 1,
  warn = 2,
  info = 3,
  debug = 4,
  trace = 5,
  verbose = 6,
  all = 7
}

/**
 * This class manages all the details required to perform a single analysis using AP.
 */
export class AnalysisItem {
  private type: string;
  private audio: string;
  private config: string;
  private output: string;
  private options: string[];

  /**
   * Create singular analysis item
   * @param type Analysis Type
   * @param audio Audio file
   * @param config Config file
   * @param output Output folder
   * @param options Terminal arguments
   */
  constructor(
    type: string,
    audio: string,
    config: string,
    output: string,
    options?: string[]
  ) {
    this.type = type;
    this.audio = audio;
    this.config = config;
    this.output = output;

    if (this.options) {
      this.options = options;
    }
  }

  spawn(): ChildProcess {
    const args: string[] = [];
    args.push(this.audio);
    args.push(this.config);
    args.push(this.output);

    if (this.options) {
    }

    return APTerminal.spawn(this.type);
  }
}

/**
 * This class manages all the details required to perform a group of analyses using AP.
 */
export class AnalysisGroup {
  static readonly CONFIG_DIRECTORY = join(
    remote.app.getAppPath(),
    'ap',
    'ConfigFiles'
  );
  static readonly TEMP_DIRECTORY = join(remote.app.getAppPath(), 'temp');

  private audio: string[];
  private config: any;
  private configFile: AnalysisConfig;
  private shortDescription: string;
  private description: string;
  private label: string;
  private output: string;
  private options: AnalysisOptions;
  private type: AnalysisType;

  /**
   * Manages analysis object to interface with the clients terminal
   * @param type Type of analysis
   * @param label Display label for analysis
   * @param configFile Configuration for analysis
   * @param shortDescription Short description of analysis
   * @param description Description of analysis
   * @param options Advanced options for analysis
   */
  constructor(
    type: AnalysisType,
    label: string,
    configFile: AnalysisConfig,
    shortDescription: string,
    description: string,
    options: AnalysisOptions
  ) {
    this.configFile = configFile;
    this.shortDescription = shortDescription;
    this.description = description;
    this.label = label;
    this.type = type;
    this.options = options;
  }

  generateBatch() {
    // Read config file
    const configFilePath = join(
      AnalysisGroup.CONFIG_DIRECTORY,
      this.configFile.template
    );
    try {
      this.config = safeLoad(readFileSync(configFilePath), 'utf8');
    } catch (e) {
      console.error('Failed to read config file: ' + configFilePath);
      console.error(e);
      return;
    }

    if (this.configFile.changes) {
      this.updateConfigValues(this.config, this.configFile.changes);
    }

    console.debug(this.config);

    // Apply changes to config

    // Save temporary file

    // Create array of AnalysisItems
  }

  /**
   * Update the config values with the custom changes
   * @param config Config values
   * @param configChanges Changes to config
   */
  updateConfigValues(config: {}, configChanges: {}) {
    for (const value in configChanges) {
      if (typeof configChanges[value] === 'object') {
        this.updateConfigValues(config[value], configChanges[value]);
      } else {
        config[value] = configChanges[value];
      }
    }
  }

  /**
   * Set the output folder path for analysis
   * @param outputFolder Output folder path
   */
  setOutputFolder(outputFolder: string) {
    this.output = outputFolder;
  }

  /**
   * Set the list of audio files for analysis
   * @param audioFiles List of audio files
   */
  setAudioFiles(audioFiles: string[]) {
    this.audio = audioFiles;
  }

  /**
   * Return the list of audio files
   * @returns List of audio files
   */
  getAudioFiles(): string[] {
    return this.audio;
  }

  /**
   * Returns the label of the analysis
   * @returns Analysis label
   */
  getLabel(): string {
    return this.label;
  }

  /**
   * Get the short description of the analysis
   * @returns Short description
   */
  getShortDescription(): string {
    return this.shortDescription;
  }

  /**
   * Get the description of the analysis
   * @returns Description
   */
  getDescription(): string {
    return this.description;
  }
}
