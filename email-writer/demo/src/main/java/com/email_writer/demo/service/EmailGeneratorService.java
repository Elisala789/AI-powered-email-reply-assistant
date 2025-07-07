package com.email_writer.demo.service;

import com.email_writer.demo.model.EmailRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import java.util.Map;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.ai.reader.tika.TikaDocumentReader;
import org.springframework.core.io.FileSystemResource;
import org.springframework.web.multipart.MultipartFile;
import java.io.*;
import java.util.List;
import org.springframework.ai.document.Document;



@Service
public class EmailGeneratorService {

    private final WebClient webClient;

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    public EmailGeneratorService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    public String generateReplyWithFile(String emailContent, String tone, MultipartFile file) {
        System.out.println("🚨 Entered generateReplyWithFile()");

        // ✅ Step 1: Always check for spam first
        String spamResult = checkIfSpam(emailContent);
        System.out.println("Spam check result: " + spamResult);

        if ("SPAM".equalsIgnoreCase(spamResult)) {
            return "🚨 Spam alert! We’ve stopped the reply to keep things safe and clean.";
        } else if ("ERROR".equalsIgnoreCase(spamResult)) {
            return "Could not perform spam check. Please try again later.";
        }

        // ✅ Step 2: Now only combine with file *if* file is not null or empty
        StringBuilder combinedContent = new StringBuilder(emailContent);
        File tempFile = null;

        try {
            if (file != null && !file.isEmpty() && file.getOriginalFilename() != null) {
                tempFile = File.createTempFile("uploaded-", "-" + file.getOriginalFilename());
                try (OutputStream os = new FileOutputStream(tempFile)) {
                    os.write(file.getBytes());
                }

                // ✅ Extract file content
                String filename = file.getOriginalFilename().toLowerCase();
                StringBuilder extractedText = new StringBuilder();

                if (filename.endsWith(".pdf")) {
                    try (PDDocument document = PDDocument.load(tempFile)) {
                        PDFTextStripper stripper = new PDFTextStripper();
                        extractedText.append(stripper.getText(document));
                    }
                } else {
                    TikaDocumentReader reader = new TikaDocumentReader(new FileSystemResource(tempFile));
                    List<Document> documents = reader.get();
                    for (Document doc : documents) {
                        extractedText.append(doc.getText()).append("\n\n");
                    }
                }

                // ✅ Add hints based on file name
                String fileHint = "The user has attached a file. ";
                if (filename.contains("resume")) {
                    fileHint += "It appears to be a resume. Acknowledge this appropriately in the reply.";
                } else if (filename.contains("report") || filename.contains("document")) {
                    fileHint += "It seems like an informational document. Provide a thoughtful acknowledgment.";
                } else {
                    fileHint += "Incorporate any useful content from it into your response.";
                }

                combinedContent
                        .append("\n\n")
                        .append(fileHint)
                        .append("\n\n[File Content]\n")
                        .append(extractedText)
                        .append("\n[End of File]");
            }

            // ✅ Step 3: Pass combined content to reply generator
            EmailRequest request = new EmailRequest();
            request.setEmailContent(combinedContent.toString());
            request.setTone(tone);

            return generateEmailReply(request);

        } catch (Exception e) {
            e.printStackTrace();
            return "Error processing file: " + e.getMessage();
        } finally {
            if (tempFile != null && tempFile.exists()) {
                tempFile.delete();
            }
        }
    }
    public String checkIfSpam(String emailContent) {
        System.out.println("🔍 checkIfSpam() function CALLED");

        File tempInputFile = null;
        try {
            // Step 1: Save email content to a temp file
            tempInputFile = File.createTempFile("email_input", ".txt");
            try (BufferedWriter writer = new BufferedWriter(new FileWriter(tempInputFile))) {
                writer.write(emailContent);
            }

            // Step 2: Build the Python process
            ProcessBuilder pb = new ProcessBuilder(
                    "python",
                    "E:/EMAIL_ASSITANT_PROJECT/ml_model/spam_check_file.py",
                    tempInputFile.getAbsolutePath()
            );
            pb.redirectErrorStream(true);

            // Step 3: Start the process and capture output
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;
            String lastMeaningfulLine = null;

            while ((line = reader.readLine()) != null) {
                System.out.println("🐍 PYTHON STDOUT: " + line);
                if (line.trim().equalsIgnoreCase("SPAM") || line.trim().equalsIgnoreCase("NOT_SPAM")) {
                    lastMeaningfulLine = line.trim();
                }
            }

            // Step 4: Check exit and return result
            int exitCode = process.waitFor();
            if (exitCode == 0 && lastMeaningfulLine != null) {
                return lastMeaningfulLine;
            } else {
                System.out.println("❗Python script exited with code: " + exitCode);
            }

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (tempInputFile != null && tempInputFile.exists()) {
                tempInputFile.delete();
            }
        }

        return "ERROR";
    }


    public String generateEmailReply(EmailRequest emailRequest) {
        // 1. Build the prompt
        String prompt = buildPrompt(emailRequest);

        // 2. Create the request body
        Map<String, Object> requestBody = Map.of(
                "contents", new Object[]{
                        Map.of("parts", new Object[]{
                                Map.of("text", prompt)
                        })
                }
        );

        // 3. Send request and get raw JSON response
        String response = webClient.post()
                .uri(geminiApiUrl)
                .header("Content-Type", "application/json")
                .header("X-goog-api-key", geminiApiKey)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        // 4. Extract and return the response content
        return extractResponseContent(response);
    }
    private String buildPrompt(EmailRequest emailRequest) {
        String tone = (emailRequest.getTone() != null && !emailRequest.getTone().isEmpty())
                ? emailRequest.getTone().toLowerCase()
                : "neutral";

        StringBuilder prompt = new StringBuilder();

        prompt.append("You are an AI assistant helping the user write a reply to the following email.\n")
                .append("The user (sender) has reviewed the attached file (e.g., resume, report, or other document) sent by the recipient.\n")
                .append("Your goal is to help them craft a meaningful reply that includes:\n")
                .append(" - Acknowledgment that the file was received.\n")
                .append(" - Clear and concise feedback about the file content (what was good, what can be improved).\n")
                .append(" - Any suggestions, appreciation, or follow-ups relevant to the file.\n")
                .append(" - Polite and appropriate tone as requested.\n\n")
                .append("Do NOT include a subject line.\n")
                .append("Do NOT refer to or repeat the original message.\n")
                .append("Do NOT include these instructions in your response.\n")
                .append("Only return the body of the reply email.\n\n")
                .append("Write the reply in a **")
                .append(tone)
                .append("** tone. The tone guidelines are as follows:\n");

        switch (tone) {
            case "professional":
                prompt.append("- Use formal, respectful language.\n")
                        .append("- Be objective and constructive in your feedback.\n");
                break;
            case "casual":
                prompt.append("- Keep it light and conversational.\n")
                        .append("- Feedback should feel informal but helpful.\n");
                break;
            case "friendly":
                prompt.append("- Use kind, encouraging language.\n")
                        .append("- Give feedback in a warm and polite way.\n");
                break;
            default:
                prompt.append("- Keep it clear, concise, and neutral.\n");
        }

        prompt.append("\nEmail:\n-----\n")
                .append(emailRequest.getEmailContent())
                .append("\n-----\n\nReply:");

        return prompt.toString();
    }



    private String extractResponseContent(String response) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode rootNode = mapper.readTree(response);
            return rootNode.path("candidates")
                    .get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText();
        } catch (Exception e) {
            return "Error processing request: " + e.getMessage();
        }
    }
}
