package com.javainsight.analyzer.model;

import java.util.List;

public class FieldInfo {
    private String fieldName;
    private String fieldType;
    private List<String> modifiers;

    public FieldInfo(String fieldName, String fieldType, List<String> modifiers) {
        this.fieldName = fieldName;
        this.fieldType = fieldType;
        this.modifiers = modifiers;
    }

    public String getFieldName() { return fieldName; }
    public void setFieldName(String fieldName) { this.fieldName = fieldName; }

    public String getFieldType() { return fieldType; }
    public void setFieldType(String fieldType) { this.fieldType = fieldType; }

    public List<String> getModifiers() { return modifiers; }
    public void setModifiers(List<String> modifiers) { this.modifiers = modifiers; }
}