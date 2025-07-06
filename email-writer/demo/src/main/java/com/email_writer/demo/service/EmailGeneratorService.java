package com.email_writer.demo.service;

import com.email_writer.demo.model.EmailRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

///
///
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
        File tempFile = null;
        try {
            // 1. Save to temp file
            tempFile = File.createTempFile("uploaded-", "-" + file.getOriginalFilename());
            try (OutputStream os = new FileOutputStream(tempFile)) {
                os.write(file.getBytes());
            }

            // 2. Detect file type and extract text
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

            // 3. Combine email content and file content
           // String combined = emailContent + "\n\n[Attached File Content]\n" + extractedText.toString();
//            String fileInfoHint = "The user has also attached a file. Use the content of the file to provide a more relevant and meaningful reply. " +
//                    "If it's a resume, acknowledge it appropriately. If it's a document, respond accordingly.\n\n";

            String fileHint = "The user has attached a file. ";
            if (filename.contains("resume")) {
                fileHint += "It appears to be a resume. Acknowledge this appropriately in the reply.";
            } else if (filename.contains("report") || filename.contains("document")) {
                fileHint += "It seems like an informational document. Provide a thoughtful acknowledgment.";
            } else {
                fileHint += "Incorporate any useful content from it into your response.";
            }

            String combined = emailContent + "\n\n" + fileHint + "\n\n[File Content]\n" + extractedText + "\n[End of File]";

           // String combined = emailContent + "\n\n" + fileInfoHint + "[Start of Attached File Content]\n" + extractedText + "\n[End of File Content]";


            // 4. Use the existing prompt builder
            EmailRequest request = new EmailRequest();
            request.setEmailContent(combined);
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

//    private String buildPrompt(EmailRequest emailRequest) {
//        StringBuilder prompt = new StringBuilder();
//        prompt.append(" Your task is to generate only the  email reply to the following message. ")
//                .append("Do NOT include a subject line. ")
//                .append("Do NOT repeat the original email. ")
//                .append("Keep the ")
//                .append(emailRequest.getTone() != null && !emailRequest.getTone().isEmpty() ? emailRequest.getTone() : "neutral")
//                .append(" tone .\n\n")
//                .append("Original email:\n")
//                .append(emailRequest.getEmailContent())
//                .append("\n\n")
//                .append("Reply:");
//        return prompt.toString();
//    }

    private String buildPrompt(EmailRequest emailRequest) {
        String tone = (emailRequest.getTone() != null && !emailRequest.getTone().isEmpty())
                ? emailRequest.getTone().toLowerCase()
                : "neutral";

        StringBuilder prompt = new StringBuilder();

        prompt.append("You are an AI assistant that helps users draft replies to emails.\n")
                .append("Your role is to generate a reply that the user (sender) would write in response to the email below.\n")
                .append("Do NOT act as the recipient of the email.\n")
                .append("If there is an attached file (e.g., a resume or document), acknowledge it in a natural way, but do NOT say you have read or reviewed it.\n")
                .append("Do not include a subject line.\n")
                .append("Do not refer to or repeat the original message.\n")
                .append("Do not include these instructions in the reply.\n")
                .append("Only return the body of the reply email.\n\n")
                .append("Write the reply in a **")
                .append(tone)
                .append("** tone. The tone guidelines are as follows:\n");

        switch (tone) {
            case "professional":
                prompt.append("- Use clear, respectful, and business-appropriate language.\n")
                        .append("- Maintain a formal tone and proper grammar.\n")
                        .append("- Avoid slang or overly casual phrases.\n");
                break;
            case "casual":
                prompt.append("- Keep the tone relaxed and conversational.\n")
                        .append("- Use everyday language and contractions.\n")
                        .append("- Feel free to be friendly, but stay relevant.\n");
                break;
            case "friendly":
                prompt.append("- Be warm, polite, and supportive.\n")
                        .append("- Sound welcoming and helpful.\n")
                        .append("- Maintain a positive and courteous tone.\n");
                break;
            default:
                prompt.append("- Keep it clear, concise, and neutral in tone.\n");
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
