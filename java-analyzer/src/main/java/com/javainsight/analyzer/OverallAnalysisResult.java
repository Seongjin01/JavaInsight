package com.javainsight.analyzer;

import com.javainsight.analyzer.model.ClassAnalysisResult;
import java.util.List;
import java.util.Map;

public class OverallAnalysisResult {
    private List<ClassAnalysisResult> classes;
    private List<Map<String, String>> graphEdges; // e.g., { "source": "fqcn.method", "target": "fqcn.method" }
    private List<String> processingErrors; // Errors encountered during analysis of specific files

    // Constructors, Getters, and Setters
    public OverallAnalysisResult(List<ClassAnalysisResult> classes, List<Map<String, String>> graphEdges, List<String> processingErrors) {
        this.classes = classes;
        this.graphEdges = graphEdges;
        this.processingErrors = processingErrors;
    }

    public List<ClassAnalysisResult> getClasses() { return classes; }
    public void setClasses(List<ClassAnalysisResult> classes) { this.classes = classes; }
    public List<Map<String, String>> getGraphEdges() { return graphEdges; }
    public void setGraphEdges(List<Map<String, String>> graphEdges) { this.graphEdges = graphEdges; }
    public List<String> getProcessingErrors() { return processingErrors; }
    public void setProcessingErrors(List<String> processingErrors) { this.processingErrors = processingErrors; }
}