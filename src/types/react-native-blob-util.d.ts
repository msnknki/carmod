declare module 'react-native-blob-util/fs' {
  const fs: {
    dirs: {CacheDir: string};
    writeFile(path: string, data: string, encoding: string): Promise<void>;
  };
  export default fs;
}

declare module 'react-native-blob-util/mediacollection' {
  const MediaCollection: {
    copyToMediaStore(
      descriptor: {name: string; parentFolder: string; mimeType: string},
      mediaType: string,
      data: string,
    ): Promise<void>;
  };
  export default MediaCollection;
}
