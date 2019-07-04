import { readFileSync, writeFileSync } from 'fs';
import { mkdir } from 'shelljs';
import { safeLoad, safeDump } from 'js-yaml';
import { join, basename, extname } from 'path';
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
  '--temp-dir'?: string;
  '--offset'?: string;
  '--align-to-minute'?: AnalysisAlignToMinute;
  '--channels'?: string;
  '--mix-down-to-mono'?: AnalysisMixDownToMono;
  '--parallel'?: boolean;
  '--when-exit-copy-log'?: boolean;
  '--when-exit-copy-config'?: boolean;
  '--log-level'?: AnalysisLogLevel;
}

/**
 * AP analysis mix down to mono option
 */
export enum AnalysisMixDownToMono {
  False = 'false',
  True = 'true'
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
  none = '0',
  error = '1',
  warn = '2',
  info = '3',
  debug = '4',
  trace = '5',
  verbose = '6',
  all = '7'
}

/**
 * This class manages all the details required to perform a single analysis using AP.
 */
export class AnalysisItem {
  readonly type: string;
  readonly audio: string;
  readonly config: string;
  readonly output: string;
  readonly label: string;
  readonly options: string[];

  /**
   * Create singular analysis item
   * @param type Analysis Type
   * @param label Analysis label
   * @param audio Audio file
   * @param config Config file
   * @param output Output folder
   * @param options Terminal arguments
   */
  constructor(
    type: string,
    label: string,
    audio: string,
    config: string,
    output: string,
    options: string[]
  ) {
    this.type = type;
    this.label = label;
    this.audio = audio;
    this.config = config;
    this.output = output;
    this.options = options;
  }

  getAudioBasename() {
    return basename(this.audio);
  }

  spawn(): ChildProcess {
    const args: string[] = [];
    args.push(this.audio);
    args.push(this.config);
    args.push(this.output);

    this.options.map(option => {
      args.push(option);
    });

    return APTerminal.spawn(this.type, args);
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

  private audioFiles: string[];
  private config: {};
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
    this.readConfigFile();

    // Apply changes to config
    if (this.configFile.changes) {
      this.updateConfigValues(this.config, this.configFile.changes);
    }

    // Generate inputs for analysis
    const timestamp: number = Date.now();
    const temporaryConfig = this.createTemporaryConfigFile(timestamp);
    const generatedOptions = this.generateOptions();

    // Create array of AnalysisItems
    const analysisBatch: AnalysisItem[] = [];
    this.audioFiles.map(audioFile => {
      analysisBatch.push(
        new AnalysisItem(
          this.type,
          this.label,
          audioFile,
          temporaryConfig,
          this.createOutputFolder(timestamp, audioFile),
          generatedOptions
        )
      );
    });

    return analysisBatch;
  }

  /**
   * Generate options from option list
   */
  private generateOptions(): string[] {
    const output: string[] = [];
    for (const option in this.options) {
      switch (typeof this.options[option]) {
        case 'boolean':
          output.push(option);
          break;

        default:
          // Check if option contains a space
          if (this.options[option].indexOf(' ') > -1) {
            output.push(`${option}="${this.options[option]}"`);
          } else {
            output.push(`${option}=${this.options[option]}`);
          }
          break;
      }
    }

    return output;
  }

  /**
   * Create the output folder specific to the analysis and return the folder path
   * @param audioFile Audio file path
   * @returns Output folder path
   */
  private createOutputFolder(timestamp: number, audioFile: string): string {
    const outputFolder: string = join(
      this.output,
      this.label + '(' + timestamp + ')',
      basename(audioFile, extname(audioFile))
    );

    mkdir('-p', outputFolder);

    return outputFolder;
  }

  /**
   * Read config file to an object
   * TODO Handle error if config not found
   */
  private readConfigFile() {
    const configFilePath = join(
      AnalysisGroup.CONFIG_DIRECTORY,
      this.configFile.template
    );
    try {
      this.config = safeLoad(readFileSync(configFilePath), 'utf8');
    } catch (err) {
      console.error('Failed to read config file: ' + configFilePath);
      console.error(err);
      throw Error(err);
    }
  }

  /**
   * Create a temporary config file for use by AnalyseItem
   * TODO Hangle error if temporary file not created
   */
  private createTemporaryConfigFile(timestamp: number) {
    const tempFilePath = join(
      AnalysisGroup.TEMP_DIRECTORY,
      `${basename(this.configFile.template, '.yml')}.temp_${timestamp}.yml`
    );
    try {
      writeFileSync(tempFilePath, safeDump(this.config), { mode: 0o755 });
    } catch (err) {
      console.error('Failed to write temporary config file: ' + tempFilePath);
      console.error(err);
      throw Error(err);
    }
    return tempFilePath;
  }

  /**
   * Update the config values with the custom changes
   * @param config Config values
   * @param configChanges Changes to config
   */
  private updateConfigValues(config: {}, configChanges: {}) {
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
    this.audioFiles = audioFiles;
  }

  /**
   * Return the list of audio files
   * @returns List of audio files
   */
  getAudioFiles(): string[] {
    return this.audioFiles;
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
