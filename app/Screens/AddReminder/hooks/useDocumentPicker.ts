import { useState, useCallback } from "react";
import DocumentPicker, { DocumentPickerResponse } from "react-native-document-picker";
import RNBlobUtil from "react-native-blob-util";
import { showMessage } from "react-native-flash-message";
import { generateUniqueFileName } from "../../../Utils/generateUniqueFileName";
import { MAX_FILE_SIZE } from "./useAudioRecorder";

const useDocumentPicker = () => {
  const [selectedDocuments, setSelectedDocuments] = useState<DocumentPickerResponse[]>([]);

  const onHandelAttachmentClick = useCallback(async () => {
    try {
      const pickerResult = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.allFiles],
        presentationStyle: "fullScreen",
        copyTo: "cachesDirectory",
      });

      if (
        pickerResult &&
        pickerResult.fileCopyUri &&
        pickerResult.name &&
        pickerResult.size &&
        pickerResult.type &&
        pickerResult.uri
      ) {
        if (pickerResult.size <= MAX_FILE_SIZE) {
          const fileName = pickerResult.name;
          const sourceUri = pickerResult.fileCopyUri;

          const documentsDir = RNBlobUtil.fs.dirs.DocumentDir;

          const uniqueFileName = await generateUniqueFileName(
            documentsDir,
            fileName
          );
          const localFilePath = `${documentsDir}/${uniqueFileName}`;

          await RNBlobUtil.fs.cp(sourceUri, localFilePath);

          const selectedDocumentInfo: DocumentPickerResponse = {
            ...pickerResult,
            name: uniqueFileName,
            uri: localFilePath,
          };

          setSelectedDocuments((prev) => [...prev, selectedDocumentInfo]);
        } else {
          showMessage({
            message: `File size exceeds the limit of ${
              MAX_FILE_SIZE / (1024 * 1024)
            } MB. Please upload a smaller file.`,
            type: "danger",
          });
        }
      } else {
        showMessage({
          message: String(pickerResult?.copyError) || "Invalid document format",
          type: "danger",
        });
      }
    } catch (e: any) {
      if (e?.message !== "User canceled directory picker") {
        showMessage({
          message: String(e?.message) || "Failed to pick document",
          type: "danger",
        });
      }
    }
  }, [showMessage]);

  const onRemoveDocument = (index: number) => {
    const updatedDocuments = selectedDocuments.filter(
      (_document, i) => i !== index
    );
    setSelectedDocuments(updatedDocuments);
  };

  return {
    selectedDocuments,
    setSelectedDocuments,
    onHandelAttachmentClick,
    onRemoveDocument,
  };
};

export default useDocumentPicker; 