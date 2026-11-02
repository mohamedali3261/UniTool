import { fabric } from 'fabric';

/** Fabric 5 revives Text.path, but omits it in IText/Textbox.fromObject.
 * Keep the original loaders (including style migration), and hydrate the path
 * before exposing the instance to canvases, groups, clones or render callbacks.
 */
export function installTextPathRevival() {
  for (const klass of [fabric.IText, fabric.Textbox]) {
    const loader = klass.fromObject as typeof klass.fromObject & { textPathFixed?: boolean };
    if (loader.textPathFixed) continue;
    const fromObject: typeof klass.fromObject & { textPathFixed?: boolean } = (object: any, callback: any) => {
      const { path, ...options } = object;
      return loader.call(klass, options, (text: any) => {
        if (!path) {
          callback?.(text);
          return;
        }
        fabric.Path.fromObject(path, (revived: fabric.Path) => {
          text.set('path', revived);
          text.setCoords();
          callback?.(text);
        });
      });
    };
    fromObject.textPathFixed = true;
    klass.fromObject = fromObject;
  }
}
