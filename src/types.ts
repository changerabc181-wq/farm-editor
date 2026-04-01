export interface MapData {
  id: string;
  name: string;
  grid_size?: number;
  tiles: number[];
  objects: Array<any>;
}

export interface ResourceType {
  id: string;
  name: string;
  fields: string[];
  file: string;
}

export interface Resource {
  id: string;
  [key: string]: any;
}
