package com.javainsight.analyzer;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.javaparser.JavaParser;
import com.github.javaparser.ParseProblemException;
import com.github.javaparser.ParseResult;
import com.github.javaparser.ParserConfiguration;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.Modifier; // Modifier 클래스 자체를 import
import com.github.javaparser.ast.Node;
import com.github.javaparser.ast.body.*;
import com.github.javaparser.ast.comments.JavadocComment;
import com.github.javaparser.ast.expr.MethodCallExpr;
import com.github.javaparser.ast.expr.ConditionalExpr; // <<< [수정] ConditionalExpr 임포트 추가
import com.github.javaparser.ast.stmt.*;
import com.github.javaparser.ast.visitor.VoidVisitorAdapter;
import com.github.javaparser.javadoc.Javadoc;

import com.javainsight.analyzer.model.*;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.util.*;
import java.util.stream.Collectors;

public class JavaFileAnalyzer {

    private final JavaParser javaParserInstance;
    private static List<StandardStructure> standardStructuresCache;

    public JavaFileAnalyzer() {
        ParserConfiguration parserConfig = new ParserConfiguration();
        // Symbol Solver (optional, for more accurate type resolution - requires careful setup)
        // ... (심볼 해석기 설정 코드는 이전과 동일하게 주석 처리) ...
        this.javaParserInstance = new JavaParser(parserConfig);
        loadStandardStructures();
    }

    private synchronized void loadStandardStructures() {
        if (standardStructuresCache == null) {
            ObjectMapper mapper = new ObjectMapper();
            TypeReference<List<StandardStructure>> typeReference = new TypeReference<>() {};
            try (InputStream inputStream = JavaFileAnalyzer.class.getResourceAsStream("/standard-structures.json")) {
                if (inputStream == null) {
                    System.err.println("Warning: standard-structures.json not found in classpath. Standard mapping will be limited.");
                    standardStructuresCache = Collections.emptyList();
                    return;
                }
                standardStructuresCache = mapper.readValue(inputStream, typeReference);
            } catch (IOException e) {
                System.err.println("Error loading standard-structures.json: " + e.getMessage());
                standardStructuresCache = Collections.emptyList();
            }
        }
    }

    public OverallAnalysisResult analyzeProject(List<Path> javaFilePaths) {
        List<ClassAnalysisResult> allClassAnalyses = new ArrayList<>();
        List<Map<String, String>> allGraphEdges = new ArrayList<>();
        List<String> processingErrors = new ArrayList<>();

        for (Path javaFilePath : javaFilePaths) {
            try {
                ParseResult<CompilationUnit> parseResult = javaParserInstance.parse(javaFilePath);

                if (parseResult.isSuccessful() && parseResult.getResult().isPresent()) {
                    CompilationUnit cu = parseResult.getResult().get();
                    String packageName = cu.getPackageDeclaration().map(pd -> pd.getName().asString()).orElse("");

                    for (TypeDeclaration<?> typeDeclaration : cu.getTypes()) {
                        if (typeDeclaration instanceof ClassOrInterfaceDeclaration) {
                            ClassOrInterfaceDeclaration cd = (ClassOrInterfaceDeclaration) typeDeclaration;
                            ClassAnalysisResult classResult = parseClassOrInterface(cd, cu, packageName, allGraphEdges);
                            allClassAnalyses.add(classResult);
                        }
                    }
                } else {
                    String errorMsg = "Failed to parse " + javaFilePath + ": " +
                                      parseResult.getProblems().stream()
                                                 .map(p -> p.getVerboseMessage()) // 더 자세한 오류 메시지
                                                 .collect(Collectors.joining("; "));
                    System.err.println(errorMsg);
                    processingErrors.add(errorMsg);
                }
            } catch (ParseProblemException e) {
                String errorMsg = "Severe parsing error in " + javaFilePath + ": " + e.getMessage();
                System.err.println(errorMsg);
                processingErrors.add(errorMsg);
            } catch (Exception e) {
                String errorMsg = "Unexpected error analyzing file " + javaFilePath + ": " + e.getMessage();
                System.err.println(errorMsg);
                // e.printStackTrace(); // 개발 시 스택 트레이스 확인용
                processingErrors.add(errorMsg);
            }
        }
        return new OverallAnalysisResult(allClassAnalyses, allGraphEdges, processingErrors);
    }

