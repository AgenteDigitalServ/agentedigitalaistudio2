export type Mode = 'create' | 'edit';

export interface ImageFile {
  file: File;
  previewUrl: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  blob: Blob;
  prompt: string;
}

export interface AppState {
  prompt: string;
  mode: Mode;
  activeCreateFn: string;
  activeEditFn: string;
  image1: ImageFile | null;
  image2: ImageFile | null;
  generatedImage: GeneratedImage | null;
  isLoading: boolean;
  error: string | null;
  resolution: string;
  history: GeneratedImage[];
}
