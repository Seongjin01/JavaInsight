package com.javainsight.analyzer.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class StandardStructure {
    private String className;
    private String extendsName;
    private List<String> implementsList;
    private String description;
    private String type;

    // Getters and Setters
    public String getClassName() { return className; }
    public void setClassName(String className) { this.className = className; }

    public String getExtendsName() { return extendsName; }
    public void setExtendsName(String extendsName) { this.extendsName = extendsName; }

    public List<String> getImplementsList() { return implementsList; }
    public void setImplementsList(List<String> implementsList) { this.implementsList = implementsList; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
}