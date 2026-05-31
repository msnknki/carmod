import {Platform, Share} from 'react-native';
import ReactNativeBlobUtilFs from 'react-native-blob-util/fs';
import MediaCollection from 'react-native-blob-util/mediacollection';
import {imageUriToBase64DataUrl} from './imageUriToBase64';

async function resolveBase64(
  imageUri: string,
): Promise<{base64: string; mime: string}> {
  let dataUrl = imageUri;
  if (!imageUri.startsWith('data:')) {
    const converted = await imageUriToBase64DataUrl(imageUri);
    if (!converted) {
      throw new Error('Could not read image');
    }
    dataUrl = converted;
  }

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) {
    throw new Error('Invalid image format');
  }

  return {mime: match[1], base64: match[2]};
}

export async function saveImageToGallery(imageUri: string): Promise<void> {
  const {base64, mime} = await resolveBase64(imageUri);
  const ext = mime.includes('png') ? 'png' : 'jpg';
  const filename = `carmod-preview-${Date.now()}.${ext}`;

  if (Platform.OS === 'android') {
    await MediaCollection.copyToMediaStore(
      {
        name: filename,
        parentFolder: 'CarModApp',
        mimeType: mime,
      },
      'Image',
      base64,
    );
    return;
  }

  const path = `${ReactNativeBlobUtilFs.dirs.CacheDir}/${filename}`;
  await ReactNativeBlobUtilFs.writeFile(path, base64, 'base64');
  await Share.share({url: path, title: 'CarMod Preview'});
}
