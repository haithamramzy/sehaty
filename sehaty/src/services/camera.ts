/**
 * Camera / image-source seam. The meal + chat flows call these instead of
 * touching a native module directly, so real capture can be dropped in later
 * (expo-camera / expo-image-picker) without changing screen code.
 */

export type ImageSource = 'camera' | 'gallery';

export interface CapturedImage {
  /** In the mock this is the 'placeholder' sentinel; real impl returns a file URI. */
  uri: string;
}

/**
 * Present source picker + capture. Mock resolves immediately with a placeholder
 * so downstream screens (analyzing → result) render the warm-plate mock image.
 *
 * Real implementation, later:
 *   import * as ImagePicker from 'expo-image-picker';
 *   const res = source === 'camera'
 *     ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
 *     : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
 *   return res.canceled ? null : { uri: res.assets[0].uri };
 */
export async function captureImage(_source: ImageSource): Promise<CapturedImage | null> {
  return { uri: 'placeholder' };
}
