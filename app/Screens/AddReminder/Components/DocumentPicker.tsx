import React from "react";
import AttachFile from "../Components/AttachFile";
import { DocumentPickerResponse } from "react-native-document-picker";

interface DocumentPickerProps {
  selectedDocuments: DocumentPickerResponse[];
  onHandelAttachmentClick: () => void;
  onRemoveDocument: (index: number) => void;
  themeColor: string;
}

const DocumentPicker: React.FC<DocumentPickerProps> = ({
  selectedDocuments,
  onHandelAttachmentClick,
  onRemoveDocument,
  themeColor,
}) => {
  return (
    <AttachFile
      themeColor={themeColor}
      onRemoveDocument={onRemoveDocument}
      selectedDocuments={selectedDocuments}
      onHandelAttachmentClick={onHandelAttachmentClick}
    />
  );
};

export default DocumentPicker;
