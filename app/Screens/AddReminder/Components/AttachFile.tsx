import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import React, { FC, memo } from "react";
import useThemeColors from "../../../Theme/useThemeMode";
import { FONTS, SIZE } from "../../../Global/Theme";
import AssetsPath from "../../../Global/AssetsPath";
import { DocumentPickerResponse } from "react-native-document-picker";

interface AttachFileProps {
  themeColor: string;
  selectedDocuments: DocumentPickerResponse[];
  onHandelAttachmentClick: () => void;
}

const AttachFile: FC<AttachFileProps> = ({
  themeColor,
  selectedDocuments,
  onHandelAttachmentClick,
}) => {
  const colors = useThemeColors();

  return (
    <View style={[styles.container]}>
      <View style={styles.flexView}>
        <Text style={[styles.attachmentText, { color: colors.text }]}>
          Attach File:
        </Text>
        <Pressable
          onPress={onHandelAttachmentClick}
          style={[styles.attachmentIconView, { backgroundColor: themeColor }]}
        >
          <Image
            style={styles.attachmentIcon}
            source={AssetsPath.ic_attachment}
          />
        </Pressable>
      </View>

      <View style={styles.previewContainer}>
        {selectedDocuments &&
          selectedDocuments?.map(
            (document: DocumentPickerResponse, index: number) => (
              console.log(document),
              (
                <View key={index} style={styles.documentPreview}>
                  <Text style={styles.documentName}>{document.type}</Text>
                </View>
              )
            )
          )}
      </View>
    </View>
  );
};

export default memo(AttachFile);

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: SIZE.listBorderRadius,
  },
  flexView: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  attachmentText: {
    fontFamily: FONTS.Medium,
    fontSize: 19,
  },
  attachmentIconView: {
    width: 33,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  attachmentIcon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
  },

  previewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  documentPreview: {
    width: 60,
    height: 60,
    backgroundColor: "#f8d7da",
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
    borderRadius: 8,
  },
  documentName: {
    fontSize: 10,
    color: "#333",
    textAlign: "center",
  },
});
