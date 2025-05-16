package com.javainsight.analyzer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.javainsight.analyzer.utils.FileUtils;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

public class Main {
    public static void main(String[] args) {
        if (args.length < 1) { // Argument 1: zipFilePath, Argument 2 (optional): outputTarget ("stdout" or filePath)
            System.err.println("Usage: java -jar java-analyzer.jar <zipFilePath> [outputTarget|stdout]");
            System.exit(1);
        }

        String zipFilePath = args[0];
        String outputTarget = (args.length > 1) ? args[1] : "stdout"; // Default to stdout

        // Create a unique temporary directory for extraction
        String tempExtractDirName = "java-analyzer-temp-" + UUID.randomUUID().toString();
        Path tempExtractPath = Paths.get(System.getProperty("java.io.tmpdir"), tempExtractDirName);

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.enable(SerializationFeature.INDENT_OUTPUT);

        OverallAnalysisResult analysisResult;

        try {
            List<Path> javaFiles = FileUtils.extractJavaFilesFromZip(zipFilePath, tempExtractPath.toString());

            if (javaFiles.isEmpty()) {
                System.err.println("No .java files found in the ZIP archive: " + zipFilePath);
                analysisResult = new OverallAnalysisResult(Collections.emptyList(), Collections.emptyList(), List.of("No .java files found in ZIP."));
            } else {
                JavaFileAnalyzer analyzer = new JavaFileAnalyzer();
                analysisResult = analyzer.analyzeProject(javaFiles);
                 if (!analysisResult.getProcessingErrors().isEmpty()){
                    System.err.println("Analysis completed with some errors:");
                    analysisResult.getProcessingErrors().forEach(System.err::println);
                }
            }

            // Output results
            if ("stdout".equalsIgnoreCase(outputTarget)) {
                System.out.println(objectMapper.writeValueAsString(analysisResult));
            } else {
                File outputFile = new File(outputTarget);
                if (outputFile.getParentFile() != null) {
                    outputFile.getParentFile().mkdirs(); // Ensure parent directory exists
                }
                objectMapper.writeValue(outputFile, analysisResult);
                System.err.println("Analysis results written to: " + outputTarget); // Use stderr for logs
            }

        } catch (IOException e) {
            System.err.println("An I/O error occurred: " + e.getMessage());
            e.printStackTrace();
            // Attempt to output an error JSON if possible
            try {
                OverallAnalysisResult errorResult = new OverallAnalysisResult(
                        Collections.emptyList(),
                        Collections.emptyList(),
                        List.of("Fatal I/O error during analysis: " + e.getMessage())
                );
                if ("stdout".equalsIgnoreCase(outputTarget)) {
                     System.out.println(objectMapper.writeValueAsString(errorResult));
                } else {
                    objectMapper.writeValue(new File(outputTarget), errorResult);
                }
            } catch (IOException ex) {
                // Ignore if cannot write error JSON
            }
            System.exit(2); // Exit with a different code for I/O errors
        } catch (Exception e) { // Catch any other critical errors
            System.err.println("A critical error occurred during analysis: " + e.getMessage());
            e.printStackTrace();
             try {
                OverallAnalysisResult errorResult = new OverallAnalysisResult(
                        Collections.emptyList(),
                        Collections.emptyList(),
                        List.of("Fatal error during analysis: " + e.getMessage())
                );
                if ("stdout".equalsIgnoreCase(outputTarget)) {
                     System.out.println(objectMapper.writeValueAsString(errorResult));
                } else {
                    objectMapper.writeValue(new File(outputTarget), errorResult);
                }
            } catch (IOException ex) {
                // Ignore
            }
            System.exit(3); // Exit with a different code for other critical errors
        } finally {
            try {
                FileUtils.deleteDirectory(tempExtractPath);
                // System.err.println("Cleaned up temporary directory: " + tempExtractPath);
            } catch (IOException e) {
                System.err.println("Warning: Failed to delete temporary directory " + tempExtractPath + ": " + e.getMessage());
            }
        }
    }
}