    private ClassAnalysisResult parseClassOrInterface(ClassOrInterfaceDeclaration cd, CompilationUnit cu, String packageName, List<Map<String, String>> allGraphEdges) {
        String simpleName = cd.getNameAsString();
        String fqcn = packageName.isEmpty() ? simpleName : packageName + "." + simpleName;
        // [수정] Modifier 처리 방식 변경
        List<String> modifiers = cd.getModifiers().stream()
                                   .map(modifier -> modifier.getKeyword().asString())
                                   .collect(Collectors.toList());

        ClassAnalysisResult classResult = new ClassAnalysisResult(packageName, fqcn, simpleName, cd.isInterface(), modifiers);

        classResult.setLoc(calculateSLOC(cd));
        classResult.setImports(cu.getImports().stream()
                                .map(imp -> imp.getName().asString() + (imp.isAsterisk() ? ".*" : ""))
                                .collect(Collectors.toSet()));

        for (FieldDeclaration fieldDecl : cd.getFields()) {
            for (VariableDeclarator var : fieldDecl.getVariables()) {
                // [수정] Modifier 처리 방식 변경
                List<String> fieldModifiers = fieldDecl.getModifiers().stream()
                                                .map(modifier -> modifier.getKeyword().asString())
                                                .collect(Collectors.toList());
                classResult.addField(new FieldInfo(var.getNameAsString(), var.getType().asString(), fieldModifiers));
            }
        }

        for (MethodDeclaration methodDecl : cd.getMethods()) {
            MethodAnalysisResult methodResult = parseMethod(methodDecl, fqcn, allGraphEdges);
            classResult.addMethod(methodResult);
        }
        
        if (classResult.getLoc() > 500) classResult.addWarning("Large class (LOC > 500)");
        if (classResult.getMethods().size() > 25) classResult.addWarning("Class with many methods (>25)");

        classResult.setExtendedTypes(cd.getExtendedTypes().stream().map(ct -> ct.getNameWithScope()).collect(Collectors.toList()));
        classResult.setImplementedTypes(cd.getImplementedTypes().stream().map(ct -> ct.getNameWithScope()).collect(Collectors.toList()));
        classResult.setUsesExternalLibraries(determineExternalLibraries(classResult.getImports(), packageName));
        classResult.setClassSummary(findStandardStructureMatch(classResult));

        return classResult;
    }

    private MethodAnalysisResult parseMethod(MethodDeclaration md, String classFqcn, List<Map<String, String>> allGraphEdges) {
        // [수정] Modifier 처리 방식 변경
        List<String> methodModifiers = md.getModifiers().stream()
                                         .map(modifier -> modifier.getKeyword().asString())
                                         .collect(Collectors.toList());
        List<String> paramTypes = md.getParameters().stream()
                                    .map(p -> p.getType().asString() + " " + p.getNameAsString())
                                    .collect(Collectors.toList());
        MethodAnalysisResult methodResult = new MethodAnalysisResult(md.getNameAsString(), md.getType().asString(), paramTypes, methodModifiers);

        methodResult.setLoc(calculateSLOC(md));
        md.getJavadocComment().map(JavadocComment::parse).map(Javadoc::getDescription)
          .ifPresent(desc -> methodResult.setJavadocSummary(desc.toText().lines().findFirst().orElse("").trim()));

        CyclomaticComplexityVisitor ccVisitor = new CyclomaticComplexityVisitor();
        md.getBody().ifPresent(body -> body.accept(ccVisitor, null));
        methodResult.setCyclomaticComplexity(ccVisitor.getComplexity());
        methodResult.setControlStatements(ccVisitor.getControlStatements());

        Set<String> invoked = new HashSet<>();
        md.findAll(MethodCallExpr.class).forEach(mce -> {
            String calledMethodName = mce.getNameAsString();
            String scope = mce.getScope().map(Node::toString).orElse("this");
            invoked.add(scope + "." + calledMethodName);

            Map<String, String> edge = new HashMap<>();
            edge.put("source", classFqcn + "." + md.getNameAsString());
            edge.put("target", scope + "." + calledMethodName);
            allGraphEdges.add(edge);
        });
        methodResult.setInvokedMethods(invoked);

        if (methodResult.getLoc() > 40) methodResult.addWarning("Long method (LOC > 40)");
        if (methodResult.getCyclomaticComplexity() > 7) methodResult.addWarning("High complexity (CC > 7)");
        if (md.getParameters().size() > 5) methodResult.addWarning("Method with many parameters (>5)");

        return methodResult;
    }

    private int calculateSLOC(Node node) {
        if (node.getBegin().isPresent() && node.getEnd().isPresent()) {
            return node.getEnd().get().line - node.getBegin().get().line + 1;
        }
        return 0;
    }

