package com.example.demo.controller;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.tika.TikaDocumentReader;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.util.List;

@RestController
@RequestMapping("/api/file")
@CrossOrigin(origins = "*")
public class UniversalFileReaderController {

    @PostMapping("/extract")
    public ResponseEntity<String> extractText(@RequestParam("file") MultipartFile file) {
        File tempFile = null;

        try {
            // Save uploaded file to temp location
            tempFile = File.createTempFile("uploaded-", "-" + file.getOriginalFilename());
            try (OutputStream os = new FileOutputStream(tempFile)) {
                os.write(file.getBytes());
            }

            String filename = file.getOriginalFilename().toLowerCase();
            StringBuilder extractedText = new StringBuilder();

            if (filename.endsWith(".pdf")) {
                // ✅ Use Apache PDFBox for PDFs
                try (PDDocument document = PDDocument.load(tempFile)) {
                    PDFTextStripper stripper = new PDFTextStripper();
                    extractedText.append(stripper.getText(document));
                }
            } else {
                // ✅ Use Tika for other types
                TikaDocumentReader reader = new TikaDocumentReader(new FileSystemResource(tempFile));
                List<Document> documents = reader.get();

                for (Document doc : documents) {
                    extractedText.append(doc.getText()).append("\n\n");
                }
            }

            return ResponseEntity.ok(extractedText.toString());

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Server Error: " + e.getMessage());

        } finally {
            if (tempFile != null && tempFile.exists()) {
                tempFile.delete();
            }
        }
    }
}
