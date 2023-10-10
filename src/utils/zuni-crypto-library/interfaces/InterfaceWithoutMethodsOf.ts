type NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? never : K;
}[keyof T];
export type InterfaceWithoutMethodsOf<T> = Pick<T, NonFunctionPropertyNames<T>>; // https://stackoverflow.com/a/55483981
