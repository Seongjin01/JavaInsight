package com.javainsight.analyzer.model;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

public class MethodAnalysisResult {
    private String methodName;
    private String returnType;
    private List<String> parameters; // e.g., "String arg0", "int count"
    private List<String> modifiers;
    private int loc;
    private int cyclomaticComplexity;
    private String javadocSummary;
    private Set<String> invokedMethods; // Stores "ClassName.methodName" or "this.methodName" or "external.methodName"
    private List<String> controlStatements; // e.g., "if", "for"
    private List<String> warnings = new ArrayList<>();

    // Constructors
    public MethodAnalysisResult(String methodName, String returnType, List<String> parameters, List<String> modifiers) {
        this.methodName = methodName;
        this.returnType = returnType;
        this.parameters = parameters;
        this.modifiers = modifiers;
    }

    // Getters and Setters
    public String getMethodName() { return methodName; }
    public void setMethodName(String methodName) { this.methodName = methodName; }

    public String getReturnType() { return returnType; }
    public void setReturnType(String returnType) { this.returnType = returnType; }

    public List<String> getParameters() { return parameters; }
    public void setParameters(List<String> parameters) { this.parameters = parameters; }

    public List<String> getModifiers() { return modifiers; }
    public void setModifiers(List<String> modifiers) { this.modifiers = modifiers; }

    public int getLoc() { return loc; }
    public void setLoc(int loc) { this.loc = loc; }

    public int getCyclomaticComplexity() { return cyclomaticComplexity; }
    public void setCyclomaticComplexity(int cyclomaticComplexity) { this.cyclomaticComplexity = cyclomaticComplexity; }

    public String getJavadocSummary() { return javadocSummary; }
    public void setJavadocSummary(String javadocSummary) { this.javadocSummary = javadocSummary; }

    public Set<String> getInvokedMethods() { return invokedMethods; }
    public void setInvokedMethods(Set<String> invokedMethods) { this.invokedMethods = invokedMethods; }

    public List<String> getControlStatements() { return controlStatements; }
    public void setControlStatements(List<String> controlStatements) { this.controlStatements = controlStatements; }

    public List<String> getWarnings() { return warnings; }
    public void setWarnings(List<String> warnings) { this.warnings = warnings; }

    public void addWarning(String warning) {
        if (this.warnings == null) {
            this.warnings = new ArrayList<>();
        }
        this.warnings.add(warning);
    }
}