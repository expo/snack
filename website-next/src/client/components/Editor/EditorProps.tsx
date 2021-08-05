import { SnackFiles, SDKVersion, SnackDependencies, SnackFile, Annotation } from '../../types';

export type EditorMode = 'normal' | 'vim';

export type EditorProps = {
  files: SnackFiles;
  dependencies: SnackDependencies;
  sdkVersion: SDKVersion;
  updateFiles: (updateFn: (files: SnackFiles) => { [path: string]: SnackFile | null }) => void;
  selectedFile: string;
  mode: EditorMode;
  onSelectFile: (path: string) => void;
  annotations: Annotation[];
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval';
  wordWrap?: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
  scrollBeyondLastLine?: boolean;
  minimap?: {
    enabled?: boolean;
    maxColumn?: number;
    renderCharacters?: boolean;
    showSlider?: 'always' | 'mouseover';
    side?: 'right' | 'left';
  };
  autoFocus?: boolean;
  fontFamily?: string;
  fontLigatures?: boolean;
};