    private Set<String> determineExternalLibraries(Set<String> imports, String currentPackageName) {
        if (imports == null) return Collections.emptySet();
        String projectRootPackage = currentPackageName != null && currentPackageName.contains(".") ?
                                    currentPackageName.substring(0, currentPackageName.indexOf(".")) : currentPackageName;

        return imports.stream()
            .filter(imp -> !imp.startsWith("java.") && !imp.startsWith("javax."))
            .filter(imp -> projectRootPackage == null || projectRootPackage.isEmpty() || !imp.startsWith(projectRootPackage))
            .map(imp -> imp.substring(0, imp.lastIndexOf('.') > 0 ? imp.lastIndexOf('.') : imp.length()))
            .distinct()
            .collect(Collectors.toSet());
    }

    private String findStandardStructureMatch(ClassAnalysisResult classResult) {
        if (standardStructuresCache == null || standardStructuresCache.isEmpty()) {
            return "Standard structure data not available.";
        }
        StandardStructure bestMatch = null;
        int maxScore = -1;

        for (StandardStructure standard : standardStructuresCache) {
            int currentScore = 0;
            String standardSimpleName = standard.getClassName().substring(standard.getClassName().lastIndexOf('.') + 1);

            if (classResult.getSimpleName().equalsIgnoreCase(standardSimpleName)) currentScore += 3;
            if (classResult.isInterface() == (standard.getType() != null && standard.getType().toLowerCase().contains("interface"))) currentScore +=1;

            String standardExtendsSimpleName = standard.getExtendsName() != null ?
                standard.getExtendsName().substring(standard.getExtendsName().lastIndexOf('.') + 1) : null;
            if (standardExtendsSimpleName != null && classResult.getExtendedTypes().stream()
                .anyMatch(ext -> ext.endsWith(standardExtendsSimpleName))) {
                 currentScore += 2;
            }

            if (standard.getImplementsList() != null && !standard.getImplementsList().isEmpty()) {
                long implementedMatchCount = classResult.getImplementedTypes().stream()
                    .filter(impl -> standard.getImplementsList().stream()
                                    .anyMatch(stdImpl -> impl.endsWith(stdImpl.substring(stdImpl.lastIndexOf('.')+1))))
                    .count();
                if (implementedMatchCount > 0) currentScore += implementedMatchCount;
            }

            if (currentScore > maxScore) {
                maxScore = currentScore;
                bestMatch = standard;
            }
        }

        if (bestMatch != null && maxScore >= 3) {
            return "Resembles JDK's " + bestMatch.getClassName() + ". " + bestMatch.getDescription();
        }
        return "No strong structural match found with common JDK classes.";
    }

    // Inner class for Cyclomatic Complexity calculation
    private static class CyclomaticComplexityVisitor extends VoidVisitorAdapter<Void> {
        private int complexity = 1;
        private final List<String> controlStatements = new ArrayList<>();

        // [수정] 각 visit 메소드에서 super.visit(n, arg) 호출 추가 (자식 노드 방문을 위해)
        @Override public void visit(IfStmt n, Void arg) { complexity++; controlStatements.add("if"); super.visit(n, arg); }
        @Override public void visit(ForStmt n, Void arg) { complexity++; controlStatements.add("for"); super.visit(n, arg); }
        @Override public void visit(ForEachStmt n, Void arg) { complexity++; controlStatements.add("foreach"); super.visit(n, arg); }
        @Override public void visit(WhileStmt n, Void arg) { complexity++; controlStatements.add("while"); super.visit(n, arg); }
        @Override public void visit(DoStmt n, Void arg) { complexity++; controlStatements.add("do-while"); super.visit(n, arg); }
        @Override public void visit(SwitchEntry n, Void arg) {
            // default 케이스는 CC에 추가하지 않는 경우가 많음 (JavaParser에서 SwitchEntry는 case 하나를 의미)
            if (n.getLabels().isNonEmpty() && !n.getLabels().getFirst().map(l -> "default".equalsIgnoreCase(l.toString())).orElse(false)) {
                 complexity++; controlStatements.add("case");
            }
            super.visit(n, arg);
        }
        @Override public void visit(ConditionalExpr n, Void arg) { complexity++; controlStatements.add("conditional"); super.visit(n, arg); } // 삼항 연산자
        @Override public void visit(CatchClause n, Void arg) { complexity++; controlStatements.add("catch"); super.visit(n, arg); }
        // TODO: Consider logical operators (&&, ||) for more precise CC.

        public int getComplexity() { return complexity; }
        public List<String> getControlStatements() { return Collections.unmodifiableList(controlStatements); }
    }
}