export interface AssemblyServiceInterface {
  songToText(songUrl: string): Promise<string>;
}

export const AssemblyServiceInterfaceType = Symbol.for(
  'AssemblyServiceInterface',
);
