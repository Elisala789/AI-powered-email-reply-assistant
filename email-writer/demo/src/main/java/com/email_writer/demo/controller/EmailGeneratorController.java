package com.email_writer.demo.controller;

import com.email_writer.demo.model.EmailRequest;
import com.email_writer.demo.service.EmailGeneratorService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/email")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class EmailGeneratorController {

    private final EmailGeneratorService emailGeneratorService;
    @PostMapping("/generate")
    public ResponseEntity<String> generateEmail(@RequestBody EmailRequest emailRequest)
    {
        String response = emailGeneratorService.generateEmailReply(emailRequest);
        return ResponseEntity.ok(response);
    }
    @PostMapping("/generate-with-file")
    public ResponseEntity<String> generateEmailWithFile(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam("emailContent") String emailContent,
            @RequestParam("tone") String tone) {

        String reply = emailGeneratorService.generateReplyWithFile(emailContent, tone, file);
        return ResponseEntity.ok(reply);
    }


}
