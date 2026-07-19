declare module '*/inkgarden.js' {
  export class InkGarden {
    constructor(canvas: HTMLCanvasElement, opts?: { params?: any; maxOut?: number; onFrame?: (() => void) | null });
    params: any;
    start(): void;
    stop(): void;
    setImage(img: any): void;
    generateSampleScene(n?: number): void;
    loadReference(path: string): Promise<boolean>;
    render(t?: number): void;
  }
  export const InkGardenDefaults: any;
  export const InkGardenCharSets: Record<string, string>;
  const _default: { InkGarden: typeof InkGarden; InkGardenDefaults: any; InkGardenCharSets: Record<string, string> };
  export default _default;
}
