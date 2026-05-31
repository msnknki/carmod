export async function imageUriToBase64DataUrl(uri: string): Promise<string | null> {
  if (!uri) {
    return null;
  }
  if (uri.startsWith('data:')) {
    return uri;
  }

  try {
    const blob = await loadUriAsBlob(uri);
    return await blobToDataUrl(blob);
  } catch {
    return null;
  }
}

function loadUriAsBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      if (xhr.response) {
        resolve(xhr.response as Blob);
      } else {
        reject(new Error('Empty image response'));
      }
    };
    xhr.onerror = () => reject(new Error('Failed to read image file'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri);
    xhr.send();
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to encode image'));
    reader.readAsDataURL(blob);
  });
}
