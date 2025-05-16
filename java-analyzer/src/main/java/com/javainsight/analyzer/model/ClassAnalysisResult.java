package com.javainsight.analyzer.model;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

public class ClassAnalysisResult {
    private String packageName;
    private String className; // Fully Qualified Class Name
    private String simpleName;
    private boolean isInterface;
    private List<String> modifiers;
    private Set<String> imports;
    private List<FieldInfo> fields = new ArrayList<>();
    private List<MethodAnalysisResult> methods = new ArrayList<>();
    private int loc;
    private int fieldCount;
    private int methodCount;
    private List<String> extendedTypes = new ArrayList<>();
    private List<String> implementedTypes = new ArrayList<>();
    private Set<String> usesExternalLibraries;
    private String classSummary; // Description from standard library mapping
    private List<String> warnings = new ArrayList<>();

    public ClassAnalysisResult(String packageName, String className, String simpleName, boolean isInterface, List<String> modifiers) {
        this.packageName = packageName;
        this.className = className;
        this.simpleName = simpleName;
        this.isInterface = isInterface;
        this.modifiers = modifiers;
    }

    // Getters and Setters
    public String getPackageName() { return packageName; }
    public void setPackageName(String packageName) { this.packageName = packageName; }

    public String getClassName() { return className; }
    public void setClassName(String className) { this.className = className; }

    public String getSimpleName() { return simpleName; }
    public void setSimpleName(String simpleName) { this.simpleName = simpleName; }

    public boolean isInterface() { return isInterface; }
    public void setInterface(boolean anInterface) { isInterface = anInterface; }

    public List<String> getModifiers() { return modifiers; }
    public void setModifiers(List<String> modifiers) { this.modifiers = modifiers; }

    public Set<String> getImports() { return imports; }
    public void setImports(Set<String> imports) { this.imports = imports; }

    public List<FieldInfo> getFields() { return fields; }
    public void setFields(List<FieldInfo> fields) {
        this.fields = fields != null ? fields : new ArrayList<>();
        this.fieldCount = this.fields.size();
    }
    public void addField(FieldInfo field) {
        if (this.fields == null) this.fields = new ArrayList<>();
        this.fields.add(field);
        this.fieldCount = this.fields.size();
    }

    public List<MethodAnalysisResult> getMethods() { return methods; }
    public void setMethods(List<MethodAnalysisResult> methods) {
        this.methods = methods != null ? methods : new ArrayList<>();
        this.methodCount = this.methods.size();
    }
    public void addMethod(MethodAnalysisResult method) {
        if (this.methods == null) this.methods = new ArrayList<>();
        this.methods.add(method);
        this.methodCount = this.methods.size();
    }

    public int getLoc() { return loc; }
    public void setLoc(int loc) { this.loc = loc; }

    public int getFieldCount() { return fieldCount; }
    // fieldCount is derived, setter might not be needed if only addField/setFields used
    // public void setFieldCount(int fieldCount) { this.fieldCount = fieldCount; }

    public int getMethodCount() { return methodCount; }
    // methodCount is derived
    // public void setMethodCount(int methodCount) { this.methodCount = methodCount; }

    public List<String> getExtendedTypes() { return extendedTypes; }
    public void setExtendedTypes(List<String> extendedTypes) { this.extendedTypes = extendedTypes; }

    public List<String> getImplementedTypes() { return implementedTypes; }
    public void setImplementedTypes(List<String> implementedTypes) { this.implementedTypes = implementedTypes; }

    public Set<String> getUsesExternalLibraries() { return usesExternalLibraries; }
    public void setUsesExternalLibraries(Set<String> usesExternalLibraries) { this.usesExternalLibraries = usesExternalLibraries; }

    public String getClassSummary() { return classSummary; }
    public void setClassSummary(String classSummary) { this.classSummary = classSummary; }

    public List<String> getWarnings() { return warnings; }
    public void setWarnings(List<String> warnings) { this.warnings = warnings; }
    public void addWarning(String warning) {
        if (this.warnings == null) this.warnings = new ArrayList<>();
        this.warnings.add(warning);
    }
}