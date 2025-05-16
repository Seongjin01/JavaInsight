package com.javainsight.analyzer.utils;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public class FileUtils {

    public static List<Path> extractJavaFilesFromZip(String zipFilePath, String tempExtractDir) throws IOException {
        List<Path> javaFiles = new ArrayList<>();
        Path extractDirPath = Paths.get(tempExtractDir);

        // Ensure the temporary directory is clean and exists
        if (Files.exists(extractDirPath)) {
            deleteDirectory(extractDirPath); // Clean up if exists from previous run
        }
        Files.createDirectories(extractDirPath);

        byte[] buffer = new byte[4096]; // Buffer for copying
        try (ZipInputStream zis = new ZipInputStream(new FileInputStream(zipFilePath))) {
            ZipEntry zipEntry = zis.getNextEntry();
            while (zipEntry != null) {
                String entryName = zipEntry.getName().replace("\\", "/"); // Normalize path separators
                Path newFilePath = extractDirPath.resolve(entryName).normalize();

                // Security check to prevent Zip Slip vulnerability
                if (!newFilePath.startsWith(extractDirPath)) {
                    System.err.println("Skipping potentially malicious ZIP entry (Zip Slip): " + entryName);
                    zis.closeEntry();
                    zipEntry = zis.getNextEntry();
                    continue;
                }

                if (zipEntry.isDirectory()) {
                    Files.createDirectories(newFilePath);
                } else {
                    // Ensure parent directory for the file exists
                    if (newFilePath.getParent() != null) {
                        Files.createDirectories(newFilePath.getParent());
                    }
                    // Process only .java files
                    if (entryName.endsWith(".java")) {
                        try (FileOutputStream fos = new FileOutputStream(newFilePath.toFile())) {
                            int len;
                            while ((len = zis.read(buffer)) > 0) {
                                fos.write(buffer, 0, len);
                            }
                        }
                        javaFiles.add(newFilePath);
                    }
                }
                zis.closeEntry();
                zipEntry = zis.getNextEntry();
            }
        }
        return javaFiles;
    }

    public static void deleteDirectory(Path directoryPath) throws IOException {
        if (Files.exists(directoryPath)) {
            Files.walk(directoryPath)
                .sorted(Comparator.reverseOrder()) // Delete files before directories
                .map(Path::toFile)
                .forEach(File::delete);
        }
    }
}