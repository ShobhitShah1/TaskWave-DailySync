import RNBlobUtil from 'react-native-blob-util';

export const generateUniqueFileName = async (directory: string, fileName: string) => {
  let uniqueFileName = fileName;
  let counter = 1;

  while (await RNBlobUtil.fs.exists(`${directory}/${uniqueFileName}`)) {
    const fileParts = fileName.split('.');
    const name = fileParts.slice(0, -1).join('.');
    const extension = fileParts[fileParts.length - 1];

    uniqueFileName = `${name}(${counter}).${extension}`;
    counter++;
  }

  return uniqueFileName;
};
